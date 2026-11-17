import {
  CHANNELS,
  isEqual,
  type AnyObject,
  type DeleteParams,
  type SubscriptionChannels,
  type SubscriptionHandler,
  type UpdateParams,
} from "prostgles-types";
import { debug, type AnyFunction, type CoreParams, type InitOptions } from "./prostgles";
import { FunctionQueuer } from "./FunctionQueuer";
import { sendSocketRequest } from "./sendSocketRequest";

type OnChange = (data: AnyObject[], err?: any) => void;
export type Subscription = CoreParams & {
  lastData: any;
  onCall: (data: { data: AnyObject[]; err?: unknown }) => void;
  handlers: OnChange[];
  unsubChannel: string;
  reAttach: () => Promise<void>;
  onHandlersChanged: () => Promise<void>;
};

const preffix = CHANNELS._preffix;

export const getSubscriptionHandler = (initOpts: Pick<InitOptions, "socket" | "onDebug">) => {
  const { socket, onDebug } = initOpts;

  const subscriptions: Map<string, Subscription> = new Map();
  let connectionVersion = 0;
  socket.on("disconnect", () => {
    connectionVersion++;
  });

  const _unsubscribe = async (
    channelName: string,
    unsubChannel: string,
    handler: AnyFunction,
  ): Promise<true> => {
    debug("_unsubscribe", { channelName, handler });

    const sub = subscriptions.get(channelName);
    if (!sub?.handlers.includes(handler)) return true;
    sub.handlers = sub.handlers.filter((h) => h !== handler);
    onDebug?.({
      type: "table",
      command: "unsubscribe",
      tableName: sub.tableName,
      unsubChannel,
      handlers: sub.handlers,
    });
    if (!sub.handlers.length) await sub.onHandlersChanged();
    return true;
  };

  const addServerSub = (params: CoreParams) =>
    sendSocketRequest<SubscriptionChannels>(socket, preffix, params);

  /**
   * Can be used concurrently
   */
  const addSubQueuer = new FunctionQueuer(_addSub, ([_, { tableName }]) => tableName);
  const addSub = async (
    dbo: any,
    params: CoreParams,
    onChange: AnyFunction,
    _onError?: AnyFunction,
  ): Promise<SubscriptionHandler> => {
    /* Each handle owns its callback, even when callers reuse the same function. */
    return addSubQueuer.run([dbo, params, (...args) => onChange(...args)]);
  };

  /**
   * Do NOT use concurrently
   */
  async function _addSub(
    dbo: any,
    params: CoreParams,
    onChange: AnyFunction,
  ): Promise<SubscriptionHandler> {
    const { tableName, command, param1, param2 } = params;
    const makeHandler = (channelName: string, unsubChannel: string) => {
      const unsubscribe = function () {
        return _unsubscribe(channelName, unsubChannel, onChange);
      };

      let subHandlers: any = { unsubscribe, filter: { ...param1 } };

      /* Some dbo sorting was done to make sure this will work */
      if (dbo[tableName].update) {
        subHandlers = {
          ...subHandlers,
          update: function (newData: AnyObject, updateParams: UpdateParams) {
            return dbo[tableName].update(param1, newData, updateParams);
          },
        };
      }
      if (dbo[tableName].delete) {
        subHandlers = {
          ...subHandlers,
          delete: function (deleteParams: DeleteParams) {
            return dbo[tableName].delete(param1, deleteParams);
          },
        };
      }
      return Object.freeze(subHandlers);
    };

    const existing = Array.from(subscriptions.entries()).find(([ch, s]) => {
      return (
        s.tableName === tableName &&
        s.command === command &&
        isEqual(s.param1 || {}, param1 || {}) &&
        isEqual(s.param2 || {}, param2 || {})
      );
    });

    if (existing) {
      const [existingChannel, existingSub] = existing;
      const { lastData } = existingSub;
      existingSub.handlers.push(onChange);
      try {
        await existingSub.onHandlersChanged();
      } catch (error) {
        await _unsubscribe(existingChannel, existingSub.unsubChannel, onChange);
        throw error;
      }
      if (lastData) {
        setTimeout(() => {
          if (existingSub.lastData === lastData && existingSub.handlers.includes(onChange)) {
            onChange(lastData);
          }
        }, 10);
      }
      return makeHandler(existingChannel, existingSub.unsubChannel);
    }

    if (!socket.connected) await new Promise<void>((resolve) => socket.once("connect", resolve));
    let attachedConnection: number | undefined = connectionVersion;
    const { channelName, channelNameReady, channelNameUnsubscribe } = await addServerSub(params);

    const onCall = function (subData: { data?: any; err?: any }) {
      /* TO DO: confirm receiving data or server will unsubscribe */
      // if(cb) cb(true);
      onDebug?.({
        type: "subscriptions",
        command: "onData",
        tableName,
        data: subData,
        channelName,
      });
      const sub = subscriptions.get(channelName);
      const { data, err } = subData as { data?: AnyObject[]; err?: any };
      if (sub) {
        if (data !== undefined || err !== undefined) {
          sub.lastData = data;
          sub.handlers.forEach((handler) => {
            if (err !== undefined) {
              console.error(`Error within running subscription \n ${channelName}`, err);
            }
            handler(data ?? [], err);
          });
        } else {
          console.error("INTERNAL ERROR: Unexpected data format from subscription: ", subData);
        }
      } else {
        console.warn("Orphaned subscription: ", channelName);
      }
    };

    const subscriptionUpdates = new FunctionQueuer(async (refresh: boolean) => {
      if (subscriptions.get(channelName) !== subscription) return;
      if (attachedConnection === connectionVersion && (refresh || !subscription.handlers.length)) {
        try {
          await sendSocketRequest(socket, channelNameUnsubscribe, {});
        } catch (error) {
          if (attachedConnection === connectionVersion) throw error;
        }
        attachedConnection = undefined;
      }
      /* Handlers can join or leave while the server acknowledges the unsubscribe. */
      if (!subscription.handlers.length) {
        subscriptions.delete(channelName);
        socket.removeListener(channelName, onCall);
      } else if (socket.connected && attachedConnection !== connectionVersion) {
        const registeringConnection = connectionVersion;
        await addServerSub(params);
        attachedConnection = registeringConnection;
        socket.emit(channelNameReady, { now: Date.now() });
      }
    });
    const subscription: Subscription = {
      lastData: undefined,
      tableName,
      command,
      param1,
      param2,
      onCall,
      unsubChannel: channelNameUnsubscribe,
      handlers: [onChange],
      reAttach: () => subscriptionUpdates.run([true]),
      onHandlersChanged: () => subscriptionUpdates.run([false]),
    };
    socket.on(channelName, onCall);
    subscriptions.set(channelName, subscription);
    socket.emit(channelNameReady, { now: Date.now() });
    return makeHandler(channelName, channelNameUnsubscribe);
  }

  /**
   * Reconnect all subscriptions
   * Used when connection is lost and re-established or schema changes
   */
  const reAttachAll = async () => {
    await onDebug?.({ type: "subscriptions", command: "reAttachAll.start", subscriptions });
    for await (const s of Array.from(subscriptions.values())) {
      try {
        await s.reAttach();
      } catch (err) {
        console.error("There was an issue reconnecting old subscriptions", err, s);
        s.onCall({ data: [], err });
      }
    }
    await onDebug?.({ type: "subscriptions", command: "reAttachAll.end", subscriptions });
  };

  return {
    addSub,
    subscriptions,
    addServerSub,
    _unsubscribe,
    reAttachAll,
  };
};
