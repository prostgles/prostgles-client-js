import type {
  AnyObject,
  AuthGuardLocation,
  AuthGuardLocationResponse,
  AuthSocketSchema,
  IdentityProvider,
  AuthResponse,
  AuthRequest,
} from "prostgles-types";
import { CHANNELS, isEmpty } from "prostgles-types";
import { hasWnd } from "./prostgles";

type Args = {
  socket: any;
  authData: AuthSocketSchema | undefined;
  onReload: VoidFunction | undefined;
};

type WithProviderLogin = Partial<Record<IdentityProvider, VoidFunction>>;

type ClientAuthSuccess<T> = T & {
  /**
   * This is a client-only property that is obtained from server redirect response
   */
  redirect_url?: string;
};

export type MagicLinkAuthResponse = ClientAuthSuccess<
  AuthResponse.MagicLinkAuthFailure | AuthResponse.MagicLinkAuthSuccess
>;

export type PasswordLoginResponse = ClientAuthSuccess<
  AuthResponse.PasswordLoginFailure | AuthResponse.PasswordLoginSuccess
>;
export type PasswordRegisterResponse = ClientAuthSuccess<
  AuthResponse.PasswordLoginFailure | AuthResponse.PasswordLoginSuccess
>;
export type PasswordRegister = (
  params: AuthRequest.RegisterData,
) => Promise<PasswordRegisterResponse>;
export type PasswordLogin = (params: AuthRequest.LoginData) => Promise<PasswordLoginResponse>;
export type MagicLinkAuth = (params: AuthRequest.RegisterData) => Promise<MagicLinkAuthResponse>;

export type EmailAuth<Type extends "register" | "login"> =
  | {
      withPassword?: Type extends "register" ? PasswordRegister : PasswordLogin;
      withMagicLink?: undefined;
    }
  | {
      withPassword?: undefined;
      withMagicLink?: MagicLinkAuth;
    };

type LoginSignupOptions = {
  prefferedLogin: "email" | IdentityProvider | undefined;
  loginWithProvider: undefined | WithProviderLogin;
  login: undefined | EmailAuth<"login">;
  register: undefined | EmailAuth<"register">;
  providers: AuthSocketSchema["providers"];
};

type AuthStateLoggedOut = LoginSignupOptions & {
  isLoggedin: false;
  user?: undefined;
};

type AuthStateLoggedIn = LoginSignupOptions & {
  isLoggedin: true;
  user: AnyObject;
  logout: VoidFunction;
};

export type AuthHandler = AuthStateLoggedOut | AuthStateLoggedIn;

export const setupAuth = ({ authData: authConfig, socket, onReload }: Args): AuthHandler => {
  if (authConfig?.pathGuard && hasWnd) {
    const doReload = (res?: AuthGuardLocationResponse) => {
      if (res?.shouldReload) {
        if (onReload) onReload();
        else if (hasWnd) {
          window.location.reload();
        }
      }
    };
    socket.emit(
      CHANNELS.AUTHGUARD,
      JSON.stringify(window.location as AuthGuardLocation),
      (err: any, res: AuthGuardLocationResponse) => {
        doReload(res);
      },
    );

    socket.removeAllListeners(CHANNELS.AUTHGUARD);
    socket.on(CHANNELS.AUTHGUARD, (res: AuthGuardLocationResponse) => {
      doReload(res);
    });
  }

  const loginSignupOptions: LoginSignupOptions = {
    login: undefined,
    prefferedLogin: undefined,
    loginWithProvider: undefined,
    register: undefined,
    providers: authConfig?.providers,
  };

  if (authConfig) {
    const { providers, register, loginType } = authConfig;
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

    const addSearchInCaseItHasReturnUrl = (url: string) => {
      const { search } = window.location;
      return url + search;
    };

    loginSignupOptions.login = loginType && {
      [loginType]: async (params) => {
        return postAuthData(addSearchInCaseItHasReturnUrl("/login"), params);
      },
    };

    loginSignupOptions.register = register?.type && {
      [register.type]: (params) => {
        return postAuthData(addSearchInCaseItHasReturnUrl(register.url), params);
      },
    };
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
    logout: () => {
      window.location.assign("/logout");
    },
    ...loginSignupOptions,
  } satisfies AuthStateLoggedIn;
};

export const postAuthData = async (
  path: string,
  data: object,
): Promise<PasswordRegisterResponse | PasswordRegisterResponse | MagicLinkAuthResponse> => {
  const rawResponse = await fetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!rawResponse.ok) {
    const error = await rawResponse
      .json()
      .catch(() => rawResponse.text())
      .catch(() => rawResponse.statusText);
    if (typeof error === "string") {
      return { success: false, code: "something-went-wrong", message: error };
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
