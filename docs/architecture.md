# Architecture

## Algorithm

Standard PageRank with damping factor via power iteration.

```
PR(pᵢ) = (1-d)/N + d · [ Σⱼ→ᵢ PR(pⱼ) · wⱼᵢ / outWeight(j)  +  danglingSum / N ]
```

### Dangling nodes

Nodes with no outgoing edges are called **dangling nodes**. Their rank mass is
distributed uniformly to **all** nodes each iteration (weakly preferential
teleportation). This matches the standard Google matrix formulation:

```
G = d · S + (1-d) · (eeᵀ)/N
```

where dangling columns of S are replaced by `e/N`.

### Convergence

Iteration stops when the L∞ norm of the change vector is below `tol`:

```
maxᵢ |PRₜ₊₁(pᵢ) - PRₜ(pᵢ)| < tol
```

## Implementation

The `PageRank` class uses an internal adjacency map:

```
#adj: Map<from, Map<to, weight>>
```

- Nodes are discovered implicitly from `add()` calls
- `add()` replaces edge weight (does not accumulate)
- Self-loops are allowed
- `remove()` is a no-op if the edge doesn't exist

For full implementation details, see the [source code](https://github.com/johanneslatzel/pagerank/blob/main/src/pagerank.ts).
