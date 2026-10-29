import type { AuthCalls, AuthInput, AuthOperation } from "prostgles-types";
import { authRequest, type ClientAuthResponse } from "./authRequest";

export const getAuthCalls = (
  routes: Record<AuthOperation, string | undefined>,
  getRequestURL: (route: string) => string,
  options: Parameters<typeof authRequest>[4],
): ClientAuthCalls => {
  const createCall =
    <Operation extends AuthOperation>(operation: Operation) =>
    async (data: AuthInput<Operation>): Promise<ClientAuthResponse<Operation>> => {
      const route = routes[operation];
      if (!route) throw new Error("Unexpected");
      return authRequest(operation, getRequestURL(route), data, "POST", options);
    };

  return {
    login: createCall("login"),
    register: createCall("register"),
    magicLinkOrOTP: createCall("magicLinkOrOTP"),
    logout: createCall("logout"),
  };
};

export type ClientAuthCalls = {
  [Operation in AuthOperation]: (
    ...args: Parameters<AuthCalls[Operation]>
  ) => Promise<ClientAuthResponse<Operation>>;
};
