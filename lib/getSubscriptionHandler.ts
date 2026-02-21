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

type OnChange = (data: AnyObject[], err?: any) => void;
export type Subscription = CoreParams & {
  lastData: any;
  onCall: (data: { data: AnyObject[]; err?: unknown }) => void;
  handlers: OnChange[];
  unsubChannel: string;
  reAttach: () => Promise<void>;
};

const preffix = CHANNELS._preffix;

export const getSubscriptionHandler = (initOpts: Pick<InitOptions, "socket" | "onDebug">) => {
  const { socket, onDebug } = initOpts;

  const subscriptions: Map<string, Subscription> = new Map();

  const removeServerSub = (unsubChannel: string) => {
    return new Promise((resolve, reject) => {
      socket.emit(unsubChannel, {}, (err: any, _res: any) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(_res);
        }
      });
    });
  };

  function _unsubscribe(
    channelName: string,
    unsubChannel: string,
    handler: AnyFunction,
  ): Promise<true> {
    debug("_unsubscribe", { channelName, handler });

    return new Promise((resolve) => {
      const sub = subscriptions.get(channelName);
      if (sub) {
        sub.handlers = sub.handlers.filter((h) => h !== handler);
        onDebug?.({
          type: "table",
          command: "unsubscribe",
          tableName: sub.tableName,
          unsubChannel,
          handlers: sub.handlers,
        });
        if (!sub.handlers.length) {
          removeServerSub(unsubChannel);
          socket.removeListener(channelName, sub.onCall);
          subscriptions.delete(channelName);

          /* Not waiting for server confirmation to speed things up */
          resolve(true);
        } else {
          resolve(true);
        }
      } else {
        resolve(true);
      }
    });
  }

  /**
   * Obtaines subscribe channel from server
   */
  function addServerSub({
    tableName,
    command,
    param1,
    param2,
  }: CoreParams): Promise<SubscriptionChannels> {
    return new Promise((resolve, reject) => {
      socket.emit(
        preffix,
        { tableName, command, param1, param2 },
        (err?: any, res?: SubscriptionChannels) => {
          if (err) {
            console.error(err);
            reject(err);
          } else if (res) {
            resolve(res);
          }
        },
      );
    });
  }

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
    return addSubQueuer.run([dbo, params, onChange]);
  };

  /**
   * Do NOT use concurrently
   */
  async function _addSub(
    dbo: any,
    { tableName, command, param1, param2 }: CoreParams,
    onChange: AnyFunction,
  ): Promise<SubscriptionHandler> {
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
      existingSub.handlers.push(onChange);
      setTimeout(() => {
        const sub = subscriptions.get(existingChannel);
        if (sub?.lastData) {
          onChange(sub.lastData);
        }
      }, 10);
      return makeHandler(existingChannel, existingSub.unsubChannel);
    }

    const { channelName, channelNameReady, channelNameUnsubscribe } = await addServerSub({
      tableName,
      command,
      param1,
      param2,
    });

    const onCall = function (subData: { data?: any; err?: any }) {
      /* TO DO: confirm receiving data or server will unsubscribe */
      // if(cb) cb(true);
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

    socket.on(channelName, onCall);
    subscriptions.set(channelName, {
      lastData: undefined,
      tableName,
      command,
      param1,
      param2,
      onCall,
      unsubChannel: channelNameUnsubscribe,
      handlers: [onChange],
      reAttach: async () => {
        await removeServerSub(channelNameUnsubscribe).catch(console.error);
        await addServerSub({ tableName, command, param1, param2 });
        socket.emit(channelNameReady, { now: Date.now() });
      },
    });
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
