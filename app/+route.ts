import { HTTPContext, logger, Xerus } from "xerus/xerus";


export const get = async (c: HTTPContext): Promise<Response> => {
  return c.html(`<p>/</p>`)
}