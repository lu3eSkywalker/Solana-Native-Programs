use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    program_error::ProgramError,
    msg,
};

entrypoint!(process_instruction);

#[derive(BorshDeserialize, BorshSerialize)]
enum UserInstruction {
    InputString(String),
}

#[derive(BorshDeserialize, BorshSerialize)]
struct OnChainData {
    storedString: String,
}

fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let mut iter = accounts.iter();

    let data_account = next_account_info(&mut iter)?;

    // Deserialize the instruction
    let instruction = UserInstruction::try_from_slice(_instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    // Deserialize current data on-chain
    let mut stored_data = OnChainData::try_from_slice(&data_account.data.borrow())?;

    // Handle the instruction
    match instruction {
        UserInstruction::InputString(input) => {
            msg!("Storing string: {}", input);
            stored_data.storedString = input;
        }
    }

    stored_data.serialize(&mut *data_account.data.borrow_mut())?;

    Ok(())
}
