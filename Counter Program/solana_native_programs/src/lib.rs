use borsh::{BorshSerialize, BorshDeserialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult, entrypoint,
    pubkey::Pubkey,
    msg,
};

#[derive(BorshSerialize, BorshDeserialize)]
enum InstructionType {
    Increment(u32),
    Decrement(u32)
}

#[derive(BorshSerialize, BorshDeserialize)]
struct Counter {
    count: u32,
}

entrypoint!(counter_contract);

pub fn counter_contract(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let acc = next_account_info(&mut accounts.iter())?; // Reading the account info that the user has passed us.

    let instruction_type = InstructionType::try_from_slice(instruction_data)?; // Reading the instruction type that the user is passing us.

    let mut counter_data = Counter::try_from_slice(&acc.data.borrow())?; // Borrowing the counter value from the struct Counter

    // Based on the instruction either increment the data or decrement the data
    match instruction_type {
        InstructionType::Increment(value) => {
            msg!("Executing Increment");
            counter_data.count += value;
        },

        InstructionType::Decrement(value) => {
            msg!("Executing Decrement");
            counter_data.count -= value;
        }
    }

    counter_data.serialize(&mut *acc.data.borrow_mut()); // Serialize back the account that the user gave us.

    msg!("Contract Succeded");

    Ok(())
}