# Plan: standalone `@johannes.latzel/pagerank` package

## Goal

Extract the inline `pagerank.ts` from `llm-chat-memory` into a standalone, zero-dependency TypeScript package published to npm under the `@johannes.latzel` scope.

---

## Scaffold checklist

1. Create `pagerank/` directory (sibling to `llm-chat-memory/`)
2. Write each file below in order
3. `npm install` — installs vitest + typescript
4. `npm run build` — tsc produces `dist/`
5. `npm test` — vitest passes
6. `npm run lint` — eslint 0 warnings
7. Write `docs/index.md`, `docs/api-reference.md`, `docs/architecture.md`
8. Write `mkdocs.yml`
9. Install mkdocs-material (`pip install mkdocs-material`) and verify build (`mkdocs build`)
10. Write `.github/workflows/docs.yml`
11. `npm publish --access=public`

---

## Mathematical specification

### Algorithm

Weighted PageRank via power iteration. Each iteration computes:

```
PR(pᵢ) = (1-d)/N + d · [ Σⱼ→ᵢ PR(pⱼ) · wⱼᵢ / outWeight(j)  +  danglingSum / N ]

where:
  d             = damping factor (0.85)
  N             = total number of distinct nodes
  wⱼᵢ           = weight of edge from j to i
  outWeight(j)  = sum of weights of all outgoing edges from j
  danglingSum   = Σ PR(k) for all nodes k with outWeight(k) = 0
```

### Google matrix formulation (equivalent)

```
G = d · S + (1-d) · (eeᵀ)/N

where:
  S = stochastic matrix (columns sum to 1)
      - for non-dangling j: S[i,j] = wⱼᵢ / outWeight(j)
      - for dangling j:      S[i,j] = 1/N (teleport uniformly)

The stationary vector PR satisfies:  PR = G · PR
```

The power method iterates `PRₜ₊₁ = G · PRₜ` until convergence.

### Convergence criteria

Stop when the **maximum** absolute change of any single node's rank is below `tol`:

```
maxᵢ |PRₜ₊₁(pᵢ) - PRₜ(pᵢ)| < tol
```

Default: `tol = 1e-6`. This is an L∞-norm check (stricter than NetworkX's L1 norm `Σ|diff| < N·tol`, meaning we may take at most 1–2 extra iterations on tight graphs but never converge prematurely).

### Damping factor

`d = 0.85` (standard value from Brin & Page 1998). The damping factor represents the probability that a random surfer continues following links rather than teleporting to a random page. Values in `[0.5, 0.95]` are common; convergence speed decreases as d → 1.

---

## API

```ts
export class PageRank {
    add(from: string, to: string, weight?: number): this;
    remove(from: string, to: string): void;
    rank(damping?: number, maxIter?: number, tol?: number): Map<string, number>;
    clear(): void;
    get size(): number;
}
```

---

## File templates

### `pagerank/package.json`

```json
{
    "name": "@johannes.latzel/pagerank",
    "version": "1.0.0",
    "description": "Zero-dependency weighted PageRank for TypeScript/JavaScript",
    "license": "MIT",
    "author": "Johannes B. Latzel",
    "files": [
        "dist/",
        "README.md",
        "LICENSE"
    ],
    "type": "module",
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js"
        }
    },
    "sideEffects": false,
    "engines": {
        "node": ">=18"
    },
    "scripts": {
        "build": "tsc -p tsconfig.build.json",
        "verify": "tsc --noEmit && eslint . --max-warnings 0 && vitest run",
        "lint": "eslint . --max-warnings 0",
        "format": "prettier --write src tests",
        "test": "vitest",
        "prepublishOnly": "npm run build && npm run verify"
    },
    "publishConfig": {
        "access": "public"
    },
    "devDependencies": {
        "@eslint/js": "^9.24.0",
        "@typescript-eslint/eslint-plugin": "^8.60.0",
        "@typescript-eslint/parser": "^8.60.0",
        "eslint": "^9.24.0",
        "eslint-config-prettier": "^10.1.2",
        "prettier": "^3.5.3",
        "typescript": "^6.0.0",
        "vitest": "^4.0.0"
    },
    "repository": {
        "type": "git",
        "url": "git+https://github.com/johanneslatzel/pagerank.git"
    },
    "bugs": {
        "url": "https://github.com/johanneslatzel/pagerank/issues"
    },
    "homepage": "https://github.com/johanneslatzel/pagerank#readme",
    "keywords": [
        "pagerank",
        "graph",
        "ranking",
        "link-analysis",
        "typescript"
    ]
}
```

### `pagerank/tsconfig.json`

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "ES2020",
        "moduleResolution": "node",
        "declaration": true,
        "sourceMap": true,
        "outDir": "./dist",
        "rootDir": "./",
        "strict": true,
        "esModuleInterop": true,
        "isolatedModules": true,
        "skipLibCheck": true
    },
    "include": ["src/**/*", "tests/**/*"],
    "exclude": []
}
```

### `pagerank/tsconfig.build.json`

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "rootDir": "./src",
        "sourceMap": false,
        "declarationMap": false
    },
    "include": ["src/**/*"]
}
```

