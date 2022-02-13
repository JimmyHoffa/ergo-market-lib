// This will require understanding the transactions, matching them by time in the history or understanding the ergotree with the swap in it
// export interface ITokenSwap {
//   amountPaid: ITokenValue;
//   valuePaid: ITokenSwapValue;
//   amountReceived: ITokenValue;
//   valueReceived: ITokenSwapValue;
// }

import { IAddressTokenAmounts } from './IAddressTokenAmounts';
import { ITokenInfo } from './ITokenInfo';
import { ITokenRate } from './ITokenRate';

export interface ITokenMarket {
  getSwappableTokens(): Promise<ITokenInfo[]>;
  getTokenRates(): Promise<ITokenRate[]>;
  getTokenRateFor(tokenIds: string[]): Promise<ITokenRate[]>;
  getTokenBalanceByAddress(address: string): Promise<IAddressTokenAmounts | undefined>;
  // getSwappableTokenMarketCaps(): Promise<ITokenSwapValue[]>; // Implementation pending endpoint on explorer presenting total circulating token amount
}
