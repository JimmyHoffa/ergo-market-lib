import { ITokenDetail } from './ITokenDetail';
export interface ITokenRate extends ITokenDetail {
    ergPerToken: number;
    tokenPerErg: number;
    ergAmount: BigInt;
    tokenAmount: BigInt;
    timestamp: number;
}
