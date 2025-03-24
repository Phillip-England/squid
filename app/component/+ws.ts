import type { ServerWebSocket } from "bun";
import type { WSContext } from "xerus/xerus";

export async function open(ws: ServerWebSocket<unknown>) {
  
}

export async function message(ws: ServerWebSocket<unknown>, message: string | Buffer<ArrayBufferLike>) {
  
}

export async function close(ws: ServerWebSocket<unknown>, code: number, message: string) {
  
}

export async function onConnect(c: WSContext) {

}