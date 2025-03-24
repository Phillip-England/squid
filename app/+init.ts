import { logger, type Xerus} from "xerus/xerus";

export const init = async (app: Xerus) => {
  app.use(logger)
}