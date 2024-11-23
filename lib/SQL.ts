import { CHANNELS, type DBEventHandles, type DBNoticeConfig, type DBNotifConfig, type SocketSQLStreamClient, type SocketSQLStreamServer } from "prostgles-types";
import type { DBHandlerClient } from "./prostgles";

type Args = {
  socket: any;
  dbo: Partial<DBHandlerClient<void>>;
}
export class SQL {

  notifSubs: {
    [key: string]: {
      config: DBNotifConfig
      listeners: ((notif: any) => void)[]
    }
  } = {};
  removeNotifListener = (listener: any, conf: DBNotifConfig, socket: any) => {
    const channelSubs = this.notifSubs[conf.notifChannel]
    if (channelSubs) {
      channelSubs.listeners = channelSubs.listeners.filter(nl => nl !== listener);
      if (!channelSubs.listeners.length && channelSubs.config.socketUnsubChannel && socket) {
        socket.emit(channelSubs.config.socketUnsubChannel, {});
        delete this.notifSubs[conf.notifChannel];
      }
    }
  };
  addNotifListener = (listener: any, conf: DBNotifConfig, socket: any) => {
    const channelSubs = this.notifSubs[conf.notifChannel]
    if (!channelSubs) {
      this.notifSubs[conf.notifChannel] = {
        config: conf,
        listeners: [listener]
      };
      socket.removeAllListeners(conf.socketChannel);
      socket.on(conf.socketChannel, (notif: any) => {
        if (this.notifSubs[conf.notifChannel]?.listeners.length) {
          this.notifSubs[conf.notifChannel]!.listeners.map(l => {
            l(notif);
          })
        } else {
          socket.emit(this.notifSubs[conf.notifChannel]?.config.socketUnsubChannel, {});
        }
      });

    } else {
      this.notifSubs[conf.notifChannel]?.listeners.push(listener);
    }
  };


  noticeSubs: {
    listeners: ((notice: any) => void)[];
    config: DBNoticeConfig;
  } | undefined;
  removeNoticeListener = (listener: any, socket: any) => {
    if (this.noticeSubs) {
      this.noticeSubs.listeners = this.noticeSubs.listeners.filter(nl => nl !== listener);
      if (!this.noticeSubs.listeners.length && this.noticeSubs.config.socketUnsubChannel && socket) {
        socket.emit(this.noticeSubs.config.socketUnsubChannel, {});
      }
    }
  }
  addNoticeListener = (listener: any, conf: DBNoticeConfig, socket: any) => {
    this.noticeSubs ??= {
      config: conf,
      listeners: []
    };

    if (!this.noticeSubs.listeners.length) {
      socket.removeAllListeners(conf.socketChannel);
      socket.on(conf.socketChannel, (notice: any) => {
        if (this.noticeSubs && this.noticeSubs.listeners.length) {
          this.noticeSubs.listeners.map(l => {
            l(notice);
          })
        } else {
          socket.emit(conf.socketUnsubChannel, {});
        }
      });
    }
    this.noticeSubs.listeners.push(listener);
  }
  setup = async ({ socket, dbo }: Args) => {
    const { removeNotifListener, addNotifListener, removeNoticeListener, addNoticeListener } = this;
    dbo.sql = function (query, params, options) {
      return new Promise((resolve, reject) => {
        socket.emit(CHANNELS.SQL, { query, params, options }, (err, res) => {
          if (err) reject(err);
          else {
            if(options?.returnType === "stream"){
              const { channel, unsubChannel } = res as SocketSQLStreamServer;
              const start: SocketSQLStreamClient["start"] = (listener) => new Promise<Awaited<ReturnType<SocketSQLStreamClient["start"]>>>((resolveStart, rejectStart) => {
                socket.on(channel, listener)
                socket.emit(channel, {}, (pid: number, err) => {
                  if(err){
                    rejectStart(err);
                    socket.removeAllListeners(channel);
                  } else {
                    resolveStart({
                      pid,
                      run: (query, params) => {
                        return new Promise((resolveRun, rejectRun) => {
                          socket.emit(channel, { query, params }, (data, _err) => {
                            if(_err){
                              rejectRun(_err);
                            } else {
                              resolveRun(data);
                            }
                          });
                        });
                      },
                      stop: (terminate?: boolean) => {
                        return new Promise((resolveStop, rejectStop) => {
                          socket.emit(unsubChannel, { terminate }, (data, _err) => {
                            if(_err){
                              rejectStop(_err);
                            } else {
                              resolveStop(data);
                            }
                          });
                        });
                      }
                    });
                  }
                });
              });
              const streamHandlers = {
                channel,
                unsubChannel,
                start,
              } satisfies SocketSQLStreamClient;

              return resolve(streamHandlers as any);
            } else if (options &&
              (options.returnType === "noticeSubscription") &&
              res &&
              Object.keys(res).sort().join() === ["socketChannel", "socketUnsubChannel"].sort().join() &&
              !Object.values(res).find(v => typeof v !== "string")
            ) {
              const sockInfo: DBNoticeConfig = res;
              const addListener = (listener: (arg: any) => void) => {
                addNoticeListener(listener, sockInfo, socket);
                return {
                  ...sockInfo,
                  removeListener: () => removeNoticeListener(listener, socket)
                }
              };
              const handle: DBEventHandles = {
                ...sockInfo,
                addListener
              };
              // @ts-ignore
              resolve(handle);
            } else if (
              (!options || !options.returnType || options.returnType !== "statement") &&
              res &&
              Object.keys(res).sort().join() === ["socketChannel", "socketUnsubChannel", "notifChannel"].sort().join() &&
              !Object.values(res).find(v => typeof v !== "string")
            ) {
              const sockInfo: DBNotifConfig = res;
              const addListener = (listener: (arg: any) => void) => {
                addNotifListener(listener, sockInfo, socket)
                return {
                  ...res,
                  removeListener: () => removeNotifListener(listener, sockInfo, socket)
                }
              }
              const handle: DBEventHandles = { ...res, addListener };
              resolve(handle as any);

            } else {
              resolve(res);
            }
          }
        });
      });
    }
  }
}