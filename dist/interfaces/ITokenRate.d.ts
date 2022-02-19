import { ITokenDetail } from './ITokenDetail';
export interface ITokenRate extends ITokenDetail {
    ergPerToken: number;
    tokenPerErg: number;
    ergAmount: string;
    tokenAmount: string;
    timestamp: number;
    globalIndex: number;
}
