import { describe, it, expect } from 'vitest';
import { PageRank } from '../../../src/index.js';
import { rankSum, buildRing, buildDense } from '../../helper/graph.js';

describe('rank invariants', () => {
    it('repeated calls return the same result', () => {
        const pg = buildRing(10);
        const r1 = pg.rank();
        const r2 = pg.rank();
        const r3 = pg.rank();
        for (const [k, v] of r1) {
            expect(v).toBe(r2.get(k)!);
            expect(v).toBe(r3.get(k)!);
        }
    });

    it('interleaved add and rank calls are independent', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        const r1 = pg.rank();
        pg.add('b', 'c');
        const r2 = pg.rank();
        pg.add('c', 'a');
        const r3 = pg.rank();
        expect(r1.size).toBe(2);
        expect(r2.size).toBe(3);
        expect(r3.size).toBe(3);
        expect(rankSum(r1)).toBeCloseTo(1, 10);
        expect(rankSum(r2)).toBeCloseTo(1, 10);
        expect(rankSum(r3)).toBeCloseTo(1, 10);
    });

    it('no NaN or infinity values in results', () => {
        const pg = buildDense(20);
        const result = pg.rank();
        for (const v of result.values()) {
            expect(Number.isFinite(v)).toBe(true);
        }
    });
});
