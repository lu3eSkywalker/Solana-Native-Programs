import { test, expect } from "bun:test";
import { LiteSVM } from "litesvm";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";

const svm = new LiteSVM();
const contractPubkey = PublicKey.unique();
// Loading our contract to the local SVM
svm.addProgramFromFile(contractPubkey, "./calculatorBinary.so");

function setUp() {
  const payer = new Keypair();
  svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));
  const dataAccount = new Keypair();
  const blockhash = svm.latestBlockhash();
  const ixs = [
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: dataAccount.publicKey,
      lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
      space: 4,
      programId: contractPubkey,
    }),
  ];

  // With this transaction we create a new dataAccount
  const tx = new Transaction();
  tx.recentBlockhash = svm.latestBlockhash();
  tx.feePayer = payer.publicKey;
  tx.add(...ixs);
  tx.sign(payer, dataAccount);
  svm.sendTransaction(tx);

  return {payer, dataAccount, blockhash};
}

test("Initialize the account to zero", () => {
  const {dataAccount} = setUp();
  const balanceAfter = svm.getBalance(dataAccount.publicKey);
  expect(balanceAfter).toBe(svm.minimumBalanceForRentExemption(BigInt(4))); 
});

test("Adding to the counter", () => {
  const {payer, dataAccount, blockhash} = setUp();

   // Adding 50 to the counter
   const borshAdd50 = Buffer.alloc(5);
   borshAdd50.writeUInt8(2, 0);
   borshAdd50.writeUInt32LE(50, 1);
 
   const ix2 = new TransactionInstruction({
     keys: [
       { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
     ],
     programId: contractPubkey,
     data: borshAdd50
   });
 
   const tx2 = new Transaction();
   tx2.recentBlockhash = blockhash;
   tx2.feePayer = payer.publicKey;
   tx2.add(ix2);
   tx2.sign(payer);
   svm.sendTransaction(tx2);
 
   const newDataAcc = svm.getAccount(dataAccount.publicKey);
   console.log("This is the counter after adding 50: ", newDataAcc?.data);

   expect(newDataAcc?.data[0]).toBe(50);
   expect(newDataAcc?.data[1]).toBe(0);
   expect(newDataAcc?.data[2]).toBe(0);
   expect(newDataAcc?.data[3]).toBe(0);
});

test("Subtracting from the counter", () => {

  const { payer, dataAccount, blockhash } = setUp();

  const borshSub10 = Buffer.alloc(5);
  borshSub10.writeUInt8(3, 0); // tag for `subtract`
  borshSub10.writeUInt32LE(10, 1); // value to subtract

  const ix3 = new TransactionInstruction({
    keys: [
      { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
    ],
    programId: contractPubkey,
    data: borshSub10
  });

  const tx3 = new Transaction();
  tx3.recentBlockhash = blockhash;
  tx3.feePayer = payer.publicKey;
  tx3.add(ix3);
  tx3.sign(payer);
  svm.sendTransaction(tx3);

  const newDataAcc = svm.getAccount(dataAccount.publicKey);
  console.log("This is the counter after subtracting 10: ", newDataAcc?.data);

  expect(newDataAcc?.data[0]).toBe(246);
  expect(newDataAcc?.data[1]).toBe(255);
  expect(newDataAcc?.data[2]).toBe(255);
  expect(newDataAcc?.data[3]).toBe(255);

});

test("Dividing the counter value by half", () => {

  const {payer, dataAccount, blockhash} = setUp();

  // Adding 10 to the counter
  const borshAdd50 = Buffer.alloc(5);
  borshAdd50.writeUInt8(2, 0);
  borshAdd50.writeUInt32LE(10, 1);

  const ix2 = new TransactionInstruction({
    keys: [
      { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
    ],
    programId: contractPubkey,
    data: borshAdd50
  });

  const tx2 = new Transaction();
  tx2.recentBlockhash = blockhash;
  tx2.feePayer = payer.publicKey;
  tx2.add(ix2);
  tx2.sign(payer);
  svm.sendTransaction(tx2);

  const borshValueHalf = Buffer.from([0]); // tag for `half`

  const ix4 = new TransactionInstruction({
    keys: [
      { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
    ],
    programId: contractPubkey,
    data: borshValueHalf
  });

  const tx4 = new Transaction();
  tx4.recentBlockhash = blockhash;
  tx4.feePayer = payer.publicKey;
  tx4.add(ix4);
  tx4.sign(payer);
  svm.sendTransaction(tx4);  

  const newDataAcc4 = svm.getAccount(dataAccount.publicKey);
  console.log("This is the counter after dividing the value by 2: ", newDataAcc4?.data);

  expect(newDataAcc4?.data[0]).toBe(5);
  expect(newDataAcc4?.data[1]).toBe(0);
  expect(newDataAcc4?.data[2]).toBe(0);
  expect(newDataAcc4?.data[3]).toBe(0);
});

test("Doubling the counter value", () => {

  const { payer, dataAccount, blockhash} = setUp();

  // Adding 10 to the counter
  const borshAdd50 = Buffer.alloc(5);
  borshAdd50.writeUInt8(2, 0);
  borshAdd50.writeUInt32LE(10, 1);

  const ix2 = new TransactionInstruction({
    keys: [
      { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
    ],
    programId: contractPubkey,
    data: borshAdd50
  });

  const tx2 = new Transaction();
  tx2.recentBlockhash = blockhash;
  tx2.feePayer = payer.publicKey;
  tx2.add(ix2);
  tx2.sign(payer);
  svm.sendTransaction(tx2);

  const borshDouble = Buffer.from([1]); // tag for `double`

  const ix5 = new TransactionInstruction({
    keys: [
      { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
    ],
    programId: contractPubkey,
    data: borshDouble
  });

  const tx5 = new Transaction();
  tx5.recentBlockhash = blockhash;
  tx5.feePayer = payer.publicKey;
  tx5.add(ix5);
  tx5.sign(payer);
  svm.sendTransaction(tx5);

  const newDataAcc5 = svm.getAccount(dataAccount.publicKey);
  console.log("This is the counter after doubling the value: ", newDataAcc5?.data);

  expect(newDataAcc5?.data[0]).toBe(20);
  expect(newDataAcc5?.data[1]).toBe(0);
  expect(newDataAcc5?.data[2]).toBe(0);
  expect(newDataAcc5?.data[3]).toBe(0);
});