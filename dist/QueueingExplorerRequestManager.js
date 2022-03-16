"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueingExplorerRequestManager = void 0;
const ExplorerRequestManager_1 = require("./ExplorerRequestManager");
const ProducerConsumerActionQueue_1 = require("./ProducerConsumerActionQueue");
class QueueingExplorerRequestManager {
    actionQueue;
    requestManager;
    constructor(actionQueue = new ProducerConsumerActionQueue_1.ProducerConsumerActionQueue(), explorerRequestConfig) {
        this.actionQueue = actionQueue;
        this.requestManager = new ExplorerRequestManager_1.ExplorerRequestManager(explorerRequestConfig);
    }
    async requestWithRetries(config, retriesLeft) {
        return this.actionQueue.push(async () => this.requestManager.requestWithRetries(config, retriesLeft));
    }
}
exports.QueueingExplorerRequestManager = QueueingExplorerRequestManager;
//# sourceMappingURL=QueueingExplorerRequestManager.js.map