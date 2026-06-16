import { describe, it, expect } from 'vitest';
import { PageRank } from '../../../src/index.js';
import { fromEdges, allPositive, rankSum } from '../../helper/graph.js';

describe('academic PageRank examples', () => {
    it('OSU Math 390R 4-node at d=1 matches exact rational', () => {
        // Oregon State Math 390R/490R PageRank worked example:
        // https://web.engr.oregonstate.edu/~phamt3/Courses/W25-Math-390R-490R/PageRank-example.pdf
        // Graph: 1→2, 1→3, 1→4, 2→3, 2→4, 3→4, 4→1 (no dangling nodes).
        // Exact PageRank vector at d=1: [6/17, 2/17, 3/17, 6/17]
        const pg = fromEdges(
            ['1', '2'], ['1', '3'], ['1', '4'],
            ['2', '3'], ['2', '4'],
            ['3', '4'],
            ['4', '1'],
        );
        const result = pg.rank(1, 1000, 1e-12);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
        expect(result.get('1')).toBeCloseTo(6 / 17, 4);
        expect(result.get('2')).toBeCloseTo(2 / 17, 4);
        expect(result.get('3')).toBeCloseTo(3 / 17, 4);
        expect(result.get('4')).toBeCloseTo(6 / 17, 4);
    });

    it('OSU Math 390R 4-node at d=2/3 matches exact rational', () => {
        // Same graph with damping d=2/3.
        // Exact PageRank vector: [201/652, 99/652, 132/652, 220/652]
        const pg = fromEdges(
            ['1', '2'], ['1', '3'], ['1', '4'],
            ['2', '3'], ['2', '4'],
            ['3', '4'],
            ['4', '1'],
        );
        const result = pg.rank(2 / 3, 1000, 1e-12);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
        expect(result.get('1')).toBeCloseTo(201 / 652, 4);
        expect(result.get('2')).toBeCloseTo(99 / 652, 4);
        expect(result.get('3')).toBeCloseTo(132 / 652, 4);
        expect(result.get('4')).toBeCloseTo(220 / 652, 4);
    });

    it('ring of 10 at d=1 produces uniform ranks', () => {
        const pg = fromEdges(
            ['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f'],
            ['f', 'g'], ['g', 'h'], ['h', 'i'], ['i', 'j'], ['j', 'a'],
        );
        const result = pg.rank(1, 1000, 1e-12);
        expect(allPositive(result)).toBe(true);
        expect(rankSum(result)).toBeCloseTo(1, 10);
        for (const v of result.values()) {
            expect(v).toBeCloseTo(0.1, 4);
        }
    });

    it('BYU ACME unweighted 4-node matches reference', () => {
        // Graph from Fig 1 of the BYU ACME PageRank lab:
        // https://labs.acme.byu.edu/Volume1/PageRank/PageRank.html
        // Edges: a→b, a→c, a→d, c→b, c→d, d→c; b is dangling.
        // Reference values: Problem 2, Fig 1, ε=0.85
        // {'a': 0.095758635, 'b': 0.274158285, 'c': 0.355924792, 'd': 0.274158285}
        const pg = fromEdges(
            ['a', 'b'], ['a', 'c'], ['a', 'd'],
            ['c', 'b'], ['c', 'd'],
            ['d', 'c'],
        );
        const result = pg.rank(0.85, 1000, 1e-10);
        expect(result.get('a')).toBeCloseTo(0.095758635, 4);
        expect(result.get('b')).toBeCloseTo(0.274158285, 4);
        expect(result.get('c')).toBeCloseTo(0.355924792, 4);
        expect(result.get('d')).toBeCloseTo(0.274158285, 4);
        expect(rankSum(result)).toBeCloseTo(1, 10);
        expect(allPositive(result)).toBe(true);
    });

    it('BYU ACME weighted 4-node matches NetworkX reference', () => {
        // Weighted graph from Fig 3 of the BYU ACME PageRank lab:
        // https://labs.acme.byu.edu/Volume1/PageRank/PageRank.html
        // Edges: a→b(w=2), a→c(w=1), a→d(w=1), c→b(w=1), c→d(w=2), d→c(w=2);
        // b is dangling.
        // Reference values from NetworkX nx.pagerank(dg, alpha=0.85):
        // {'a': 0.08588484379379199, 'b': 0.22769274265738826,
        //  'c': 0.37167323388682205, 'd': 0.31474917966199767}
        const pg = new PageRank();
        pg.add('a', 'b', 2);
        pg.add('a', 'c', 1);
        pg.add('a', 'd', 1);
        pg.add('c', 'b', 1);
        pg.add('c', 'd', 2);
        pg.add('d', 'c', 2);
        const result = pg.rank(0.85, 1000, 1e-10);
        expect(result.get('a')).toBeCloseTo(0.0858848438, 4);
        expect(result.get('b')).toBeCloseTo(0.2276927427, 4);
        expect(result.get('c')).toBeCloseTo(0.3716732339, 4);
        expect(result.get('d')).toBeCloseTo(0.3147491797, 4);
        expect(rankSum(result)).toBeCloseTo(1, 10);
        expect(allPositive(result)).toBe(true);
    });

    it('MathWorks MATLAB 6-node matches reference', () => {
        // Graph from the MATLAB "Use PageRank Algorithm to Rank Websites" example:
        // https://se.mathworks.com/help/matlab/math/use-page-rank-algorithm-to-rank-websites.html
        // Edges: α→β, α→ε, β→γ, β→δ, γ→δ, γ→ε, γ→ζ, δ→α, ε→α; ζ is dangling
        // Reference values from centrality(G,'pagerank','FollowProbability',0.85):
        // {α: 0.32098, β: 0.17057, γ: 0.10657, δ: 0.13678, ε: 0.20078, ζ: 0.06432}
        const pg = fromEdges(
            ['alpha', 'beta'],
            ['alpha', 'epsilon'],
            ['beta', 'gamma'],
            ['beta', 'delta'],
            ['gamma', 'delta'],
            ['gamma', 'epsilon'],
            ['gamma', 'zeta'],
            ['delta', 'alpha'],
            ['epsilon', 'alpha'],
        );
        const result = pg.rank(0.85, 1000, 1e-10);
        expect(result.get('alpha')).toBeCloseTo(0.32098, 4);
        expect(result.get('beta')).toBeCloseTo(0.17057, 4);
        expect(result.get('gamma')).toBeCloseTo(0.10657, 4);
        expect(result.get('delta')).toBeCloseTo(0.13678, 4);
        expect(result.get('epsilon')).toBeCloseTo(0.20078, 4);
        expect(result.get('zeta')).toBeCloseTo(0.06432, 4);
        expect(rankSum(result)).toBeCloseTo(1, 10);
        expect(allPositive(result)).toBe(true);
    });
});
