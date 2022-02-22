import { AxiosRequestConfig } from 'axios';
import JSONBigInt from 'json-bigint';
import { ExplorerRequestManager } from './ExplorerRequestManager';
import { IAssetBalance, ITotalBalance } from './interfaces/explorer/IBalance';
import { IBox, ITimestampedBox } from './interfaces/explorer/IBox';
import { IAddressTokenAmounts } from './interfaces/IAddressTokenAmounts';
import { ITokenInfo } from './interfaces/ITokenInfo';
import { ITokenMarket } from './interfaces/ITokenMarket';
import { ITokenRate } from './interfaces/ITokenRate';
import { math, renderFractions } from './math';

export const PoolSample =
  '1999030f0400040204020404040405feffffffffffffffff0105feffffffffffffffff01050004d00f040004000406050005000580dac409d819d601b2a5730000d602e4c6a70404d603db63087201d604db6308a7d605b27203730100d606b27204730200d607b27203730300d608b27204730400d6099973058c720602d60a999973068c7205027209d60bc17201d60cc1a7d60d99720b720cd60e91720d7307d60f8c720802d6107e720f06d6117e720d06d612998c720702720fd6137e720c06d6147308d6157e721206d6167e720a06d6177e720906d6189c72117217d6199c72157217d1ededededededed93c27201c2a793e4c672010404720293b27203730900b27204730a00938c7205018c720601938c7207018c72080193b17203730b9593720a730c95720e929c9c721072117e7202069c7ef07212069a9c72137e7214067e9c720d7e72020506929c9c721372157e7202069c7ef0720d069a9c72107e7214067e9c72127e7202050695ed720e917212730d907216a19d721872139d72197210ed9272189c721672139272199c7216721091720b730e';
const JSONBI = JSONBigInt({ useNativeBigInt: true });

export const tokenSwapValueFromBox = (box: ITimestampedBox): ITokenRate => {
  const erg = { name: 'ERG', decimals: 9, amount: box.value };
  const token = box.assets[2];

  const ergAmount = renderFractions(box.value, 9);
  const tokenAmount = renderFractions(token.amount, token.decimals);
  const ergPerToken = math.evaluate?.(`${ergAmount} / ${tokenAmount}`).toFixed(erg.decimals ?? 0);
  const tokenPerErg = math.evaluate?.(`${tokenAmount} / ${ergAmount}`).toFixed(token.decimals ?? 0);
  const tokenInfo: ITokenInfo = {
    name: token.name,
    tokenId: token.tokenId,
    decimals: token.decimals,
  };
  return {
    timestamp: box.createdAt, // numerical timestamp
    ergPerToken,
    tokenPerErg,
    ergAmount,
    tokenAmount,
    token: tokenInfo,
    globalIndex: box.globalIndex,
  };
};

export type ExplorerTokenMarketConfig = {
  explorerUri?: string;
  defaultRetryCount?: number;
  defaultRetryWaitMillis?: number;
  throwOnError?: boolean;
  axiosInstanceConfig?: AxiosRequestConfig;
};

export class ExplorerTokenMarket implements ITokenMarket {
  private explorerHttpClient: ExplorerRequestManager;

  private explorerUri = 'https://api.ergoplatform.com';

  private defaultRetryCount = 5;

  private defaultRetryWaitMillis = 2000;

  private throwOnError = true;

  constructor(
    {
      explorerUri = 'https://api.ergoplatform.com',
      defaultRetryCount = 5,
      defaultRetryWaitMillis = 2000,
      throwOnError = true,
      axiosInstanceConfig = {},
    }: ExplorerTokenMarketConfig = {
      explorerUri: 'https://api.ergoplatform.com',
      defaultRetryCount: 5,
      defaultRetryWaitMillis: 2000,
      throwOnError: true,
      axiosInstanceConfig: {},
    }
  ) {
    this.explorerUri = explorerUri;
    this.defaultRetryCount = defaultRetryCount;
    this.defaultRetryWaitMillis = defaultRetryWaitMillis;
    this.throwOnError = throwOnError;

    this.explorerHttpClient = new ExplorerRequestManager(this.explorerUri, this.throwOnError, axiosInstanceConfig);
  }

