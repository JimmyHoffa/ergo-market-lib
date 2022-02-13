import { ITokenDetail } from './ITokenDetail';
import { ITokenRate } from './ITokenRate';

export interface ITokenValue {
  amount: number;
  valueInErgs?: number;
}

export interface ITokenBalance extends ITokenDetail {
  confirmed: ITokenValue;
  unconfirmed: ITokenValue;
  total: ITokenValue;
  value?: ITokenRate;
}
