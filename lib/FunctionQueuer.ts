
type Func = (...args: any[]) => any;
export class FunctionQueuer<F extends Func> {
  private queue: { arguments: Parameters<F>; onResult: (result: ReturnType<F>) => void; onFail: (error: any) => void }[] = [];
  private func: F;
  private groupBy?: (args: Parameters<F>) => string;
  constructor(func: F, groupBy?: ((args: Parameters<F>) => string)) {
    this.func = func;
    this.groupBy = groupBy;
  }
  private isRunning = false;
  async run(args: Parameters<F>): Promise<ReturnType<F>> {

    const result = new Promise<ReturnType<F>>((resolve, reject) => {
      const item = { arguments: args, onResult: resolve, onFail: reject }
      this.queue.push(item);
    });

    const startQueueJob = async () => {
      if (this.isRunning) {
        return;
      }
      this.isRunning = true;

      const runItem = async (item: undefined | typeof this.queue[number]) => {
        if (item) {
          try {
            const result = await this.func(...item.arguments);
            item.onResult(result);
          } catch(error) {
            item.onFail(error);
          }
        }
      }

      if(!this.groupBy){
        const item = this.queue.shift();
        await runItem(item);

      /** Run items in parallel for each group */
      } else {
        type Item = typeof this.queue[number];
        const groups: string[] = [];
        const items: { index: number; item: Item; }[] = [];
        this.queue.forEach(async (item, index) => {
          const group = this.groupBy!(item.arguments);
          if(!groups.includes(group)){
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
    }

    startQueueJob();

    return result;

  }
}