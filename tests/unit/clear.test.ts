import { describe, it, expect } from 'vitest';
import { PageRank } from '../../src/index.js';

describe('clear', () => {
    it('resets all state', () => {
        const pg = new PageRank();
        pg.add('a', 'b').add('b', 'c');
        expect(pg.size).toBe(3);
        pg.clear();
        expect(pg.size).toBe(0);
        expect(pg.rank().size).toBe(0);
    });
});
