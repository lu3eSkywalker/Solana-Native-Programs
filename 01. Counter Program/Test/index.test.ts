import {
  Keypair,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as borsh from "borsh";
import {expect, test} from "bun:test";
import {COUNTER_SIZE, instructionSchema, InstructionType, schema2} from './types';
import { schema } from "./types";
import { CounterAccount } from "./types";


let adminAccount = Keypair.generate();
let dataAccount = Keypair.generate();

const PROGRAM_ID = new PublicKey("FhrQn6PPV1C261gfGq4LQTxifhLsjQj7h3woHm7Xhezh");

test("Account is initialized", async () => {
  const connection = new Connection("http://127.0.0.1:8899");
  
  const txn = await connection.requestAirdrop(adminAccount.publicKey, 1 * 1000_000_000);
  await connection.confirmTransaction(txn);
  // airdrop done


  // Creating an empty data
  const lamports = await connection.getMinimumBalanceForRentExemption(COUNTER_SIZE);

  const ix = SystemProgram.createAccount({
    fromPubkey: adminAccount.publicKey,
    lamports,
    space: COUNTER_SIZE,
    programId: PROGRAM_ID,
    newAccountPubkey: dataAccount.publicKey
  });

  const createAccountTxn = new Transaction();
  createAccountTxn.add(ix);

  const signature = await connection.sendTransaction(createAccountTxn, [adminAccount, dataAccount]);

  await connection.confirmTransaction(signature);
  console.log(dataAccount.publicKey.toBase58());

  const dataAccountInfo = await connection.getAccountInfo(dataAccount.publicKey);

  if(!dataAccountInfo || !dataAccountInfo.data) {
    throw new Error("Failed to fetch account info or account is uninitialized");
  }

  const counter = borsh.deserialize(schema, dataAccountInfo.data) as CounterAccount;

  if (!counter) {
    throw new Error("Deserialization failed: Counter is null");
  }
  
  expect(counter.count).toBe(0);
});