import { describe, it, expect } from 'vitest';
import { PageRank } from '../../src/index.js';

describe('add', () => {
    it('creates source and target nodes', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        expect(pg.size).toBe(2);
    });

    it('replaces weight on duplicate edge', () => {
        const pg = new PageRank();
        pg.add('a', 'b', 1);
        pg.add('a', 'b', 10);
        const result = pg.rank();
        expect(result.get('b')!).toBeGreaterThan(result.get('a')!);
    });

    it('does not create duplicate node entries for existing nodes', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        pg.add('a', 'c');
        expect(pg.size).toBe(3);
    });

    it('returns this for chaining', () => {
        const pg = new PageRank();
        expect(pg.add('a', 'b')).toBe(pg);
    });
});
