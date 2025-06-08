// ForexAI Services - Ready for Perplexity AI and FRED Integration
import { API_CONFIG, apiHelpers } from './apiConfig';

class ForexAIService {
  constructor() {
    this.perplexityApiKey = process.env.REACT_APP_PERPLEXITY_API_KEY;
    this.fredApiKey = process.env.REACT_APP_FRED_API_KEY;
    this.isInitialized = true;
    
    if (this.perplexityApiKey && this.perplexityApiKey !== 'placeholder_for_perplexity_key') {
      console.log('🤖 ForexAI Service initialized with Perplexity AI');
    }
  }

  // Check if service is ready
  isReady() {
    return this.perplexityApiKey && this.perplexityApiKey !== 'placeholder_for_perplexity_key';
  }

  // Check if FRED is ready
  isFredReady() {
    return this.fredApiKey && this.fredApiKey !== 'placeholder_for_fred_key';
  }

  // Generate Daily Market Recap using Perplexity AI
  async generateDailyRecap() {
    if (!this.isReady()) {
      // Return mock data when APIs not ready
      return this.getMockDailyRecap();
    }

    try {
      // Get latest economic data from FRED
      const economicData = await this.getLatestEconomicData();
      
      // Create comprehensive prompt for Perplexity AI
      const prompt = this.buildDailyRecapPrompt(economicData);
      
      // Call Perplexity AI for analysis
      const aiAnalysis = await this.callPerplexityAI(prompt);
      
      return this.formatDailyRecap(aiAnalysis, economicData);
    } catch (error) {
      console.error('Error generating daily recap:', error);
      return this.getMockDailyRecap();
    }
  }

  // Generate Currency Analysis using AI + Economic Data
  async generateCurrencyAnalysis(currency) {
    if (!this.isReady()) {
      return this.getMockCurrencyAnalysis(currency);
    }

    try {
      // Get specific economic indicators for the currency
      const indicators = await this.getCurrencyIndicators(currency);
      
      // Build analysis prompt
      const prompt = this.buildCurrencyAnalysisPrompt(currency, indicators);
      
      // Get AI analysis
      const aiAnalysis = await this.callPerplexityAI(prompt);
      
      return this.formatCurrencyAnalysis(currency, aiAnalysis, indicators);
    } catch (error) {
      console.error(`Error analyzing ${currency}:`, error);
      return this.getMockCurrencyAnalysis(currency);
    }
  }

  // Deep Research using Perplexity AI
  async conductDeepResearch(topic) {
    if (!this.isReady()) {
      return this.getMockResearchData(topic);
    }

    try {
      const prompt = API_CONFIG.PROMPTS.DEEP_RESEARCH(topic);
      const research = await this.callPerplexityAI(prompt);
      return this.formatResearchResults(research);
    } catch (error) {
      console.error('Error conducting deep research:', error);
      return this.getMockResearchData(topic);
    }
  }

  // Private Methods

