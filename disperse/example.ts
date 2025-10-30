/**
 * Example usage of bulk transfer functions
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  generateBulkSolTransactions,
  generateCompleteBulkSplTransactions,
  chunk,
  sleep,
} from './index';

// Configuration
const RPC_ENDPOINT = 'https://api.devnet.solana.com';
const CHUNK_SIZE = 5; // Number of transactions to send in parallel
const DELAY_MS = 1000; // Delay between chunks

/**
 * Example: Bulk SOL Transfer
 */
async function exampleBulkSolTransfer() {
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const sender = Keypair.generate(); // Replace with your keypair

  console.log('Sender:', sender.publicKey.toBase58());

  // Generate recipient addresses
  const recipients = Array.from({ length: 100 }, () => Keypair.generate().publicKey.toBase58());

  // Generate transactions
  const transactions = generateBulkSolTransactions({
    sender: sender.publicKey,
    recipients,
    fixedAmount: 0.001 * LAMPORTS_PER_SOL, // 0.001 SOL per recipient
    memo: 'Example bulk SOL transfer',
  });

  console.log(`Generated ${transactions.length} transactions for ${recipients.length} recipients`);

  // Split into chunks for rate limiting
  const txChunks = chunk(transactions, CHUNK_SIZE);

  for (let i = 0; i < txChunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${txChunks.length}`);

    await Promise.all(
      txChunks[i].map(async (tx, idx) => {
        // Add recent blockhash and fee payer
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = sender.publicKey;

        // Sign transaction
        tx.sign(sender);

        // Send transaction
        const signature = await connection.sendRawTransaction(tx.serialize(), {
          skipPreflight: false,
        });

        // Confirm transaction
        await connection.confirmTransaction(signature, 'confirmed');

        console.log(`  Tx ${idx + 1} confirmed:`, signature);
      })
    );

    // Delay between chunks to avoid rate limits
    if (i < txChunks.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('All SOL transfers completed!');
}

/**
 * Example: Bulk SPL Token Transfer
 */
async function exampleBulkSplTransfer() {
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const sender = Keypair.generate(); // Replace with your keypair
  const mint = Keypair.generate().publicKey; // Replace with your token mint

  console.log('Sender:', sender.publicKey.toBase58());
  console.log('Mint:', mint.toBase58());

  // Generate recipient addresses
  const recipients = Array.from({ length: 100 }, () => Keypair.generate().publicKey.toBase58());

  // Generate all transactions (account creation + transfers)
  const { accountCreationTxs, transferTxs } = await generateCompleteBulkSplTransactions(connection, {
    sender: sender.publicKey,
    mint,
    recipients,
    fixedAmount: 1_000_000, // Raw token amount
    memo: 'Example bulk SPL transfer',
  });

  console.log(`Generated ${accountCreationTxs.length} account creation transactions`);
  console.log(`Generated ${transferTxs.length} transfer transactions`);

  // Step 1: Create token accounts
  if (accountCreationTxs.length > 0) {
    console.log('Creating token accounts...');
    const accountChunks = chunk(accountCreationTxs, CHUNK_SIZE);

    for (let i = 0; i < accountChunks.length; i++) {
      console.log(`Processing account creation chunk ${i + 1}/${accountChunks.length}`);

      await Promise.all(
        accountChunks[i].map(async (tx, idx) => {
          const { blockhash } = await connection.getLatestBlockhash();
          tx.recentBlockhash = blockhash;
          tx.feePayer = sender.publicKey;
          tx.sign(sender);

          const signature = await connection.sendRawTransaction(tx.serialize());
          await connection.confirmTransaction(signature, 'confirmed');

          console.log(`  Account creation tx ${idx + 1} confirmed:`, signature);
        })
      );

      if (i < accountChunks.length - 1) {
        await sleep(DELAY_MS);
      }
    }
  }

  // Step 2: Send tokens
  console.log('Sending tokens...');
  const transferChunks = chunk(transferTxs, CHUNK_SIZE);

  for (let i = 0; i < transferChunks.length; i++) {
    console.log(`Processing transfer chunk ${i + 1}/${transferChunks.length}`);

    await Promise.all(
      transferChunks[i].map(async (tx, idx) => {
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = sender.publicKey;
        tx.sign(sender);

        const signature = await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(signature, 'confirmed');

        console.log(`  Transfer tx ${idx + 1} confirmed:`, signature);
      })
    );

    if (i < transferChunks.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('All SPL transfers completed!');
}

/**
 * Example: Variable amounts
 */
async function exampleVariableAmounts() {
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const sender = Keypair.generate();

  const transactions = generateBulkSolTransactions({
    sender: sender.publicKey,
    transfers: [
      { recipient: Keypair.generate().publicKey.toBase58(), amount: 0.001 * LAMPORTS_PER_SOL },
      { recipient: Keypair.generate().publicKey.toBase58(), amount: 0.002 * LAMPORTS_PER_SOL },
      { recipient: Keypair.generate().publicKey.toBase58(), amount: 0.003 * LAMPORTS_PER_SOL },
    ],
    memo: 'Variable amount transfers',
  });

  console.log(`Generated ${transactions.length} transactions with variable amounts`);
}

// Run examples
if (require.main === module) {
  console.log('=== Bulk Transfer Examples ===\n');

  // Uncomment to run:
  // exampleBulkSolTransfer().catch(console.error);
  // exampleBulkSplTransfer().catch(console.error);
  // exampleVariableAmounts().catch(console.error);

  console.log('Examples ready. Uncomment the function calls to run.');
}
