import { IAsset } from './IAsset';

export interface IBox {
  value: number;
  assets: IAsset[];
  transactionId: string;
  spentTransactionId: string;
  globalIndex: number;
  spentAt?: number;
  boxId: string;
}

export interface ITimestampedBox extends IBox {
  createdAt: number;
}
