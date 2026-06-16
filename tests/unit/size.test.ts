import { describe, it, expect } from 'vitest';
import { PageRank } from '../../src/index.js';

describe('size', () => {
    it('starts at 0', () => {
        expect(new PageRank().size).toBe(0);
    });

    it('tracks distinct nodes across add calls', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        expect(pg.size).toBe(2);
        pg.add('b', 'c');
        expect(pg.size).toBe(3);
        pg.add('a', 'c');
        expect(pg.size).toBe(3);
    });
});
