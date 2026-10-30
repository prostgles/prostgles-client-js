import type {
  AuthGuardLocation,
  AuthGuardLocationResponse,
  AuthRequest,
  AuthSocketSchema,
  IdentityProvider,
  LocalLoginMode,
  UserLike,
} from "prostgles-types";
import { CHANNELS, isEmpty } from "prostgles-types";
import { isClientSide, type InitOptions } from "./prostgles";
import type { Socket } from "socket.io-client";
import type { ClientAuthResponse } from "./auth/authRequest";
import { getAuthCalls, type ClientAuthCalls } from "./auth/getAuthCalls";
export { authRequest } from "./auth/authRequest";
type OptionalToUndefined<T> = { [K in {} & keyof T]: T[K] };

type Args = Pick<OptionalToUndefined<InitOptions>, "credentials" | "redirect"> & {
  socket: Socket;
  authData: AuthSocketSchema | undefined;
  onReload: VoidFunction | undefined;
  endpoint: string | undefined;
};

type WithProviderLogin = Partial<Record<IdentityProvider, VoidFunction>>;

export type PasswordLoginResponse = ClientAuthResponse<"login">;
export type PasswordRegisterResponse = ClientAuthResponse<"register">;
export type PasswordRegister = ClientAuthCalls["register"];
export type PasswordLogin = ClientAuthCalls["login"];
export type ConfirmEmail = (
  data: AuthRequest.ConfirmEmailData,
) => Promise<ClientAuthResponse<"magicLinkOrOTP">>;

type LoginSignupOptions = Pick<AuthSocketSchema, "providers" | "preferredLogin"> & {
  loginWithProvider: undefined | WithProviderLogin;
  login: undefined | PasswordLogin;
  loginType: LocalLoginMode | undefined;
  signupWithEmail: undefined | ClientAuthCalls["register"];
  signupWithEmailOptions: AuthSocketSchema["signupWithEmail"];
  /** @deprecated Use signupWithEmail and signupWithEmailOptions.requireInvitation. */
  signupWithEmailAndPassword: undefined | PasswordRegister;
  confirmEmail: undefined | ConfirmEmail;
};

type AuthStateLoggedOut = LoginSignupOptions & {
  isLoggedin: false;
  user?: undefined;
};

type AuthStateLoggedIn<U extends UserLike = UserLike> = LoginSignupOptions & {
  isLoggedin: true;
  user: U;
  logout: () => Promise<ClientAuthResponse<"logout">>;
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
    const search = typeof window !== "undefined" ? window.location.search : "";
    let url = route + search;
    if (endpoint) url = `${endpoint}${url}`;
    return url;
  };
  const legacySignupWithEmail = authConfig?.signupWithEmailAndPassword;
  const signupWithEmailOptions =
    authConfig?.signupWithEmail ??
    (legacySignupWithEmail && {
      ...legacySignupWithEmail,
      requirePassword: true,
      requireInvitation: false,
    });
  const authCalls = getAuthCalls(
    {
      login: authConfig?.login?.loginRoute,
      register: signupWithEmailOptions?.url,
      magicLinkOrOTP: signupWithEmailOptions?.emailConfirmationRoute,
      logout: authConfig?.login?.logoutRoute,
    },
    urlWithEndpointAndSearch,
    authOpts,
  );
  if (authConfig?.pathGuard && isClientSide) {
    const doReload = (res?: AuthGuardLocationResponse) => {
      if (res?.shouldReload) {
        if (onReload) onReload();
        else if (isClientSide) {
          console.log("prostgles page reload due to auth guard", res);
          setTimeout(() => {
            window.location.reload();
          }, 200);
        }
      }
    };
    socket.emit(
      CHANNELS.AUTH_GUARD,
      JSON.stringify(window.location as AuthGuardLocation),
      (_err: any, res: AuthGuardLocationResponse) => {
        doReload(res);
      },
    );

    socket.removeAllListeners(CHANNELS.AUTH_GUARD);
    socket.on(CHANNELS.AUTH_GUARD, (res: AuthGuardLocationResponse) => {
      doReload(res);
    });
  }

  const loginSignupOptions: LoginSignupOptions = {
    loginType: authConfig?.login?.mode,
    login: undefined,
    preferredLogin: authConfig?.preferredLogin,
    loginWithProvider: undefined,
    signupWithEmail: signupWithEmailOptions && authCalls.register,
    signupWithEmailOptions,
    signupWithEmailAndPassword: undefined,
    confirmEmail: undefined,
    providers: authConfig?.providers,
  };

  if (authConfig) {
    const { providers, login } = authConfig;
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

    loginSignupOptions.login = login && authCalls.login;
    loginSignupOptions.signupWithEmailAndPassword =
      signupWithEmailOptions && !signupWithEmailOptions.requireInvitation ?
        authCalls.register
      : undefined;
    loginSignupOptions.confirmEmail = signupWithEmailOptions && authCalls.magicLinkOrOTP;
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
    logout: () => authCalls.logout({}),
    ...loginSignupOptions,
  } satisfies AuthStateLoggedIn;
};
