import { ITokenDetail } from './ITokenDetail';

export interface ITokenRate extends ITokenDetail {
  // sigUSDPerToken: number;
  // tokenPerSigUSD: number;
  ergPerToken: number;
  tokenPerErg: number;
  timestamp: number; // Unix epoch is more efficient for storage than the ISO8601 and moment can keep it straight. Always work in UTC, only use locale on display.
}