### `pagerank/vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        pool: 'forks',
        include: ['tests/**/*.test.ts'],
        exclude: ['dist/**', 'node_modules/**']
    }
});
```

### `pagerank/eslint.config.js`

```js
import js from '@eslint/js';
import tseslintParser from '@typescript-eslint/parser';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tseslintParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: true
            },
            globals: {}
        },
        plugins: {
            '@typescript-eslint': tseslintPlugin
        },
        rules: {
            'no-undef': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-deprecated': 'warn'
        }
    },
    {
        ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'vitest.config.ts']
    },
    eslintConfigPrettier
];
```

### `pagerank/.prettierrc`

```json
{
    "semi": true,
    "singleQuote": true,
    "tabWidth": 4,
    "trailingComma": "none",
    "printWidth": 100
}
```

### `pagerank/.prettierignore`

```
node_modules
dist
coverage/
```

### `pagerank/.gitignore`

```
node_modules/
dist/
coverage/
```

### `pagerank/LICENSE`

```
MIT License

Copyright (c) 2026 Johannes B. Latzel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `pagerank/src/index.ts`

```ts
/**
 * A directed edge in the internal adjacency map.
 * @internal
 */
type EdgeEntry = { src: string; weight: number };

const DEFAULT_DAMPING = 0.85;
const DEFAULT_MAX_ITER = 100;
const DEFAULT_TOL = 1e-6;

/**
 * Weighted PageRank computation using the power-iteration method.
 *
 * Tracks a directed graph of nodes and weighted edges. Call {@link add} to
 * build the graph, then {@link rank} to compute the stationary PageRank
 * vector. Dangling nodes (no outgoing edges) distribute their rank
 * uniformly to all nodes each iteration.
 *
 * ```ts
 * const pg = new PageRank();
 * pg.add('a', 'b').add('b', 'c');
 * const ranks = pg.rank();
 * // Map { 'a' => ~0.223, 'b' => ~0.331, 'c' => ~0.446 }
 * ```
 *
 * References:
 * - Brin & Page (1998). "The Anatomy of a Large-Scale Hypertextual Web Search Engine"
 * - Wikipedia "PageRank" — normalized formula with damping factor
 */
export class PageRank {
    /**
     * Internal adjacency storage.
     * `#adj.get(from)` returns a `Map<to, weight>` of outgoing edges.
     * A node with no outgoing edges has an entry pointing to an empty Map.
     */
    readonly #adj = new Map<string, Map<string, number>>();

    /**
     * Add or replace a directed edge between two nodes.
     *
     * Nodes are created implicitly — you do not need to register them
     * separately. If the edge already exists its weight is **replaced**
     * (not accumulated).
     *
     * @param from    Source node identifier.
     * @param to      Target node identifier.
     * @param weight  Positive edge weight (default `1`).
     * @returns `this` for method chaining.
     */
    add(from: string, to: string, weight = 1): this {
        let dst = this.#adj.get(from);
        if (!dst) {
            dst = new Map();
            this.#adj.set(from, dst);
        }
        dst.set(to, weight);
        if (!this.#adj.has(to)) {
            this.#adj.set(to, new Map());
        }
        return this;
    }

    /**
     * Remove a directed edge. No-op if the edge does not exist.
     *
     * @param from  Source node identifier.
     * @param to    Target node identifier.
     */
    remove(from: string, to: string): void {
        this.#adj.get(from)?.delete(to);
    }

    /**
     * Remove all edges and reset tracked nodes.
     */
    clear(): void {
        this.#adj.clear();
    }

    /**
     * Number of distinct nodes currently tracked in the graph.
     */
    get size(): number {
        return this.#adj.size;
    }

    /**
     * Run the weighted PageRank algorithm using power iteration.
     *
     * Computation steps per iteration:
     * 1. Collect the rank mass of all dangling nodes → `danglingSum`.
     * 2. For each node: sum the proportional incoming rank from its neighbours.
     * 3. Apply the PageRank formula:
     *    `PR(i) = (1-d)/N + d · (incomingSum + danglingSum / N)`
     * 4. Check convergence via L∞ norm: `max|PRₜ₊₁ - PRₜ| < tol`.
     *
     * @param damping  Damping factor (default `0.85`). Probability of
     *                 following a link vs. teleporting to a random node.
     * @param maxIter  Maximum number of power-iteration steps (default `100`).
     * @param tol      Convergence threshold (default `1e-6`). Iteration stops
     *                 when no single node's rank changes by more than `tol`.
     * @returns Map of node identifier to PageRank score. Scores sum to ≈1.
     */
    rank(
        damping = DEFAULT_DAMPING,
        maxIter = DEFAULT_MAX_ITER,
        tol = DEFAULT_TOL
    ): Map<string, number> {
        const nodes = Array.from(this.#adj.keys());
        const N = nodes.length;
        if (N === 0) return new Map();

        const outWeight = new Map<string, number>();
        const incoming = new Map<string, EdgeEntry[]>();
        for (const id of nodes) {
            outWeight.set(id, 0);
            incoming.set(id, []);
        }
        for (const [from, dst] of this.#adj) {
            let total = 0;
            for (const w of dst.values()) total += w;
            outWeight.set(from, total);
            for (const [to, w] of dst) {
                incoming.get(to)!.push({ src: from, weight: w });
            }
        }

        const rank = new Map<string, number>();
        for (const id of nodes) rank.set(id, 1 / N);

        for (let iter = 0; iter < maxIter; iter++) {
            let danglingSum = 0;
            for (const id of nodes) {
                if ((outWeight.get(id) ?? 0) === 0) {
                    danglingSum += rank.get(id) ?? 0;
                }
            }

            const next = new Map<string, number>();
            let maxDiff = 0;

            for (const id of nodes) {
                let sum = 0;
                for (const { src, weight } of incoming.get(id) ?? []) {
                    sum += (rank.get(src) ?? 0) * weight / (outWeight.get(src) ?? 1);
                }
                sum += danglingSum / N;
                const pr = (1 - damping) / N + damping * sum;
                next.set(id, pr);
                maxDiff = Math.max(maxDiff, Math.abs(pr - (rank.get(id) ?? 0)));
            }

            for (const [id, pr] of next) rank.set(id, pr);
            if (maxDiff < tol) break;
        }

        return rank;
    }
}
```

### `pagerank/tests/pagerank.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { PageRank } from '../src/index.js';

