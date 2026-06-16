/**
 * A directed edge in the internal adjacency map.
 * @internal
 */
type EdgeEntry = { src: string; weight: number };

const DEFAULT_DAMPING = 0.85;
const DEFAULT_MAX_ITER = 100;
const DEFAULT_TOL = 1e-6;

/**
 * Weighted PageRank computation using the power-iteration method.
 *
 * Tracks a directed graph of nodes and weighted edges. Call {@link add} to
 * build the graph, then {@link rank} to compute the stationary PageRank
 * vector. Dangling nodes (no outgoing edges) distribute their rank
 * uniformly to all nodes each iteration.
 *
 * ```ts
 * const pg = new PageRank();
 * pg.add('a', 'b').add('b', 'c');
 * const ranks = pg.rank();
 * // Map { 'a' => ~0.223, 'b' => ~0.331, 'c' => ~0.446 }
 * ```
 *
 * References:
 * - Brin & Page (1998). "The Anatomy of a Large-Scale Hypertextual Web Search Engine"
 * - Wikipedia "PageRank" — normalized formula with damping factor
 */
export class PageRank {
    /**
     * Internal adjacency storage.
     * `#adj.get(from)` returns a `Map<to, weight>` of outgoing edges.
     * A node with no outgoing edges has an entry pointing to an empty Map.
     */
    readonly #adj = new Map<string, Map<string, number>>();

    /**
     * Add or replace a directed edge between two nodes.
     *
     * Nodes are created implicitly — you do not need to register them
     * separately. If the edge already exists its weight is **replaced**
     * (not accumulated).
     *
     * @param from    Source node identifier.
     * @param to      Target node identifier.
     * @param weight  Positive edge weight (default `1`).
     * @returns `this` for method chaining.
     */
    add(from: string, to: string, weight = 1): this {
        let dst = this.#adj.get(from);
        if (!dst) {
            dst = new Map();
            this.#adj.set(from, dst);
        }
        dst.set(to, weight);
        if (!this.#adj.has(to)) {
            this.#adj.set(to, new Map());
        }
        return this;
    }

    /**
     * Remove a directed edge. No-op if the edge does not exist.
     *
     * @param from  Source node identifier.
     * @param to    Target node identifier.
     */
    remove(from: string, to: string): void {
        this.#adj.get(from)?.delete(to);
    }

    /**
     * Remove a node and all its incident edges.
     *
     * Both outgoing and incoming edges to this node are removed.
     * No-op if the node does not exist.
     *
     * @param id  Node identifier to remove.
     */
    removeNode(id: string): void {
        this.#adj.delete(id);
        for (const dst of this.#adj.values()) {
            dst.delete(id);
        }
    }

    /**
     * Remove all edges and reset tracked nodes.
     */
    clear(): void {
        this.#adj.clear();
    }

    /**
     * Number of distinct nodes currently tracked in the graph.
     */
    get size(): number {
        return this.#adj.size;
    }

    /**
     * Run the weighted PageRank algorithm using power iteration.
     *
     * Computation steps per iteration:
     * 1. Collect the rank mass of all dangling nodes → `danglingSum`.
     * 2. For each node: sum the proportional incoming rank from its neighbours.
     * 3. Apply the PageRank formula:
     *    `PR(i) = (1-d)/N + d · (incomingSum + danglingSum / N)`
     * 4. Check convergence via L∞ norm: `max|PRₜ₊₁ - PRₜ| < tol`.
     *
     * @param damping  Damping factor (default `0.85`). Probability of
     *                 following a link vs. teleporting to a random node.
     * @param maxIter  Maximum number of power-iteration steps (default `100`).
     * @param tol      Convergence threshold (default `1e-6`). Iteration stops
     *                 when no single node's rank changes by more than `tol`.
     * @returns Map of node identifier to PageRank score. Scores sum to ≈1.
     */
    rank(
        damping = DEFAULT_DAMPING,
        maxIter = DEFAULT_MAX_ITER,
        tol = DEFAULT_TOL
    ): Map<string, number> {
        const nodes = Array.from(this.#adj.keys());
        const N = nodes.length;
        if (N === 0) return new Map();

        const { outWeight, incoming } = this.#buildAdjacency(nodes);
        const rank = new Map<string, number>();
        for (const id of nodes) rank.set(id, 1 / N);

        for (let iter = 0; iter < maxIter; iter++) {
            const danglingSum = this.#danglingRankSum(rank, nodes, outWeight);
            const { nextRank, maxDiff } = this.#powerIteration(
                rank,
                nodes,
                outWeight,
                incoming,
                danglingSum,
                N,
                damping
            );
            for (const [id, pr] of nextRank) rank.set(id, pr);
            if (maxDiff < tol) break;
        }

        return rank;
    }

    /**
     * Build per-node outgoing-weight totals and incoming edge lists
     * from the internal adjacency map.
     */
    #buildAdjacency(nodes: string[]): {
        outWeight: Map<string, number>;
        incoming: Map<string, EdgeEntry[]>;
    } {
        const outWeight = new Map<string, number>();
        const incoming = new Map<string, EdgeEntry[]>();
        for (const id of nodes) {
            outWeight.set(id, 0);
            incoming.set(id, []);
        }
        for (const [from, dst] of this.#adj) {
            let total = 0;
            for (const w of dst.values()) total += w;
            outWeight.set(from, total);
            for (const [to, w] of dst) {
                incoming.get(to)!.push({ src: from, weight: w });
            }
        }
        return { outWeight, incoming };
    }

    /**
     * Sum of rank mass held by dangling nodes (nodes with no outgoing edges).
     * This mass is redistributed uniformly to all nodes in each iteration.
     */
    #danglingRankSum(
        rank: Map<string, number>,
        nodes: string[],
        outWeight: Map<string, number>
    ): number {
        let sum = 0;
        for (const id of nodes) {
            if (outWeight.get(id)! === 0) {
                sum += rank.get(id)!;
            }
        }
        return sum;
    }

    /**
     * Perform one power-iteration step.
     *
     * Computes the next PageRank vector from the current `rank` and returns
     * it together with the L∞-norm change for convergence checking.
     */
    #powerIteration(
        rank: Map<string, number>,
        nodes: string[],
        outWeight: Map<string, number>,
        incoming: Map<string, EdgeEntry[]>,
        danglingSum: number,
        N: number,
        damping: number
    ): { nextRank: Map<string, number>; maxDiff: number } {
        const nextRank = new Map<string, number>();
        let maxDiff = 0;

        for (const id of nodes) {
            let incomingSum = 0;
            for (const { src, weight } of incoming.get(id)!) {
                incomingSum += (rank.get(src)! * weight) / outWeight.get(src)!;
            }
            const pr = (1 - damping) / N + damping * (incomingSum + danglingSum / N);
            nextRank.set(id, pr);
            maxDiff = Math.max(maxDiff, Math.abs(pr - rank.get(id)!));
        }

        return { nextRank, maxDiff };
    }
}
