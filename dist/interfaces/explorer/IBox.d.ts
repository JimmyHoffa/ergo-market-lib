import { IAsset } from './IAsset';
export interface IBox {
    value: number;
    assets: IAsset[];
    transactionId: string;
    spentTransactionId: string;
    globalIndex: number;
}
