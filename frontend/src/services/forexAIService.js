// ForexAI Services - Ready for Perplexity AI and FRED Integration
import { API_CONFIG, apiHelpers } from './apiConfig';

class ForexAIService {
  constructor() {
    this.perplexityApiKey = process.env.REACT_APP_PERPLEXITY_API_KEY;
    this.fredApiKey = process.env.REACT_APP_FRED_API_KEY;
    this.isInitialized = true;
    
    // Scheduled report times (GMT)
    this.reportTimes = [
      { hour: 7, minute: 0, name: "Ouverture Européenne" },   // 7:00 AM GMT
      { hour: 12, minute: 0, name: "Ouverture Américaine" },  // 12:00 PM GMT  
      { hour: 17, minute: 0, name: "Récap de Fin de Journée" } // 5:00 PM GMT
    ];
    
    if (this.perplexityApiKey && this.perplexityApiKey !== 'placeholder_for_perplexity_key') {
      console.log('🤖 ForexAI Service initialized with Perplexity AI');
      console.log('⏰ Scheduled reports: 7:00, 12:00, 17:00 GMT');
    }
  }

  // Check if we should generate a new report based on time
  shouldGenerateNewReport() {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    // Check if we're within 30 minutes of any scheduled report time
    for (const reportTime of this.reportTimes) {
      const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (reportTime.hour * 60 + reportTime.minute));
      if (timeDiff <= 30) { // Within 30 minutes window
        return { should: true, session: reportTime.name };
      }
    }
    
