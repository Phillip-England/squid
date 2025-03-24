import { expect, test } from "bun:test";
import { Squid } from ".";

let app = await Squid.new("./app", process.cwd())
await app.listen()

test("basic +route.ts", async () => {
  let res = await fetch('localhost:8080/')
  expect(res.status).toBe(200)
});