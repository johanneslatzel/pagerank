import { describe, it, expect } from 'vitest';
import { PageRank } from '../../../src/index.js';
import { sorted, rankSum, allPositive } from '../../helper/graph.js';

describe('rank basic flow', () => {
    it('sink node gets higher rank with one edge', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        const result = pg.rank();
        expect(result.get('b')!).toBeGreaterThan(result.get('a')!);
    });

    it('ranks sink highest in a chain', () => {
        const pg = new PageRank();
        pg.add('a', 'b').add('b', 'c');
        const result = sorted(pg.rank());
        expect(result[0]![0]).toBe('c');
        expect(result[1]![0]).toBe('b');
        expect(result[2]![0]).toBe('a');
        expect(result[0]![1]).toBeGreaterThan(result[1]![1]);
        expect(result[1]![1]).toBeGreaterThan(result[2]![1]);
    });

    it('produces correct rank order for a 3-node chain', () => {
        const pg = new PageRank();
        pg.add('a', 'b').add('b', 'c');
        const result = pg.rank();
        const entries = sorted(result);
        expect(entries.map(([n]) => n)).toEqual(['c', 'b', 'a']);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });

    it('passes more rank through heavier edges', () => {
        const pg = new PageRank();
        pg.add('a', 'b', 1).add('a', 'c', 5);
        const result = pg.rank();
        expect(result.get('c')!).toBeGreaterThan(result.get('b')!);
    });

    it('gives higher rank to node with multiple incoming edges', () => {
        const pg = new PageRank();
        pg.add('a', 'c').add('b', 'c');
        const result = pg.rank();
        expect(result.get('c')!).toBeGreaterThan(result.get('a')!);
        expect(result.get('c')!).toBeGreaterThan(result.get('b')!);
    });

    it('distributes dangling node rank uniformly', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        pg.add('b', 'c');
        const result = pg.rank();
        expect(result.get('c')!).toBeGreaterThan(0);
        expect(result.get('a')!).toBeGreaterThan(0);
        expect(result.get('b')!).toBeGreaterThan(0);
    });

    it('gives positive rank to both disconnected components', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        pg.add('c', 'd');
        const result = pg.rank();
        expect(allPositive(result)).toBe(true);
    });

    it('conserves total rank to sum of 1', () => {
        const pg = new PageRank();
        pg.add('a', 'b').add('b', 'c').add('c', 'a');
        expect(rankSum(pg.rank())).toBeCloseTo(1, 10);
    });

    it('handles a cyclic graph', () => {
        const pg = new PageRank();
        pg.add('a', 'b').add('a', 'c');
        pg.add('b', 'c');
        pg.add('c', 'a');
        const result = pg.rank();
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
    });
});
