use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo}, 
    entrypoint::{ProgramResult},
    entrypoint,
    msg, pubkey::Pubkey
};

#[derive(BorshDeserialize, BorshSerialize)]
enum InstructionType {
    half,
    double,
    add(u32),
    subtract(u32)
}


#[derive(BorshDeserialize, BorshSerialize)]
struct OnChainData {
    count: u32,
}

entrypoint!(process_instruction);


pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let acc = next_account_info(&mut accounts.iter())?; // Reading the account info that the user has passed us.

    let instruction_type = InstructionType::try_from_slice(instruction_data)?; // Reading the instruction type that the user is passing us.

    let mut counter_data = OnChainData::try_from_slice(&acc.data.borrow())?; // Borrowing the counter value from the struct Counter

    // Based on the instruction we half, double, add or subtract from the counter value
    match instruction_type {
        InstructionType::double => {
            msg!("Doubling the value");
            counter_data.count = 2 * counter_data.count;
        },
        InstructionType::half => {
            msg!("Dividing the value by half");
            counter_data.count = counter_data.count / 2;
        },
        InstructionType::add(value) => {
            msg!("adding the value");
            counter_data.count += value;
        },
        InstructionType::subtract(value) => {
            msg!("subtracting the value");
            counter_data.count -= value;
        }
    }

    counter_data.serialize(&mut *acc.data.borrow_mut());  // Serialize back the account that the user gave us.

    msg!("Contract Succeded");

    Ok(())
}