"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionQueuer = void 0;
class FunctionQueuer {
    constructor(func, groupBy) {
        this.queue = [];
        this.isRunning = false;
        this.startQueueJob = async () => {
            if (this.isRunning) {
                return;
            }
            this.isRunning = true;
            const executeItem = async (item) => {
                if (!item) {
                    return;
                }
                try {
                    const result = await this.func(...item.arguments);
                    item.onResult(result);
                }
                catch (error) {
                    item.onFail(error);
                }
            };
            if (!this.groupBy) {
                const item = this.queue.shift();
                await executeItem(item);
                /** Run items in parallel for each group */
            }
            else {
                const groups = new Set();
                const items = [];
                this.queue.forEach((item) => {
                    const group = this.groupBy(item.arguments);
                    if (!groups.has(group)) {
                        groups.add(group);
                        items.push(item);
                    }
                });
                items
                    .slice(0)
                    .reverse()
                    .forEach((item) => {
                    this.queue.splice(this.queue.indexOf(item), 1);
                });
                await Promise.all(items.map((item) => {
                    return executeItem(item);
                }));
            }
            this.isRunning = false;
            if (this.queue.length) {
                this.startQueueJob();
            }
        };
        this.func = func;
        this.groupBy = groupBy;
    }
    async run(args) {
        const result = new Promise((resolve, reject) => {
            const item = { arguments: args, onResult: resolve, onFail: reject };
            this.queue.push(item);
        });
        this.startQueueJob();
        return result;
    }
}
exports.FunctionQueuer = FunctionQueuer;
