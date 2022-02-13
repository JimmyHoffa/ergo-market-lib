import { IAddressTokenAmounts } from './IAddressTokenAmounts';
import { ITokenInfo } from './ITokenInfo';
import { ITokenRate } from './ITokenRate';
export interface ITokenMarket {
    getSwappableTokens(): Promise<ITokenInfo[]>;
    getTokenRates(): Promise<ITokenRate[]>;
    getTokenRateFor(tokenIds: string[]): Promise<ITokenRate[]>;
    getTokenBalanceByAddress(address: string): Promise<IAddressTokenAmounts | undefined>;
}
