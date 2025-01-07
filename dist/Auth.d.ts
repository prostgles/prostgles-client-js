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
export type PasswordRegisterResponse = ClientAuthSuccess<AuthResponse.PasswordRegisterSuccess | AuthResponse.PasswordRegisterFailure>;
export type PasswordRegister = (params: AuthRequest.RegisterData) => Promise<PasswordRegisterResponse>;
export type PasswordLogin = (params: AuthRequest.LoginData) => Promise<PasswordLoginResponse>;
type LoginSignupOptions = Pick<AuthSocketSchema, "loginType" | "providers" | "preferredLogin"> & {
    loginWithProvider: undefined | WithProviderLogin;
    login: undefined | PasswordLogin;
    signupWithEmailAndPassword: undefined | PasswordRegister;
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
export declare const authRequest: <T extends (import("prostgles-types").CommonAuthFailure & {
    /**
     * This is a client-only property that is obtained from server redirect response
     */
    redirect_url?: string | undefined;
}) | ({
    success: false;
    code: "no-match";
    message?: string | undefined;
} & {
    /**
     * This is a client-only property that is obtained from server redirect response
     */
    redirect_url?: string | undefined;
}) | ({
    success: false;
    code: "inactive-account";
    message?: string | undefined;
} & {
    /**
     * This is a client-only property that is obtained from server redirect response
     */
    redirect_url?: string | undefined;
}) | ({
    success: false;
    code: "totp-token-missing" | "invalid-username" | "username-missing" | "invalid-email" | "password-missing" | "invalid-password" | "is-from-OAuth" | "is-from-magic-link" | "invalid-totp-recovery-code" | "invalid-totp-code" | "email-not-confirmed";
    message?: string | undefined;
} & {
    /**
     * This is a client-only property that is obtained from server redirect response
     */
    redirect_url?: string | undefined;
}) | (AuthResponse.AuthSuccess & {
    /**
     * This is a client-only property that is obtained from server redirect response
     */
    redirect_url?: string | undefined;
}) | (AuthResponse.MagicLinkAuthSuccess & {
    /**
     * This is a client-only property that is obtained from server redirect response
     */
    redirect_url?: string | undefined;
}) | ({
    success: false;
    code: "expired-magic-link" | "invalid-magic-link" | "used-magic-link";
    message?: string | undefined;
} & {
    /**
     * This is a client-only property that is obtained from server redirect response
     */
    redirect_url?: string | undefined;
}) | ({
    success: false;
    code: "provider-issue";
    message?: string | undefined;
} & {
    /**
     * This is a client-only property that is obtained from server redirect response
     */
    redirect_url?: string | undefined;
}) | (AuthResponse.PasswordRegisterSuccess & {
    /**
     * This is a client-only property that is obtained from server redirect response
     */
    redirect_url?: string | undefined;
}) | ({
    success: false;
    code: "username-missing" | "password-missing" | "weak-password" | "user-already-registered" | "invalid-email-confirmation-code" | "expired-email-confirmation-code" | "inactive-account";
    message?: string | undefined;
} & {
    /**
     * This is a client-only property that is obtained from server redirect response
     */
    redirect_url?: string | undefined;
})>(path: string, data: object, method?: "GET") => Promise<T>;
export {};
//# sourceMappingURL=Auth.d.ts.map