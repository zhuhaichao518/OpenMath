# OpenMath

**Reusable, searchable, incrementally completable mathematical proof tools for LLMs.**

[中文](README.md) · [Design](docs/DESIGN.md) · [Language](docs/LANGUAGE.md) · [Roadmap](docs/ROADMAP.md)

A proposition can have many proof directions. Some may be only a lemma or a few steps away from completion. OpenMath aims to preserve those directions, their evidence, and their remaining obligations, so an LLM can continue from prior work instead of starting over.

## Vision

Represent mathematical knowledge as a graph of claims and inference steps. Retrieve equivalent formulations through theory-specific canonical forms. Use evidence to guide exploration, and use proof checkers to decide whether a chain is complete.

Ultimately, a typed mathematical intermediate language should preserve domains, assumptions, definitions, units, provenance, and approximation boundaries when scientific knowledge is formalized. The LLM proposes and searches; the checker validates.

## Trust model

- **Axiom:** explicitly accepted in the selected theory; confidence is 1 relative to that theory.
- **Proven:** all dependencies and inference steps are checked; confidence is 1 relative to the theory and checker.
- **Conjectured:** supported by evidence but still unproved; confidence is `null` and a separate heuristic `supportScore` guides search.
- **Unknown:** no checked proof or reported supporting evidence.

Absence of counterexamples is not a proof. A high score must never promote a claim to `proven`. Conditional proofs retain their assumptions. Empirical support for a scientific model is distinct from a theorem inside that model.

## Working prototype

The dependency-free JavaScript prototype provides exact integer-polynomial normalization, context-sensitive claim hashes, equivalent-form lookup, alternative proof routes, and outstanding obligations. Its small checker supports polynomial identities and modus ponens. A least-fixed-point computation prevents circular claims from certifying each other.

```sh
git clone https://github.com/zhuhaichao518/OpenMath.git
cd OpenMath
npm test
npm run demo
```

Requires Node.js 22+. No installation or API key is needed. Demo evidence counts are synthetic fixtures, explicitly labelled as such.

```js
import { ProofGraph } from './src/index.js';
const x = ['var', 'x'];
const graph = new ProofGraph();
graph.add({ id: 'double', statement: ['eq', ['add', x, x], ['mul', 2, x]] });
console.log(graph.analyze('double')); // proven, confidence: 1
```

## Scope and limitations

This is an early research prototype, not a general-purpose proof assistant. There is no Lean adapter, natural-language formalizer, scientific knowledge database, quantifier engine, or validated counterexample checker yet. Evidence metadata is caller-reported, and the score is not a calibrated probability. The prototype checker has not itself been formally verified.

There is no universal terminating canonicalizer for arbitrary mathematical equivalence. Normalization is limited to declared fragments; outside them, retain the original statement and require equivalence certificates. A missing key match does not establish inequivalence. Graph exploration is intended for small local examples, not adversarial or large-scale workloads.

The project is independent of the established [OpenMath standard](https://openmath.org/standard/). The experimental OM-IR is not currently a compatible implementation. Future integration can reuse existing mathematical symbol dictionaries and [Lean proof checking](https://lean-lang.org/doc/reference/latest/ValidatingProofs/).

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md). Contributions to proof reuse, canonicalization, evidence calibration, counterexample search, and formally checked backends are welcome.

Licensed under the [MIT License](LICENSE).
