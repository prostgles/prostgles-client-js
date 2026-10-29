import {
  authContract,
  getJSONBSchemaValidationError,
  isObject,
  type AuthInput,
  type AuthOperation,
  type AuthOutput,
  type CommonAuthFailure,
} from "prostgles-types";

export const authRequest = async <Operation extends AuthOperation>(
  operation: Operation,
  path: string,
  data: AuthInput<Operation>,
  method: "GET" | "POST",
  { credentials, redirect }: Pick<Partial<Request>, "credentials" | "redirect">,
): Promise<ClientAuthResponse<Operation>> => {
  const rawResponse = await fetch(path, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    ...(method !== "GET" && { body: JSON.stringify(data) }),
    credentials,
    redirect,
  });

  const responseText = await rawResponse.text();
  let response: unknown;
  try {
    response = JSON.parse(responseText);
  } catch {
    if (rawResponse.ok && rawResponse.redirected) {
      response = { success: true };
    } else {
      return {
        success: false,
        code: "something-went-wrong",
        message: responseText || rawResponse.statusText,
      };
    }
  }

  if (
    rawResponse.ok &&
    rawResponse.redirected &&
    (!isObject(response) || !("success" in response))
  ) {
    response = { success: true };
  }

  const validation = getJSONBSchemaValidationError<(typeof authContract)[Operation]["response"]>(
    authContract[operation].response,
    response,
    { allowExtraProperties: true },
  );
  if (validation.error !== undefined || (!rawResponse.ok && validation.data.success)) {
    return {
      success: false,
      code: "something-went-wrong",
      message: "Unexpected authentication response was sent by the server: " + validation.error,
    };
  }

  return {
    ...validation.data,
    ...(rawResponse.redirected && { redirect_url: rawResponse.url }),
  };
};

export type ClientAuthResponse<Operation extends AuthOperation> = (
  | AuthOutput<Operation>
  | CommonAuthFailure
) & {
  /** Obtained from the HTTP redirect, rather than the response body. */
  redirect_url?: string;
};
