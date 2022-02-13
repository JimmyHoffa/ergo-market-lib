import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import JSONBigInt from 'json-bigint';

export class ExplorerRequestManager {
  private JSONBI = JSONBigInt({ useNativeBigInt: true });

  private explorerHttpClient: AxiosInstance;

  constructor(
    private explorerUri: string = 'https://api.ergoplatform.com',
    private throwOnError = true,
    axiosInstanceConfig: AxiosRequestConfig = {}
  ) {
    this.explorerHttpClient = axios.create({
      baseURL: explorerUri,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
      ...axiosInstanceConfig,
    });
  }

  async requestWithRetries<T>(
    config: AxiosRequestConfig<T>,
    retriesLeft = 5,
    retryWaitTime = 2000,
    throwOnError = this.throwOnError
  ): Promise<T | undefined> {
    try {
      const { data } = await this.explorerHttpClient.request<T, AxiosResponse<T>, T>(config);
      return data;
    } catch (ex) {
      if (retriesLeft < 1) {
        if (throwOnError) throw ex;
        return undefined;
      }
      console.log('EX occurred on axios request, retry...');
      return new Promise<T | undefined>((res) => {
        setTimeout(() => res(this.requestWithRetries<T>(config, retriesLeft - 1)), retryWaitTime);
      });
    }
  }
}
