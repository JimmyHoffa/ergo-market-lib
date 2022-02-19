import JSONBigInt from 'json-bigint';
import { ExplorerTokenMarket } from './ExplorerTokenMarket';
import { tokenSwapValuesExample } from './ExplorerTokenMarket.test.samples';

const JSONBI = JSONBigInt({ useNativeBigInt: true });
jest.setTimeout(200000);
describe('getHistoricalTokenRates', () => {
  it('should return an empty array when it cant retrieve data', async () => {
    const expectedSwapValues: any[] = [];
    const tokenSwapMarketRepo = new ExplorerTokenMarket({ explorerUri: 'http://test.example.com', defaultRetryCount: 1, defaultRetryWaitMillis: 150, throwOnError: false, axiosInstanceConfig: { timeout: 100 }});
    
    const actualSwapValues = await tokenSwapMarketRepo.getHistoricalTokenRates(2000);

    expect(actualSwapValues).toEqual(expectedSwapValues);
  });
  it('should return less than 500 historical token rates succesfully in order', async () => {
    jest.setTimeout(200000);
    const expectedTokenRateCount = 40;
    const tokenSwapMarketRepo = new ExplorerTokenMarket();
    const actualSwapValues = await tokenSwapMarketRepo.getHistoricalTokenRates(expectedTokenRateCount, 23000);

    expect(actualSwapValues.length).toBe(expectedTokenRateCount);
    expect(actualSwapValues[0].ergPerToken).toBeDefined();
    expect(actualSwapValues[0].tokenPerErg).toBeDefined();
    expect(actualSwapValues[0].ergAmount).toBeDefined();
    expect(actualSwapValues[0].tokenAmount).toBeDefined();
    expect(actualSwapValues[0].token).toBeDefined();
    expect(actualSwapValues[0].timestamp).toBeDefined();
    actualSwapValues.forEach((tokenRate, index) => {
      const nextTokenRate = actualSwapValues[index+1];
      // console.log('CHECCCC', tokenRate, nextTokenRate);
      if (nextTokenRate === undefined) return;
      expect(tokenRate.timestamp).toBeLessThanOrEqual(nextTokenRate.timestamp);
    })
    jest.setTimeout(5000);
  });
  it('should return over 500 historical token rates succesfully in order', async () => {
    jest.setTimeout(200000);
    const expectedTokenRateCount = 501;
    const tokenSwapMarketRepo = new ExplorerTokenMarket();
    const actualSwapValues = await tokenSwapMarketRepo.getHistoricalTokenRates(expectedTokenRateCount);

    expect(actualSwapValues.length).toBe(expectedTokenRateCount);
    expect(actualSwapValues[0].ergPerToken).toBeDefined();
    expect(actualSwapValues[0].tokenPerErg).toBeDefined();
    expect(actualSwapValues[0].ergAmount).toBeDefined();
    expect(actualSwapValues[0].tokenAmount).toBeDefined();
    expect(actualSwapValues[0].token).toBeDefined();
    expect(actualSwapValues[0].timestamp).toBeDefined();
    actualSwapValues.forEach((tokenRate, index) => {
      const nextTokenRate = actualSwapValues.length < index+1 ? actualSwapValues[index+1] : undefined;
      if (nextTokenRate === undefined) return;
      expect(tokenRate.timestamp).toBeLessThanOrEqual(nextTokenRate.timestamp);
    })
    jest.setTimeout(5000);
  });
  it('should return 1222 historical token rates succesfully in order', async () => {
    jest.setTimeout(200000);
    const expectedTokenRateCount = 1222;
    const tokenSwapMarketRepo = new ExplorerTokenMarket();
    const actualSwapValues = await tokenSwapMarketRepo.getHistoricalTokenRates(expectedTokenRateCount);

    expect(actualSwapValues.length).toBe(expectedTokenRateCount);
    expect(actualSwapValues[0].ergPerToken).toBeDefined();
    expect(actualSwapValues[0].tokenPerErg).toBeDefined();
    expect(actualSwapValues[0].ergAmount).toBeDefined();
    expect(actualSwapValues[0].tokenAmount).toBeDefined();
    expect(actualSwapValues[0].token).toBeDefined();
    expect(actualSwapValues[0].timestamp).toBeDefined();
    actualSwapValues.forEach((tokenRate, index) => {
      const nextTokenRate = actualSwapValues.length < index+1 ? actualSwapValues[index+1] : undefined;
      if (nextTokenRate === undefined) return;
      expect(tokenRate.timestamp).toBeLessThanOrEqual(nextTokenRate.timestamp);
    })
    jest.setTimeout(5000);
  });
  // it('should return first and second historical token rates succesfully in order', async () => {
  //   jest.setTimeout(200000);
  //   const expectedTokenRateCount = 1;
  //   const tokenSwapMarketRepo = new ExplorerTokenMarket();
  //   const expectedSecondGlobalIndex = 7043807;
  //   const firstActualSwapValue = await tokenSwapMarketRepo.getHistoricalTokenRates(expectedTokenRateCount, 0);
  //   const secondActualSwapValue = await tokenSwapMarketRepo.getHistoricalTokenRates(expectedTokenRateCount, 1);

  //   expect(firstActualSwapValue.length).toBe(expectedTokenRateCount);
  //   expect(secondActualSwapValue.length).toBe(expectedTokenRateCount);
  //   expect(firstActualSwapValue[0].ergPerToken).toBeDefined();
  //   expect(secondActualSwapValue[0].ergPerToken).toBeDefined();
  //   expect(firstActualSwapValue[0].tokenPerErg).toBeDefined();
  //   expect(secondActualSwapValue[0].tokenPerErg).toBeDefined();
  //   expect(firstActualSwapValue[0].ergAmount).toBeDefined();
  //   expect(secondActualSwapValue[0].ergAmount).toBeDefined();
  //   expect(firstActualSwapValue[0].tokenAmount).toBeDefined();
  //   expect(secondActualSwapValue[0].tokenAmount).toBeDefined();
  //   expect(firstActualSwapValue[0].token).toBeDefined();
  //   expect(secondActualSwapValue[0].token).toBeDefined();
  //   expect(firstActualSwapValue[0].timestamp).toBeDefined();
  //   expect(secondActualSwapValue[0].timestamp).toBeDefined();
  //   expect(firstActualSwapValue[0].globalIndex).toBeLessThan(secondActualSwapValue[0].globalIndex);
  //   jest.setTimeout(5000);
  // });
});

