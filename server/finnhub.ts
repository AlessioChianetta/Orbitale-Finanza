// Finnhub API integration for financial data
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd19251hr01qkcat5jen0d19251hr01qkcat5jeng';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export interface SearchResult {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
}

export interface Quote {
  c: number; // Current price
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

class FinnhubService {
  private async makeRequest(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
    url.searchParams.append('token', FINNHUB_API_KEY);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log(`Calling Finnhub API: ${url.toString()}`);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status} ${response.statusText}`);
      throw new Error(`Finnhub API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Finnhub response:`, data);
    return data;
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    try {
      const data = await this.makeRequest('/search', { q: query });
      return data.result || [];
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    try {
      const data = await this.makeRequest('/quote', { symbol });
      return data;
    } catch (error) {
      console.error(`Error getting quote for ${symbol}:`, error);
      return null;
    }
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    try {
      const data = await this.makeRequest('/stock/profile2', { symbol });
      return data;
    } catch (error) {
      console.error(`Error getting company profile for ${symbol}:`, error);
      return null;
    }
  }

  async getCryptoQuote(symbol: string): Promise<Quote | null> {
    try {
      // For crypto, we need to format the symbol correctly (e.g., BTCUSD)
      const cryptoSymbol = symbol.includes('USD') ? symbol : `${symbol}USD`;
      const data = await this.makeRequest('/crypto/candle', { 
        symbol: `BINANCE:${cryptoSymbol}`,
        resolution: 'D',
        from: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        to: Math.floor(Date.now() / 1000)
      });
      
      if (data.s === 'ok' && data.c && data.c.length > 0) {
        const lastIndex = data.c.length - 1;
        return {
          c: data.c[lastIndex], // Current (last close)
          h: data.h[lastIndex], // High
          l: data.l[lastIndex], // Low
          o: data.o[lastIndex], // Open
          pc: lastIndex > 0 ? data.c[lastIndex - 1] : data.o[lastIndex], // Previous close
          t: data.t[lastIndex] // Timestamp
        };
      }
      return null;
    } catch (error) {
      console.error(`Error getting crypto quote for ${symbol}:`, error);
      return null;
    }
  }

  async getForexQuote(symbol: string): Promise<Quote | null> {
    try {
      // For forex, format as OANDA:EUR_USD
      const forexSymbol = symbol.includes('_') ? symbol : `${symbol}_USD`;
      const data = await this.makeRequest('/forex/candle', { 
        symbol: `OANDA:${forexSymbol}`,
        resolution: 'D',
        from: (Math.floor(Date.now() / 1000) - 86400).toString(),
        to: Math.floor(Date.now() / 1000).toString()
      });
      
      if (data.s === 'ok' && data.c && data.c.length > 0) {
        const lastIndex = data.c.length - 1;
        return {
          c: data.c[lastIndex],
          h: data.h[lastIndex],
          l: data.l[lastIndex],
          o: data.o[lastIndex],
          pc: lastIndex > 0 ? data.c[lastIndex - 1] : data.o[lastIndex],
          t: data.t[lastIndex]
        };
      }
      return null;
    } catch (error) {
      console.error(`Error getting forex quote for ${symbol}:`, error);
      return null;
    }
  }

  // Get price for any type of instrument
  async getPrice(symbol: string, type: 'stock' | 'crypto' | 'forex' | 'etf' = 'stock'): Promise<number | null> {
    try {
      let quote: Quote | null = null;
      
      switch (type) {
        case 'crypto':
          quote = await this.getCryptoQuote(symbol);
          break;
        case 'forex':
          quote = await this.getForexQuote(symbol);
          break;
        case 'stock':
        case 'etf':
        default:
          quote = await this.getQuote(symbol);
          break;
      }
      
      return quote ? quote.c : null;
    } catch (error) {
      console.error(`Error getting price for ${symbol}:`, error);
      return null;
    }
  }
}

export const finnhubService = new FinnhubService();