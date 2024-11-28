import { type AnyObject, type AuthSocketSchema, type IdentityProvider } from "prostgles-types";
type Args = {
    socket: any;
    authData: AuthSocketSchema | undefined;
    onReload: VoidFunction | undefined;
};
type WithProviderLogin = Partial<Record<IdentityProvider, VoidFunction>>;
type AuthResult = {
    success: true;
} | {
    success: false;
    error: string;
};
export type PasswordLoginData = {
    username: string;
    password: string;
    remember_me?: boolean;
    totp_token?: string;
    totp_recovery_code?: string;
};
export type PasswordRegisterData = Pick<PasswordLoginData, "username" | "password">;
export type PasswordAuth<T> = (params: T) => Promise<AuthResult>;
export type MagicLinkAuth = (params: Pick<PasswordLoginData, "username">) => Promise<AuthResult>;
export type EmailAuth<T> = {
    withPassword?: PasswordAuth<T>;
    withMagicLink?: undefined;
} | {
    withPassword?: undefined;
    withMagicLink?: MagicLinkAuth;
};
type LoginSignupOptions = {
    prefferedLogin: string;
    login: undefined | {
        withProvider?: WithProviderLogin;
    } & EmailAuth<PasswordLoginData>;
    register: undefined | EmailAuth<PasswordRegisterData>;
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