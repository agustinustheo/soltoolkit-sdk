import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';

export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/**
 * Create a SOL transfer instruction
 */
export function createSolTransferInstruction(
  from: PublicKey,
  to: PublicKey,
  amountLamports: number
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports: amountLamports,
  });
}

/**
 * Create an SPL token transfer instruction by token accounts
 */
export function createSplTransferInstruction(
  fromTokenAccount: PublicKey,
  toTokenAccount: PublicKey,
  owner: PublicKey,
  rawAmount: number
): TransactionInstruction {
  return createTransferInstruction(fromTokenAccount, toTokenAccount, owner, rawAmount);
}

/**
 * Create an SPL token transfer instruction by owners
 */
export function createSplTransferInstructionByOwners(
  mint: PublicKey,
  fromOwner: PublicKey,
  toOwner: PublicKey,
  rawAmount: number
): TransactionInstruction {
  const fromTokenAccount = getAssociatedTokenAddressSync(mint, fromOwner);
  const toTokenAccount = getAssociatedTokenAddressSync(mint, toOwner);
  return createTransferInstruction(fromTokenAccount, toTokenAccount, fromOwner, rawAmount);
}

/**
 * Create a memo instruction
 */
export function createMemoInstruction(memo: string, signer: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    keys: [{ pubkey: signer, isSigner: true, isWritable: true }],
    data: Buffer.from(memo),
    programId: MEMO_PROGRAM_ID,
  });
}

/**
 * Create an associated token account instruction
 */
export function createTokenAccountInstruction(
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey
): { instruction: TransactionInstruction; associatedAddress: PublicKey } {
  const associatedAddress = getAssociatedTokenAddressSync(mint, owner);
  const instruction = createAssociatedTokenAccountInstruction(payer, associatedAddress, owner, mint);
  return { instruction, associatedAddress };
}

/**
 * Build a transaction from instructions
 */
export function buildTransaction(instructions: TransactionInstruction[]): Transaction {
  const transaction = new Transaction();
  transaction.add(...instructions);
  return transaction;
}
