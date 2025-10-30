/**
 * Utility functions for bulk operations
 */

/**
 * Split an array into chunks of specified size
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  let i = 0;
  const n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, (i += size)));
  }
  return chunks;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
