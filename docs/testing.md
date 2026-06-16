# Testing

## Structure

Tests mirror the [llm-chat](https://github.com/johanneslatzel/llm-chat) convention:

```
tests/
├── index.ts            # barrel
├── helper/
│   └── graph.ts        # topology builders + test utilities
└── unit/
    ├── add.test.ts
    ├── remove.test.ts
    ├── clear.test.ts
    ├── size.test.ts
    └── rank/
        ├── basic-flow.test.ts
        ├── edge-cases.test.ts
        ├── invariants.test.ts
        ├── parameters.test.ts
        ├── topologies.test.ts
        └── academic.test.ts
```

## Coverage

100% required on statements, branches, functions, and lines — enforced via
Vitest config. The `src/index.ts` barrel export is excluded from the threshold.

## Invariants checked in every rank test

- **Sum ≈ 1**: `rankSum(result)` is within `1e-10` of 1
- **All positive**: every node score > 0
- **No NaN/Infinity**: `Number.isFinite` on every value
- **Determinism**: repeated calls to `rank()` return identical results
- **Edge mutations between calls**: interleaved `add`/`rank` are independent

## Academic reference graphs

The implementation is validated against exact solutions and published
reference values from four authoritative sources. All graphs are defined
inline via `fromEdges()` in [`tests/unit/rank/academic.test.ts`](https://github.com/johanneslatzel/pagerank/blob/main/tests/unit/rank/academic.test.ts).

### Oregon State University — Math 390R/490R

**Source:** [PageRank worked example (PDF)](https://web.engr.oregonstate.edu/~phamt3/Courses/W25-Math-390R-490R/PageRank-example.pdf)

```
1 → 2, 1 → 3, 1 → 4
2 → 3, 2 → 4
3 → 4
4 → 1
```

No dangling nodes.

| Damping | PageRank vector (exact rational) | Decimal |
|---------|----------------------------------|---------|
| `d = 1` | `[6/17, 2/17, 3/17, 6/17]` | ≈ [0.3529, 0.1176, 0.1765, 0.3529] |
| `d = 2/3` | `[201/652, 99/652, 132/652, 220/652]` | ≈ [0.3083, 0.1518, 0.2025, 0.3374] |

### BYU ACME Lab — Problem 2 (unweighted)

**Source:** [The PageRank Algorithm — ACME Labs, Fig 1](https://labs.acme.byu.edu/Volume1/PageRank/PageRank.html)

```
a → b, a → c, a → d
c → b, c → d
d → c
```

Node `b` is dangling (no outgoing edges).

| Damping | Reference (`Problem 2`, `itersolve`) |
|---------|--------------------------------------|
| `d = 0.85` | `{a: 0.095758635, b: 0.274158285, c: 0.355924792, d: 0.274158285}` |

### BYU ACME Lab — Weighted graph (Fig 3)

**Source:** [The PageRank Algorithm — ACME Labs, Fig 3 / NetworkX example](https://labs.acme.byu.edu/Volume1/PageRank/PageRank.html)

```
a → b (w=2), a → c (w=1), a → d (w=1)
c → b (w=1), c → d (w=2)
d → c (w=2)
```

Node `b` is dangling.

| Damping | Reference (`nx.pagerank`, `alpha=0.85`) |
|---------|----------------------------------------|
| `d = 0.85` | `{a: 0.0858848438, b: 0.2276927427, c: 0.3716732339, d: 0.3147491797}` |

### MathWorks MATLAB — 6-node example

**Source:** [Use PageRank Algorithm to Rank Websites — MathWorks docs](https://se.mathworks.com/help/matlab/math/use-page-rank-algorithm-to-rank-websites.html)

```
alpha → beta, alpha → epsilon
beta → gamma, beta → delta
gamma → delta, gamma → epsilon, gamma → zeta
delta → alpha
epsilon → alpha
```

Node `zeta` is dangling.

| Damping | Reference (`centrality(G,'pagerank','FollowProbability',0.85)`) |
|---------|----------------------------------------------------------------|
| `d = 0.85` | `{α: 0.32098, β: 0.17057, γ: 0.10657, δ: 0.13678, ε: 0.20078, ζ: 0.06432}` |

### Ring of 10 at d = 1

Exact uniform distribution: every node receives `0.1`. No dangling nodes,
so `d = 1` converges immediately to the uniform eigenvector.

## Topology & parameter sweep

Additional test graphs exercise specific structural properties:

| Topology | Description |
|----------|-------------|
| **Ring** (10 nodes) | Uniform ranks at any damping |
| **Star** (center → 8 leaves) | Hub-and-spoke |
| **Bipartite** (3 → 4) | Two-tier structure |
| **Two-tier hub** (3 mids × 4 leaves) | Depth-3 fan-out |
| **Dense** (20 nodes, ~60% edges) | Near-complete graph |
| **Chain** (100 nodes) | Long sequential path |

Parameter tests vary `damping` (0.5, 0.85, 0.99), `maxIter` (1, 500, 2000),
and `tol` (1e-6, 1e-10, 1e-12) to verify convergence behaviour across
the full operating range.
