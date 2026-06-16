import { describe, it, expect } from 'vitest';
import { PageRank } from '../../../src/index.js';
import { allPositive, rankSum, buildChain, buildRing } from '../../helper/graph.js';

describe('rank parameters', () => {
    it('lower damping (0.5) still conserves rank', () => {
        const pg = buildRing(10);
        const result = pg.rank(0.5);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });

    it('high damping (0.99) still converges within maxIter', () => {
        const pg = buildRing(10);
        const result = pg.rank(0.99, 500, 1e-6);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });

    it('single iteration does not throw and returns partial result', () => {
        const pg = buildChain(10);
        const result = pg.rank(0.85, 1);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });

    it('very tight tolerance (1e-12) converges with enough iterations', () => {
        const pg = buildChain(10);
        const result = pg.rank(0.85, 2000, 1e-12);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });

    it('converges within given tolerance', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        const result = pg.rank(0.85, 1000, 1e-10);
        expect(result.has('a')).toBe(true);
        expect(result.has('b')).toBe(true);
    });
});
