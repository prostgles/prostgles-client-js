import { type AnyObject, type AuthGuardLocation, type AuthGuardLocationResponse, type AuthSocketSchema, CHANNELS, type IdentityProvider, type EmailAuthType, isEmpty } from "prostgles-types";
import { hasWnd } from "./prostgles";

type Args = {
  socket: any;
  authData: AuthSocketSchema | undefined;
  onReload: VoidFunction | undefined;
}

type WithProviderLogin = Partial<Record<IdentityProvider, VoidFunction>>;

type SignupResult = 
| { success: true; }
| { success: false; error: string; }

type EmailAuth = 
| {
  withPassword?: (params: { username: string; password: string; remember_me?: boolean; totp_token?: string; totp_recovery_code?: string; }) => Promise<SignupResult>;
  withMagicLink?: undefined;
} 
| {
  withPassword?: undefined;
  withMagicLink?: (params: { username: string; }) => Promise<SignupResult>;
}

type LoginSignupOptions = {
  prefferedLogin: string;
  login: undefined | {
    withProvider?: WithProviderLogin;
  } & EmailAuth;
  register: undefined | EmailAuth;
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

    loginSignupOptions.login = {
      withProvider,
      ...(loginType && {
        [loginType]: async (params) => {
          return POST("/login", params);
        },
      }),
    };

    loginSignupOptions.register = register?.type? {
      [register.type]: (params) => {
        return POST(register.url, params);
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

export const POST = async (path: string, data: object) => {
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
    throw error;
  }
  
  return rawResponse;   
}