import type { AnyObject, AuthSocketSchema, IdentityProvider, AuthResponse, AuthRequest } from "prostgles-types";
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
export type MagicLinkAuthResponse = ClientAuthSuccess<AuthResponse.MagicLinkAuthFailure | AuthResponse.MagicLinkAuthSuccess>;
export type PasswordLoginResponse = ClientAuthSuccess<AuthResponse.PasswordLoginFailure | AuthResponse.PasswordLoginSuccess>;
export type PasswordRegisterResponse = ClientAuthSuccess<AuthResponse.PasswordLoginFailure | AuthResponse.PasswordLoginSuccess>;
export type PasswordRegister = (params: AuthRequest.RegisterData) => Promise<PasswordRegisterResponse>;
export type PasswordLogin = (params: AuthRequest.LoginData) => Promise<PasswordLoginResponse>;
export type MagicLinkAuth = (params: AuthRequest.RegisterData) => Promise<MagicLinkAuthResponse>;
export type EmailAuth<Type extends "register" | "login"> = {
    withPassword?: Type extends "register" ? PasswordRegister : PasswordLogin;
    withMagicLink?: undefined;
} | {
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
export declare const setupAuth: ({ authData: authConfig, socket, onReload }: Args) => AuthHandler;
export declare const postAuthData: (path: string, data: object) => Promise<PasswordRegisterResponse | PasswordRegisterResponse | MagicLinkAuthResponse>;
export {};
//# sourceMappingURL=Auth.d.ts.map