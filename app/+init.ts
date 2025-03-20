import { logger, type Xerus, HTTPContext } from "xerus/xerus";


export const init = async (app: Xerus) => {
  app.use(logger)
}