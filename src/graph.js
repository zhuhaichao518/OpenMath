import { claimKey, isPolynomialIdentity, statementKey } from './canonical.js';

/**
 * Research prototype. Axioms are explicitly approved by the caller, never
 * inferred from evidence or an LLM's asserted status. Treat this policy as trusted.
 */
export class ProofGraph {
  #nodes = new Map();
  #axioms;
  #context;
  constructor({ axioms = [] } = {}) {
    this.#context = { axioms: structuredClone(axioms) };
    this.#axioms = new Set(axioms.map(statementKey));
  }

  add({ id, statement, evidence, routes = [] }) {
    if (typeof id !== 'string' || !id || this.#nodes.has(id)) throw new Error('Unique nonempty claim id required');
    statementKey(statement);
    if (evidence !== undefined) {
      if (!evidence || !Number.isSafeInteger(evidence.passed) || !Number.isSafeInteger(evidence.tested) ||
          evidence.tested < 1 || evidence.passed < 0 || evidence.passed > evidence.tested ||
          typeof evidence.source !== 'string' || !evidence.source.trim()) {
        throw new Error('Evidence requires passed, tested, and source');
      }
    }
    if (!Array.isArray(routes)) throw new Error('Routes must be an array');
    for (const route of routes) {
      if (!route || route.rule !== 'modus-ponens' || !Array.isArray(route.premises) ||
          route.premises.length !== 2 || route.premises.some(x => typeof x !== 'string' || !x)) {
        throw new Error('Only modus-ponens routes with two premise ids are supported');
      }
    }
    // Ignore caller-supplied confidence/status/proven flags; own all mutable data.
    this.#nodes.set(id, structuredClone({ id, statement, evidence, routes }));
    return id;
  }

  #validRoute(node, route) {
    const [fact, implication] = route.premises.map(id => this.#nodes.get(id));
    if (!fact || !implication) throw new Error(`Missing premise in route for ${node.id}`);
    const s = implication.statement;
    if (s[0] !== 'implies' || statementKey(s[1]) !== statementKey(fact.statement) ||
        statementKey(s[2]) !== statementKey(node.statement)) {
      throw new Error(`Invalid modus-ponens route for ${node.id}`);
    }
  }

  analyze(id) {
    if (!this.#nodes.has(id)) throw new Error(`Unknown claim: ${id}`);
    // Validate all edges, then compute a least fixed point. Cycles cannot self-certify.
    for (const node of this.#nodes.values()) for (const r of node.routes) this.#validRoute(node, r);
    const certified = new Map();
    for (const node of this.#nodes.values()) {
      if (this.#axioms.has(statementKey(node.statement))) {
        certified.set(node.id, { rule: 'axiom', axioms: [statementKey(node.statement)] });
      } else if (isPolynomialIdentity(node.statement)) {
        certified.set(node.id, { rule: 'polynomial-identity', axioms: [] });
      }
    }
    let changed = true;
    while (changed) {
      changed = false;
      for (const node of this.#nodes.values()) {
        if (certified.has(node.id)) continue;
        const route = node.routes.find(r => r.premises.every(p => certified.has(p)));
        if (route) {
          const axioms = [...new Set(route.premises.flatMap(p => certified.get(p).axioms))].sort();
          certified.set(node.id, { ...route, axioms });
          changed = true;
        }
      }
    }
    const explore = (target, visiting = new Set()) => {
      if (certified.has(target)) return { score: 1, obligations: [], route: certified.get(target) };
      if (visiting.has(target)) return { score: 0, obligations: [target], cycle: true };
      const node = this.#nodes.get(target);
      const e = node.evidence;
      // Experimental pass-rate support; deliberately NOT P(theorem is true).
      let best = {
        score: e ? Math.min(0.99, (e.passed + 1) / (e.tested + 2)) : 0,
        obligations: [target], route: null
      };
      const next = new Set([...visiting, target]);
      for (const route of node.routes) {
        const premises = route.premises.map(p => explore(p, next));
        const candidate = {
          score: Math.min(...premises.map(p => p.score)),
          obligations: [...new Set(premises.flatMap(p => p.obligations))].sort(), route
        };
        if (candidate.score > best.score) best = candidate;
      }
      return best;
    };
    const node = this.#nodes.get(id);
    const result = explore(id);
    const proof = certified.get(id);
    return {
      id, key: claimKey(node.statement, this.#context),
      status: proof ? proof.rule === 'axiom' ? 'axiom' : 'proven' : result.score > 0 ? 'conjectured' : 'unknown',
      confidence: proof ? 1 : null,
      supportScore: result.score,
      scoreMeaning: 'search heuristic, not probability of truth',
      obligations: result.obligations, selectedRoute: result.route,
      axiomDependencies: proof?.axioms ?? null,
      checker: 'openmath-prototype/0.1', domain: 'Z'
    };
  }

  lookup(statement) {
    const key = claimKey(statement, this.#context);
    return [...this.#nodes.values()]
      .filter(node => claimKey(node.statement, this.#context) === key)
      .map(node => this.analyze(node.id));
  }
}
