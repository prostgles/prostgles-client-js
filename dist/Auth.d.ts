import { type AnyObject, type AuthSocketSchema, type IdentityProvider } from "prostgles-types";
type Args = {
    socket: any;
    authData: AuthSocketSchema | undefined;
    onReload: VoidFunction | undefined;
};
type WithProviderLogin = Partial<Record<IdentityProvider, VoidFunction>>;
type SignupResult = {
    success: true;
} | {
    success: false;
    error: string;
};
type EmailAuth = {
    withPassword?: (params: {
        username: string;
        password: string;
        remember_me?: boolean;
        totp_token?: string;
        totp_recovery_code?: string;
    }) => Promise<SignupResult>;
    withMagicLink?: undefined;
} | {
    withPassword?: undefined;
    withMagicLink?: (params: {
        username: string;
    }) => Promise<SignupResult>;
};
type LoginSignupOptions = {
    prefferedLogin: string;
    login: undefined | {
        withProvider?: WithProviderLogin;
    } & EmailAuth;
    register: undefined | EmailAuth;
    providers: AuthSocketSchema["providers"];
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
export declare const POST: (path: string, data: object) => Promise<any>;
export {};
//# sourceMappingURL=Auth.d.ts.map