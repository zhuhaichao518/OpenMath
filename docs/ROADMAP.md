# Roadmap

The repository begins with a small executable foundation. The following milestones are research and engineering plans, not promises of completed capability.

## v0.1 — executable foundation

- [x] Publish the project vision and explicit trust boundaries.
- [x] Define a minimal integer-polynomial/propositional JSON language.
- [x] Implement exact polynomial normalization and contextual claim keys.
- [x] Represent alternative proof routes and return unresolved obligations.
- [x] Check polynomial identities and modus ponens; reject circular self-certification.
- [x] Include examples, tests and CI.

## v0.2 — verifiable artifacts and persistent knowledge

- [ ] Versioned schemas, serialization, storage and indexed lookup.
- [ ] Immutable evidence records with provenance, search domain and reproducibility metadata.
- [ ] Export and replay complete proof certificates.
- [ ] Validate counterexample witnesses and represent refuted claims.
- [ ] Incremental graph updates, computation budgets and scalable route selection.
- [ ] Distinguish proof gaps, remaining assumptions and route cost in the API.

Acceptance: a second process can reload the knowledge base, replay certificates, detect tampering and retrieve context-compatible statements.

## v0.3 — Lean integration and LLM tools

- [ ] Verify exact target statements through an isolated Lean backend.
- [ ] Audit axioms and record prover/toolchain/library versions.
- [ ] Add typed binders and explicit assumptions; preserve conditional conclusions.
- [ ] Expose structured APIs/MCP tools for retrieval, proof proposals and obligations.
- [ ] Build a benchmark where an agent completes partial proofs using reusable lemmas.

Acceptance: an agent closes a previously unfinished route with a replayable Lean proof, while attempts to change the target, hide assumptions or use unsupported axioms are rejected.

## Research track — evidence-guided search

- [ ] Evaluate heuristics against simple baselines on held-out theorem families.
- [ ] Measure effects of correlated evidence, sampling bias and repeated tests.
- [ ] Compare route scoring based on support, estimated proof effort and information gain.
- [ ] Keep calibration uncertainty and proof status independently visible.

Acceptance: report reproducible changes in solved goals and computation cost, without interpreting test-pass rates as theorem probabilities.

## Research track — scientific formalization

- [ ] Map source statements to typed formulas with units, domains and assumptions.
- [ ] Keep approximation/error bounds and empirical provenance.
- [ ] Require equivalence certificates outside decidable normalization fragments.
- [ ] Explore established OpenMath symbol dictionaries and existing formal libraries.
- [ ] Evaluate translation fidelity independently of proof validity.

Acceptance: a small curated corpus can be retrieved across equivalent formulations while incompatible domains, units and assumptions remain distinct.
