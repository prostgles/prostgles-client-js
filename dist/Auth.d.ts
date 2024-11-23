import { type AnyObject, type AuthSocketSchema, type IdentityProvider } from "prostgles-types";
type Args = {
    socket: any;
    authData: AuthSocketSchema | undefined;
    onReload: VoidFunction | undefined;
};
type AuthStateLoggedOut = {
    isLoggedin: false;
    user?: undefined;
    prefferedLogin: string;
    login?: {
        withEmailAndPassword?: (params: {
            email: string;
            password: string;
        }) => Promise<any>;
        withMagicLink?: (params: {
            email: string;
        }) => Promise<any>;
        withProvider?: (provider: IdentityProvider) => void;
    };
    register?: {
        withPassword: (params: {
            email: string;
            password: string;
        }) => Promise<any>;
    } | {
        magicLink: (params: {
            email: string;
        }) => Promise<any>;
    };
};
type AuthStateLoggedIn = {
    isLoggedin: true;
    user: AnyObject;
    prefferedLogin: string;
    logout: VoidFunction;
};
export type AuthHandler = AuthStateLoggedOut | AuthStateLoggedIn;
export declare const setupAuth: ({ authData: authConfig, socket, onReload }: Args) => AuthHandler;
export {};
//# sourceMappingURL=Auth.d.ts.map