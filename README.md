# astro-capo

> Warning
>
> POC, not production ready

Optimize head using capo.js.

## Get started

```bash
pnpm add astro-capo
```

Add a middleware and import `withCapo`:

```ts
// src/middleware.ts

import { sequence } from "astro/middleware";
import { withCapo } from "astro-capo";

export const onRequest = sequence(withCapo);
```

That's it

## Development

Having Corepack is recommended

```
pnpm i --frozen-lockfile
```

Run 2 terminals:

```
pnpm --filter astro-capo dev
pnpm --filter playground dev
```
