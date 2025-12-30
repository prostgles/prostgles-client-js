import type { UserLike } from "prostgles-types";
import React, { createContext, useContext, type ReactNode } from "react";
import {
  useProstglesClient,
  type OnReadyParams,
  type ProstglesClientState,
  type UseProstglesClientProps,
} from "./useProstglesClient";

type ProstglesLoginProviderProps<DBSchema, U extends UserLike> = UseProstglesClientProps & {
  children: ReactNode;
  loginFormStyles?: React.CSSProperties;
};

type ProstglesLoginContextType<DBSchema, U extends UserLike> = {
  clientState: ProstglesClientState<OnReadyParams<DBSchema, U>>;
};

const ProstglesLoginContext = createContext<ProstglesLoginContextType<any, any> | null>(null);

export const ProstglesLoginProvider = <DBSchema, U extends UserLike>({
  children,
  loginFormStyles,
  ...initOptions
}: ProstglesLoginProviderProps<DBSchema, U>) => {
  const clientState = useProstglesClient<DBSchema, U>(initOptions);

  if (clientState.isLoading) {
    return <div style={loginFormStyles}>Loading...</div>;
  }

  if (clientState.hasError) {
    return <div style={loginFormStyles}>Error: {String(clientState.error)}</div>;
  }

  return (
    <ProstglesLoginContext.Provider
      value={{ clientState: clientState as ProstglesLoginContextType<any, any>["clientState"] }}
    >
      {children}
    </ProstglesLoginContext.Provider>
  );
};

export const useProstglesLogin = <DBSchema, U extends UserLike>() => {
  const ctx = useContext(ProstglesLoginContext) as ProstglesLoginContextType<DBSchema, U> | null;
  if (!ctx) throw new Error("useProstglesLogin must be used within a ProstglesLoginProvider");
  return ctx.clientState;
};
