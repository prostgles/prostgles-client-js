import type {
  AuthGuardLocation,
  AuthGuardLocationResponse,
  AuthRequest,
  AuthResponse,
  AuthSocketSchema,
  IdentityProvider,
  LocalLoginMode,
  UserLike,
} from "prostgles-types";
import { CHANNELS, isEmpty } from "prostgles-types";
import { isClientSide, type InitOptions } from "./prostgles";
import type { Socket } from "socket.io-client";
type OptionalToUndefined<T> = { [K in {} & keyof T]: T[K] };

type Args = Pick<OptionalToUndefined<InitOptions>, "credentials" | "redirect"> & {
  socket: Socket;
  authData: AuthSocketSchema | undefined;
  onReload: VoidFunction | undefined;
  endpoint: string | undefined;
};

type WithProviderLogin = Partial<Record<IdentityProvider, VoidFunction>>;

type ClientAuthSuccess<T> = T & {
  /**
   * This is a client-only property that is obtained from server redirect response
   */
  redirect_url?: string;
};

export type PasswordLoginResponse = ClientAuthSuccess<
  | AuthResponse.PasswordLoginFailure
  | AuthResponse.PasswordLoginSuccess
  | AuthResponse.MagicLinkAuthSuccess
  | AuthResponse.MagicLinkAuthFailure
  | AuthResponse.OAuthRegisterSuccess
  | AuthResponse.OAuthRegisterFailure
>;
export type PasswordRegisterResponse = ClientAuthSuccess<
  AuthResponse.PasswordRegisterSuccess | AuthResponse.PasswordRegisterFailure
>;
export type PasswordRegister = (
  params: AuthRequest.RegisterData,
) => Promise<PasswordRegisterResponse>;
export type PasswordLogin = (params: AuthRequest.LoginData) => Promise<PasswordLoginResponse>;

type LoginSignupOptions = Pick<AuthSocketSchema, "providers" | "preferredLogin"> & {
  loginWithProvider: undefined | WithProviderLogin;
  login: undefined | PasswordLogin;
  loginType: LocalLoginMode | undefined;
  signupWithEmailAndPassword: undefined | PasswordRegister;
  confirmEmail:
    | undefined
    | ((data: AuthRequest.ConfirmEmailData) => Promise<PasswordRegisterResponse>);
};

type AuthStateLoggedOut = LoginSignupOptions & {
  isLoggedin: false;
  user?: undefined;
};

type AuthStateLoggedIn<U extends UserLike = UserLike> = LoginSignupOptions & {
  isLoggedin: true;
  user: U;
  logout: () => Promise<any>;
};

export type AuthHandler<U extends UserLike = UserLike> = AuthStateLoggedOut | AuthStateLoggedIn<U>;

export const getAuthHandler = ({
  authData: authConfig,
  socket,
  onReload,
  endpoint,
  ...authOpts
}: Args): AuthHandler => {
  const urlWithEndpointAndSearch = (route: string) => {
    const { search } = window.location;
    let url = route + search;
    if (endpoint) url = `${endpoint}${url}`;
    return url;
  };
  if (authConfig?.pathGuard && isClientSide) {
    const doReload = (res?: AuthGuardLocationResponse) => {
      if (res?.shouldReload) {
        if (onReload) onReload();
        else if (isClientSide) {
          console.log("prostgles page reload due to authguard", res);
          setTimeout(() => {
            window.location.reload();
          }, 200);
        }
      }
    };
    socket.emit(
      CHANNELS.AUTHGUARD,
      JSON.stringify(window.location as AuthGuardLocation),
      (_err: any, res: AuthGuardLocationResponse) => {
        doReload(res);
      },
    );

    socket.removeAllListeners(CHANNELS.AUTHGUARD);
    socket.on(CHANNELS.AUTHGUARD, (res: AuthGuardLocationResponse) => {
      doReload(res);
    });
  }

  const loginSignupOptions: LoginSignupOptions = {
    loginType: authConfig?.login?.mode,
    login: undefined,
    preferredLogin: authConfig?.preferredLogin,
    loginWithProvider: undefined,
    signupWithEmailAndPassword: undefined,
    confirmEmail: undefined,
    providers: authConfig?.providers,
  };

  if (authConfig) {
    const { providers, signupWithEmailAndPassword, login } = authConfig;
    loginSignupOptions.loginWithProvider =
      isEmpty(providers) ? undefined : (
        providers &&
        Object.entries(providers).reduce((acc, [provider, { url }]) => {
          acc[provider as IdentityProvider] = () => {
            window.location.assign(url);
          };
          return acc;
        }, {})
      );

    loginSignupOptions.login =
      login &&
      (async (params) => {
        return authRequest(urlWithEndpointAndSearch(login.loginRoute), params, "POST", authOpts);
      });

    loginSignupOptions.signupWithEmailAndPassword =
      signupWithEmailAndPassword &&
      ((params) => {
        return authRequest(
          urlWithEndpointAndSearch(signupWithEmailAndPassword.url),
          params,
          "POST",
          authOpts,
        );
      });
    loginSignupOptions.confirmEmail =
      signupWithEmailAndPassword &&
      ((data) => {
        return authRequest(
          urlWithEndpointAndSearch(signupWithEmailAndPassword.emailConfirmationRoute),
          data,
          "POST",
          authOpts,
        );
      });
  }

  if (!authConfig?.user) {
    return {
      isLoggedin: false,
      user: undefined,
      ...loginSignupOptions,
    } satisfies AuthStateLoggedOut;
  }

  return {
    isLoggedin: true,
    user: authConfig.user,
    logout: async () => {
      const { logoutRoute } = authConfig.login ?? {};
      if (!logoutRoute) throw new Error("Unexpected");
      return authRequest(urlWithEndpointAndSearch(logoutRoute), {}, "POST", authOpts);
    },
    ...loginSignupOptions,
  } satisfies AuthStateLoggedIn;
};

export const authRequest = async <T extends PasswordRegisterResponse | PasswordLoginResponse>(
  path: string,
  data: object,
  method: "GET" | "POST",
  { credentials, redirect }: Pick<Partial<Request>, "credentials" | "redirect">,
): Promise<T> => {
  const rawResponse = await fetch(path, {
    method: method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    ...(method !== "GET" && { body: JSON.stringify(data) }),
    credentials,
    redirect,
  });

  if (!rawResponse.ok) {
    const error = await rawResponse
      .json()
      .catch(() => rawResponse.text())
      .catch(() => rawResponse.statusText);
    if (typeof error === "string") {
      return { success: false, code: "something-went-wrong", message: error } as T;
    }
    return error;
  }

  const responseObject = await rawResponse
    .json()
    .catch(async () => ({ message: await rawResponse.text() }))
    .catch(() => ({ message: rawResponse.statusText }));

  if (rawResponse.redirected) {
    return { ...responseObject, success: true, redirect_url: rawResponse.url };
  }

  return responseObject;
};
