export interface SuiConfig {
  network: string;
  endpoint?: string;
}

export interface RetrievalOptions {
  timeout?: number;
  retries?: number;
}