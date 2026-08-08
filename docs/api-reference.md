# API Reference

## `PageRank`

### `add(from, to, weight?)`

Add or replace a directed edge. Both `from` and `to` are created implicitly if they don't already exist. No separate node registration is needed. If the edge already exists its weight is **replaced** (not accumulated). Returns `this` for chaining.

| Param | Type | Default | Description |
|---|---|---|---|
| `from` | `string` |  | Source node identifier |
| `to` | `string` |  | Target node identifier |
| `weight` | `number` | `1` | Edge weight |

### `remove(from, to)`

Remove a directed edge. No-op if it doesn't exist. The source and target nodes remain tracked even if they become isolated.

### `removeNode(id)`

Remove a node and all its incident edges, both outgoing and incoming. No-op if the node doesn't exist. `size` decreases by one.

### `rank(damping?, maxIter?, tol?)`

Compute weighted PageRank scores.

| Param | Type | Default | Description |
|---|---|---|---|
| `damping` | `number` | `0.85` | Damping factor |
| `maxIter` | `number` | `100` | Maximum iterations |
| `tol` | `number` | `1e-6` | Convergence threshold |

Returns `Map<string, number>` mapping node identifier to PageRank score.

### `clear()`

Remove all edges and reset tracked nodes.

### `size`

Number of distinct nodes tracked. Read-only.
