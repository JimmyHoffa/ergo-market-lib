"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProducerConsumerActionQueue = void 0;
class ProducerConsumerActionQueue {
    delayMillis;
    concurrentActionCount;
    actionQueue = [];
    executingNow = false;
    /* eslint-disable-next-line no-useless-constructor */
    constructor(delayMillis = 10, concurrentActionCount = 1) {
        this.delayMillis = delayMillis;
        this.concurrentActionCount = concurrentActionCount;
    }
    stopProcessingQueue() {
        this.executingNow = false;
    }
    async startProcessingQueue() {
        if (this.executingNow)
            return;
        this.executingNow = true;
        while (this.executingNow) {
            const actionsToExecute = this.actionQueue.splice(0, this.concurrentActionCount);
            // console.log('Going now...', { toExec: actionsToExecute.length, queued: this.actionQueue.length });
            await Promise.all(actionsToExecute.map((action) => action()));
            await new Promise((res) => {
                setTimeout(() => res(), this.delayMillis);
            });
            if (this.actionQueue.length < 1)
                this.executingNow = false;
        }
    }
    async push(action) {
        this.startProcessingQueue();
        return new Promise((res, rej) => {
            this.actionQueue.push(async () => {
                try {
                    const actionResult = await action();
                    res(actionResult);
                }
                catch (ex) {
                    rej(ex);
                }
            });
        });
    }
}
exports.ProducerConsumerActionQueue = ProducerConsumerActionQueue;
//# sourceMappingURL=ProducerConsumerActionQueue.js.map