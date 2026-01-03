type Func = (...args: any[]) => any;
type QueueItem<F extends Func> = {
  arguments: Parameters<F>;
  onResult: (result: ReturnType<F>) => void;
  onFail: (error: any) => void;
};
export class FunctionQueuer<F extends Func> {
  private queue: QueueItem<F>[] = [];
  private func: F;
  private groupBy?: (args: Parameters<F>) => string;
  constructor(func: F, groupBy?: (args: Parameters<F>) => string) {
    this.func = func;
    this.groupBy = groupBy;
  }
  private isRunning = false;
  async run(args: Parameters<F>): Promise<ReturnType<F>> {
    const result = new Promise<ReturnType<F>>((resolve, reject) => {
      const item = { arguments: args, onResult: resolve, onFail: reject };
      this.queue.push(item);
    });

    this.startQueueJob();

    return result;
  }

  startQueueJob = async () => {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;

    const executeItem = async (item: undefined | QueueItem<F>) => {
      if (!item) {
        return;
      }
      try {
        const result = await this.func(...item.arguments);
        item.onResult(result);
      } catch (error) {
        item.onFail(error);
      }
    };

    if (!this.groupBy) {
      const item = this.queue.shift();
      await executeItem(item);

      /** Run items in parallel for each group */
    } else {
      const groups = new Set<string>();
      const items: QueueItem<F>[] = [];
      this.queue.forEach((item) => {
        const group = this.groupBy!(item.arguments);
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
      await Promise.all(
        items.map((item) => {
          return executeItem(item);
        }),
      );
    }

    this.isRunning = false;
    if (this.queue.length) {
      this.startQueueJob();
    }
  };
}