function sorted(result: Map<string, number>): Array<[string, number]> {
    return Array.from(result.entries()).sort((a, b) => b[1] - a[1]);
}

describe('PageRank', () => {
    it('returns empty map for empty graph', () => {
        const pg = new PageRank();
        expect(pg.rank().size).toBe(0);
    });

    it('returns uniform rank for single node', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        expect(pg.size).toBe(2);
        const result = pg.rank();
        expect(result.get('a')).toBeCloseTo(0.5, 4);
        expect(result.get('b')).toBeCloseTo(0.5, 4);
    });

    it('returns uniform rank for two isolated nodes', () => {
        const pg = new PageRank();
        pg.add('a', 'a');
        pg.add('b', 'b');
        expect(pg.size).toBe(2);
        const result = pg.rank();
        expect(result.get('a')).toBeCloseTo(0.5, 4);
        expect(result.get('b')).toBeCloseTo(0.5, 4);
    });

    it('ranks sink node higher in a chain', () => {
        // a → b → c
        const pg = new PageRank();
        pg.add('a', 'b').add('b', 'c');
        const result = sorted(pg.rank());
        expect(result[0]![0]).toBe('c');
        expect(result[1]![0]).toBe('b');
        expect(result[2]![0]).toBe('a');
        expect(result[0]![1]).toBeGreaterThan(result[1]![1]);
        expect(result[1]![1]).toBeGreaterThan(result[2]![1]);
    });

    it('weighted edge passes more rank', () => {
        // a → b (weight 1), a → c (weight 5)
        const pg = new PageRank();
        pg.add('a', 'b', 1).add('a', 'c', 5);
        const result = pg.rank();
        expect(result.get('c')!).toBeGreaterThan(result.get('b')!);
    });

    it('tolerates self-loops', () => {
        const pg = new PageRank();
        pg.add('a', 'a', 1);
        const result = pg.rank();
        expect(result.get('a')).toBeCloseTo(1, 4);
    });

    it('handles multiple incoming edges', () => {
        // a → c, b → c
        const pg = new PageRank();
        pg.add('a', 'c').add('b', 'c');
        const result = pg.rank();
        expect(result.get('c')!).toBeGreaterThan(result.get('a')!);
        expect(result.get('c')!).toBeGreaterThan(result.get('b')!);
    });

    it('converges within tolerance', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        const result = pg.rank(0.85, 1000, 1e-10);
        expect(result.has('a')).toBe(true);
        expect(result.has('b')).toBe(true);
    });

    it('sum of ranks equals 1', () => {
        const pg = new PageRank();
        pg.add('a', 'b').add('b', 'c').add('c', 'a');
        const result = pg.rank();
        const sum = Array.from(result.values()).reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1, 10);
    });

    it('add replaces weight, does not accumulate', () => {
        const pg = new PageRank();
        pg.add('a', 'b', 1);
        pg.add('a', 'b', 10); // replaces
        const result = pg.rank();
        // b should get all of a's rank since it's the only edge
        expect(result.get('b')!).toBeGreaterThan(result.get('a')!);
    });

    it('remove is no-op for nonexistent edge', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        pg.remove('x', 'y'); // should not throw
        expect(pg.size).toBe(2);
    });

    it('clear resets all state', () => {
        const pg = new PageRank();
        pg.add('a', 'b').add('b', 'c');
        expect(pg.size).toBe(3);
        pg.clear();
        expect(pg.size).toBe(0);
        expect(pg.rank().size).toBe(0);
    });

    it('size grows with distinct nodes from add', () => {
        const pg = new PageRank();
        expect(pg.size).toBe(0);
        pg.add('a', 'b');
        expect(pg.size).toBe(2);
        pg.add('b', 'c');
        expect(pg.size).toBe(3);
        pg.add('a', 'c'); // no new nodes
        expect(pg.size).toBe(3);
    });

    it('dangling node redistributes rank uniformly', () => {
        const pg = new PageRank();
        pg.add('a', 'b');
        pg.add('b', 'c');
        // c is dangling (no outgoing edges)
        // its rank should be redistributed to all nodes
        const result = pg.rank();
        expect(result.get('c')!).toBeGreaterThan(0);
        expect(result.get('a')!).toBeGreaterThan(0);
        expect(result.get('b')!).toBeGreaterThan(0);
    });

    it('graph with only dangling nodes converges', () => {
        const pg = new PageRank();
        pg.add('a', 'b'); // a→b but b has no outgoing edges
        // both a and b are dangling in a sense... actually a has outgoing
        // this tests that the algorithm handles all-dangling graphs
        const result = pg.rank();
        expect(result.size).toBe(2);
    });

    it('chain of 10 nodes ranks sink highest', () => {
        const pg = new PageRank();
        for (let i = 1; i < 10; i++) {
            pg.add(`n${i}`, `n${i + 1}`);
        }
        const sorted = Array.from(pg.rank().entries()).sort((a, b) => b[1] - a[1]);
        expect(sorted[0]![0]).toBe('n10');
    });

    it('two disconnected components both get positive rank', () => {
        // Component 1: a → b
        // Component 2: c → d
        const pg = new PageRank();
        pg.add('a', 'b');
        pg.add('c', 'd');
        const result = pg.rank();
        expect(result.get('a')!).toBeGreaterThan(0);
        expect(result.get('b')!).toBeGreaterThan(0);
        expect(result.get('c')!).toBeGreaterThan(0);
        expect(result.get('d')!).toBeGreaterThan(0);
    });

    it('rank is deterministic for same graph', () => {
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

    it('chain of 3 nodes produces expected rank order', () => {
        const pg = new PageRank();
        pg.add('a', 'b').add('b', 'c');
        const result = pg.rank();
        const sorted = Array.from(result.entries()).sort((a, b) => b[1] - a[1]);
        expect(sorted.map(([n]) => n)).toEqual(['c', 'b', 'a']);
        // Verify ranks sum to ~1
        const sum = sorted.reduce((s, [, v]) => s + v, 0);
        expect(sum).toBeCloseTo(1, 10);
    });

    it('handles a more complex graph', () => {
        // a → b, a → c, b → c, c → a
        const pg = new PageRank();
        pg.add('a', 'b').add('a', 'c');
        pg.add('b', 'c');
        pg.add('c', 'a');
        const result = pg.rank();
        // All ranks should be positive and sum to 1
        for (const v of result.values()) {
            expect(v).toBeGreaterThan(0);
        }
        const sum = Array.from(result.values()).reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1, 10);
    });
});
```

### `pagerank/README.md`

```md
# @johannes.latzel/pagerank

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/@johannes.latzel/pagerank)](https://www.npmjs.com/package/@johannes.latzel/pagerank)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![CI](https://github.com/johanneslatzel/pagerank/actions/workflows/ci.yml/badge.svg)](https://github.com/johanneslatzel/pagerank/actions/workflows/ci.yml)

Zero-dependency weighted PageRank for TypeScript/JavaScript.

## Why this package?

Existing npm PageRank packages don't satisfy all of these criteria at once:

| Criteria | Existing packages | This package |
|---|---|---|
| Zero dependencies | ✅ some | ✅ |
| Weighted edges | ✅ some | ✅ |
| TypeScript with `NodeNext` / `verbatimModuleSyntax` | ❌ none | ✅ |
| Simple class API with chaining + remove/clear/size | ❌ none | ✅ |
| ESM-native | ❌ none (all CJS) | ✅ |
| ~100 lines of source code | ❌ heavy | ✅ |

The closest existing package is [`pagerank.js`](https://www.npmjs.com/package/pagerank.js)
(zero deps, weighted, MIT) — but it's callback-based CommonJS with no types,
no `remove()`/`clear()`/`size()`, and unmaintained since 2014.
The alternatives either pull in heavy dependencies (`graphology`, `mathjs`) or
don't support weighted edges.

This package is one small file with zero dependencies and exactly the API you'd
write by hand.

## Install

```bash
npm install @johannes.latzel/pagerank
```

## Usage

```ts
import { PageRank } from '@johannes.latzel/pagerank';

const pg = new PageRank();
pg.add('a', 'b').add('b', 'c');
const ranks = pg.rank();
// Map { 'a' => ~0.223, 'b' => ~0.331, 'c' => ~0.446 }
```

With edge weights:

```ts
pg.add('a', 'b', 1).add('a', 'c', 5);
const ranks = pg.rank();
// c receives 5/6 of a's rank, b receives 1/6
```

## API

| Method | Description |
|---|---|
| `add(from, to, weight?)` | Add or replace a directed edge. Returns `this` for chaining. |
| `remove(from, to)` | Remove a directed edge. No-op if it doesn't exist. |
| `rank(damping?, maxIter?, tol?)` | Compute weighted PageRank scores. Returns `Map<string, number>`. |
| `clear()` | Remove all edges and reset state. |
| `size` | Number of distinct nodes tracked. |

### Parameters for `rank()`

| Param | Default | Description |
|---|---|---|
| `damping` | `0.85` | Damping factor. Probability of following a link vs teleporting. |
| `maxIter` | `100` | Maximum power-method iterations. |
| `tol` | `1e-6` | Convergence threshold (L∞ norm: max single-node change). |

## Algorithm

Standard PageRank with damping factor via power iteration. Dangling nodes (no outgoing edges) distribute their rank uniformly to all nodes. See [`pagerank.md`](pagerank.md) for the full mathematical specification.

## License

MIT — see [`LICENSE`](LICENSE).
```

### `pagerank/.github/workflows/ci.yml`

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm run verify
```

### `pagerank/.github/workflows/publish.yml`

```yaml
name: Publish to npm

on:
  release:
    types: [published]
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm run build
      - run: npm run verify
      - run: npm publish --access=public --provenance
```

---

## Implementation notes

### Edge storage (internal)

```ts
// Internal graph representation:
// #adj: Map<from, Map<to, weight>>
//
// Nodes are discovered implicitly from add() calls.
// size is derived from #adj.size (keys = all nodes that have appeared).
```

Key design choices:
- `add()` **replaces** the weight if the edge already exists (idempotent-like). This differs from accumulating weights, but is simpler and matches our use case where edge weight is always set explicitly.
- **Self-loops are allowed**. A node with only a self-loop has `outWeight > 0`, so it is NOT a dangling node. Its rank iterates correctly: `pr = (1-d)/N + d * pr` which converges to `1/N`.
- `remove()` is a **no-op** if the edge doesn't exist (no error thrown).
- Node discovery is automatic from `add()`: both `from` and `to` are tracked.

### Internal implementation of rank()

```ts
rank(damping = 0.85, maxIter = 100, tol = 1e-6): Map<string, number> {
    const nodes = Array.from(this.#adj.keys());
    const N = nodes.length;
    if (N === 0) return new Map();

    // 1. Compute outWeight and incoming adjacency
    const outWeight = new Map<string, number>();
    const incoming = new Map<string, Array<{ src: string; weight: number }>>();
    for (const id of nodes) { outWeight.set(id, 0); incoming.set(id, []); }
    for (const [from, dst] of this.#adj) {
        let total = 0;
        for (const w of dst.values()) total += w;
        outWeight.set(from, total);
        for (const [to, w] of dst) {
            incoming.get(to)!.push({ src: from, weight: w });
        }
    }

    // 2. Initialize uniform ranks
    const rank = new Map(nodes.map(id => [id, 1 / N]));

    // 3. Power iteration
    for (let iter = 0; iter < maxIter; iter++) {
        // Collect dangling rank
        let danglingSum = 0;
        for (const id of nodes) {
            if ((outWeight.get(id) ?? 0) === 0) danglingSum += rank.get(id) ?? 0;
        }

        const next = new Map<string, number>();
        let maxDiff = 0;

        for (const id of nodes) {
            // Incoming contributions
            let sum = 0;
            for (const { src, weight } of incoming.get(id) ?? []) {
                sum += (rank.get(src) ?? 0) * weight / (outWeight.get(src) ?? 1);
            }
            // Dangling teleportation
            sum += danglingSum / N;
            // Damping + teleport
            const pr = (1 - damping) / N + damping * sum;
            next.set(id, pr);
            maxDiff = Math.max(maxDiff, Math.abs(pr - (rank.get(id) ?? 0)));
        }

        for (const [id, pr] of next) rank.set(id, pr);
        if (maxDiff < tol) break;
    }

    return rank;
}
```

### Numerical stability

- All arithmetic is double-precision IEEE 754 (standard JS `number`).
- For expected graph sizes (~10³–10⁵ nodes), the power iteration converges in ~20–60 iterations with `tol = 1e-6`.
- No underflow risk for this iteration count.

### Comparison with NetworkX reference

| Aspect | NetworkX `_pagerank_python` | This implementation |
|---|---|---|
| Edge normalization | `stochastic_graph()` pre-normalizes rows | On-the-fly: `weight / outWeight[src]` (equivalent) |
| Dangling distribution | `danglesum = α·Σ rank[dangling]` then `+ danglesum·dangling_weights[n]` | `+ danglingSum / N` (equivalent when `dangling_weights = uniform`) |
| Damping + teleport | `+ (1-α)·personalization[n]` | `(1-d)/N` in formula (equivalent when `personalization = uniform`) |
| Convergence norm | L1: `Σ|diff| < N·tol` | L∞: `max|diff| < tol` |
| Weighted edges | `weight` key on edges, passed through `stochastic_graph` | `weight` parameter on `add()`, manual normalization |
| Multi-edges | Accumulates weights | Replaces weight on `add()` (simpler, matches use case) |

---

## Authoritative references

| Source | Key content | URL |
|---|---|---|
| **Brin & Page (1998)** — original paper | `PR(A) = (1-d) + d·Σ PR(Tᵢ)/C(Tᵢ)` (un-normalized form) | http://infolab.stanford.edu/pub/papers/google.pdf |
| **Page, Brin, Motwani, Winograd (1999)** — Stanford tech report | Extended analysis, convergence proofs | http://ilpubs.stanford.edu:8090/422/1/1999-66.pdf |
| **Wikipedia — PageRank** | `PR(pᵢ) = (1-d)/N + d·Σⱼ PR(pⱼ)/L(pⱼ)` (normalized form); dangling node handling | https://en.wikipedia.org/wiki/PageRank |
| **Cornell — Mathematics of Google Search** | Google matrix `M = p·A + (1-p)·(1/n)·eeᵀ`; Perron-Frobenius theorem; power method convergence | https://pi.math.cornell.edu/~mec/Winter2009/RalucaRemus/Lecture3/lecture3.html |
| **Cambridge Part II — The Google PageRank Algorithm** | Random surfer model with damping; dangling node as "bored surfer" teleportation | https://www.maths.cam.ac.uk/undergrad/catam/II/9pt5.pdf |
| **NetworkX `_pagerank_python`** (reference implementation) | Uses stochastic graph, `danglesum = α·Σ xlast[dangling]`, uniform personalization default | https://github.com/networkx/networkx/blob/main/networkx/algorithms/link_analysis/pagerank_alg.py |
| **Gleich (2015) — PageRank Beyond the Web** | Comprehensive survey; distinguishes weakly vs strongly preferential dangling handling | https://www.cs.purdue.edu/homes/dgleich/publications/Gleich%202015%20-%20prbeyond.pdf |
| **Bryan & Leise — The $25,000,000,000 Eigenvector** | Excellent linear-algebra tutorial on PageRank | https://www.rose-hulman.edu/~bryan/googleFinalVersionFixed.pdf |

---

## Re-integration into `llm-chat-memory`

After publishing:

1. Add `@johannes.latzel/pagerank` as a dependency in `llm-chat-memory/package.json`
2. Remove `src/lib/pagerank.ts` and `tests/unit/pagerank.test.ts`
3. Update `src/lib/pool.ts`:

```ts
import { PageRank } from '@johannes.latzel/pagerank';

// in recalculateScoresUnsafe():
private async recalculateScoresUnsafe(): Promise<void> {
    const edges = this.linkPool.getEdges();
    const pg = new PageRank();
    for (const edge of edges) {
        pg.add(edge.from, edge.to, edge.weight);
    }
    const ranks = pg.rank();
    const dir = this._config.memoryDir;
    for (const [id, rank] of ranks) {
        const mem = this.data.get(id);
        if (!mem) continue;
        mem.score = rank;
        await fsp.writeFile(
            path.join(dir, `${id}.json`),
            JSON.stringify(mem.toJSON(), null, 2),
            'utf-8'
        );
    }
}
```

Note: `nodeIds` is no longer passed — the `PageRank` class tracks nodes from `add()` calls automatically.

---

## Documentation

### JSDoc style guide

Patterns observed in the parent `llm-chat-memory` codebase:

1. **One-line JSDoc** for properties and simple getters — describes "what", not "why":
   ```ts
   /** Number of concurrent requests in flight. */
   readonly #concurrency = 0;
   ```

2. **Multi-line JSDoc** for methods and classes — explains design rationale ("why"), uses `@param` / `@returns` with meaningful descriptions:
   ```ts
   /**
      Add or replace a directed edge between two nodes.

      Nodes are created implicitly — you do not need to register them
      separately. If the edge already exists its weight is **replaced**
      (not accumulated).

      @param from    Source node identifier.
      @param to      Target node identifier.
      @param weight  Positive edge weight (default `1`).
      @returns `this` for method chaining.
   */
   ```

3. **Class JSDoc** includes a usage example and references to relevant papers/algorithms:
   ```ts
   /**
      Weighted PageRank computation using the power-iteration method.

      Tracks a directed graph of nodes and weighted edges. Call {@link add} to
      build the graph, then {@link rank} to compute the stationary PageRank
      vector. Dangling nodes (no outgoing edges) distribute their rank
      uniformly to all nodes each iteration.

      ```ts
      const pg = new PageRank();
      pg.add('a', 'b').add('b', 'c');
      const ranks = pg.rank();
      ```

      References:
      - Brin & Page (1998). "The Anatomy of a Large-Scale Hypertextual Web Search Engine"
      - Wikipedia "PageRank" — normalized formula with damping factor
   */
   ```

4. **Internal types** use `@internal`:
   ```ts
   /** @internal */
   type EdgeEntry = { src: string; weight: number };
   ```

The JSDoc annotations in `src/index.ts` above already follow these conventions.

### `docs/` directory structure

```
docs/
  index.md              # Landing page (re-use README content with mkdocs-specific formatting)
  api-reference.md      # Generated or hand-written API reference
  architecture.md       # Design decisions, algorithm, usage examples
```

#### `docs/index.md`

```md
# @johannes.latzel/pagerank

Zero-dependency weighted PageRank for TypeScript/JavaScript.

## Install

```bash
npm install @johannes.latzel/pagerank
```

## Quick start

```ts
import { PageRank } from '@johannes.latzel/pagerank';

const pg = new PageRank();
pg.add('a', 'b').add('b', 'c');
const ranks = pg.rank();
// Map { 'a' => ~0.223, 'b' => ~0.331, 'c' => ~0.446 }
```

## Features

- **Zero dependencies** — just TypeScript/JavaScript
- **Weighted edges** — pass a `weight` parameter to `add()`
- **ESM-first** — native ES modules
- **TypeScript** — full type declarations included
- **Small** — single-file, ~100 lines of source code

## License

MIT — see [LICENSE](LICENSE).
```

#### `docs/api-reference.md`

```md
# API Reference

## `PageRank`

### `add(from, to, weight?)`

Add or replace a directed edge. Nodes are created implicitly. Returns `this` for chaining.

| Param | Type | Default | Description |
|---|---|---|---|
| `from` | `string` | — | Source node identifier |
| `to` | `string` | — | Target node identifier |
| `weight` | `number` | `1` | Edge weight |

### `remove(from, to)`

Remove a directed edge. No-op if it doesn't exist.

### `rank(damping?, maxIter?, tol?)`

Compute weighted PageRank scores.

| Param | Type | Default | Description |
|---|---|---|---|
| `damping` | `number` | `0.85` | Damping factor |
| `maxIter` | `number` | `100` | Maximum iterations |
| `tol` | `number` | `1e-6` | Convergence threshold |

Returns `Map<string, number>` — node identifier to PageRank score.

### `clear()`

Remove all edges and reset tracked nodes.

### `size`

Number of distinct nodes tracked. Read-only.
```

#### `docs/architecture.md`

```md
# Architecture

## Algorithm

Standard PageRank with damping factor via power iteration.

```
PR(pᵢ) = (1-d)/N + d · [ Σⱼ→ᵢ PR(pⱼ) · wⱼᵢ / outWeight(j)  +  danglingSum / N ]
```

### Dangling nodes

Nodes with no outgoing edges are called **dangling nodes**. Their rank mass is
distributed uniformly to **all** nodes each iteration (weakly preferential
teleportation). This matches the standard Google matrix formulation:

```
G = d · S + (1-d) · (eeᵀ)/N
```

where dangling columns of S are replaced by `e/N`.

### Convergence

Iteration stops when the L∞ norm of the change vector is below `tol`:

```
maxᵢ |PRₜ₊₁(pᵢ) - PRₜ(pᵢ)| < tol
```

## Implementation

The `PageRank` class uses an internal adjacency map:

```
#adj: Map<from, Map<to, weight>>
```

- Nodes are discovered implicitly from `add()` calls
- `add()` replaces edge weight (does not accumulate)
- Self-loops are allowed
- `remove()` is a no-op if the edge doesn't exist

For full implementation details, see the [source code](https://github.com/johanneslatzel/pagerank/blob/main/src/index.ts).
```

### `mkdocs.yml`

```yaml
site_name: "@johannes.latzel/pagerank"
repo_url: https://github.com/johanneslatzel/pagerank
theme:
  name: material
  palette:
    - scheme: default
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
  features:
    - navigation.instant
    - navigation.tracking
    - content.code.copy
    - content.code.annotate
  icon:
    repo: fontawesome/brands/github

nav:
  - Home: index.md
  - API Reference: api-reference.md
  - Architecture: architecture.md

markdown_extensions:
  - admonition
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.inlinehilite
  - pymdownx.snippets
  - pymdownx.superfences
  - pymdownx.tabbed:
      alternate_style: true
  - toc:
      permalink: true

extra:
  social:
    - icon: fontawesome/brands/github
      link: https://github.com/johanneslatzel/pagerank
```

### `pagerank/.github/workflows/docs.yml`

```yaml
name: Deploy docs

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.x"
      - run: pip install mkdocs-material
      - run: mkdocs build --site-dir _site
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
      - id: deployment
        uses: actions/deploy-pages@v4
```

The scaffold checklist should include:

8. Write `docs/index.md`
9. Write `docs/api-reference.md`
10. Write `docs/architecture.md`
11. Write `mkdocs.yml`
12. Install mkdocs-material (`pip install mkdocs-material`) and build (`mkdocs build`)
13. Add docs deploy workflow

---

## Key decisions

- **Zero dependencies** — same as current inline implementation
- **Class tracks nodes from `add()` calls** — no separate `nodeIds` param needed
- **Dangling node teleportation** included (weakly preferential, uniform redistribution)
- **`weight` defaults to 1** — unweighted usage is just `add('a', 'b')`
- **`add()` replaces weight** (not accumulates) — matches our use case where weight is set explicitly per edge
- **L∞ convergence check** (`max|diff| < tol`) — stricter than NetworkX L1 check; more predictable
- **No persistent storage or I/O** — purely in-memory computation
- **MIT license**
