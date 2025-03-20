# squid
A file-based route for [Xerus](https://github.com/Phillip-England/xerus)

## Installation
```bash
bun add github:phillip-england/squid
```

## Quickstart
If you already know how to use `Squid`, here you go:
```ts
import { Squid } from "squid"

let result = await Squid.new("./app", process.cwd())
if (result.isErr()) {
  console.error(result.unwrapErr())
}

let app = result.unwrap() as Squid

await app.listen()
```

## Project Directory
Create an `./app` directory to place our application within:
```bash
mkdir ./app
mkdir ./app/user
mkdir ./app/user/:id
touch ./app/+init.ts
touch ./app/+route.ts
touch ./app/about/+route.ts
touch ./app/user/+route.ts
touch ./app/user/+mw.ts
touch ./app/user/:id/+route.ts
```

The rest of this guide assumes your application is found at `./app`

## Application Initilization
`Squid` allows you to initalize `Xerus` prior to mounting http endpoints. To do so, create an `+init.ts` file at `./app/+init.ts` and export an `init` function. Here, we apply the `logger` middleware globally using `app.use`

`./app/+init.ts`
```ts
import { logger, type Xerus} from "xerus/xerus";


export const init = async (app: Xerus) => {
  app.use(logger)
}
```

## Routing
`Squid` scans your `./app` directory for `+route.ts` files and it expects them to export `get`, `post`, `put`, `patch`, and `delete` methods.

The index route for our application can be found at `./app/+route.ts` and can be triggered by visiting `/`:
```ts
import { HTTPContext, logger, Xerus } from "xerus/xerus";

export const get = async (c: HTTPContext): Promise<Response> => {
  return c.html(`<p>/</p>`)
}
```

Routes resolve based off of their location in the file system. For instance, this file at `./app/about/+route.ts` will be executed when we visit `/about`:
```ts
import { HTTPContext } from "xerus/xerus";

export const get = async (c: HTTPContext): Promise<Response> => {
  return c.html(`<p>/about</p>`)
}
```

## Dyanmic Routes
Dyanmic routes may be defined by using the `:paramName` syntax like `./app/user/:id/+route.ts`:
```ts
import type { HTTPContext } from "xerus/xerus";

export const get = (c: HTTPContext) => {
  return c.json({id: c.getParam('id')})
}
```

## Middleware
`Squid` scans for `+mw.ts` files inside of `./app` (or wherever you placed your app). When it encounters an `+mw.ts` file, it assumes all routes at or beneath that level in the file system want to apply the middleware.

For example, if we place the following file at `./app/user/+mw.ts` then all endpoints starting with `/user` will apply the middleware:
```ts
import { logger, type Middleware } from "xerus/xerus";

export const mw: Middleware[] = [logger, logger, logger]
```

Middleware is organized by file system depth. The deeper the middlware is, the deeper in the middleware chain it exists.


