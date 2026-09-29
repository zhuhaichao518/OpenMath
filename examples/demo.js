import { ProofGraph } from '../src/index.js';

const x = ['var', 'x'];
const P = ['eq', ['mul', ['add', x, 1], ['sub', x, 1]], ['sub', ['pow', x, 2], 1]];
const Q = ['atom', 'downstream-result'];
const implication = ['implies', P, Q];

// A hypothetical implication is explicitly approved as an axiom for this demo.
const graph = new ProofGraph({ axioms: [implication] });
graph.add({ id: 'lemma', statement: P });
graph.add({ id: 'bridge', statement: implication });
graph.add({ id: 'goal', statement: Q, routes: [{ rule: 'modus-ponens', premises: ['lemma', 'bridge'] }] });

console.log('1. Reuse a polynomial identity through a different spelling:');
console.log(JSON.stringify(graph.lookup(['eq', ['pow', x, 2], ['add', ['mul', ['sub', x, 1], ['add', x, 1]], 1]]), null, 2));
console.log('2. Complete a chain under an explicitly declared axiom:');
console.log(JSON.stringify(graph.analyze('goal'), null, 2));

// The same statement in a different axiom context is not certified.
const research = new ProofGraph();
research.add({ id: 'lemma', statement: P });
research.add({ id: 'bridge', statement: implication, evidence: {
  passed: 998, tested: 998, source: 'Synthetic example metadata; no experiment was run.'
} });
research.add({ id: 'goal', statement: Q, routes: [{ rule: 'modus-ponens', premises: ['lemma', 'bridge'] }] });
console.log('3. High support still leaves a concrete proof obligation:');
console.log(JSON.stringify(research.analyze('goal'), null, 2));
