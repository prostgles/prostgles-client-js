export type ReactT = typeof import("react");
let React: ReactT;

const alertNoReact = (...args: any[]): any => {
  throw "Must install react";
};
const alertNoReactT = <T>(...args: any[]): any => {
  throw "Must install react";
};
export const getReact = (throwError?: boolean): ReactT => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-require-imports
    React ??= require("react");
  } catch (err) {}
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (throwError && !React) throw new Error("Must install react");
  return React as any;
};
getReact();
const {
  useEffect = alertNoReact as (typeof React)["useEffect"],
  useCallback = alertNoReact as (typeof React)["useCallback"],
  useRef,
  useState = alertNoReactT as (typeof React)["useState"],
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
} = React! ?? {};

export { useEffect, useCallback, useRef, useState, React };

export const __prglReactInstalled = () => Boolean((React as any) && useRef);
