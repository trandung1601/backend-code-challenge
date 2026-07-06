/**
 * Problem 1 — Three unique implementations of `sum_to_n`.
 *
 * Input:  `n` - any integer.
 *         The result is assumed to always be < Number.MAX_SAFE_INTEGER.
 * Output: summation to `n`, e.g. sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15.
 *
 * Note on negative input:
 *   `n` can be "any integer", so negatives are handled symmetrically:
 *   sum_to_n(-5) === -1 + -2 + -3 + -4 + -5 === -15.
 *   (We sum every integer between 1 and `n` inclusive, in whichever
 *   direction `n` points.)
 */

/**
 * (a) Closed-form formula (Gauss).
 *
 * Complexity: O(1) time, O(1) space.
 * The most efficient approach — a constant number of arithmetic ops
 * regardless of `n`. Uses Math.abs so negative `n` mirrors positive `n`.
 */
export function sum_to_n_a(n: number): number {
  const sign = Math.sign(n);
  const m = Math.abs(n);
  return (sign * (m * (m + 1))) / 2;
}

/**
 * (b) Iterative loop.
 *
 * Complexity: O(n) time, O(1) space.
 * Straightforward and readable; cost grows linearly with |n|.
 * `step` walks toward `n` so both positive and negative inputs work.
 */
export function sum_to_n_b(n: number): number {
  let sum = 0;
  const step = n < 0 ? -1 : 1;
  for (let i = Math.abs(n); i > 0; i--) {
    sum += step * i;
  }
  return sum;
}

/**
 * (c) Recursion.
 *
 * Complexity: O(n) time, O(n) space (one stack frame per level).
 * The least efficient here: linear call-stack usage risks a
 * "Maximum call stack size exceeded" error for large |n|.
 * Included to show a third distinct technique.
 */
export function sum_to_n_c(n: number): number {
  if (n === 0) return 0;
  const next = n > 0 ? n - 1 : n + 1;
  return n + sum_to_n_c(next);
}
