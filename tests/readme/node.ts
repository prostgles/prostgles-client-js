import prostgles from "prostgles-client";

export const connect = async (endpoint: string, token: string) => {
  const prostglesClient = await prostgles({ endpoint, token });
  return prostglesClient;
};
