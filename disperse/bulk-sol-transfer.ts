import { PublicKey, Transaction } from '@solana/web3.js';
import { IBulkSolTransferConfig } from './types';
import {
  createSolTransferInstruction,
  createMemoInstruction,
  buildTransaction,
} from './transaction-builder';

const DEFAULT_INSTRUCTIONS_PER_TX = 18;
const DEFAULT_MEMO = 'Bulk SOL transfer';

/**
 * Generate transactions for bulk SOL transfers
 *
 * @param config - Configuration for bulk SOL transfers
 * @returns Array of unsigned transactions ready to be signed and sent
 *
 * @example
 * // Using transfers array (variable amounts)
 * const transactions = generateBulkSolTransactions({
 *   sender: senderPublicKey,
 *   transfers: [
 *     { recipient: 'address1', amount: 1000000 },
 *     { recipient: 'address2', amount: 2000000 },
 *   ]
 * });
 *
 * @example
 * // Using recipients with fixed amount
 * const transactions = generateBulkSolTransactions({
 *   sender: senderPublicKey,
 *   recipients: ['address1', 'address2', 'address3'],
 *   fixedAmount: 1000000,
 * });
 */
export function generateBulkSolTransactions(config: IBulkSolTransferConfig): Transaction[] {
  const {
    sender,
    transfers,
    recipients,
    fixedAmount,
    instructionsPerTx = DEFAULT_INSTRUCTIONS_PER_TX,
    memo = DEFAULT_MEMO,
  } = config;

  const transactions: Transaction[] = [];
  let currentInstructions: any[] = [];

  // Helper to finalize current transaction
  const finalizeTransaction = () => {
    if (currentInstructions.length > 0) {
      // Add memo as last instruction
      currentInstructions.push(createMemoInstruction(memo, sender));
      transactions.push(buildTransaction(currentInstructions));
      currentInstructions = [];
    }
  };

  // Mode 1: Using recipients with fixed amount
  if (fixedAmount !== undefined && recipients !== undefined) {
    for (let i = 0; i < recipients.length; i++) {
      currentInstructions.push(
        createSolTransferInstruction(sender, new PublicKey(recipients[i]), fixedAmount)
      );

      // Finalize transaction every N instructions or at the end
      if ((i + 1) % instructionsPerTx === 0 || i === recipients.length - 1) {
        finalizeTransaction();
      }
    }
  }
  // Mode 2: Using transfers array (variable amounts)
  else if (transfers !== undefined) {
    for (let i = 0; i < transfers.length; i++) {
      currentInstructions.push(
        createSolTransferInstruction(sender, new PublicKey(transfers[i].recipient), transfers[i].amount)
      );

      // Finalize transaction every N instructions or at the end
      if ((i + 1) % instructionsPerTx === 0 || i === transfers.length - 1) {
        finalizeTransaction();
      }
    }
  } else {
    throw new Error('Either transfers or (recipients + fixedAmount) must be provided');
  }

  return transactions;
}
