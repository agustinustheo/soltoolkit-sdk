/**
 * Bulk Transfer Functions for Solana
 *
 * This module provides standalone functions for bulk sending SOL and SPL tokens.
 * All functions are self-contained and can be used without importing the full library.
 *
 * @module bulk
 */

// Types
export type { ITransfer, IBulkSolTransferConfig, IBulkSplTransferConfig } from './types';

// Utility functions
export { chunk, sleep } from './utils';

// Transaction builder functions
export {
  MEMO_PROGRAM_ID,
  createSolTransferInstruction,
  createSplTransferInstruction,
  createSplTransferInstructionByOwners,
  createMemoInstruction,
  createTokenAccountInstruction,
  buildTransaction,
} from './transaction-builder';

// Bulk SOL transfer
export { generateBulkSolTransactions } from './bulk-sol-transfer';

// Bulk SPL transfer
export {
  generateTokenAccountCreationTransactions,
  generateBulkSplTransactions,
  generateCompleteBulkSplTransactions,
} from './bulk-spl-transfer';