describe('getTokenRates', () => {
  it('should return an empty array when it cant retrieve data', async () => {
    const expectedSwapValues: any[] = [];
    const tokenSwapMarketRepo = new ExplorerTokenMarket({ explorerUri: 'http://test.example.com', defaultRetryCount: 1, defaultRetryWaitMillis: 150, throwOnError: false, axiosInstanceConfig: { timeout: 100 }});
    
    const actualSwapValues = await tokenSwapMarketRepo.getTokenRates();

    expect(actualSwapValues).toEqual(expectedSwapValues);
  });
  it('should return token swap values succesfully', async () => {
    jest.setTimeout(20000);
    const expectedSwapValues = tokenSwapValuesExample;
    const tokenSwapMarketRepo = new ExplorerTokenMarket();
    const actualSwapValues = await tokenSwapMarketRepo.getTokenRates();

    expect(actualSwapValues.length).toBeGreaterThanOrEqual(expectedSwapValues.length);
    expect(actualSwapValues[0].ergPerToken).toBeDefined();
    expect(actualSwapValues[0].tokenPerErg).toBeDefined();
    expect(actualSwapValues.map((value) => value.token)).toContainEqual(expectedSwapValues[0].token);
    jest.setTimeout(5000);
  });
});

describe('getTokenInfoById', () => {
  it('should return undefined when it cant retrieve data', async () => {
    const expectedTokenData = undefined;
    const tokenSwapMarketRepo = new ExplorerTokenMarket({ explorerUri: 'http://test.example.com', defaultRetryCount: 1, defaultRetryWaitMillis: 150, throwOnError: false, axiosInstanceConfig: { timeout: 100 }});
    const actualTokenData = await tokenSwapMarketRepo.getTokenInfoById('asdf');

    expect(actualTokenData).toEqual(expectedTokenData);
  });
  it('should return neta data for neta tokenId', async () => {
    jest.setTimeout(20000);
    const expectedTokenData = {
      boxId: '12ba7cb7c13f738ae3a5be2b353774bc3eb8f0ef72933a839907cbdcb046af9a',
      decimals: 6,
      description: '',
      emissionAmount: 1000000000000000n,
      id: '472c3d4ecaa08fb7392ff041ee2e6af75f4a558810a74b28600549d5392810e8',
      name: 'NETA',
      type: 'EIP-004',
    };
    const tokenSwapMarketRepo = new ExplorerTokenMarket();
    const actualTokenData = await tokenSwapMarketRepo.getTokenInfoById(
      '472c3d4ecaa08fb7392ff041ee2e6af75f4a558810a74b28600549d5392810e8'
    );

    jest.setTimeout(5000);
    expect(actualTokenData).toEqual(expectedTokenData);
  });
});

describe('getTokenBalanceByAddress', () => {
  it('should return undefined when it cant retrieve data', async () => {
    const expectedTokenData = undefined;
    const tokenSwapMarketRepo = new ExplorerTokenMarket({ explorerUri: 'http://test.example.com', defaultRetryCount: 1, defaultRetryWaitMillis: 150, throwOnError: false, axiosInstanceConfig: { timeout: 100 }});
    const actualTokenData = await tokenSwapMarketRepo.getTokenBalanceByAddress('asdf');

    expect(actualTokenData).toEqual(expectedTokenData);
  });
  it('should return wallet values for tokens in address', async () => {
    jest.setTimeout(20000);

    const tokenSwapMarketRepo = new ExplorerTokenMarket();
    const tokenValueForAddress = await tokenSwapMarketRepo.getTokenBalanceByAddress(
      '9gzfBJLomCgKk5dgpo5nboEb4aLZtJ9gGsv5TmzcnNSS1ou4ADn'
    );

    jest.setTimeout(5000);
  });
});
