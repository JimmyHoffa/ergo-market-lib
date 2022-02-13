export interface IAssetBalance {
  tokenId: string;
  amount: number;
  decimals: number;
  name: string;
  tokenType: string;
}

export interface IBalance {
  nanoErgs: number;
  tokens: IAssetBalance[];
}

export interface ITotalBalance {
  confirmed: IBalance;
  unconfirmed: IBalance;
}
