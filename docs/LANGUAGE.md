# OM-IR 0.1: experimental mathematical representation

This project-local JSON language is not the established OpenMath interchange standard. It is deliberately restricted so the prototype can implement clear semantics.

## Expressions

All variables range over the integers. Variable names denote the same variable throughout a statement and its theory context. Expressions have exact arithmetic semantics.

| JSON form | Meaning |
| --- | --- |
| `42` | A JavaScript safe integer |
| `["int", "9007199254740993"]` | An exact integer encoded as a decimal string |
| `["var", "x"]` | An integer variable |
| `["add", a, b]` | Addition |
| `["sub", a, b]` | Subtraction |
| `["mul", a, b]` | Multiplication |
| `["pow", a, n]` | Natural-number power; `0 <= n <= 16` |

By polynomial convention, the zeroth power is 1, including at a zero base. Decimal fractions, division, functions and negative exponents are rejected. Decimal integer strings are limited to 256 characters. Variable names match `[A-Za-z][A-Za-z0-9_]{0,63}`. Polynomial normalization imposes depth, work and term budgets; these are guardrails, not a complete sandbox.

## Statements

```json
["eq", ["add", ["var", "x"], ["var", "x"]], ["mul", 2, ["var", "x"]]]
```

Supported statements are `["eq", expression, expression]`, `["atom", "name"]`, and `["implies", premise, conclusion]`. Atoms are opaque proposition names of 1–256 characters, not natural-language claims with automatically understood semantics. Free integer variables use a common environment; polynomial identities hold for every integer assignment. There are no binders, quantifier manipulation, variable substitution or implicit alpha-renaming in this version.

Do not encode a real-number or scientific statement as an integer polynomial without reviewing its domain. The syntax does not yet carry general type or unit information.

## Theory and graph construction

```js
const P = ['atom', 'P'];
const Q = ['atom', 'Q'];
const graph = new ProofGraph({ axioms: [['implies', P, Q]] });
graph.add({ id: 'p', statement: P });
graph.add({ id: 'implication', statement: ['implies', P, Q] });
graph.add({
  id: 'q', statement: Q,
  routes: [{ rule: 'modus-ponens', premises: ['p', 'implication'] }]
});
graph.analyze('q'); // unknown: P is still an obligation
```

The approved axiom list is supplied by trusted application policy. An axiom needs a graph node if an edge refers to it. An `add` call is immutable: duplicate IDs are rejected and input data is cloned. Rebuild the graph to revise evidence or routes in this version. Ignore any model-supplied `status`, `proven`, or `confidence` fields; the checker computes them itself.

Optional evidence:

```json
{
  "passed": 998,
  "tested": 998,
  "source": "Synthetic fixture for documentation; not an actual experiment."
}
```

Counts must be safe integers with `0 <= passed <= tested` and `tested >= 1`. This is reported metadata, not a proof object or validated experiment.

## Public exports

| Export | Result |
| --- | --- |
| `normalizePolynomial(expr)` | Sorted `[monomialVariables, decimalCoefficient]` terms |
| `normalizeStatement(statement)` | Internal canonical statement representation |
| `statementKey(statement)` | Canonical JSON string within the fixed integer fragment |
| `claimKey(statement, { axioms })` | SHA-256 index key including theory and version context |
| `isPolynomialIdentity(statement)` | Whether an equation reduces exactly to zero |
| `ProofGraph.add(claim)` | Store a claim; return its ID |
| `ProofGraph.analyze(id)` | Status, support, selected route, obligations and axiom dependencies |
| `ProofGraph.lookup(statement)` | Analysis of all stored claims with the same context-sensitive key |

The normalization output is an internal representation, not input syntax. In particular, `eq-zero` is not accepted as user input. Lookup does not add or prove a missing node automatically. Unsupported or malformed input throws an error.