  async callPerplexityAI(prompt) {
    const response = await fetch(API_CONFIG.PERPLEXITY.BASE_URL + API_CONFIG.PERPLEXITY.ENDPOINTS.CHAT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: API_CONFIG.PERPLEXITY.MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a professional forex analyst with expertise in fundamental analysis. Provide accurate, actionable insights in French.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        max_tokens: API_CONFIG.PERPLEXITY.MAX_TOKENS,
        temperature: API_CONFIG.PERPLEXITY.TEMPERATURE
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async getFredData(indicator, startDate = null, endDate = null) {
    const url = new URL(API_CONFIG.FRED.BASE_URL + API_CONFIG.FRED.ENDPOINTS.SERIES);
    url.searchParams.append('series_id', indicator);
    url.searchParams.append('api_key', this.fredApiKey);
    url.searchParams.append('file_type', 'json');
    
    if (startDate) url.searchParams.append('observation_start', startDate);
    if (endDate) url.searchParams.append('observation_end', endDate);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status}`);
    }

    return await response.json();
  }

  async getLatestEconomicData() {
    const indicators = [
      'FEDFUNDS', 'CPIAUCSL', 'UNRATE', // US data
      'ECBREFI', 'EA19CPHAINMEI', // EU data
      'JPNINTDSGDPM193N', 'GBRCPIALLMINMEI' // Japan, UK data
    ];

    const data = {};
    for (const indicator of indicators) {
      try {
        data[indicator] = await this.getFredData(indicator);
      } catch (error) {
        console.error(`Error fetching ${indicator}:`, error);
      }
    }

    return data;
  }

  async getCurrencyIndicators(currency) {
    const indicatorMap = {
      'USD': ['FEDFUNDS', 'CPIAUCSL', 'UNRATE', 'GDP'],
      'EUR': ['ECBREFI', 'EA19CPHAINMEI'],
      'GBP': ['INTDSRUKM193N', 'GBRCPIALLMINMEI'],
      'JPY': ['JPNINTDSGDPM193N', 'JPNCPIALLMINMEI'],
      'CAD': ['INTDSRCAM193N', 'CANCPIALLMINMEI'],
      'AUD': ['INTDSRAUQ193N', 'AUSCPIALLQINMEI'],
      'CHF': ['INTDSRCHM193N'] // Swiss indicators
    };

    const indicators = indicatorMap[currency] || [];
    const data = {};

    for (const indicator of indicators) {
      try {
        data[indicator] = await this.getFredData(indicator);
      } catch (error) {
        console.error(`Error fetching ${indicator} for ${currency}:`, error);
      }
    }

    return data;
  }

  buildDailyRecapPrompt(economicData) {
    return `${API_CONFIG.PROMPTS.DAILY_RECAP}
    
Données économiques récentes:
${JSON.stringify(economicData, null, 2)}

Analyse ces données et fournis un récapitulatif quotidien complet du marché forex.`;
  }

  buildCurrencyAnalysisPrompt(currency, indicators) {
    return `${API_CONFIG.PROMPTS.CURRENCY_ANALYSIS(currency)}
    
Indicateurs économiques pour ${currency}:
${JSON.stringify(indicators, null, 2)}

Fournis une analyse fondamentale complète de cette devise.`;
  }

  // Mock Data Methods (used when APIs not available)
  getMockDailyRecap() {
    return {
      date: new Date().toLocaleDateString('fr-FR'),
      summary: "Les marchés forex montrent une volatilité accrue suite aux dernières déclarations de la BCE concernant l'inflation dans la zone euro. L'EUR/USD maintient une tendance haussière modérée.",
      keyPoints: [
        {
          title: "BCE maintient ses taux directeurs",
          impact: "positif",
          description: "La Banque Centrale Européenne a maintenu ses taux d'intérêt à 4.25%, conformément aux attentes du marché."
        },
        {
          title: "Dollar américain sous pression",
          impact: "négatif",
          description: "Le DXY recule de 0.3% face aux incertitudes sur la politique monétaire de la Fed."
        },
        {
          title: "Livre sterling en hausse",
          impact: "positif",
          description: "GBP/USD gagne 0.45% grâce aux données d'inflation britanniques favorables."
        }
      ],
      aiInsights: {
        sentiment: "Optimiste modéré",
        confidence: 78,
        mainTrend: "Affaiblissement du Dollar US face aux devises européennes",
        recommendation: "Surveiller les annonces Fed de mercredi pour confirmation de tendance"
      }
    };
  }

  getMockCurrencyAnalysis(currency) {
    const mockData = {
      EUR: {
        fundamentalScore: 78,
        technicalScore: 65,
        sentiment: "Haussier modéré",
        aiRating: "ACHAT",
        confidence: 76,
        forecast: "L'Euro devrait maintenir sa trajectoire haussière face au Dollar US, soutenu par une politique monétaire BCE équilibrée et des fondamentaux économiques solides."
      },
      USD: {
        fundamentalScore: 72,
        technicalScore: 58,
        sentiment: "Baissier léger",
        aiRating: "NEUTRE",
        confidence: 68,
        forecast: "Le Dollar US fait face à des vents contraires à court terme, mais reste soutenu par des fondamentaux économiques solides à long terme."
      },
      GBP: {
        fundamentalScore: 71,
        technicalScore: 73,
        sentiment: "Haussier",
        aiRating: "ACHAT",
        confidence: 73,
        forecast: "La Livre Sterling bénéficie d'une politique monétaire ferme de la BoE et d'une amélioration des relations commerciales post-Brexit."
      }
    };

    return mockData[currency] || mockData.USD;
  }

  getMockResearchData(topic) {
    return {
      topic,
      summary: `Recherche approfondie sur ${topic} et son impact sur les marchés forex.`,
      keyFindings: [
        "Impact historique significatif sur la volatilité des devises",
        "Corrélations fortes avec les politiques des banques centrales",
        "Implications pour les stratégies de trading à moyen terme"
      ],
      tradingRecommendations: [
        "Surveiller les niveaux de support/résistance clés",
        "Utiliser une gestion de risque stricte",
        "Considérer les hedges sur positions longues"
      ],
      confidence: 82
    };
  }

  formatDailyRecap(aiAnalysis, economicData) {
    // Format AI analysis into structured daily recap
    return {
      date: new Date().toLocaleDateString('fr-FR'),
      summary: aiAnalysis,
      economicData: economicData,
      timestamp: new Date().toISOString()
    };
  }

  formatCurrencyAnalysis(currency, aiAnalysis, indicators) {
    // Format AI analysis into structured currency analysis
    return {
      currency,
      analysis: aiAnalysis,
      indicators: indicators,
      timestamp: new Date().toISOString()
    };
  }

  formatResearchResults(research) {
    // Format research results
    return {
      research,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const forexAIService = new ForexAIService();

export default forexAIService;