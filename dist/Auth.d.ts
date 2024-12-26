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
export type PasswordLoginResponse = ClientAuthSuccess<AuthResponse.PasswordLoginFailure | AuthResponse.PasswordLoginSuccess | AuthResponse.MagicLinkAuthSuccess | AuthResponse.MagicLinkAuthFailure | AuthResponse.OAuthRegisterSuccess | AuthResponse.OAuthRegisterFailure>;
export type PasswordRegisterResponse = ClientAuthSuccess<AuthResponse.PasswordLoginFailure | AuthResponse.PasswordLoginSuccess>;
export type PasswordRegister = (params: AuthRequest.RegisterData) => Promise<PasswordRegisterResponse>;
export type PasswordLogin = (params: AuthRequest.LoginData) => Promise<PasswordLoginResponse>;
type LoginSignupOptions = {
    prefferedLogin: "email" | IdentityProvider | undefined;
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
export declare const setupAuth: ({ authData: authConfig, socket, onReload }: Args) => AuthHandler;
export declare const postAuthData: (path: string, data: object) => Promise<any>;
export {};
//# sourceMappingURL=Auth.d.ts.map