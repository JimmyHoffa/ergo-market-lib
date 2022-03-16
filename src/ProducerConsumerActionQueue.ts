export class ProducerConsumerActionQueue {
  private actionQueue: (() => Promise<void>)[] = [];

  private executingNow = false;

  /* eslint-disable-next-line no-useless-constructor */
  constructor(private delayMillis: number = 10, private concurrentActionCount = 1) {}

  stopProcessingQueue(): void {
    this.executingNow = false;
  }

  async startProcessingQueue(): Promise<void> {
    if (this.executingNow) return;

    this.executingNow = true;

    while (this.executingNow) {
      const actionsToExecute = this.actionQueue.splice(0, this.concurrentActionCount);

      await Promise.all(actionsToExecute.map((action) => action()));
      await new Promise<void>((res) => {
        setTimeout(() => res(), this.delayMillis);
      });

      if (this.actionQueue.length < 1) this.executingNow = false;
    }
  }

  async push<T>(action: () => Promise<T>): Promise<T> {
    this.startProcessingQueue();
    return new Promise<T>((res, rej) => {
      this.actionQueue.push(async () => {
        try {
          const actionResult = await action();
          res(actionResult);
        } catch (ex) {
          rej(ex);
        }
      });
    });
  }
}
