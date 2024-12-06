import { CHANNELS, type AnyObject, type DeleteParams, type SubscriptionChannels, type SubscriptionHandler, type UpdateParams } from "prostgles-types";
import { debug, isEqual, type AnyFunction, type CoreParams, type InitOptions } from "./prostgles";
import { FunctionQueuer } from "./FunctionQueuer";

type Subscription = CoreParams & {
  lastData: any;
  onCall: AnyFunction,
  handlers: AnyFunction[];
  errorHandlers: (AnyFunction | undefined)[];
  unsubChannel: string;
  reAttach: () => Promise<void>;
};

type Subscriptions = {
  [key: string]: Subscription
};

const preffix = CHANNELS._preffix;

export const getSubscriptionHandler = (initOpts: Pick<InitOptions, "socket" | "onDebug">) => {
  const { socket, onDebug, } = initOpts;

  const subscriptions: Subscriptions = {};

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
  }

  function _unsubscribe(channelName: string, unsubChannel: string, handler: AnyFunction, onDebug: InitOptions["onDebug"]): Promise<true> {
    debug("_unsubscribe", { channelName, handler });

    return new Promise((resolve, reject) => {
      const sub = subscriptions[channelName];
      if (sub) {
        sub.handlers = sub.handlers.filter(h => h !== handler);
        if (!sub.handlers.length) {
          onDebug?.({ type: "table", command: "unsubscribe", tableName: sub.tableName });
          removeServerSub(unsubChannel);
          socket.removeListener(channelName, sub.onCall);
          delete subscriptions[channelName];

          /* Not waiting for server confirmation to speed things up */
          resolve(true)
        } else {
          onDebug?.({ type: "table", command: "unsubscribe", tableName: sub.tableName, unsubChannel });
          resolve(true)
        }
      } else {
        resolve(true)
      }
    });
  }


  /**
   * Obtaines subscribe channel from server
   */
  function addServerSub({ tableName, command, param1, param2 }: CoreParams): Promise<SubscriptionChannels> {
    return new Promise((resolve, reject) => {
      socket.emit(preffix, { tableName, command, param1, param2 }, (err?: any, res?: SubscriptionChannels) => {
        if (err) {
          console.error(err);
          reject(err);
        } else if (res) {
          resolve(res);
        }
      });
    });
  }


  /**
   * Can be used concurrently
   */
  const addSubQueuer = new FunctionQueuer(_addSub, ([_, { tableName }]) => tableName);
  const addSub = async (dbo: any, params: CoreParams, onChange: AnyFunction, _onError?: AnyFunction): Promise<SubscriptionHandler> => { 
    return addSubQueuer.run([dbo, params, onChange, _onError]);
  }

  /**
   * Do NOT use concurrently
   */
  async function _addSub(dbo: any, { tableName, command, param1, param2 }: CoreParams, onChange: AnyFunction, _onError?: AnyFunction): Promise<SubscriptionHandler> {

    const makeHandler = (channelName: string, unsubChannel: string) => {

      const unsubscribe = function () {
        return _unsubscribe(channelName, unsubChannel, onChange, onDebug);
      }

      let subHandlers: any = { unsubscribe, filter: { ...param1 } }

      /* Some dbo sorting was done to make sure this will work */
      if (dbo[tableName].update) {
        subHandlers = {
          ...subHandlers,
          update: function (newData: AnyObject, updateParams: UpdateParams) {
            return dbo[tableName].update(param1, newData, updateParams);
          }
        }
      }
      if (dbo[tableName].delete) {
        subHandlers = {
          ...subHandlers,
          delete: function (deleteParams: DeleteParams) {
            return dbo[tableName].delete(param1, deleteParams);
          }
        }
      }
      return Object.freeze(subHandlers);
    }

    const existing = Object.entries(subscriptions).find(([ch, s]) => {
      return (
        s.tableName === tableName &&
        s.command === command &&
        isEqual(s.param1 || {}, param1 || {}) &&
        isEqual(s.param2 || {}, param2 || {})
      );
    });

    if (existing) {
      const existingCh = existing[0];
      existing[1].handlers.push(onChange);
      existing[1].errorHandlers.push(_onError);
      setTimeout(() => {
        if (subscriptions[existingCh]?.lastData) {
          onChange(subscriptions[existingCh]?.lastData)
        }
      }, 10)
      return makeHandler(existingCh, existing[1].unsubChannel);
    }

    const { channelName, channelNameReady, channelNameUnsubscribe } = await addServerSub({ tableName, command, param1, param2 })

    const onCall = function (data: any) {
      /* TO DO: confirm receiving data or server will unsubscribe */
      // if(cb) cb(true);
      const sub = subscriptions[channelName];
      if (sub) {
        if (data.data) {
          sub.lastData = data.data;
          sub.handlers.forEach(h => {
            h(data.data);
          });
        } else if (data.err) {
          sub.errorHandlers.forEach(h => {
            h?.(data.err);
          });
        } else {
          console.error("INTERNAL ERROR: Unexpected data format from subscription: ", data)
        }
      } else {
        console.warn("Orphaned subscription: ", channelName)
      }
    }
    const onError = _onError || function (err: any) { console.error(`Uncaught error within running subscription \n ${channelName}`, err) }

    socket.on(channelName, onCall);
    subscriptions[channelName] = {
      lastData: undefined,
      tableName,
      command,
      param1,
      param2,
      onCall,
      unsubChannel: channelNameUnsubscribe,
      handlers: [onChange],
      errorHandlers: [onError],
      reAttach: async () => {
        await removeServerSub(channelNameUnsubscribe).catch(console.error);
        await addServerSub({ tableName, command, param1, param2 });
        socket.emit(channelNameReady, { now: Date.now() });
      }
    }
    socket.emit(channelNameReady, { now: Date.now() });
    return makeHandler(channelName, channelNameUnsubscribe);
  }

  /**
   * Reconnect all subscriptions
   * Used when connection is lost and re-established or schema changes
   */
  const reAttachAll = async () => {
    for await (const s of Object.values(subscriptions)) {
      try {
        await s.reAttach();
      } catch (err) {
        console.error("There was an issue reconnecting old subscriptions", err, s)
        Object.values(s.errorHandlers).forEach(h => h?.(err));
      }
    }
  }

  return {
    addSub,
    subscriptions,
    addServerSub,
    _unsubscribe,
    reAttachAll,
  }
}