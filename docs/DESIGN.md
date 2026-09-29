# Design: reusable proof directions

## 1. Research objective

Keep useful mathematical work even when the final proof is unfinished. A query should answer: what is known, under which assumptions, why it is trusted, what alternative routes exist, and which obligations remain?

The long-term graph is a directed hypergraph. A claim is a node. A proof step consumes multiple premises and produces one conclusion. Separate attempts may reach the same conclusion through different intermediate lemmas.

## 2. Separate logical status from evidence

The word “confidence” can conflate distinct quantities. The API deliberately separates:

- `status`: axiom, proven, conjectured, or unknown in this prototype.
- `confidence`: 1 for a checked/accepted result in the selected theory; otherwise null.
- `supportScore`: an experimental search-ranking value, not a truth probability.
- `obligations`: unproved claims on the selected candidate route.
- `axiomDependencies`: the explicit axioms used by the selected checked route.
- `checker`: the implementation/version whose result is being trusted.

An axiom is a theory-relative premise, not an empirically established absolute truth. A theory can be inconsistent. The prototype does not check consistency. Automatically allowing an LLM to approve its own new axioms would destroy the intended trust boundary.

In production, axiom policy must live outside the model-controlled input. The application supplies approved axioms; the model can only propose claims and proof attempts. Adding assumptions creates a distinct context and must never silently change the original query.

## 3. Prototype scoring policy

For caller-reported test metadata with `p` passes and `n` tests:

```text
evidenceSupport = min(0.99, (p + 1) / (n + 2))
routeSupport    = min(premiseSupport_1, ..., premiseSupport_k)
claimSupport    = max(ownEvidenceSupport, alternativeRouteSupports)
```

No evidence gives a score of 0. Checked claims score 1. This is a smoothed test-pass-rate heuristic. It has no claim to calibration as the probability of a universal proposition, and repeated or correlated tests can make it misleading. Route aggregation is a ranking convention, not probability calculus. Equal-scoring routes retain the earlier choice; ties with direct evidence keep the claim itself as the obligation. This implementation does not minimize the number of remaining steps.

Evidence requires a source string but is not independently verified. A failed test does not yet become a formally validated counterexample: that requires a witness checker, planned separately. Consumers must not interpret any score as either a proof or a refutation.

Research directions: store search domains, seeds, generators, solver versions, computation budgets and witness artifacts; deduplicate correlated evidence; calibrate ranking on historical theorem-proving tasks; measure completed proofs per unit of computation. Do not use “high confidence” as a substitute for these experiments.

## 4. Checked routes and cycles

The prototype starts with explicitly approved axioms and polynomial identities checked by exact normalization. It repeatedly accepts a modus-ponens edge only if both premises are already certified. This least fixed point cannot bootstrap an unsupported cycle.

Inference edges are structurally checked even when their premises are unproved. For `P` and `P → Q`, the claimed conclusion must be `Q` under the supported normalization. Missing premises, unknown rules and mismatched conclusions fail closed with an error. Forward references are allowed during graph construction, but must resolve before analysis.

The prototype returns a selected immediate route and its transitive axiom dependencies. It does not yet export a standalone recursively replayable certificate bundle. Candidate route search recursively avoids revisiting nodes; it is intended for small graphs, and may take exponential time on large branching graphs. Persistence, incremental indexes, isolated execution and graph budgets remain future work.

## 5. Canonical forms and reuse

Canonicalization is versioned and theory-specific. The initial fragment is integer polynomials: flatten products into monomials, sort variables, collect exact coefficients, then sort monomials. Equations normalize their difference and choose a consistent sign.

For example, `(x + 1)(x - 1)` and `x² - 1` share a polynomial representation. Every checked polynomial identity normalizes to the zero polynomial and therefore has the same truth key in this fragment. Original statements remain in their graph nodes.

The claim hash includes the normalized statement, the complete approved axiom set, integer domain, language version and normalizer version. The hash is an index key, not a proof certificate. Current lookup scans stored nodes; persistent indexing is a later optimization.

Different keys do not prove inequivalence. For instance, `2x = 0` and `x = 0` have different keys in version 0.1 even though they are equivalent over the integers. Alpha-equivalence, definitions, richer types and external equivalence certificates are not implemented. Avoid unsound rewrites such as cancelling `x` in `x / x` without a nonzero hypothesis; division is currently rejected entirely.

## 6. Scientific knowledge

The intended formalization record should preserve:

| Field | Purpose |
| --- | --- |
| Source and quotation/span | Trace the mathematical statement back to the original assertion |
| Types, domain and units | Prevent incompatible quantities and domains from matching |
| Assumptions and model | Record idealizations, initial conditions and scope |
| Exact versus approximate | Preserve error bounds and approximation conditions |
| Formalization review | Track whether the formal statement faithfully expresses the source |
| Evidence and provenance | Separate empirical observations from mathematical derivations |

A theorem about an idealized model does not prove that the model describes reality. Translation quality and proof validity are separate checks. These fields are a design target, not features of OM-IR 0.1.

## 7. LLM tool contract (planned)

Proposed tools: `formalize`, `canonicalize`, `lookup`, `propose_route`, `search_counterexample`, `verify_proof`, and `next_obligations`. A future API/MCP adapter should expose structured statements, context fingerprints, proof artifacts and actionable failures.

The current JavaScript exports are the first local building blocks. There is no hosted service, MCP server, model integration or external proof backend yet. A Lean adapter should verify the exact requested statement and audit its axiom dependencies; a model saying “Lean accepted it” is not evidence.

## 8. Trust boundary

The trusted implementation currently includes Node.js, exact polynomial normalization, inference checking, input validation and the caller's axiom policy. It has not been formally verified or security hardened. Tests exercise key soundness boundaries but cannot establish complete correctness. A production system should isolate resource-intensive work and independently replay proof artifacts with a mature prover.

References: [OpenMath standard](https://openmath.org/standard/), [Lean axioms](https://lean-lang.org/doc/reference/latest/Axioms/), [validating a Lean proof](https://lean-lang.org/doc/reference/latest/ValidatingProofs/).
