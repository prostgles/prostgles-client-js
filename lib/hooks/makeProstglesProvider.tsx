import type { ReactNode } from "react";
import React from "react";
import { getReact } from "./reactImports";
import type { ClientFunctionHandler } from "lib/getMethods";
import type { UserLike } from "prostgles-types";

import {
  useProstglesClient,
  type OnReadyParams,
  type UseProstglesClientProps,
  type ProstglesClientState,
} from "./useProstglesClient";

type ProstglesContextValue<
  DBSchema,
  FuncSchema extends ClientFunctionHandler = ClientFunctionHandler,
  U extends UserLike = UserLike,
> = ProstglesClientState<OnReadyParams<DBSchema, FuncSchema, U>>;

export const makeProstglesProvider = <
  DBSchema,
  FuncSchema extends ClientFunctionHandler = ClientFunctionHandler,
  U extends UserLike = UserLike,
>() => {
  const { createContext, useContext } = getReact(true);

  const ProstglesContext = createContext<
    ProstglesContextValue<DBSchema, FuncSchema, U> | undefined
  >(undefined);

  const ProstglesProvider = ({
    children,
    ...props
  }: UseProstglesClientProps & { children: ReactNode }) => {
    const value = useProstglesClient<DBSchema, FuncSchema, U>(props);
    return <ProstglesContext.Provider value={value}>{children}</ProstglesContext.Provider>;
  };

  const useProstgles = () => {
    const ctx = useContext(ProstglesContext);
    if (!ctx) {
      throw new Error("useProstgles must be used within ProstglesProvider");
    }
    return ctx;
  };

  return { ProstglesProvider, useProstgles, ProstglesContext };
};
