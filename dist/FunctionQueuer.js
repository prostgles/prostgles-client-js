"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionQueuer = void 0;
class FunctionQueuer {
    constructor(func, groupBy) {
        this.queue = [];
        this.isRunning = false;
        this.func = func;
        this.groupBy = groupBy;
    }
    async run(args) {
        const result = new Promise((resolve, reject) => {
            const item = { arguments: args, onResult: resolve, onFail: reject };
            this.queue.push(item);
        });
        const startQueueJob = async () => {
            if (this.isRunning) {
                return;
            }
            this.isRunning = true;
            const runItem = async (item) => {
                if (item) {
                    try {
                        const result = await this.func(...item.arguments);
                        item.onResult(result);
                    }
                    catch (error) {
                        item.onFail(error);
                    }
                }
            };
            if (!this.groupBy) {
                const item = this.queue.shift();
                await runItem(item);
                /** Run items in parallel for each group */
            }
            else {
                const groups = [];
                const items = [];
                this.queue.forEach(async (item, index) => {
                    const group = this.groupBy(item.arguments);
                    if (!groups.includes(group)) {
                        groups.push(group);
                        items.push({ index, item });
                    }
                });
                items.slice(0).reverse().forEach((item) => {
                    this.queue.splice(item.index, 1);
                });
                await Promise.all(items.map(item => {
                    return runItem(item.item);
                }));
            }
            this.isRunning = false;
            if (this.queue.length) {
                startQueueJob();
            }
        };
        startQueueJob();
        return result;
    }
}
exports.FunctionQueuer = FunctionQueuer;
