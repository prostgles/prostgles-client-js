import { type AnyObject, type AuthSocketSchema, type IdentityProvider } from "prostgles-types";
type Args = {
    socket: any;
    authData: AuthSocketSchema | undefined;
    onReload: VoidFunction | undefined;
};
type WithProviderLogin = Partial<Record<IdentityProvider, VoidFunction>>;
type EmailAuth = {
    withPassword?: (params: {
        username: string;
        password: string;
        remember_me?: boolean;
        totp_token?: string;
        totp_recovery_code?: string;
    }) => Promise<any>;
    withMagicLink?: undefined;
} | {
    withPassword?: undefined;
    withMagicLink?: (params: {
        username: string;
    }) => Promise<any>;
};
type LoginSignupOptions = {
    prefferedLogin: string;
    login: undefined | {
        withProvider?: WithProviderLogin;
    } & EmailAuth;
    register: undefined | EmailAuth;
};
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
export type AuthHandler = AuthStateLoggedOut | AuthStateLoggedIn;
export declare const setupAuth: ({ authData: authConfig, socket, onReload }: Args) => AuthHandler;
export declare const POST: (path: string, data: object) => Promise<Response>;
export {};
//# sourceMappingURL=Auth.d.ts.map