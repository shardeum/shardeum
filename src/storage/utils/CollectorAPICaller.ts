import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class CollectorApiCaller {
  private axiosInstance: AxiosInstance;
  private maxRetries: number;

  constructor(baseURL: string, maxRetries: number = 3) {
    this.axiosInstance = axios.create({
      baseURL,
    });
    this.maxRetries = maxRetries;
  }

  private async request<T>(config: AxiosRequestConfig, retries = 0): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request(config);
      return response.data;
    } catch (error: any) {
      if (retries < this.maxRetries) {
        return this.request<T>(config, retries + 1);
      } else {
        throw new Error(error.response?.data?.error || error.message);
      }
    }
  }

  public get<T>(path: string, params?: any): Promise<T> {
    return this.request<T>({ url: path, method: 'GET', params });
  }

  public post<T>(path: string, data?: any): Promise<T> {
    return this.request<T>({ url: path, method: 'POST', data });
  }

  public put<T>(path: string, data?: any): Promise<T> {
    return this.request<T>({ url: path, method: 'PUT', data });
  }

  public delete<T>(path: string, params?: any): Promise<T> {
    return this.request<T>({ url: path, method: 'DELETE', params });
  }
}