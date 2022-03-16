export declare class ProducerConsumerActionQueue {
    private delayMillis;
    private concurrentActionCount;
    private actionQueue;
    private executingNow;
    constructor(delayMillis?: number, concurrentActionCount?: number);
    stopProcessingQueue(): void;
    startProcessingQueue(): Promise<void>;
    push<T>(action: () => Promise<T>): Promise<T>;
}
