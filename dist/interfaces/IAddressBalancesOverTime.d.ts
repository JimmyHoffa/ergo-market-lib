import { IAddressTokenAmounts } from './IAddressTokenAmounts';
export interface IAddressTokenBalanceAtTime {
    timestamp: number;
    tokenAmounts: IAddressTokenAmounts;
}
export interface IAddressTokenBalancesOverTime {
    [key: string]: IAddressTokenBalanceAtTime[];
}
