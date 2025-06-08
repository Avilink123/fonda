// API Configuration for ForexAI Platform
// This file will contain all API configurations for Perplexity AI and FRED

export const API_CONFIG = {
  // Perplexity AI Configuration
  PERPLEXITY: {
    BASE_URL: 'https://api.perplexity.ai',
    MODEL: 'llama-3.1-sonar-small-128k-online', // Cost-effective model for forex analysis
    MAX_TOKENS: 4000,
    TEMPERATURE: 0.2, // Lower temperature for more factual financial analysis
    ENDPOINTS: {
      CHAT: '/chat/completions',
      SEARCH: '/search'
    }
  },

  // FRED Economic Data Configuration  
  FRED: {
    BASE_URL: 'https://api.stlouisfed.org/fred',
    ENDPOINTS: {
      SERIES: '/series/observations',
      RELEASES: '/releases',
      CATEGORIES: '/category/series'
    },
    // Key economic indicators for forex analysis
    INDICATORS: {
      // US Economic Indicators
      US_INTEREST_RATE: 'FEDFUNDS',
      US_INFLATION: 'CPIAUCSL',
      US_GDP: 'GDP',
      US_UNEMPLOYMENT: 'UNRATE',
      US_RETAIL_SALES: 'RSAFS',
      
      // European Indicators  
      EU_INTEREST_RATE: 'ECBREFI',
      EU_INFLATION: 'EA19CPHAINMEI',
      EU_GDP: 'CLVMNACSCAB1GQEA19',
      
      // UK Indicators
      UK_INTEREST_RATE: 'INTDSRUKM193N',
      UK_INFLATION: 'GBRCPIALLMINMEI',
      
      // Japan Indicators
      JP_INTEREST_RATE: 'JPNINTDSGDPM193N',
      JP_INFLATION: 'JPNCPIALLMINMEI',
      
      // Canada Indicators
      CA_INTEREST_RATE: 'INTDSRCAM193N',
      CA_INFLATION: 'CANCPIALLMINMEI',
      
      // Australia Indicators
      AU_INTEREST_RATE: 'INTDSRAUQ193N',
      AU_INFLATION: 'AUSCPIALLQINMEI'
    }
  },

  // Rate Limiting Configuration
  RATE_LIMITS: {
    PERPLEXITY_REQUESTS_PER_MINUTE: 20,
    FRED_REQUESTS_PER_HOUR: 120,
    CACHE_DURATION_MINUTES: 15
  },

  // AI Analysis Prompts for Forex
  PROMPTS: {
    DAILY_RECAP: `Analyze today's forex market movements focusing on major currency pairs (EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD). 
    Include: 1) Key economic events impact, 2) Central bank policy implications, 3) Market sentiment, 4) Technical outlook. 
    Respond in French, keep analysis concise and actionable for forex traders.`,
    
    CURRENCY_ANALYSIS: (currency) => `Provide comprehensive fundamental analysis for ${currency}. 
    Cover: 1) Current monetary policy, 2) Economic indicators (inflation, GDP, employment), 3) Political stability, 
    4) Trade balance, 5) Market sentiment. Give a rating (BUY/SELL/HOLD) with confidence percentage. 
    Respond in French, be specific about key support/resistance levels.`,
    
    DEEP_RESEARCH: (topic) => `Conduct deep research on ${topic} and its impact on forex markets. 
    Analyze historical correlations, current market dynamics, and provide forward-looking insights. 
    Include specific trading recommendations for major currency pairs. Respond in French.`
  }
};

// Helper functions for API calls (to be implemented when API keys are provided)
export const apiHelpers = {
  // Perplexity AI helper
  callPerplexityAI: async (prompt, apiKey) => {
    // This will be implemented when API key is provided
    console.log('Perplexity AI call would be made with:', prompt);
    return null;
  },

  // FRED data helper
  getFredData: async (indicator, apiKey, startDate = null, endDate = null) => {
    // This will be implemented when API key is provided
    console.log('FRED API call would be made for:', indicator);
    return null;
  },

  // Cache management
  cacheData: (key, data, durationMinutes = 15) => {
    const expiry = new Date().getTime() + (durationMinutes * 60 * 1000);
    localStorage.setItem(key, JSON.stringify({ data, expiry }));
  },

  getCachedData: (key) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, expiry } = JSON.parse(cached);
    if (new Date().getTime() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  }
};

export default API_CONFIG;