import type { HTTPContext } from "xerus/xerus";


export const get = (c: HTTPContext) => {
  return c.json({id: c.getParam('id')})
}