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

type LoginSignupOptions = {
  preferredLogin: "email" | IdentityProvider | undefined;
  loginWithProvider: undefined | WithProviderLogin;
  loginType: AuthSocketSchema["loginType"];
  login: undefined | PasswordLogin;
  signupWithEmailAndPassword: undefined | PasswordRegister;
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
    loginType: authConfig?.loginType,
    login: undefined,
    preferredLogin: authConfig?.preferredLogin,
    loginWithProvider: undefined,
    signupWithEmailAndPassword: undefined,
    providers: authConfig?.providers,
  };

  if (authConfig) {
    const { providers, signupWithEmailAndPassword, loginType } = authConfig;
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

    loginSignupOptions.login =
      loginType &&
      (async (params) => {
        return authRequest(addSearchInCaseItHasReturnUrl("/login"), params);
      });

    loginSignupOptions.signupWithEmailAndPassword =
      signupWithEmailAndPassword &&
      ((params) => {
        return authRequest(addSearchInCaseItHasReturnUrl(signupWithEmailAndPassword.url), params);
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
    logout: () => {
      window.location.assign("/logout");
    },
    ...loginSignupOptions,
  } satisfies AuthStateLoggedIn;
};

export const authRequest = async <T extends PasswordRegisterResponse | PasswordLoginResponse>(
  path: string,
  data: object,
  method?: "GET",
): Promise<T> => {
  const rawResponse = await fetch(path, {
    method: method ?? "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    ...(method !== "GET" && { body: JSON.stringify(data) }),
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
