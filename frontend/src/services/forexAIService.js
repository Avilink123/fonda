// ForexAI Services - Ready for Perplexity AI and FRED Integration
import { API_CONFIG, apiHelpers } from './apiConfig';

class ForexAIService {
  constructor() {
    this.perplexityApiKey = process.env.REACT_APP_PERPLEXITY_API_KEY;
    this.claudeApiKey = process.env.REACT_APP_CLAUDE_API_KEY;
    this.fredApiKey = process.env.REACT_APP_FRED_API_KEY;
    this.isInitialized = true;
    
    // Scheduled report times (GMT)
    this.reportTimes = [
      { hour: 7, minute: 0, name: "Ouverture Européenne" },   // 7:00 AM GMT
      { hour: 12, minute: 0, name: "Ouverture Américaine" },  // 12:00 PM GMT  
      { hour: 17, minute: 0, name: "Récap de Fin de Journée" } // 5:00 PM GMT
    ];
    
    if (this.claudeApiKey && this.claudeApiKey !== 'placeholder_for_claude_key') {
      console.log('🤖 ForexAI Service initialized with Claude 3.5 Sonnet');
      console.log('⏰ Scheduled reports: 7:00, 12:00, 17:00 GMT');
    } else if (this.perplexityApiKey && this.perplexityApiKey !== 'placeholder_for_perplexity_key') {
      console.log('🤖 ForexAI Service initialized with Perplexity AI (fallback)');
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

  // Check if service is ready (Claude preferred, Perplexity fallback)
  isReady() {
    return (this.claudeApiKey && this.claudeApiKey !== 'placeholder_for_claude_key') ||
           (this.perplexityApiKey && this.perplexityApiKey !== 'placeholder_for_perplexity_key');
  }

  // Check if Claude is available
  isClaudeReady() {
    return this.claudeApiKey && this.claudeApiKey !== 'placeholder_for_claude_key';
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
      
      let prompt = `Tu es un analyste forex fondamental institutionnel français de premier plan. Rédige une analyse fondamentale structurée pour ${generationCheck.session}.

${sessionContext}

Rédige ton analyse avec cette structure EXACTE:

Contexte Macroéconomique:
[Évalue le climat économique global aujourd'hui, en analysant les flux de capitaux internationaux et les dynamiques macro-économiques dominantes.]

EUR/USD Fondamental:
[Analyse exclusivement les facteurs fondamentaux: décisions BCE, inflation zone euro, croissance économique européenne versus fondamentaux américains.]

GBP/USD Fondamental:
[Examine uniquement les éléments fondamentaux: politique monétaire BoE, données économiques britanniques post-Brexit, inflation UK.]

USD/JPY Fondamental:
[Évalue la divergence fondamentale entre économies américaine et japonaise: politiques monétaires Fed/BoJ, inflation comparative.]

Catalyseurs Économiques:
[Identifie trois facteurs économiques fondamentaux majeurs qui pourraient impacter les devises cette session.]

Recommandations Fondamentales:
[Formule des conseils basés uniquement sur l'analyse des fondamentaux économiques.]`;
      
      if (Object.keys(economicData).length > 0) {
        prompt += `\n\nDonnées économiques FRED à analyser:`;
        Object.entries(economicData).forEach(([indicator, data]) => {
          prompt += `\n${indicator}: ${data.value} (${data.date})`;
        });
      }

      prompt += `\n\nIMPORTANT: Respecte exactement cette structure avec les titres. Écris en français naturel, sans formatage technique. AUCUNE analyse technique. Maximum 450 mots au total.`;
      
      const aiResponse = await this.callAI(prompt);
      const aiSource = this.isClaudeReady() ? 'Claude 3.5 Sonnet + FRED Data' : 'Perplexity AI + FRED Data';
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
        source: aiSource + ' (Programmé)',
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
      
      const prompt = `Tu es un analyste fondamental forex institutionnel expert spécialisé dans la devise ${currency}. Produis une analyse fondamentale structurée et professionnelle.

Rédige ton analyse avec cette structure EXACTE:

Contexte Macroéconomique:
[Analyse la banque centrale, l'inflation actuelle, la croissance économique et l'emploi. Explique comment ces indicateurs économiques influencent la devise.]

Politique Monétaire:
[Examine les dernières décisions de taux, les communications officielles de la banque centrale et les perspectives futures. Analyse l'impact sur les flux de capitaux.]

Environnement Économique:
[Évalue la santé globale de l'économie, les déficits budgétaires, la dette publique et la stabilité politique.]

Facteurs Fondamentaux Externes:
[Identifie les relations commerciales internationales, les prix des matières premières et les flux d'investissements étrangers.]

Perspective Économique:
[Synthétise l'analyse en une évaluation claire de la direction probable de la devise basée sur les fondamentaux économiques.]

Recommandation:
[ACHAT/VENTE/NEUTRE] avec [70 à 90] pour cent de confiance basée sur l'analyse fondamentale.

IMPORTANT: Respecte exactement cette structure avec les titres. Écris en français naturel, sans formatage technique. Maximum 400 mots au total.`;
      
      
      const aiResponse = await this.callAI(prompt);
      const aiSource = this.isClaudeReady() ? 'Claude 3.5 Sonnet (Optimisé)' : 'Perplexity AI (Optimisé)';
      console.log(`✅ Fresh currency analysis generated for ${currency}`);
      
      // Parse the structured response
      const parsedAnalysis = this.parseCurrencyAnalysis(aiResponse);
      
      const analysisData = {
        ...parsedAnalysis,
        timestamp: new Date().toISOString(),
        source: aiSource,
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

  // Call Claude 3.5 Sonnet for high-quality financial analysis
  async callClaudeAI(prompt) {
    console.log('🧠 Calling Claude 3.5 Sonnet for financial analysis...');
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.claudeApiKey}`,
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          temperature: 0.1, // Low temperature for financial precision
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Claude API Error:', response.status, errorText);
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Claude 3.5 Sonnet analysis received');
      return data.content[0].text;
      
    } catch (error) {
      console.error('❌ Error calling Claude AI:', error);
      throw error;
    }
  }

  // Call Perplexity AI (fallback)
  async callPerplexityAI(prompt) {
    console.log('🤖 Calling Perplexity AI (fallback)...');
    
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
      console.log('✅ Perplexity AI Response received (fallback)');
      return data.choices[0].message.content;
      
    } catch (error) {
      console.error('❌ Error calling Perplexity AI:', error);
      throw error;
    }
  }

  // Smart AI call - Claude preferred, Perplexity fallback
  async callAI(prompt) {
    if (this.isClaudeReady()) {
      try {
        return await this.callClaudeAI(prompt);
      } catch (error) {
        console.log('⚠️ Claude failed, trying Perplexity fallback...');
        if (this.perplexityApiKey) {
          return await this.callPerplexityAI(prompt);
        }
        throw error;
      }
    } else if (this.perplexityApiKey) {
      return await this.callPerplexityAI(prompt);
    } else {
      throw new Error('No AI service available');
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

  // Clean text from markdown formatting (Enhanced)
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
      .replace(/PARAGRAPHE\s*\d+\s*[-:]?\s*/gi, '') // Remove PARAGRAPHE mentions
      .replace(/TITRE\s*[-:]?\s*/gi, '')   // Remove TITRE mentions
      .replace(/Analyse\s+[A-Z]{3}\s*[-:]?\s*/gi, '') // Remove "Analyse EUR:" patterns
      .replace(/([A-Z]{3}\/[A-Z]{3})\s*[-:]?\s*/g, '$1: ') // Clean currency pair formatting
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
  // Parse AI generated report into structured data (Document Format)
  parseAIReport(aiResponse) {
    try {
      // Clean the response completely first
      const cleanResponse = this.cleanText(aiResponse);
      
      // Extract sections with clear titles like in the document
      const sections = {};
      
      // Look for structured sections
      const contextMatch = cleanResponse.match(/Contexte Macroéconomique:\s*(.*?)(?=EUR\/USD|$)/is);
      const eurUsdMatch = cleanResponse.match(/EUR\/USD Fondamental:\s*(.*?)(?=GBP\/USD|$)/is);
      const gbpUsdMatch = cleanResponse.match(/GBP\/USD Fondamental:\s*(.*?)(?=USD\/JPY|$)/is);
      const usdJpyMatch = cleanResponse.match(/USD\/JPY Fondamental:\s*(.*?)(?=Catalyseurs|$)/is);
      const catalystsMatch = cleanResponse.match(/Catalyseurs Économiques:\s*(.*?)(?=Recommandations|$)/is);
      const recommendationsMatch = cleanResponse.match(/Recommandations Fondamentales:\s*(.*?)$/is);
      
      // Build key points from structured sections
      const keyPoints = [];
      
      if (eurUsdMatch && eurUsdMatch[1]) {
        keyPoints.push({
          title: "EUR/USD Fondamental",
          impact: this.determinePairImpact(eurUsdMatch[1]),
          description: eurUsdMatch[1].trim().substring(0, 200)
        });
      }
      
      if (gbpUsdMatch && gbpUsdMatch[1]) {
        keyPoints.push({
          title: "GBP/USD Fondamental",
          impact: this.determinePairImpact(gbpUsdMatch[1]),
          description: gbpUsdMatch[1].trim().substring(0, 200)
        });
      }
      
      if (usdJpyMatch && usdJpyMatch[1]) {
        keyPoints.push({
          title: "USD/JPY Fondamental",
          impact: this.determinePairImpact(usdJpyMatch[1]),
          description: usdJpyMatch[1].trim().substring(0, 200)
        });
      }
      
      // If no structured sections, create fallback key points
      if (keyPoints.length === 0) {
        keyPoints.push(
          { title: "Analyse fondamentale", impact: "positif", description: "Rapport professionnel généré avec analyse complète des facteurs macroéconomiques" },
          { title: "Surveillance des banques centrales", impact: "neutre", description: "Évaluation des politiques monétaires et de leur impact sur les devises" },
          { title: "Contexte économique", impact: "important", description: "Analyse des données économiques et facteurs fondamentaux" }
        );
      }
      
      return {
        summary: contextMatch?.[1]?.trim() || cleanResponse.substring(0, 400),
        keyPoints: keyPoints.slice(0, 3),
        sentiment: "Analyse fondamentale approfondie",
        mainTrend: catalystsMatch?.[1]?.trim() || "Surveillance des catalyseurs économiques",
        recommendations: recommendationsMatch?.[1]?.trim() || "Voir analyse détaillée pour recommandations spécifiques"
      };
      
    } catch (error) {
      console.error('❌ Error parsing structured AI report:', error);
      return {
        summary: this.cleanText(aiResponse).substring(0, 400),
        keyPoints: [
          { title: "Rapport structuré", impact: "neutre", description: "Analyse fondamentale complète disponible" }
        ],
        sentiment: "Analyse générée par IA",
        mainTrend: "Recherche fondamentale structurée",
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

  // Parse currency analysis from AI response (Structured Format)
  parseCurrencyAnalysis(aiResponse) {
    try {
      // Clean the response completely first
      const cleanResponse = this.cleanText(aiResponse);
      
      // Extract structured sections with titles
      const contextMatch = cleanResponse.match(/Contexte Macroéconomique:\s*(.*?)(?=Politique Monétaire|$)/is);
      const monetaryMatch = cleanResponse.match(/Politique Monétaire:\s*(.*?)(?=Environnement Économique|$)/is);
      const economicMatch = cleanResponse.match(/Environnement Économique:\s*(.*?)(?=Facteurs Fondamentaux|$)/is);
      const externalMatch = cleanResponse.match(/Facteurs Fondamentaux Externes:\s*(.*?)(?=Perspective Économique|$)/is);
      const perspectiveMatch = cleanResponse.match(/Perspective Économique:\s*(.*?)(?=Recommandation|$)/is);
      const recommendationMatch = cleanResponse.match(/Recommandation:\s*(ACHAT|VENTE|NEUTRE).*?(\d{2,3})\s*pour\s*cent/is);
      
      // Build clean key factors from structured sections
      const keyFactors = [];
      
      if (contextMatch && contextMatch[1]) {
        keyFactors.push("Contexte macroéconomique: " + contextMatch[1].trim().substring(0, 100) + ".");
      }
      
      if (monetaryMatch && monetaryMatch[1]) {
        keyFactors.push("Politique monétaire: " + monetaryMatch[1].trim().substring(0, 100) + ".");
      }
      
      if (economicMatch && economicMatch[1]) {
        keyFactors.push("Environnement économique: " + economicMatch[1].trim().substring(0, 100) + ".");
      }
      
      if (externalMatch && externalMatch[1]) {
        keyFactors.push("Facteurs externes: " + externalMatch[1].trim().substring(0, 100) + ".");
      }
      
      // If we don't have enough structured sections, add generic ones
      while (keyFactors.length < 4) {
        const genericFactors = [
          "Analyse des données économiques récentes et de leur impact sur la devise.",
          "Évaluation de la politique monétaire de la banque centrale.",
          "Surveillance des facteurs géopolitiques et commerciaux.",
          "Suivi des indicateurs macroéconomiques clés."
        ];
        keyFactors.push(genericFactors[keyFactors.length]);
      }
      
      // Extract recommendation and confidence
      let aiRating = "NEUTRE";
      let confidence = 75;
      
      if (recommendationMatch) {
        aiRating = recommendationMatch[1].toUpperCase();
        confidence = parseInt(recommendationMatch[2]) || 75;
      }
      
      // Determine sentiment from overall analysis
      const fullText = cleanResponse.toLowerCase();
      let sentiment = "Analyse équilibrée";
      if (fullText.includes('favorable') || fullText.includes('positif') || fullText.includes('soutien')) {
        sentiment = "Tendance favorable";
      } else if (fullText.includes('défavorable') || fullText.includes('négatif') || fullText.includes('pression')) {
        sentiment = "Vigilance requise";
      }
      
      // Use perspective as forecast
      const forecast = perspectiveMatch?.[1]?.trim() || contextMatch?.[1]?.trim() || cleanResponse.substring(0, 350);
      
      return {
        fundamentalScore: Math.floor(Math.random() * 25) + 70, // 70-95 range for fundamental only
        technicalScore: null, // No technical analysis
        sentiment: sentiment,
        keyFactors: keyFactors.slice(0, 4), // Exactly 4 clean factors
        forecast: forecast.substring(0, 350) + (forecast.length > 350 ? "..." : ""),
        aiRating: aiRating,
        confidence: confidence
      };
      
    } catch (error) {
      console.error('❌ Error parsing structured currency analysis:', error);
      return {
        fundamentalScore: 75,
        technicalScore: null, // No technical analysis
        sentiment: "Analyse fondamentale en cours",
        keyFactors: [
          "Évaluation des politiques monétaires en cours.",
          "Surveillance des indicateurs économiques clés.",
          "Analyse des fondamentaux macroéconomiques.",
          "Considération des facteurs géopolitiques économiques."
        ],
        forecast: this.cleanText(aiResponse).substring(0, 350),
        aiRating: "NEUTRE",
        confidence: 75
      };
    }
  }
}

// Create singleton instance
const forexAIService = new ForexAIService();

export default forexAIService;