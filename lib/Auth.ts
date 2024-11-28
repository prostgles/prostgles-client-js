import { type AnyObject, type AuthGuardLocation, type AuthGuardLocationResponse, type AuthSocketSchema, CHANNELS, type IdentityProvider, isEmpty } from "prostgles-types";
import { hasWnd } from "./prostgles";

type Args = {
  socket: any;
  authData: AuthSocketSchema | undefined;
  onReload: VoidFunction | undefined;
}

type WithProviderLogin = Partial<Record<IdentityProvider, VoidFunction>>;

export type AuthResult = 
| { success: true; redirect_url?: string; }
| { success: false; error: string; }

export type PasswordLoginData = { username: string; password: string; remember_me?: boolean; totp_token?: string; totp_recovery_code?: string; };
export type PasswordRegisterData = Pick<PasswordLoginData, "username" | "password">
export type PasswordAuth<T> = (params: T) => Promise<AuthResult>;
export type MagicLinkAuth = (params: Pick<PasswordLoginData, "username">) => Promise<AuthResult>;

export type EmailAuth<T> = 
| {
  withPassword?: PasswordAuth<T>
  withMagicLink?: undefined;
} 
| {
  withPassword?: undefined;
  withMagicLink?: MagicLinkAuth;
}

type LoginSignupOptions = {
  prefferedLogin: string;
  login: undefined | {
    withProvider?: WithProviderLogin;
  } & EmailAuth<PasswordLoginData>;
  register: undefined | EmailAuth<PasswordRegisterData>;
  providers: AuthSocketSchema["providers"];
}

type AuthStateLoggedOut = LoginSignupOptions & {
  isLoggedin: false;
  user?: undefined;
};

type AuthStateLoggedIn = LoginSignupOptions & {
  isLoggedin: true;
  user: AnyObject;
  prefferedLogin: string;
  logout: VoidFunction;
};

export type AuthHandler = 
| AuthStateLoggedOut 
| AuthStateLoggedIn;

export const setupAuth = ({ authData: authConfig, socket, onReload }: Args): AuthHandler => {
  if (authConfig?.pathGuard && hasWnd) {
    const doReload = (res?: AuthGuardLocationResponse) => {
      if (res?.shouldReload) {
        if (onReload) onReload();
        else if (hasWnd) {
          window.location.reload();
        }
      }
    }
    socket.emit(CHANNELS.AUTHGUARD, JSON.stringify(window.location as AuthGuardLocation), (err: any, res: AuthGuardLocationResponse) => {
      doReload(res)
    });

    socket.removeAllListeners(CHANNELS.AUTHGUARD);
    socket.on(CHANNELS.AUTHGUARD, (res: AuthGuardLocationResponse) => {
      doReload(res);
    });
  }

  const loginSignupOptions: LoginSignupOptions = {
    login: undefined,
    prefferedLogin: "",
    register: undefined,
    providers: authConfig?.providers,
  }

  if(authConfig){
    const { providers, register, loginType } = authConfig;
    const withProvider: WithProviderLogin | undefined = isEmpty(providers)? undefined : providers && Object.entries(providers).reduce((acc, [provider, { url }]) => {
      acc[provider as IdentityProvider] = () => {
        window.location.assign(url);
      }
      return acc;
    }, {});

    const addSearchInCaseItHasReturnUrl = (url: string) => {
      const { search } = window.location;
      return url + search;
    }

    loginSignupOptions.login = {
      withProvider,
      ...(loginType && {
        [loginType]: async (params) => {
          return postAuthData(addSearchInCaseItHasReturnUrl("/login"), params);
        },
      }),
    };

    loginSignupOptions.register = register?.type? {
      [register.type]: (params) => {
        return postAuthData(addSearchInCaseItHasReturnUrl(register.url), params);
      }
    } : undefined;
  }

  if(!authConfig?.user){
    return {
      isLoggedin: false,
      user: undefined,
      ...loginSignupOptions
    } satisfies AuthStateLoggedOut;
  }
 
  return {
    isLoggedin: true,
    user: authConfig.user,
    logout: () => {
      window.location.assign("/logout");
    },
    ...loginSignupOptions
  } satisfies AuthStateLoggedIn;
}

export const postAuthData = async (path: string, data: object): Promise<AuthResult> => {
  const rawResponse = await fetch(path, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if(!rawResponse.ok){
    const error = await rawResponse.json().catch(() => rawResponse.text()).catch(() => rawResponse.statusText);
    if(typeof error === "string") {
      return { success: false, error };
    }
    return error;
  }

  const responseObject = await rawResponse.json().catch(async () => ({ message: await rawResponse.text()})).catch(() => ({ message: rawResponse.statusText }));
  if(rawResponse.redirected){
    return { ...responseObject, success: true, redirect_url: rawResponse.url };
  }
  
  return responseObject;   
}