# Contributing to OpenMath

欢迎中文或英文讨论、问题反馈和 Pull Request。

## Development

Use Node.js 22 or newer. There are no runtime or development package dependencies.

```sh
npm test
npm run demo
```

For a change, explain the mathematical meaning, assumptions, supported domain and expected behavior. Include a small example. Changes to canonicalization must consider key-version compatibility; changes to checking must include meaningful soundness tests.

## Useful contributions

- Small reproducible problems where different proof directions can share lemmas.
- Exact normalization within a precisely declared mathematical theory.
- Proof and equivalence certificates that can be replayed independently.
- Evidence provenance, counterexample witnesses and research benchmarks.
- Lean integration and assumption auditing.
- Clear documentation in Chinese or English.

## Review principles

1. Keep proof status separate from heuristic evidence scores.
2. State every domain restriction and assumption. Never silently add an axiom to close a goal.
3. Check the submitted proof against the exact requested proposition.
4. Preserve original statements and source provenance alongside normalized keys.
5. Fail explicitly on unsupported syntax; do not guess semantics.
6. Label synthetic evidence and planned capabilities accurately.

LLM-assisted contributions are welcome and receive the same mathematical and engineering review. Do not submit secrets, private source material or datasets you lack permission to redistribute. By contributing, you agree to license your contribution under the repository's MIT License.
