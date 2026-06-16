import { describe, it, expect } from 'vitest';
import { PageRank } from '../../src/index.js';
import { rankSum } from '../helper/graph.js';

describe('remove', () => {
    it('removes an existing edge', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        pg.remove('a', 'b');
        const result = pg.rank();
        expect(result.size).toBe(2);
    });

    it('is a no-op for nonexistent edge', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        pg.remove('x', 'y');
        expect(pg.size).toBe(2);
    });

    it('removeNode removes node and shrinks size', () => {
        const pg = new PageRank();
        pg.add('a', 'b').add('b', 'c').add('c', 'a');
        expect(pg.size).toBe(3);
        pg.removeNode('b');
        expect(pg.size).toBe(2);
        const result = pg.rank();
        expect(result.has('b')).toBe(false);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });

    it('removeNode also removes incoming edges', () => {
        const pg = new PageRank();
        pg.add('a', 'b').add('b', 'c');
        pg.removeNode('b');
        // a still exists but its only outgoing edge (→b) is gone → a becomes dangling
        const result = pg.rank();
        expect(result.has('a')).toBe(true);
        expect(result.has('c')).toBe(true);
        expect(result.has('b')).toBe(false);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });

    it('removeNode is a no-op for nonexistent node', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        pg.removeNode('x');
        expect(pg.size).toBe(2);
    });
});
