import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sum_to_n_a, sum_to_n_b, sum_to_n_c } from './index.ts';

const implementations = {
  sum_to_n_a,
  sum_to_n_b,
  sum_to_n_c,
};

// [input, expected]
const cases: Array<[number, number]> = [
  [0, 0],
  [1, 1],
  [5, 15], // 1 + 2 + 3 + 4 + 5
  [10, 55],
  [100, 5050],
  [-1, -1],
  [-5, -15], // -1 + -2 + -3 + -4 + -5
];

function formatCase(input: number, expected: number, actual: number) {
  const status = actual === expected ? 'PASS' : 'FAIL';
  return `[${status}] input=${input} expected=${expected} actual=${actual}`;
}

for (const [name, fn] of Object.entries(implementations)) {
  test(`${name} returns the correct summation`, (t) => {
    t.diagnostic(`Running ${name} against ${cases.length} sample cases`);

    for (const [input, expected] of cases) {
      const actual = fn(input);
      t.diagnostic(formatCase(input, expected, actual));
      assert.equal(actual, expected, `${name}(${input}) should be ${expected}`);
    }
  });
}

test('all implementations agree with each other', (t) => {
  t.diagnostic('Cross-checking all implementations for every n in [-50, 50]');

  for (let n = -50; n <= 50; n++) {
    const a = sum_to_n_a(n);
    const b = sum_to_n_b(n);
    const c = sum_to_n_c(n);
    t.diagnostic(`[PASS] n=${n} formula=${a} loop=${b} recursion=${c}`);
    assert.equal(b, a, `sum_to_n_b(${n}) diverges`);
    assert.equal(c, a, `sum_to_n_c(${n}) diverges`);
  }
});

test('handles a large input consistently', (t) => {
  const n = 100_000;
  const expected = (n * (n + 1)) / 2; // 5000050000
  const formula = sum_to_n_a(n);
  const loop = sum_to_n_b(n);

  t.diagnostic(`Stress test input=${n}`);
  t.diagnostic(`[PASS] formula expected=${expected} actual=${formula}`);
  t.diagnostic(`[PASS] loop expected=${expected} actual=${loop}`);

  assert.equal(formula, expected);
  assert.equal(loop, expected);
});
