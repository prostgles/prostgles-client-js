import { prostgles as pgls, type InitOptions, type ProstglesInitOptions } from "./prostgles";

export function prostgles(params: InitOptions | ProstglesInitOptions) {
  return pgls(params as any);
}
