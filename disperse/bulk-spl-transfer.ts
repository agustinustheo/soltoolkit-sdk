import { PublicKey, Transaction, Connection } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { IBulkSplTransferConfig } from './types';
import {
  createSplTransferInstructionByOwners,
  createTokenAccountInstruction,
  createMemoInstruction,
  buildTransaction,
} from './transaction-builder';

const DEFAULT_INSTRUCTIONS_PER_TX_ACCOUNT_CREATION = 12;
const DEFAULT_INSTRUCTIONS_PER_TX_TRANSFER = 18;
const DEFAULT_MEMO = 'Bulk SPL transfer';

/**
 * Generate transactions for creating associated token accounts for recipients
 *
 * @param connection - Solana connection to check if accounts exist
 * @param mint - Token mint address
 * @param payer - Account that will pay for account creation
 * @param recipients - Array of recipient addresses
 * @param instructionsPerTx - Number of account creation instructions per transaction (default: 12)
 * @returns Array of unsigned transactions for creating token accounts
 */
export async function generateTokenAccountCreationTransactions(
  connection: Connection,
  mint: PublicKey,
  payer: PublicKey,
  recipients: string[],
  instructionsPerTx: number = DEFAULT_INSTRUCTIONS_PER_TX_ACCOUNT_CREATION
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];
  let currentInstructions: any[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const recipientPubkey = new PublicKey(recipients[i]);
    const associatedAddress = getAssociatedTokenAddressSync(mint, recipientPubkey);

    // Check if account already exists
    const accountInfo = await connection.getAccountInfo(associatedAddress);
    if (accountInfo === null) {
      const { instruction } = createTokenAccountInstruction(payer, mint, recipientPubkey);
      currentInstructions.push(instruction);
    }

    // Finalize transaction every N instructions or at the end
    if (currentInstructions.length >= instructionsPerTx || i === recipients.length - 1) {
      if (currentInstructions.length > 0) {
        transactions.push(buildTransaction(currentInstructions));
        currentInstructions = [];
      }
    }
  }

  return transactions;
}

/**
 * Generate transactions for bulk SPL token transfers
 *
 * NOTE: This function assumes that all recipient token accounts already exist.
 * Use generateTokenAccountCreationTransactions() first if accounts may not exist.
 *
 * @param config - Configuration for bulk SPL token transfers
 * @returns Array of unsigned transactions ready to be signed and sent
 *
 * @example
 * // Using transfers array (variable amounts)
 * const transactions = generateBulkSplTransactions({
 *   sender: senderPublicKey,
 *   mint: tokenMintPublicKey,
 *   transfers: [
 *     { recipient: 'address1', amount: 1000000 },
 *     { recipient: 'address2', amount: 2000000 },
 *   ]
 * });
 *
 * @example
 * // Using recipients with fixed amount
 * const transactions = generateBulkSplTransactions({
 *   sender: senderPublicKey,
 *   mint: tokenMintPublicKey,
 *   recipients: ['address1', 'address2', 'address3'],
 *   fixedAmount: 1000000,
 * });
 */
export function generateBulkSplTransactions(config: IBulkSplTransferConfig): Transaction[] {
  const {
    sender,
    mint,
    transfers,
    recipients,
    fixedAmount,
    instructionsPerTx = DEFAULT_INSTRUCTIONS_PER_TX_TRANSFER,
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
        createSplTransferInstructionByOwners(mint, sender, new PublicKey(recipients[i]), fixedAmount)
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
        createSplTransferInstructionByOwners(
          mint,
          sender,
          new PublicKey(transfers[i].recipient),
          transfers[i].amount
        )
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

/**
 * Complete workflow for bulk SPL token transfers including account creation
 *
 * @param connection - Solana connection
 * @param config - Configuration for bulk SPL token transfers
 * @returns Object containing account creation transactions and transfer transactions
 *
 * @example
 * const { accountCreationTxs, transferTxs } = await generateCompleteBulkSplTransactions(
 *   connection,
 *   {
 *     sender: senderPublicKey,
 *     mint: tokenMintPublicKey,
 *     recipients: ['address1', 'address2'],
 *     fixedAmount: 1000000,
 *   }
 * );
 *
 * // Sign and send accountCreationTxs first
 * // Then sign and send transferTxs
 */
export async function generateCompleteBulkSplTransactions(
  connection: Connection,
  config: IBulkSplTransferConfig
): Promise<{
  accountCreationTxs: Transaction[];
  transferTxs: Transaction[];
}> {
  const { sender, mint, recipients, transfers } = config;

  // Determine recipient list
  let recipientList: string[];
  if (recipients !== undefined) {
    recipientList = recipients;
  } else if (transfers !== undefined) {
    recipientList = transfers.map((t) => t.recipient);
  } else {
    throw new Error('Either transfers or recipients must be provided');
  }

  // Generate account creation transactions
  const accountCreationTxs = await generateTokenAccountCreationTransactions(
    connection,
    mint,
    sender,
    recipientList,
    config.instructionsPerTx
  );

  // Generate transfer transactions
  const transferTxs = generateBulkSplTransactions(config);

  return {
    accountCreationTxs,
    transferTxs,
  };
}
