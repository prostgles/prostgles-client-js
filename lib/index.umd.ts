import { prostgles as pgls, type InitOptions } from "./prostgles";
export function prostgles(params: InitOptions) {
  return pgls(params as any);
}
