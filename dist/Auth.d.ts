import { type AnyObject, type AuthSocketSchema, type EmailLoginResponse, type EmailRegisterResponse, type IdentityProvider } from "prostgles-types";
type Args = {
    socket: any;
    authData: AuthSocketSchema | undefined;
    onReload: VoidFunction | undefined;
};
type WithProviderLogin = Partial<Record<IdentityProvider, VoidFunction>>;
export type AuthResult = {
    success: true;
    redirect_url?: string;
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
export type PasswordAuth<T> = (params: T) => Promise<EmailRegisterResponse>;
export type MagicLinkAuth = (params: Pick<PasswordLoginData, "username">) => Promise<EmailLoginResponse>;
export type EmailAuth<T> = {
    withPassword?: PasswordAuth<T>;
    withMagicLink?: undefined;
} | {
    withPassword?: undefined;
    withMagicLink?: MagicLinkAuth;
};
type LoginSignupOptions = {
    prefferedLogin: string;
    login: undefined | ({
        withProvider?: WithProviderLogin;
    } & EmailAuth<PasswordLoginData>);
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
export declare const postAuthData: (path: string, data: object) => Promise<AuthResult>;
export {};
//# sourceMappingURL=Auth.d.ts.map