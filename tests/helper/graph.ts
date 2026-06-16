import { PageRank } from '../../src/index.js';

export type Edge = readonly [string, string, number?];

export function fromEdges(...edges: Edge[]): PageRank {
    const pg = new PageRank();
    for (const [from, to, weight] of edges) {
        pg.add(from, to, weight);
    }
    return pg;
}

export function sorted(result: Map<string, number>): Array<[string, number]> {
    return Array.from(result.entries()).sort((a, b) => b[1] - a[1]);
}

export function rankSum(result: Map<string, number>): number {
    return Array.from(result.values()).reduce((a, b) => a + b, 0);
}

export function allPositive(result: Map<string, number>): boolean {
    for (const v of result.values()) {
        if (v <= 0) return false;
    }
    return true;
}

export function buildChain(length: number): PageRank {
    const pg = new PageRank();
    for (let i = 1; i < length; i++) {
        pg.add(`n${i}`, `n${i + 1}`);
    }
    return pg;
}

export function buildRing(size: number): PageRank {
    const pg = new PageRank();
    for (let i = 1; i <= size; i++) {
        pg.add(`n${i}`, `n${i < size ? i + 1 : 1}`);
    }
    return pg;
}

export function buildStar(center: string, leaves: number): PageRank {
    const pg = new PageRank();
    for (let i = 1; i <= leaves; i++) {
        pg.add(center, `${center}_leaf${i}`);
    }
    return pg;
}

export function buildBipartite(sources: number, targets: number): PageRank {
    const pg = new PageRank();
    for (let s = 1; s <= sources; s++) {
        for (let t = 1; t <= targets; t++) {
            pg.add(`s${s}`, `t${t}`);
        }
    }
    return pg;
}

export function buildHub(hubSize: number, fanOut: number): PageRank {
    const pg = new PageRank();
    for (let m = 1; m <= hubSize; m++) {
        const mid = `mid${m}`;
        pg.add('hub', mid);
        for (let l = 1; l <= fanOut; l++) {
            pg.add(mid, `leaf${mid}_${l}`);
        }
    }
    return pg;
}

export function buildDense(nodeCount: number): PageRank {
    const pg = new PageRank();
    for (let i = 1; i <= nodeCount; i++) {
        for (let j = 1; j <= nodeCount; j++) {
            if (i !== j && (i + j) % 3 !== 0) {
                pg.add(`n${i}`, `n${j}`);
            }
        }
    }
    return pg;
}
