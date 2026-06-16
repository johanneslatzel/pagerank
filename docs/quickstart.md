# Quickstart

## Install

```bash
npm install @johannes.latzel/pagerank
```

## Basic usage

```ts
import { PageRank } from '@johannes.latzel/pagerank';

const pg = new PageRank();
pg.add('a', 'b').add('b', 'c');
const ranks = pg.rank();
// Map { 'a' => ~0.223, 'b' => ~0.331, 'c' => ~0.446 }
```

Edges are directed with optional weights:

```ts
const pg = new PageRank();
pg.add('alice', 'bob');              // unweighted (default 1)
pg.add('bob', 'carol', 0.5);         // weighted
pg.add('carol', 'dave', 2);          // weighted
pg.add('carol', 'alice');            // carol's second outlink
const ranks = pg.rank(0.85, 200, 1e-8);
```

## Full API

See [API Reference](api-reference.md).
