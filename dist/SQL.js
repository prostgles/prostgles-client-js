"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQL = void 0;
const prostgles_types_1 = require("prostgles-types");
class SQL {
    constructor() {
        this.notifSubs = {};
        this.removeNotifListener = (listener, conf, socket) => {
            const channelSubs = this.notifSubs[conf.notifChannel];
            if (channelSubs) {
                channelSubs.listeners = channelSubs.listeners.filter(nl => nl !== listener);
                if (!channelSubs.listeners.length && channelSubs.config.socketUnsubChannel && socket) {
                    socket.emit(channelSubs.config.socketUnsubChannel, {});
                    delete this.notifSubs[conf.notifChannel];
                }
            }
        };
        this.addNotifListener = (listener, conf, socket) => {
            var _a;
            const channelSubs = this.notifSubs[conf.notifChannel];
            if (!channelSubs) {
                this.notifSubs[conf.notifChannel] = {
                    config: conf,
                    listeners: [listener]
                };
                socket.removeAllListeners(conf.socketChannel);
                socket.on(conf.socketChannel, (notif) => {
                    var _a, _b;
                    if ((_a = this.notifSubs[conf.notifChannel]) === null || _a === void 0 ? void 0 : _a.listeners.length) {
                        this.notifSubs[conf.notifChannel].listeners.map(l => {
                            l(notif);
                        });
                    }
                    else {
                        socket.emit((_b = this.notifSubs[conf.notifChannel]) === null || _b === void 0 ? void 0 : _b.config.socketUnsubChannel, {});
                    }
                });
            }
            else {
                (_a = this.notifSubs[conf.notifChannel]) === null || _a === void 0 ? void 0 : _a.listeners.push(listener);
            }
        };
        this.removeNoticeListener = (listener, socket) => {
            if (this.noticeSubs) {
                this.noticeSubs.listeners = this.noticeSubs.listeners.filter(nl => nl !== listener);
                if (!this.noticeSubs.listeners.length && this.noticeSubs.config.socketUnsubChannel && socket) {
                    socket.emit(this.noticeSubs.config.socketUnsubChannel, {});
                }
            }
        };
        this.addNoticeListener = (listener, conf, socket) => {
            var _a;
            (_a = this.noticeSubs) !== null && _a !== void 0 ? _a : (this.noticeSubs = {
                config: conf,
                listeners: []
            });
            if (!this.noticeSubs.listeners.length) {
                socket.removeAllListeners(conf.socketChannel);
                socket.on(conf.socketChannel, (notice) => {
                    if (this.noticeSubs && this.noticeSubs.listeners.length) {
                        this.noticeSubs.listeners.map(l => {
                            l(notice);
                        });
                    }
                    else {
                        socket.emit(conf.socketUnsubChannel, {});
                    }
                });
            }
            this.noticeSubs.listeners.push(listener);
        };
        this.setup = async ({ socket, dbo }) => {
            const { removeNotifListener, addNotifListener, removeNoticeListener, addNoticeListener } = this;
            dbo.sql = function (query, params, options) {
                return new Promise((resolve, reject) => {
                    socket.emit(prostgles_types_1.CHANNELS.SQL, { query, params, options }, (err, res) => {
                        if (err)
                            reject(err);
                        else {
                            if ((options === null || options === void 0 ? void 0 : options.returnType) === "stream") {
                                const { channel, unsubChannel } = res;
                                const start = (listener) => new Promise((resolveStart, rejectStart) => {
                                    socket.on(channel, listener);
                                    socket.emit(channel, {}, (pid, err) => {
                                        if (err) {
                                            rejectStart(err);
                                            socket.removeAllListeners(channel);
                                        }
                                        else {
                                            resolveStart({
                                                pid,
                                                run: (query, params) => {
                                                    return new Promise((resolveRun, rejectRun) => {
                                                        socket.emit(channel, { query, params }, (data, _err) => {
                                                            if (_err) {
                                                                rejectRun(_err);
                                                            }
                                                            else {
                                                                resolveRun(data);
                                                            }
                                                        });
                                                    });
                                                },
                                                stop: (terminate) => {
                                                    return new Promise((resolveStop, rejectStop) => {
                                                        socket.emit(unsubChannel, { terminate }, (data, _err) => {
                                                            if (_err) {
                                                                rejectStop(_err);
                                                            }
                                                            else {
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
                                };
                                return resolve(streamHandlers);
                            }
                            else if (options &&
                                (options.returnType === "noticeSubscription") &&
                                res &&
                                Object.keys(res).sort().join() === ["socketChannel", "socketUnsubChannel"].sort().join() &&
                                !Object.values(res).find(v => typeof v !== "string")) {
                                const sockInfo = res;
                                const addListener = (listener) => {
                                    addNoticeListener(listener, sockInfo, socket);
                                    return {
                                        ...sockInfo,
                                        removeListener: () => removeNoticeListener(listener, socket)
                                    };
                                };
                                const handle = {
                                    ...sockInfo,
                                    addListener
                                };
                                // @ts-ignore
                                resolve(handle);
                            }
                            else if ((!options || !options.returnType || options.returnType !== "statement") &&
                                res &&
                                Object.keys(res).sort().join() === ["socketChannel", "socketUnsubChannel", "notifChannel"].sort().join() &&
                                !Object.values(res).find(v => typeof v !== "string")) {
                                const sockInfo = res;
                                const addListener = (listener) => {
                                    addNotifListener(listener, sockInfo, socket);
                                    return {
                                        ...res,
                                        removeListener: () => removeNotifListener(listener, sockInfo, socket)
                                    };
                                };
                                const handle = { ...res, addListener };
                                resolve(handle);
                            }
                            else {
                                resolve(res);
                            }
                        }
                    });
                });
            };
        };
    }
}
exports.SQL = SQL;
