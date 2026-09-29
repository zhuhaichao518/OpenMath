import { createHash } from 'node:crypto';

// A deliberately small language: exact integer polynomials, atoms, implication.
// Monomials are sorted arrays of variable names; coefficients are BigInts.
const MAX_TERMS = 2048;
const MAX_WORK = 100000;
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
function shape(value, tag, length) {
  return Array.isArray(value) && value[0] === tag && value.length === length;
}
function add(a, b, factor = 1n) {
  const out = new Map(a);
  for (const [m, c] of b) {
    const value = (out.get(m) ?? 0n) + c * factor;
    if (value === 0n) out.delete(m); else out.set(m, value);
  }
  if (out.size > MAX_TERMS) throw new Error('Polynomial term budget exceeded');
  return out;
}
function multiply(a, b, budget) {
  let out = new Map();
  for (const [am, ac] of a) for (const [bm, bc] of b) {
    if (--budget.work < 0) throw new Error('Polynomial work budget exceeded');
    const monomial = JSON.stringify([...JSON.parse(am), ...JSON.parse(bm)].sort(compare));
    out = add(out, new Map([[monomial, ac * bc]]));
  }
  return out;
}
function polynomial(expr, budget, depth = 0) {
  if (depth > 64 || --budget.work < 0) throw new Error('Expression budget exceeded');
  if (Number.isSafeInteger(expr)) return expr === 0 ? new Map() : new Map([['[]', BigInt(expr)]]);
  if (shape(expr, 'int', 2) && typeof expr[1] === 'string' && /^-?(0|[1-9]\d*)$/.test(expr[1]) && expr[1].length <= 256) {
    const n = BigInt(expr[1]);
    return n === 0n ? new Map() : new Map([['[]', n]]);
  }
  if (shape(expr, 'var', 2) && typeof expr[1] === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(expr[1])) {
    return new Map([[JSON.stringify([expr[1]]), 1n]]);
  }
  const parse = x => polynomial(x, budget, depth + 1);
  if (shape(expr, 'add', 3)) return add(parse(expr[1]), parse(expr[2]));
  if (shape(expr, 'sub', 3)) return add(parse(expr[1]), parse(expr[2]), -1n);
  if (shape(expr, 'mul', 3)) return multiply(parse(expr[1]), parse(expr[2]), budget);
  if (shape(expr, 'pow', 3) && Number.isInteger(expr[2]) && expr[2] >= 0 && expr[2] <= 16) {
    const base = parse(expr[1]);
    let out = new Map([['[]', 1n]]);
    for (let i = 0; i < expr[2]; i++) out = multiply(out, base, budget);
    return out;
  }
  throw new Error('Unsupported polynomial expression');
}

/** Exact normal form in Z[x_1, ..., x_n]. No floating-point arithmetic. */
export function normalizePolynomial(expr) {
  return [...polynomial(expr, { work: MAX_WORK })]
    .sort(([a], [b]) => compare(a, b))
    .map(([monomial, coefficient]) => [JSON.parse(monomial), coefficient.toString()]);
}

/** Sound but incomplete equivalence normalization for statements over integers. */
export function normalizeStatement(statement, depth = 0) {
  if (depth > 64) throw new Error('Statement depth budget exceeded');
  if (shape(statement, 'atom', 2) && typeof statement[1] === 'string' && statement[1].length > 0 && statement[1].length <= 256) {
    return statement;
  }
  if (shape(statement, 'implies', 3)) {
    return ['implies', normalizeStatement(statement[1], depth + 1), normalizeStatement(statement[2], depth + 1)];
  }
  if (shape(statement, 'eq', 3)) {
    const terms = normalizePolynomial(['sub', statement[1], statement[2]]);
    // p = 0 and -p = 0 have identical keys. Other equivalences need certificates.
    if (terms.length && BigInt(terms[0][1]) < 0n) {
      for (const term of terms) term[1] = (-BigInt(term[1])).toString();
    }
    return ['eq-zero', terms];
  }
  throw new Error('Unsupported statement');
}

export function statementKey(statement) {
  return JSON.stringify(normalizeStatement(statement));
}

/** Keys include the entire trusted theory and the normalization version. */
export function claimKey(statement, { axioms = [] } = {}) {
  const context = [...new Set(axioms.map(statementKey))].sort(compare);
  return createHash('sha256').update(JSON.stringify({
    language: 'om-ir/0.1', domain: 'Z', normalizer: 'polynomial/0.1',
    axioms: context, statement: statementKey(statement)
  })).digest('hex');
}

export function isPolynomialIdentity(statement) {
  const normal = normalizeStatement(statement);
  return normal[0] === 'eq-zero' && normal[1].length === 0;
}
