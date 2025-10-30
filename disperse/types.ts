import { PublicKey } from '@solana/web3.js';

/**
 * Transfer information for bulk operations
 */
export interface ITransfer {
  recipient: string;
  amount: number; // lamports for SOL, raw amount for SPL tokens
  associatedTokenAccount?: string; // optional for SPL
}

/**
 * Configuration for bulk SOL transfers
 */
export interface IBulkSolTransferConfig {
  sender: PublicKey;
  transfers?: ITransfer[];
  recipients?: string[];
  fixedAmount?: number; // lamports
  instructionsPerTx?: number; // default: 18
  memo?: string;
}

/**
 * Configuration for bulk SPL token transfers
 */
export interface IBulkSplTransferConfig {
  sender: PublicKey;
  mint: PublicKey;
  transfers?: ITransfer[];
  recipients?: string[];
  fixedAmount?: number; // raw token amount
  instructionsPerTx?: number; // default: 12 for account creation, 18 for transfers
  memo?: string;
  decimals?: number; // token decimals for display purposes
}
