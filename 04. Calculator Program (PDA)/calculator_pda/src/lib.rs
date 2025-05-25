use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
    system_program::ID as SYSTEM_PROGRAM_ID,
};

entrypoint!(process_instruction);

#[derive(BorshDeserialize, BorshSerialize)]
enum InstructionType {
    Half,
    Double,
    Add(u32),
    Subtract(u32),
}

#[derive(BorshDeserialize, BorshSerialize)]
struct OnChainData {
    count: u32,
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let iter = &mut accounts.iter();
    let payer_account = next_account_info(iter)?;
    let pda_account = next_account_info(iter)?;
    let system_program = next_account_info(iter)?;
    let payer_pubkey = payer_account.key;

    let (pda, bump) = Pubkey::find_program_address(
        &[b"client1", payer_pubkey.as_ref()],
        program_id,
    );

    let signer_seeds = &[b"client1", payer_pubkey.as_ref(), &[bump]];

    if pda_account.lamports() == 0 {
        let space = 4;
        let rent = Rent::get()?.minimum_balance(space);
        let ix = system_instruction::create_account(
            payer_pubkey,
            &pda,
            rent,
            space as u64,
            program_id,
        );
        invoke_signed(
            &ix,
            &[payer_account.clone(), pda_account.clone(), system_program.clone()],
            &[signer_seeds],
        )?;

        let mut data = OnChainData { count: 0 };
        data.serialize(&mut *pda_account.data.borrow_mut())?;
    }

    let instruction = InstructionType::try_from_slice(instruction_data)?;
    let mut counter_data = OnChainData::try_from_slice(&pda_account.data.borrow())?;

    match instruction {
        InstructionType::Double => {
            msg!("Doubling the value");
            counter_data.count *= 2;
        }
        InstructionType::Half => {
            msg!("Dividing the value by 2");
            counter_data.count /= 2;
        }
        InstructionType::Add(value) => {
            msg!("Adding the value {}", value);
            counter_data.count += value;
        }
        InstructionType::Subtract(value) => {
            msg!("Subtracting the value {}", value);
            counter_data.count -= value;
        }
    }

    counter_data.serialize(&mut *pda_account.data.borrow_mut())?;
    msg!("Contract Succeeded");

    Ok(())
}
