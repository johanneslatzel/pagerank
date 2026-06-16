import { describe, it, expect } from 'vitest';
import { PageRank } from '../../../src/index.js';

describe('rank edge cases', () => {
    it('returns empty map for empty graph', () => {
        const pg = new PageRank();
        expect(pg.rank().size).toBe(0);
    });

    it('converges to 1 for a single self-loop node', () => {
        const pg = new PageRank();
        pg.add('a', 'a', 1);
        expect(pg.rank().get('a')).toBeCloseTo(1, 4);
    });

    it('returns uniform rank for self-loop nodes', () => {
        const pg = new PageRank();
        pg.add('a', 'a');
        pg.add('b', 'b');
        const result = pg.rank();
        expect(result.get('a')).toBeCloseTo(0.5, 4);
        expect(result.get('b')).toBeCloseTo(0.5, 4);
    });

    it('handles graph with only dangling nodes', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        expect(pg.rank().size).toBe(2);
    });

    it('is deterministic for the same graph', () => {
        const build = () => {
            const pg = new PageRank();
            pg.add('a', 'b', 2).add('b', 'c', 3).add('c', 'a', 1);
            return pg.rank();
        };
        const r1 = build();
        const r2 = build();
        for (const [k, v] of r1) {
            expect(v).toBe(r2.get(k)!);
        }
    });
});
