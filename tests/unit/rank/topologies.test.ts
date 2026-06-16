import { describe, it, expect } from 'vitest';
import { allPositive, rankSum, buildChain, buildRing, buildStar, buildBipartite, buildHub, buildDense } from '../../helper/graph.js';

describe('rank topologies', () => {
    it('ring of 10 nodes produces uniform ranks', () => {
        const result = buildRing(10).rank();
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
        const entries = Array.from(result.entries());
        for (const [, v] of entries) {
            expect(v).toBeCloseTo(0.1, 4);
        }
    });

    it('star (center → 8 leaves) conserves rank', () => {
        const pg = buildStar('hub', 8);
        const result = pg.rank();
        expect(result.size).toBe(9);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });

    it('bipartite (3 sources → 4 targets) conserves rank', () => {
        const pg = buildBipartite(3, 4);
        const result = pg.rank();
        expect(result.size).toBe(7);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });

    it('two-tier hub with fan-out conserves rank', () => {
        const pg = buildHub(3, 4);
        const result = pg.rank();
        const totalNodes = 1 + 3 + 3 * 4;
        expect(result.size).toBe(totalNodes);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });

    it('dense graph (20 nodes, ~60% edges) converges', () => {
        const pg = buildDense(20);
        const result = pg.rank();
        expect(result.size).toBe(20);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });

    it('large chain of 100 nodes converges', () => {
        const pg = buildChain(100);
        const result = pg.rank();
        expect(result.size).toBe(100);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });
});