    return { should: false, session: null };
  }

  // Get the last cached report or determine if we need a new one
  getLastReportInfo() {
    const cached = localStorage.getItem('forexai_daily_report');
    if (!cached) return { needsGeneration: true, lastReport: null };
    
    try {
      const data = JSON.parse(cached);
      const reportDate = new Date(data.timestamp);
      const now = new Date();
      
      // Check if report is from today
      const isToday = reportDate.toDateString() === now.toDateString();
      
      if (!isToday) {
        return { needsGeneration: true, lastReport: null };
      }
      
      // Check if we're in a generation window and haven't generated for this time slot
      const generationCheck = this.shouldGenerateNewReport();
      if (generationCheck.should) {
        const reportHour = reportDate.getUTCHours();
        const currentTimeSlot = this.getCurrentTimeSlot();
        
        // If the cached report is not from the current time slot, generate new one
        if (this.getReportTimeSlot(reportHour) !== currentTimeSlot) {
          return { needsGeneration: true, lastReport: data };
        }
      }
      
      return { needsGeneration: false, lastReport: data };
      
    } catch (error) {
      console.error('Error parsing cached report:', error);
      return { needsGeneration: true, lastReport: null };
    }
  }

  // Get current time slot (0, 1, or 2)
  getCurrentTimeSlot() {
    const hour = new Date().getUTCHours();
    if (hour >= 7 && hour < 12) return 0;  // Morning slot
    if (hour >= 12 && hour < 17) return 1; // Afternoon slot
    if (hour >= 17 || hour < 7) return 2;  // Evening slot
    return 0;
  }

  // Get time slot for a given hour
  getReportTimeSlot(hour) {
    if (hour >= 7 && hour < 12) return 0;
    if (hour >= 12 && hour < 17) return 1;
    if (hour >= 17 || hour < 7) return 2;
    return 0;
  }

  // Get next report time
  getNextReportTime() {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    for (const reportTime of this.reportTimes) {
      const reportMinutes = reportTime.hour * 60 + reportTime.minute;
      const currentMinutes = currentHour * 60 + currentMinute;
      
      if (reportMinutes > currentMinutes) {
        return `${reportTime.hour.toString().padStart(2, '0')}:${reportTime.minute.toString().padStart(2, '0')} GMT (${reportTime.name})`;
      }
    }
    
    // If no more reports today, next is tomorrow at 7:00
    return "07:00 GMT demain (Ouverture Européenne)";
  }

  // Check if FRED is ready
  isFredReady() {
    return this.fredApiKey && this.fredApiKey !== 'placeholder_for_fred_key';
  }

  // Check if service is ready
  isReady() {
    return this.perplexityApiKey && this.perplexityApiKey !== 'placeholder_for_perplexity_key';
  }

  // Generate Daily Market Recap using Perplexity AI + FRED Data (Scheduled)
  async generateDailyRecap() {
    if (!this.isReady()) {
      console.log('⚠️ Perplexity API not ready, using mock data');
      return this.getMockDailyRecap();
    }

    // Check if we need to generate a new report
    const reportInfo = this.getLastReportInfo();
    
    if (!reportInfo.needsGeneration && reportInfo.lastReport) {
      console.log('📋 Using cached report from:', new Date(reportInfo.lastReport.timestamp).toLocaleString());
      return reportInfo.lastReport;
    }

    // Check if we're in a generation window
    const generationCheck = this.shouldGenerateNewReport();
    if (!generationCheck.should) {
      console.log('⏰ Hors créneau de génération. Dernier rapport disponible');
      
      // Always return the last available report with timing info
      if (reportInfo.lastReport) {
        reportInfo.lastReport.nextGeneration = this.getNextReportTime();
        reportInfo.lastReport.isScheduled = true;
        reportInfo.lastReport.status = "Rapport précédent";
        return reportInfo.lastReport;
      } else {
        const mockData = this.getMockDailyRecap();
        mockData.summary = `Le premier rapport de la journée sera généré à ${this.getNextReportTime()}. Données d'exemple affichées en attendant.`;
        mockData.nextGeneration = this.getNextReportTime();
        mockData.isScheduled = true;
        mockData.status = "En attente du premier rapport";
        return mockData;
      }
    }

    try {
      console.log(`🤖 Generating scheduled report for: ${generationCheck.session}...`);
      
      // Get latest economic data from FRED if available
      const economicData = await this.getLatestEconomicData();
      
      // Build enhanced prompt based on session
      let sessionContext = "";
      const currentTimeSlot = this.getCurrentTimeSlot();
      
      switch(currentTimeSlot) {
        case 0: // 7:00 AM - European Session
          sessionContext = "Focus sur l'ouverture de la session européenne. Analysez particulièrement EUR/USD, GBP/USD, USD/CHF et l'impact sur les autres paires.";
          break;
        case 1: // 12:00 PM - American Session  
          sessionContext = "Focus sur l'ouverture de la session américaine. Analysez l'impact du Dollar US sur toutes les paires majeures et les données économiques US.";
          break;
        case 2: // 5:00 PM - End of Day Recap
          sessionContext = "Récapitulatif de fin de journée. Résumez les mouvements de toutes les sessions et préparez pour la session asiatique.";
          break;
      }
      
      let prompt = `Tu es un analyste forex français réputé. Rédige un rapport de marché professionnel pour ${generationCheck.session}.

RÈGLES ABSOLUES:
- Texte pur uniquement, AUCUN formatage (pas de **, pas de •, pas de :, pas de chiffres à la fin)
- Phrases complètes et fluides
- Structure claire avec paragraphes séparés
- Langage accessible à un lycéen mais professionnel

${sessionContext}

Rédige exactement ceci:

TITRE: Rapport ${generationCheck.session}

PARAGRAPHE 1 - Vue d'ensemble:
[2-3 phrases sur la situation générale des marchés forex aujourd'hui]

PARAGRAPHE 2 - EUR/USD:
[Analyse complète en 2 phrases: facteurs BCE, économie européenne, sentiment USD]

PARAGRAPHE 3 - GBP/USD:
[Analyse complète en 2 phrases: facteurs BoE, données UK, Brexit]

PARAGRAPHE 4 - USD/JPY:
[Analyse complète en 2 phrases: politique BoJ, intervention, yen carry trade]

PARAGRAPHE 5 - Facteurs de risque:
[3 éléments à surveiller cette session, expliqués simplement]

PARAGRAPHE 6 - Recommandations:
[2 conseils concrets pour les traders aujourd'hui]

Maximum 300 mots. Français naturel, pas de jargon technique.`;
      
      if (Object.keys(economicData).length > 0) {
        prompt += `\n\nDonnées économiques FRED récentes à intégrer dans l'analyse:`;
        Object.entries(economicData).forEach(([indicator, data]) => {
          prompt += `\n- ${indicator}: ${data.value} (${data.date})`;
        });
      }
      
      prompt += `

STRUCTURE REQUISE EN FRANÇAIS:

**APERÇU DU MARCHÉ:**
[2-3 phrases sur le sentiment général et les facteurs dominants]

**ANALYSE FONDAMENTALE DES PAIRES PRINCIPALES:**

**EUR/USD:** [Analyse des facteurs BCE, données européennes, sentiment USD]
**GBP/USD:** [Analyse BoE, données UK, facteurs post-Brexit]  
**USD/JPY:** [Analyse BoJ, politique monétaire, intervention risques]
**USD/CHF:** [Analyse BNS, safe-haven, corrélations]
**AUD/USD:** [Analyse RBA, Chine, matières premières]
**NZD/USD:** [Analyse RBNZ, économie NZ, correlations]
**USD/CAD:** [Analyse BoC, pétrole, données canadiennes]

**FACTEURS CLÉS À SURVEILLER:**
• [Événement/donnée économique 1]
• [Déclaration banque centrale/politique monétaire 2]  
• [Tension géopolitique/facteur de risque 3]

**DÉCLENCHEURS DE VOLATILITÉ:**
[Ce qui pourrait causer des mouvements significatifs cette session]

**SENTIMENT DES TRADERS:** [Ce sur quoi se concentrent les traders institutionnels]

**PRÉVISIONS SESSION:** [Mouvements attendus et niveaux à surveiller]

Maximum 400 mots. Langage professionnel mais accessible à un lycéen.`;
      
      const aiResponse = await this.callPerplexityAI(prompt);
      console.log(`✅ Scheduled report generated for ${generationCheck.session}`);
      
      // Parse the structured response
      const parsedReport = this.parseAIReport(aiResponse);
      
      const reportData = {
        date: new Date().toLocaleDateString('fr-FR'),
        session: generationCheck.session,
        summary: parsedReport.summary,
        keyPoints: parsedReport.keyPoints,
        aiInsights: {
          sentiment: parsedReport.sentiment,
          confidence: 90,
          mainTrend: parsedReport.mainTrend,
          recommendation: parsedReport.recommendations
        },
        economicData: economicData,
        timestamp: new Date().toISOString(),
        source: 'Perplexity AI + FRED Data (Programmé)',
        rawReport: aiResponse,
        nextGeneration: this.getNextReportTime(),
        isScheduled: true,
        status: `Rapport ${generationCheck.session} - ${new Date().toLocaleTimeString('fr-FR', {timeZone: 'GMT'})} GMT`
      };
      
      // Cache the report
      localStorage.setItem('forexai_daily_report', JSON.stringify(reportData));
      console.log('💾 Report cached successfully');
      
      return reportData;
      
    } catch (error) {
      console.error('❌ Error generating scheduled recap:', error);
      const mockData = this.getMockDailyRecap();
      mockData.summary = "Erreur lors de la génération du rapport programmé. Données de démonstration affichées.";
      mockData.nextGeneration = this.getNextReportTime();
      return mockData;
    }
  }

  // Generate Currency Analysis using AI (Optimized with Cache)
  async generateCurrencyAnalysis(currency) {
    if (!this.isReady()) {
      console.log('⚠️ Perplexity API not ready, using mock data for', currency);
      return this.getMockCurrencyAnalysis(currency);
    }

    // Check cache first
    const cacheKey = `forexai_currency_${currency}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const data = JSON.parse(cached);
        const cacheTime = new Date(data.timestamp);
        const now = new Date();
        const hoursSinceCache = (now - cacheTime) / (1000 * 60 * 60);
        
        // Use cache if less than 4 hours old
        if (hoursSinceCache < 4) {
          console.log(`📋 Using cached analysis for ${currency} (${hoursSinceCache.toFixed(1)}h old)`);
          return data;
        }
      } catch (error) {
        console.error('Error parsing cached currency data:', error);
      }
    }

    try {
      console.log(`🤖 Generating fresh analysis for ${currency}...`);
      
      const prompt = `Act as a professional forex analyst. Conduct a comprehensive fundamental analysis of ${currency} currency.

Analyze current market sentiment and factors affecting ${currency}:
- Central bank monetary policy and recent statements
- Key economic indicators (inflation, employment, GDP, trade balance)
- Political stability and government policies  
- Market positioning and institutional flows
- Risk sentiment impact on the currency
- Correlations with commodities (if applicable)
- Technical levels and market structure

Provide specific insights that matter to forex traders right now.

Make sure your analysis is easy to understand by a high school student. The analysis must be in French.

STRUCTURE REQUISE EN FRANÇAIS:

**SITUATION ACTUELLE ${currency}:**
[Vue d'ensemble de la devise aujourd'hui - 2 phrases]

**ANALYSE FONDAMENTALE:**

**Politique Monétaire:** [Position de la banque centrale, taux, orientation future]
**Économie:** [Données clés - inflation, emploi, croissance, principales tendances]  
**Facteurs Politiques:** [Stabilité, élections, réformes, impact sur devise]
**Sentiment de Marché:** [Positionnement institutionnel, flux de capitaux, risk-on/risk-off]

**CATALYSEURS À SURVEILLER:**
• [Événement/donnée à venir 1]
• [Décision politique/monétaire 2]
• [Facteur externe/corrélation 3]

**ANALYSE TECHNIQUE:**
[Niveaux clés, tendance, supports/résistances principales]

**PRÉVISION ${currency}:**
[Perspective court/moyen terme basée sur l'analyse fondamentale - 2-3 phrases]

**SCORE FONDAMENTAL:** [1-100] **SCORE TECHNIQUE:** [1-100]
**RECOMMANDATION:** [ACHAT/VENTE/NEUTRE] **CONFIANCE:** [1-100]%

Maximum 300 mots. Langage professionnel mais accessible.`;
      
      const aiResponse = await this.callPerplexityAI(prompt);
      console.log(`✅ Fresh currency analysis generated for ${currency}`);
      
      // Parse the structured response
      const parsedAnalysis = this.parseCurrencyAnalysis(aiResponse);
      
      const analysisData = {
        ...parsedAnalysis,
        timestamp: new Date().toISOString(),
        source: 'Perplexity AI (Optimisé)',
        rawAnalysis: aiResponse
      };
      
      // Cache for 4 hours
      localStorage.setItem(cacheKey, JSON.stringify(analysisData));
      console.log(`💾 Analysis cached for ${currency} (4h validity)`);
      
      return analysisData;
      
    } catch (error) {
      console.error(`❌ Error analyzing ${currency}:`, error);
      const mockData = this.getMockCurrencyAnalysis(currency);
      mockData.forecast = "Erreur lors de l'analyse IA. Données de démonstration affichées.";
      return mockData;
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
    console.log('🤖 Calling Perplexity AI with prompt:', prompt.substring(0, 100) + '...');
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Tu es un analyste forex professionnel expert en analyse fondamentale. Fournis des analyses précises et actionnables en français pour les traders forex. Sois concis mais complet.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.2,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Perplexity API Error:', response.status, errorText);
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Perplexity AI Response received');
      return data.choices[0].message.content;
      
    } catch (error) {
      console.error('❌ Error calling Perplexity AI:', error);
      throw error;
    }
  }

  async getFredData(indicator, startDate = null, endDate = null) {
    if (!this.isFredReady()) {
      console.log('⚠️ FRED API not available, skipping economic data');
      return null;
    }

    try {
      console.log(`📊 Fetching FRED data for ${indicator}...`);
      
      const url = new URL('https://api.stlouisfed.org/fred/series/observations');
      url.searchParams.append('series_id', indicator);
      url.searchParams.append('api_key', this.fredApiKey);
      url.searchParams.append('file_type', 'json');
      url.searchParams.append('limit', '5'); // Get last 5 data points
      url.searchParams.append('sort_order', 'desc'); // Most recent first
      
      if (startDate) url.searchParams.append('observation_start', startDate);
      if (endDate) url.searchParams.append('observation_end', endDate);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`FRED API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ FRED data received for ${indicator}`);
      return data;
      
    } catch (error) {
      console.error(`❌ Error fetching FRED data for ${indicator}:`, error);
      return null;
    }
  }

  async getLatestEconomicData() {
    if (!this.isFredReady()) {
      console.log('⚠️ FRED API not ready, skipping economic data');
      return {};
    }

    console.log('📊 Fetching latest economic indicators from FRED...');
    
    const indicators = [
      'FEDFUNDS',      // US Federal Funds Rate
      'CPIAUCSL',      // US CPI
      'UNRATE',        // US Unemployment Rate
      'GDPC1',         // US Real GDP
      'DEXUSEU',       // US/Euro Exchange Rate
      'DEXJPUS',       // Japan/US Exchange Rate
      'DEXUSUK'        // US/UK Exchange Rate
    ];

    const data = {};
    for (const indicator of indicators) {
      try {
        const result = await this.getFredData(indicator);
        if (result && result.observations && result.observations.length > 0) {
          // Get the most recent non-null value
          const validObs = result.observations.filter(obs => obs.value !== '.');
          if (validObs.length > 0) {
            data[indicator] = {
              value: validObs[0].value,
              date: validObs[0].date,
              series_id: indicator
            };
          }
        }
      } catch (error) {
        console.error(`❌ Error fetching ${indicator}:`, error);
      }
    }

    console.log('✅ Economic data fetched from FRED:', Object.keys(data));
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

  // Clean text from markdown formatting
  cleanText(text) {
    if (!text) return "";
    
    return text
      // Remove all markdown formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold **text**
      .replace(/\*([^*]+)\*/g, '$1')      // Remove italic *text*
      .replace(/#{1,6}\s+/g, '')          // Remove headers
      .replace(/^\s*[-•]\s+/gm, '• ')     // Clean bullet points
      .replace(/^\s*\d+\.\s+/gm, '')      // Remove numbered lists
      .replace(/\[([^\]]+)\]/g, '$1')     // Remove brackets
      .replace(/\s{2,}/g, ' ')            // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n')         // Multiple newlines to double
      .trim();
  }

  // Extract clean sections from AI response
  extractCleanSections(aiResponse) {
    const sections = {};
    
    // Clean the entire response first
    const cleanResponse = this.cleanText(aiResponse);
    
    // Define section patterns (looking for the cleaned text)
    const patterns = {
      overview: /APERÇU DU MARCHÉ:?\s*(.*?)(?=ANALYSE FONDAMENTALE|$)/is,
      eurUsd: /EUR\/USD:?\s*(.*?)(?=GBP\/USD|$)/is,
      gbpUsd: /GBP\/USD:?\s*(.*?)(?=USD\/JPY|$)/is,
      usdJpy: /USD\/JPY:?\s*(.*?)(?=USD\/CHF|$)/is,
      usdChf: /USD\/CHF:?\s*(.*?)(?=AUD\/USD|$)/is,
      audUsd: /AUD\/USD:?\s*(.*?)(?=NZD\/USD|$)/is,
      nzdUsd: /NZD\/USD:?\s*(.*?)(?=USD\/CAD|$)/is,
      usdCad: /USD\/CAD:?\s*(.*?)(?=FACTEURS CLÉS|$)/is,
      factors: /FACTEURS CLÉS À SURVEILLER:?\s*(.*?)(?=DÉCLENCHEURS|$)/is,
      volatility: /DÉCLENCHEURS DE VOLATILITÉ:?\s*(.*?)(?=SENTIMENT|$)/is,
      sentiment: /SENTIMENT DES TRADERS:?\s*(.*?)(?=PRÉVISIONS|$)/is,
      forecast: /PRÉVISIONS SESSION:?\s*(.*?)$/is
    };
    
    // Extract each section
    Object.keys(patterns).forEach(key => {
      const match = cleanResponse.match(patterns[key]);
      if (match && match[1]) {
        sections[key] = this.cleanText(match[1]).substring(0, 200).trim();
      }
    });
    
    return sections;
  }
  // Parse AI generated report into structured data (Enhanced & Professional)
  parseAIReport(aiResponse) {
    try {
      // Use the clean extraction method
      const sections = this.extractCleanSections(aiResponse);
      
      // Build professional key points from currency analyses
      const keyPoints = [];
      
      // Add major currency pair insights
      if (sections.eurUsd) {
        keyPoints.push({
          title: "EUR/USD",
          impact: this.determinePairImpact(sections.eurUsd),
          description: sections.eurUsd
        });
      }
      
      if (sections.gbpUsd) {
        keyPoints.push({
          title: "GBP/USD", 
          impact: this.determinePairImpact(sections.gbpUsd),
          description: sections.gbpUsd
        });
      }
      
      if (sections.usdJpy) {
        keyPoints.push({
          title: "USD/JPY",
          impact: this.determinePairImpact(sections.usdJpy),
          description: sections.usdJpy
        });
      }
      
      // If no pair analyses, extract factors as key points
      if (keyPoints.length === 0 && sections.factors) {
        const factorsList = sections.factors.split('•').filter(f => f.trim());
        factorsList.forEach((factor, index) => {
          if (factor.trim() && index < 3) {
            keyPoints.push({
              title: "Facteur clé",
              impact: "important",
              description: factor.trim()
            });
          }
        });
      }
      
      // Default professional key points if none found
      if (keyPoints.length === 0) {
        keyPoints.push(
          { title: "Analyse fondamentale", impact: "positif", description: "Rapport professionnel généré avec analyse complète des facteurs macroéconomiques" },
          { title: "Surveillance des banques centrales", impact: "neutre", description: "Évaluation des politiques monétaires et de leur impact sur les devises" },
          { title: "Sentiment institutionnel", impact: "important", description: "Analyse du positionnement des traders professionnels et des flux de capitaux" }
        );
      }
      
      return {
        summary: sections.overview || this.cleanText(aiResponse).substring(0, 300) + "...",
        keyPoints: keyPoints.slice(0, 3), // Limit to 3 for clean display
        sentiment: sections.sentiment || "Analyse professionnelle en cours",
        mainTrend: sections.volatility || "Surveillance des déclencheurs de volatilité",
        recommendations: sections.forecast || "Voir analyse détaillée pour recommandations spécifiques"
      };
      
    } catch (error) {
      console.error('❌ Error parsing enhanced AI report:', error);
      return {
        summary: this.cleanText(aiResponse),
        keyPoints: [
          { title: "Rapport professionnel", impact: "neutre", description: "Analyse fondamentale complète disponible" }
        ],
        sentiment: "Analyse générée par IA",
        mainTrend: "Recherche fondamentale approfondie",
        recommendations: "Consulter le rapport détaillé"
      };
    }
  }

  // Determine impact based on content analysis
  determinePairImpact(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('hausse') || lowerText.includes('positif') || lowerText.includes('soutien') || lowerText.includes('fort')) {
      return 'positif';
    } else if (lowerText.includes('baisse') || lowerText.includes('négatif') || lowerText.includes('pression') || lowerText.includes('faible')) {
      return 'négatif';
    }
    return 'neutre';
  }

  // Parse currency analysis from AI response (Enhanced)
  parseCurrencyAnalysis(aiResponse) {
    try {
      // Clean the response first
      const cleanResponse = this.cleanText(aiResponse);
      
      // Extract scores from cleaned structure
      const fundamentalMatch = cleanResponse.match(/SCORE FONDAMENTAL:?\s*(\d+)/i);
      const technicalMatch = cleanResponse.match(/SCORE TECHNIQUE:?\s*(\d+)/i);
      const recommendationMatch = cleanResponse.match(/RECOMMANDATION:?\s*(ACHAT|VENTE|NEUTRE)/i);
      const confidenceMatch = cleanResponse.match(/CONFIANCE:?\s*(\d+)/i);
      
      // Extract detailed sections (cleaned)
      const situationMatch = cleanResponse.match(/SITUATION ACTUELLE [A-Z]{3}:?\s*(.*?)(?=ANALYSE FONDAMENTALE|$)/is);
      const monetaryMatch = cleanResponse.match(/Politique Monétaire:?\s*(.*?)(?=Économie|$)/is);
      const economyMatch = cleanResponse.match(/Économie:?\s*(.*?)(?=Facteurs Politiques|$)/is);
      const politicalMatch = cleanResponse.match(/Facteurs Politiques:?\s*(.*?)(?=Sentiment de Marché|$)/is);
      const sentimentMatch = cleanResponse.match(/Sentiment de Marché:?\s*(.*?)(?=CATALYSEURS|$)/is);
      const forecastMatch = cleanResponse.match(/PRÉVISION [A-Z]{3}:?\s*(.*?)(?=SCORE|$)/is);
      
      // Extract catalysts (cleaned)
      const catalystsSection = cleanResponse.match(/CATALYSEURS À SURVEILLER:?\s*(.*?)(?=ANALYSE TECHNIQUE|$)/is)?.[1] || '';
      const keyFactors = [];
      
      // Extract bullet points without formatting
      const catalystLines = catalystsSection.split('\n').filter(line => line.trim());
      catalystLines.forEach(line => {
        const cleaned = line.replace(/^[•\-\*]\s*/, '').trim();
        if (cleaned && cleaned.length > 10) { // Minimum meaningful length
          keyFactors.push(cleaned);
        }
      });
      
      // Build comprehensive factors list (all cleaned)
      const comprehensiveFactors = [];
      if (monetaryMatch?.[1]?.trim()) {
        comprehensiveFactors.push(`Politique monétaire: ${this.cleanText(monetaryMatch[1]).substring(0, 80)}`);
      }
      if (economyMatch?.[1]?.trim()) {
        comprehensiveFactors.push(`Économie: ${this.cleanText(economyMatch[1]).substring(0, 80)}`);
      }
      if (politicalMatch?.[1]?.trim()) {
        comprehensiveFactors.push(`Politique: ${this.cleanText(politicalMatch[1]).substring(0, 80)}`);
      }
      if (sentimentMatch?.[1]?.trim()) {
        comprehensiveFactors.push(`Sentiment: ${this.cleanText(sentimentMatch[1]).substring(0, 80)}`);
      }
      
      // Use catalysts if comprehensive factors are empty
      const finalFactors = comprehensiveFactors.length > 0 ? comprehensiveFactors : keyFactors;
      
      // Professional default factors if none found
      if (finalFactors.length === 0) {
        finalFactors.push(
          "Analyse fondamentale approfondie en cours",
          "Surveillance des décisions de banque centrale", 
          "Évaluation des données macroéconomiques",
          "Suivi du sentiment de marché institutionnel"
        );
      }
      
      // Determine professional sentiment from cleaned content
      let sentiment = "Analyse professionnelle";
      const combinedText = (situationMatch?.[1] || '') + (forecastMatch?.[1] || '');
      const lowerText = combinedText.toLowerCase();
      
      if (lowerText.includes('positif') || lowerText.includes('hausse') || lowerText.includes('fort') || lowerText.includes('soutien')) {
        sentiment = "Tendance haussière modérée";
      } else if (lowerText.includes('négatif') || lowerText.includes('baisse') || lowerText.includes('faible') || lowerText.includes('pression')) {
        sentiment = "Tendance baissière modérée";
      } else {
        sentiment = "Consolidation avec surveillance active";
      }
      
      // Clean forecast text
      const cleanForecast = this.cleanText(forecastMatch?.[1] || situationMatch?.[1] || cleanResponse);
      
      return {
        fundamentalScore: parseInt(fundamentalMatch?.[1]) || 75,
        technicalScore: parseInt(technicalMatch?.[1]) || 70,
        sentiment: sentiment,
        keyFactors: finalFactors.slice(0, 4), // Limit to 4 for clean display
        forecast: cleanForecast.substring(0, 250) + (cleanForecast.length > 250 ? "..." : ""),
        aiRating: recommendationMatch?.[1]?.toUpperCase() || "NEUTRE",
        confidence: parseInt(confidenceMatch?.[1]) || 80
      };
      
    } catch (error) {
      console.error('❌ Error parsing enhanced currency analysis:', error);
      return {
        fundamentalScore: 75,
        technicalScore: 70,
        sentiment: "Analyse professionnelle générée",
        keyFactors: [
          "Recherche fondamentale avancée", 
          "Analyse macroéconomique détaillée", 
          "Surveillance banques centrales",
          "Évaluation sentiment de marché"
        ],
        forecast: this.cleanText(aiResponse).substring(0, 250) + "...",
        aiRating: "NEUTRE",
        confidence: 80
      };
    }
  }
}

// Create singleton instance
const forexAIService = new ForexAIService();

export default forexAIService;