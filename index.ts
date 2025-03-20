import "fs/promises"

import { type Result, Exit } from "bun-err"
import { walkDir } from "./src/util"
import { Xerus, type Middleware, HTTPContext } from "xerus/xerus"
import { init } from "./app/+init"

enum SquidFileType {
  INIT = 'INIT',
  ROUTE = 'ROUTE',
  MIDDLEWARE = 'MIDDLEWARE'
}

//==================================
// SquidFile
//==================================

class SquidFile {
  path: string
  text: string
  fileType: SquidFileType
  pathParts: string[]
  lastPathPart: string
  depth: number
  extension: string
  httpPath: string
  constructor(path: string, text: string, fileType: SquidFileType) {
    this.path = './'+path
    this.text = text
    this.fileType = fileType
    this.pathParts = path.split('/')
    this.lastPathPart = this.pathParts[this.pathParts.length-1] || ''
    this.depth = this.pathParts.length
    this.extension = this.lastPathPart.split('.')[this.lastPathPart.split('.').length-1] || ''
    if (this.depth == 2) {
      this.httpPath = "/"
    } else {
      let pathPartsWithoutFirstAndLast = []
      for (let i = 0; i < this.depth; i++) {
        if (i == 0 || i == this.depth-1) {
          continue
        }
        pathPartsWithoutFirstAndLast.push(this.pathParts[i])
      }
      this.httpPath = '/'+pathPartsWithoutFirstAndLast.join('/')
    }
  }
  static async new(path: string, fileType: SquidFileType): Promise<Result<SquidFile>> {
    let file = await Bun.file(path)
    let text = await file.text()
    return Exit.ok(new SquidFile(path, text, fileType))
  } 
}

//==================================
// Squid
//==================================

class Squid {
  files: SquidFile[]
  app: Xerus
  constructor(app: Xerus, files: SquidFile[]) {
    this.app = app
    this.files = files
  }
  static async new(dir: string): Promise<Result<Squid>> {
    let fileRes = await this.loadFiles(dir)
    if (fileRes.isErr()) {
      return Exit.err(fileRes.unwrapErr())
    }
    let files = fileRes.unwrap() as SquidFile[]
    let app = new Xerus()
    await this.mountStaticFiles(app, dir)
    await this.loadInit(app, files)
    await this.mountRoutes(app, files)
    return Exit.ok(new Squid(app, files))
  }
  private static async mountRoutes(app: Xerus, files: SquidFile[]) {
    await this.walkFilesOfType(files, SquidFileType.ROUTE, async (file: SquidFile) => {
      let module = await import(file.path)
      console.log(module, file.path)
      let mw = await this.importMiddlewareByPath(file.path, files)
      if (module.get) {
        app.get(file.httpPath, module.get, ...mw)
      }
      if (module.post) {
        app.post(file.httpPath, module.post, ...mw)
      }
      if (module.patch) {
        app.patch(file.httpPath, module.patch, ...mw)
      }
      if (module.put) {
        app.put(file.httpPath, module.put, ...mw)
      }
      if (module.delete) {
        app.delete(file.httpPath, module.delete, ...mw)
      }
    })
  }
  private static async loadInit(app: Xerus, files: SquidFile[]) {
    await this.walkFilesOfType(files, SquidFileType.INIT, async (file: SquidFile) => {
      let module = await import(file.path)
      await init(app)
    })
  }
  private static async mountStaticFiles(app: Xerus, dir: string) {
    app.get("/static/*", async (c: HTTPContext) => {
      return await c.file("./" + dir + c.path);
    });
  }
  async listen(port: number = 8080) {
    this.app.listen(port)
  }
  private static async walkFilesOfType(files: SquidFile[], fileType: SquidFileType, callback: (file: SquidFile) => void) {
    for (let i = 0; i < files.length; i++) {
      let file = files[i]
      if (file?.fileType == fileType) {
        await callback(file)
      }
    }
  }
  private static orderFilesByDepth(files: SquidFile[]): SquidFile[] {
    return files.sort((a, b) => {
      const depthA = a.path.split('/').length
      const depthB = b.path.split('/').length
      return depthA - depthB
    })
  }
  private static async importMiddlewareByPath(path: string, files: SquidFile[]) {
    let mw: Middleware[] = []
    await this.walkFilesOfType(files, SquidFileType.MIDDLEWARE, async (file: SquidFile) => {
      if (path.includes(file.httpPath)) {
        let ts = await import(file.path)
        mw.push(...ts.mw)
      }
    })
    return mw
  }
  private static async loadFiles(dir: string): Promise<Result<SquidFile[]>> {
    let files: SquidFile[] = []
    let dirRes = await walkDir(dir, async (isDir: boolean, path: string) => {
      if (isDir) {
        return
      }
      let checkForFile = async (includes: string, fileType: SquidFileType, files: SquidFile[]) => {
        if (path.includes(includes)) {
          let sqRes = await SquidFile.new(path, fileType)
          if (sqRes.isErr()) {
            return Exit.err(sqRes.unwrapErr())
          }
          files.push(sqRes.unwrap() as SquidFile)
        }
      }
      await checkForFile('+route.ts', SquidFileType.ROUTE, files)
      await checkForFile('+mw.ts', SquidFileType.MIDDLEWARE, files)
      await checkForFile('+init.ts', SquidFileType.INIT, files)
    })
    if (dirRes.isErr()) {
      return Exit.err(dirRes.unwrapErr())
    }
    return Exit.ok(this.orderFilesByDepth(files) as SquidFile[])
  }
}

//==================================
// testing
//==================================

let result = await Squid.new("./app")
if (result.isErr()) {
  console.log(result.unwrapErr())
}

let app = result.unwrap() as Squid

await app.listen()