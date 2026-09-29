import test from 'node:test';
import assert from 'node:assert/strict';
import { ProofGraph, claimKey, normalizePolynomial, statementKey, isPolynomialIdentity } from '../src/index.js';

const x = ['var', 'x'];
const A = ['atom', 'A'];
const B = ['atom', 'B'];
const AB = ['implies', A, B];
const route = { rule: 'modus-ponens', premises: ['a', 'ab'] };

test('expanded and factored polynomials normalize identically', () => {
  assert.deepEqual(normalizePolynomial(['mul', ['add', x, 1], ['sub', x, 1]]), normalizePolynomial(['sub', ['pow', x, 2], 1]));
});
test('integer arithmetic is exact beyond Number precision', () => {
  assert.deepEqual(normalizePolynomial(['add', ['int', '9007199254740993'], 1]), [[[], '9007199254740994']]);
});
test('equality is symmetric, but different assertions stay distinct', () => {
  assert.equal(statementKey(['eq', x, 1]), statementKey(['eq', 1, x]));
  assert.notEqual(statementKey(['eq', x, 1]), statementKey(['eq', x, 2]));
});
test('keys isolate axiom contexts and ignore axiom ordering/duplicates', () => {
  assert.notEqual(claimKey(B), claimKey(B, { axioms: [A] }));
  assert.equal(claimKey(B, { axioms: [A, AB, A] }), claimKey(B, { axioms: [AB, A] }));
});
test('unsupported expressions and excessive resource requests fail closed', () => {
  for (const expr of [['div', x, x], 0.5, Number.MAX_SAFE_INTEGER + 1, ['pow', x, 17], ['var', '']]) {
    assert.throws(() => normalizePolynomial(expr));
  }
});
test('polynomial checker rejects nonidentities', () => {
  assert.equal(isPolynomialIdentity(['eq', ['add', x, 1], x]), false);
  assert.equal(isPolynomialIdentity(['eq', ['mul', 0, x], 0]), true);
});
test('only explicit axioms and checked inferences reach 100%', () => {
  const g = new ProofGraph({ axioms: [A, AB] });
  g.add({ id: 'b', statement: B, routes: [route] });
  g.add({ id: 'ab', statement: AB });
  g.add({ id: 'a', statement: A });
  assert.equal(g.analyze('b').status, 'proven');
  assert.equal(g.analyze('b').confidence, 1);
  assert.equal(g.analyze('b').axiomDependencies.length, 2);
  assert.deepEqual(g.analyze('b').obligations, []);
});
test('lots of reported tests never certify a conjecture', () => {
  const g = new ProofGraph({ axioms: [AB] });
  g.add({ id: 'a', statement: A, evidence: { passed: 1000000, tested: 1000000, source: 'fixture' }, status: 'proven', confidence: 1 });
  g.add({ id: 'ab', statement: AB });
  g.add({ id: 'b', statement: B, routes: [route] });
  const r = g.analyze('b');
  assert.equal(r.status, 'conjectured');
  assert.equal(r.confidence, null);
  assert.equal(r.supportScore, 0.99);
  assert.deepEqual(r.obligations, ['a']);
});
test('cyclic reasoning cannot manufacture a proof', () => {
  const BA = ['implies', B, A];
  const g = new ProofGraph({ axioms: [AB, BA] });
  g.add({ id: 'a', statement: A, routes: [{ rule: 'modus-ponens', premises: ['b', 'ba'] }] });
  g.add({ id: 'b', statement: B, routes: [route] });
  g.add({ id: 'ab', statement: AB });
  g.add({ id: 'ba', statement: BA });
  assert.equal(g.analyze('b').status, 'unknown');
  assert.equal(g.analyze('b').confidence, null);
});
test('an independent checked route can close a cyclic graph', () => {
  const BA = ['implies', B, A];
  const g = new ProofGraph({ axioms: [A, AB, BA] });
  g.add({ id: 'a', statement: A, routes: [{ rule: 'modus-ponens', premises: ['b', 'ba'] }] });
  g.add({ id: 'b', statement: B, routes: [route] });
  g.add({ id: 'ab', statement: AB });
  g.add({ id: 'ba', statement: BA });
  assert.equal(g.analyze('b').status, 'proven');
});
test('bad inference edges and missing premises fail closed', () => {
  const g = new ProofGraph();
  g.add({ id: 'a', statement: A });
  g.add({ id: 'ab', statement: ['implies', B, A] });
  g.add({ id: 'b', statement: B, routes: [route] });
  assert.throws(() => g.analyze('b'), /Invalid modus-ponens/);
  const missing = new ProofGraph();
  missing.add({ id: 'b', statement: B, routes: [route] });
  assert.throws(() => missing.analyze('b'), /Missing premise/);
});
test('external mutations cannot alter stored claims or trusted policy', () => {
  const axioms = [structuredClone(A)];
  const g = new ProofGraph({ axioms });
  const claim = { id: 'a', statement: structuredClone(A) };
  g.add(claim);
  axioms[0][1] = 'B'; claim.statement[1] = 'B';
  const r = g.analyze('a'); r.selectedRoute.axioms.push('fake');
  assert.equal(g.analyze('a').status, 'axiom');
  assert.equal(g.analyze('a').axiomDependencies.length, 1);
  assert.deepEqual(g.lookup(B), []);
});
test('duplicate ids, invented rules, and malformed evidence are rejected', () => {
  const g = new ProofGraph();
  g.add({ id: 'a', statement: A });
  assert.throws(() => g.add({ id: 'a', statement: B }));
  assert.throws(() => g.add({ id: 'x', statement: A, routes: [{ rule: 'trust-me' }] }));
  assert.throws(() => g.add({ id: 'x', statement: A, evidence: { passed: 2, tested: 1, source: 'fixture' } }));
});
test('equivalent formula lookup returns a checked identity', () => {
  const g = new ProofGraph();
  g.add({ id: 'identity', statement: ['eq', ['add', x, x], ['mul', 2, x]] });
  const result = g.lookup(['eq', ['sub', ['mul', 2, x], x], x]);
  assert.equal(result[0].status, 'proven');
});
test('best supported alternative identifies its remaining lemma', () => {
  const C = ['atom', 'C'];
  const CB = ['implies', C, B];
  const g = new ProofGraph({ axioms: [AB, CB] });
  g.add({ id: 'a', statement: A });
  g.add({ id: 'c', statement: C, evidence: { passed: 98, tested: 98, source: 'fixture' } });
  g.add({ id: 'ab', statement: AB });
  g.add({ id: 'cb', statement: CB });
  g.add({ id: 'b', statement: B, routes: [route, { rule: 'modus-ponens', premises: ['c', 'cb'] }] });
  assert.deepEqual(g.analyze('b').obligations, ['c']);
  assert.equal(g.analyze('b').supportScore, 0.99);
});
