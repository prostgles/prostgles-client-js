import { type AnyObject, type AuthGuardLocation, type AuthGuardLocationResponse, type AuthSocketSchema, CHANNELS, type IdentityProvider, type EmailAuthType } from "prostgles-types";
import { hasWnd } from "./prostgles";

type Args = {
  socket: any;
  authData: AuthSocketSchema | undefined;
  onReload: VoidFunction | undefined;
}

type AuthStateLoggedOut = {
  isLoggedin: false;
  user?: undefined;
  prefferedLogin: string;
  login?: {
    withEmailAndPassword?: (params: { email: string; password: string }) => Promise<any>;
    withMagicLink?: (params: { email: string; }) => Promise<any>;
    withProvider?: (provider: IdentityProvider) => void;
  };
  register?: {
    withPassword: (params: { email: string; password: string }) => Promise<any>;
  } | {
    magicLink: (params: { email: string; }) => Promise<any>;
  }
}
type AuthStateLoggedIn = {
  isLoggedin: true;
  user: AnyObject;
  prefferedLogin: string;
  logout: VoidFunction;
}
export type AuthHandler = 
| AuthStateLoggedOut 
| AuthStateLoggedIn;

export const setupAuth = ({ authData: authConfig, socket, onReload }: Args): AuthHandler => {

  const emit = (channel: string, params: any) => {
    return new Promise((resolve, reject) => {
      socket.emit(channel, params, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  if(!authConfig?.user){
    return {
      isLoggedin: false,
      user: undefined,
      prefferedLogin: "",
      login: {
        withEmailAndPassword: (params) => emit(CHANNELS.LOGIN, { type: "withPassword" satisfies EmailAuthType, params }),
        withMagicLink: (params) => emit(CHANNELS.LOGIN, { type: "magicLink" satisfies EmailAuthType, params }),
        withProvider: (provider) => {
          const url = authConfig?.providers?.[provider]?.url;
          if(!url) throw new Error(`Provider ${provider} not enabled`);
          window.location.assign(url);
        }
      },
      register: authConfig?.register? {
        [authConfig.register]: (params) => emit(CHANNELS.REGISTER, { type: authConfig.register, params })
      } as any : undefined
    } satisfies AuthStateLoggedOut;
  } 
  if (authConfig.pathGuard && hasWnd) {
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
 
  return {
    isLoggedin: true,
    user: authConfig.user,
    logout: () => emit(CHANNELS.LOGOUT, {}),
    prefferedLogin: "",
  } satisfies AuthStateLoggedIn;
}