import { logger, type Middleware } from "xerus/xerus";


export const mw: Middleware[] = [logger, logger]