  async getTransactionTimestamp(
    transactionId: string,
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<number | undefined> {
    const transaction = await this.explorerHttpClient.requestWithRetries<{ timestamp: number }>(
      {
        url: `/api/v1/transactions/${transactionId}`,
        params: {},
        transformResponse: (data) => JSONBI.parse(data),
      },
      numberOfTimesToRetry,
      retryWaitTime
    );
    return transaction?.timestamp;
  }

  async getBoxesAtUri(
    uriForBoxes: string,
    numberToRetrieve = 500,
    initialOffset = 0,
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<IBox[]> {
    let boxItems: IBox[] = [];
    for (let numberLeftToRetrieve = numberToRetrieve; numberLeftToRetrieve > 0; ) {
      const nextBoxItems = await this.explorerHttpClient.requestWithRetries<{ items: IBox[] }>(
        {
          url: uriForBoxes,
          params: {
            limit: Math.min(500, numberLeftToRetrieve),
            offset: initialOffset + (numberToRetrieve - numberLeftToRetrieve),
          },
          transformResponse: (data) => JSONBI.parse(data),
        },
        numberOfTimesToRetry,
        retryWaitTime
      );
      if (nextBoxItems === undefined || nextBoxItems.items.length < 1) break;
      boxItems = boxItems.concat(nextBoxItems?.items);
      numberLeftToRetrieve -= Math.min(500, numberLeftToRetrieve);
    }

    if (boxItems === undefined) return []; // Failed to retrieve values, we got nothin to give back.
    return boxItems;
  }

  async makeChunkedRequests<T>(
    requestConfigs: AxiosRequestConfig<T>[],
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis,
    chunkSize = 100
  ): Promise<T[]> {
    const responseItems: T[] = [];
    for (let requestConfigChunk = 0; requestConfigChunk < requestConfigs.length; requestConfigChunk += 100) {
      await Promise.all(
        new Array(chunkSize).fill(0).map(async (blank, index) => {
          const configIndex = requestConfigChunk + index;
          if (configIndex >= requestConfigs.length) return;
          const currentConfig = requestConfigs[configIndex];
          const currentResponse = await this.explorerHttpClient.requestWithRetries<T>(
            currentConfig,
            numberOfTimesToRetry,
            retryWaitTime
          );
          if (currentResponse !== undefined) responseItems.push(currentResponse);
        })
      );
    }
    return responseItems;
  }

  async getTimestampsForBoxes(boxesWithoutCreationDates: IBox[]): Promise<ITimestampedBox[]> {
    const transactionRequests = boxesWithoutCreationDates.map((box) => ({
      url: `/api/v1/transactions/${box.transactionId}`,
      params: {},
      transformResponse: (data: any) => {
        const tx: any = JSONBI.parse(data);
        (box as ITimestampedBox).createdAt = tx.timestamp;
        return box;
      },
    }));

    const boxesOverTime = await this.makeChunkedRequests<ITimestampedBox>(transactionRequests);
    return boxesOverTime.sort((a, b) => ((a.createdAt as any) > (b.createdAt as any) ? 1 : -1));
  }

  async getTimestampedBoxesFromBoxes(
    boxesToTimestamp: IBox[],
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<ITimestampedBox[]> {
    const boxesWithCreationDatesRequest = boxesToTimestamp.map((box) => ({
      url: `/api/v1/transactions/${box.transactionId}`,
      params: {},
      transformResponse: (data: any) => {
        const tx: any = JSONBI.parse(data);
        (box as ITimestampedBox).createdAt = tx.timestamp;
        return box;
      },
    }));

    const boxesWithSpendDatesRequest = boxesToTimestamp
      .filter((box) => box.spentTransactionId?.length)
      .map((box) => ({
        url: `/api/v1/transactions/${box.spentTransactionId}`,
        params: {},
        transformResponse: (data: any) => {
          const tx: any = JSONBI.parse(data);
          box.spentAt = tx.timestamp;
          return box;
        },
      }));

    const boxesWithCreation = (
      await this.makeChunkedRequests<ITimestampedBox>(
        boxesWithCreationDatesRequest,
        numberOfTimesToRetry,
        retryWaitTime
      )
    ).sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    await this.makeChunkedRequests<ITimestampedBox>(boxesWithSpendDatesRequest, numberOfTimesToRetry, retryWaitTime); // Adds spentAt to boxes in the transform response defined above
    return boxesWithCreation;
  }

  async getBalanceTimelineAtAddress(
    address: string,
    numberToRetrieve = 500,
    initialOffset = 0,
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<any[]> {
    const allBoxesForAddress = await this.getBoxesAtUri(
      `/api/v1/boxes/byAddress/${address}`,
      numberToRetrieve,
      initialOffset,
      numberOfTimesToRetry,
      retryWaitTime
    );
    const timestampedBoxes = await this.getTimestampedBoxesFromBoxes(
      allBoxesForAddress,
      numberOfTimesToRetry,
      retryWaitTime
    );

    const creditBoxToBalance = (
      boxToDebit: IBox,
      tokenBalances: { [key: string]: number }
    ): { [key: string]: number } => {
      tokenBalances.nergs = tokenBalances.nergs || 0;
      tokenBalances.nergs += boxToDebit.value || 0;
      boxToDebit.assets.forEach((assetToDebit) => {
        tokenBalances[assetToDebit.tokenId] = tokenBalances[assetToDebit.tokenId] || 0;
        tokenBalances[assetToDebit.tokenId] += assetToDebit.amount;
      });
      return tokenBalances;
    };

    const debitBoxFromBalance = (
      boxToDebit: IBox,
      tokenBalances: { [key: string]: number }
    ): { [key: string]: number } => {
      tokenBalances.nergs = tokenBalances.nergs || 0;
      tokenBalances.nergs -= boxToDebit.value || 0;
      boxToDebit.assets.forEach((assetToDebit) => {
        tokenBalances[assetToDebit.tokenId] = tokenBalances[assetToDebit.tokenId] || 0;
        tokenBalances[assetToDebit.tokenId] -= assetToDebit.amount;
      });
      return tokenBalances;
    };

    let balancesOverTime: { tokenBalances: { [key: string]: number }; box: ITimestampedBox; timestamp: number }[] = [];
    timestampedBoxes.forEach((box) => {
      const tokenBalances = {};
      creditBoxToBalance(box, tokenBalances);
      balancesOverTime.push({ tokenBalances: {}, timestamp: box.createdAt, box });
      box.spentAt && balancesOverTime.push({ tokenBalances: {}, timestamp: box?.spentAt as number, box });
    });

    timestampedBoxes.forEach((box, boxIdx) => {
      const creditBegins = box.createdAt;
      const creditEnds = box.spentAt || Number.MAX_SAFE_INTEGER;
      balancesOverTime.forEach((boxToCreditOrDebit) => {
        if (boxToCreditOrDebit.timestamp >= creditBegins) {
          creditBoxToBalance(box, boxToCreditOrDebit.tokenBalances);
        }
        if (boxToCreditOrDebit.timestamp >= creditEnds) {
          debitBoxFromBalance(box, boxToCreditOrDebit.tokenBalances);
        }
      });
    });

    balancesOverTime = balancesOverTime.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
    return balancesOverTime;
  }

  async getHistoricalTokenRates(
    numberToRetrieve = 500,
    initialOffset = 0,
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<ITokenRate[]> {
    const ergoPoolBoxes = await this.getBoxesAtUri(
      `/api/v1/boxes/byErgoTree/${PoolSample}`,
      numberToRetrieve,
      initialOffset,
      numberOfTimesToRetry,
      retryWaitTime
    );
    const timestampedBoxes = await this.getTimestampsForBoxes(ergoPoolBoxes);
    const result = timestampedBoxes.map(tokenSwapValueFromBox);
    return result;
  }

  async getTokenRates(
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<ITokenRate[]> {
    const boxItems = await this.explorerHttpClient.requestWithRetries<{ items: IBox[] }>(
      {
        url: `/api/v1/boxes/unspent/byErgoTree/${PoolSample}`,
        params: { limit: 100, offset: 0 },
        transformResponse: (data) => JSONBI.parse(data),
      },
      numberOfTimesToRetry,
      retryWaitTime
    );

    const timestampedBoxes = await this.getTimestampedBoxesFromBoxes(boxItems?.items || []);

    if (boxItems === undefined) return []; // Failed to retrieve values, we got nothin to give back.

    // Deduplicating the tokens because only the first box per token presents an accurate valuation with the dex
    return Object.values(
      timestampedBoxes.reduce((acc: any, box) => {
        const { tokenId } = box.assets[2];
        if (acc[tokenId] === undefined) acc[tokenId] = tokenSwapValueFromBox(box);
        return acc;
      }, {})
    );
  }

  multiplyFractions(amountA: number, decimalsA: number, amountB: number, decimalsB: number) {
    const amountAFraction = renderFractions(amountA, decimalsA);
    const amountBFraction = renderFractions(amountB, decimalsB);
    return math.evaluate?.(`${amountAFraction} * ${amountBFraction}`).toFixed();
  }

  decorateTokenAmountsWithValues(value: ITokenRate, tokenAmountsMap: IAddressTokenAmounts) {
    const tokenBalance = tokenAmountsMap[value.token.tokenId];
    if (tokenBalance === undefined) return; // they don't have this token in their wallet
    const {
      token: { decimals: tokenDecimals },
    } = value;

    tokenBalance.confirmed.valueInErgs = this.multiplyFractions(
      tokenBalance.confirmed.amount,
      tokenDecimals,
      value.ergPerToken,
      0
    );
    tokenBalance.unconfirmed.valueInErgs = this.multiplyFractions(
      tokenBalance.unconfirmed.amount,
      tokenDecimals,
      value.ergPerToken,
      0
    );
    tokenBalance.total.valueInErgs = this.multiplyFractions(
      tokenBalance.total.amount,
      tokenDecimals,
      value.ergPerToken,
      0
    );

    // eslint-disable-next-line no-param-reassign
    tokenAmountsMap[value.token.tokenId].value = value;
  }

  async getTokenBalanceByAddress(
    address: string,
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<IAddressTokenAmounts | undefined> {
    const balances = await this.explorerHttpClient.requestWithRetries<ITotalBalance>(
      {
        url: `/api/v1/addresses/${address}/balance/total`,
        transformResponse: (data) => JSONBI.parse(data),
      },
      numberOfTimesToRetry,
      retryWaitTime
    );

    if (balances === undefined) return undefined; // Failed to retrieve values, we got nothin to give back.

    const tokenAmountsMap: IAddressTokenAmounts = {};
    balances.confirmed.tokens.forEach((token: IAssetBalance) => {
      tokenAmountsMap[token.tokenId] = {
        token,
        confirmed: {
          amount: token.amount,
        },
        unconfirmed: { amount: 0 },
        total: {
          amount: token.amount,
        },
      };
    });
    balances.unconfirmed.tokens.forEach((token: IAssetBalance) => {
      const curToken = tokenAmountsMap[token.tokenId] || { token, confirmed: { amount: 0 }, total: { amount: 0 } };
      curToken.unconfirmed = { amount: token.amount };
      curToken.confirmed = curToken.confirmed || { token, amount: 0 };
      curToken.total.amount = curToken.confirmed.amount + curToken.unconfirmed.amount;
    });

    const tokenSwapValues = await this.getTokenRates();
    tokenSwapValues?.forEach((value) => this.decorateTokenAmountsWithValues(value, tokenAmountsMap));

    return tokenAmountsMap;
  }

  async getTokenInfoById(
    tokenId: string,
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<ITokenInfo> {
    const token = await this.explorerHttpClient.requestWithRetries<{ items: IBox[] }>(
      {
        url: `/api/v1/tokens/${tokenId}`,
        params: { limit: 100, offset: 0 },
        transformResponse: (data) => JSONBI.parse(data),
      },
      numberOfTimesToRetry,
      retryWaitTime
    );

    if (token === undefined) return undefined as any; // Failed to retrieve values, we got nothin to give back.

    return token as any;
  }

  async getSwappableTokens(): Promise<ITokenInfo[]> {
    return (await this.getTokenRates()).map((swapValue) => swapValue.token);
  }

  async getTokenRateFor(tokenIds: string[]): Promise<ITokenRate[]> {
    const tokenRates = await this.getTokenRates();
    return tokenRates.filter((rate) => tokenIds.includes(rate.token.tokenId));
  }
}
