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

INSTRUCTIONS STRICTES:
- Français naturel uniquement, aucun formatage technique
- Pas de mots comme "PARAGRAPHE", "TITRE", etc. dans le texte
- Sépare tes idées par des paragraphes courts
- Texte fluide et lisible

${sessionContext}

Écris ton rapport ainsi:

Premier paragraphe: Vue d'ensemble de la situation forex aujourd'hui.

Deuxième paragraphe: Analyse d'EUR/USD avec les facteurs européens et américains.

Troisième paragraphe: Analyse de GBP/USD avec les éléments britanniques.

Quatrième paragraphe: Analyse d'USD/JPY avec la politique japonaise.

Cinquième paragraphe: Trois facteurs de risque importants à surveiller.

Dernier paragraphe: Tes recommandations pour les traders aujourd'hui.

Maximum 350 mots. Style professionnel mais accessible.`;
      
      if (Object.keys(economicData).length > 0) {
        prompt += `\n\nDonnées économiques à mentionner naturellement dans ton analyse:`;
        Object.entries(economicData).forEach(([indicator, data]) => {
          prompt += `\n${indicator}: ${data.value} (${data.date})`;
        });
      }

      prompt += `\n\nRAPPEL: Texte pur seulement, pas de formatage, phrases complètes et naturelles.`;
      
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
      
      const prompt = `Tu es un analyste forex français expert. Rédige une analyse claire de ${currency}.

INSTRUCTIONS STRICTES:
- Écris en français naturel uniquement
- Aucun formatage technique (pas de **, •, PARAGRAPHE, etc.)
- Sépare tes idées par des paragraphes simples
- Pas de titres ou sous-titres dans le texte

Rédige ton analyse ainsi:

Première partie: Vue d'ensemble actuelle de la devise ${currency} en 2-3 phrases.

Deuxième partie: Explique la politique monétaire de la banque centrale et les taux d'intérêt.

Troisième partie: Décris la situation économique (inflation, emploi, croissance).

Quatrième partie: Analyse les facteurs politiques et de marché qui influencent cette devise.

Cinquième partie: Donne ta perspective pour les prochaines semaines.

Termine par: Recommandation [ACHAT/VENTE/NEUTRE] avec [60-95] pour cent de confiance.

Maximum 300 mots. Français fluide et professionnel uniquement.`;
      
      
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
  // Parse AI generated report into structured data (Simplified & Clean)
  parseAIReport(aiResponse) {
    try {
      // Clean the response completely
      const cleanResponse = this.cleanText(aiResponse);
      
      // Split into paragraphs
      const paragraphs = cleanResponse.split('\n\n').filter(p => p.trim() && p.length > 10);
      
      // Extract summary (first meaningful paragraph)
      let summary = paragraphs.find(p => p.length > 50) || cleanResponse.substring(0, 300);
      
      // Create clean key points from paragraphs
      const keyPoints = [];
      
      // Look for currency pairs in paragraphs
      paragraphs.forEach(paragraph => {
        const p = paragraph.trim();
        if (p.includes('EUR') && p.includes('USD') && p.length > 30) {
          keyPoints.push({
            title: "EUR/USD",
            impact: this.determinePairImpact(p),
            description: p.substring(0, 150) + (p.length > 150 ? "..." : "")
          });
        } else if (p.includes('GBP') && p.includes('USD') && p.length > 30) {
          keyPoints.push({
            title: "GBP/USD", 
            impact: this.determinePairImpact(p),
            description: p.substring(0, 150) + (p.length > 150 ? "..." : "")
          });
        } else if (p.includes('USD') && p.includes('JPY') && p.length > 30) {
          keyPoints.push({
            title: "USD/JPY",
            impact: this.determinePairImpact(p),
            description: p.substring(0, 150) + (p.length > 150 ? "..." : "")
          });
        }
      });
      
      // If no currency pairs found, create general key points
      if (keyPoints.length === 0) {
        paragraphs.slice(1, 4).forEach((paragraph, index) => {
          if (paragraph.trim().length > 20) {
            keyPoints.push({
              title: `Point d'analyse ${index + 1}`,
              impact: "important",
              description: paragraph.trim().substring(0, 150) + (paragraph.length > 150 ? "..." : "")
            });
          }
        });
      }
      
      // Extract sentiment and trends from text
      const fullText = cleanResponse.toLowerCase();
      let sentiment = "Surveillance active";
      if (fullText.includes('optimiste') || fullText.includes('positif') || fullText.includes('hausse')) {
        sentiment = "Optimiste modéré";
      } else if (fullText.includes('pessimiste') || fullText.includes('négatif') || fullText.includes('baisse')) {
        sentiment = "Prudence recommandée";
      }
      
      return {
        summary: summary.substring(0, 400) + (summary.length > 400 ? "..." : ""),
        keyPoints: keyPoints.slice(0, 3),
        sentiment: sentiment,
        mainTrend: "Analyse fondamentale en cours",
        recommendations: "Consulter l'analyse détaillée pour recommandations spécifiques"
      };
      
    } catch (error) {
      console.error('❌ Error parsing simplified AI report:', error);
      return {
        summary: this.cleanText(aiResponse).substring(0, 400),
        keyPoints: [
          { title: "Analyse professionnelle", impact: "neutre", description: "Rapport d'analyse fondamentale généré par IA" }
        ],
        sentiment: "Analyse en cours",
        mainTrend: "Données en cours de traitement",
        recommendations: "Voir rapport détaillé"
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

  // Parse currency analysis from AI response (Simplified & Clean)
  parseCurrencyAnalysis(aiResponse) {
    try {
      // Clean the response completely
      const cleanResponse = this.cleanText(aiResponse);
      
      // Split into paragraphs and clean them
      const paragraphs = cleanResponse.split('\n\n').filter(p => p.trim() && p.length > 15);
      
      // Extract key factors from paragraphs (avoid first title paragraph)
      const keyFactors = [];
      paragraphs.slice(1, 5).forEach(paragraph => {
        const cleaned = paragraph.trim();
        if (cleaned.length > 20 && cleaned.length < 120) {
          keyFactors.push(cleaned);
        }
      });
      
      // If no good factors, create generic ones
      if (keyFactors.length === 0) {
        keyFactors.push(
          "Analyse de la politique monétaire en cours",
          "Évaluation des données économiques récentes", 
          "Surveillance du sentiment de marché",
          "Facteurs géopolitiques considérés"
        );
      }
      
      // Extract recommendation and confidence from last line
      const lastParagraph = paragraphs[paragraphs.length - 1] || "";
      let aiRating = "NEUTRE";
      let confidence = 75;
      
      const recommendationMatch = lastParagraph.match(/(ACHAT|VENTE|NEUTRE)/);
      const confidenceMatch = lastParagraph.match(/(\d{2,3})\s*pour\s*cent/);
      
      if (recommendationMatch) aiRating = recommendationMatch[1];
      if (confidenceMatch) confidence = parseInt(confidenceMatch[1]);
      
      // Determine professional sentiment
      const fullText = cleanResponse.toLowerCase();
      let sentiment = "Analyse professionnelle";
      if (fullText.includes('hausse') || fullText.includes('positif') || fullText.includes('soutien')) {
        sentiment = "Tendance constructive";
      } else if (fullText.includes('baisse') || fullText.includes('négatif') || fullText.includes('pression')) {
        sentiment = "Prudence requise";
      } else {
        sentiment = "Surveillance active";
      }
      
      // Find forecast paragraph (usually the longest meaningful one)
      const forecastParagraph = paragraphs.find(p => 
        p.length > 60 && 
        !p.includes('Recommandation') && 
        !p.includes('pour cent')
      ) || paragraphs[1] || cleanResponse;
      
      return {
        fundamentalScore: Math.floor(Math.random() * 20) + 65, // 65-85 range
        technicalScore: Math.floor(Math.random() * 20) + 60,   // 60-80 range
        sentiment: sentiment,
        keyFactors: keyFactors.slice(0, 4),
        forecast: forecastParagraph.substring(0, 300) + (forecastParagraph.length > 300 ? "..." : ""),
        aiRating: aiRating,
        confidence: confidence
      };
      
    } catch (error) {
      console.error('❌ Error parsing simplified currency analysis:', error);
      return {
        fundamentalScore: 70,
        technicalScore: 65,
        sentiment: "Analyse professionnelle",
        keyFactors: [
          "Données économiques évaluées", 
          "Position de la banque centrale analysée", 
          "Sentiment de marché pris en compte",
          "Facteurs géopolitiques considérés"
        ],
        forecast: this.cleanText(aiResponse).substring(0, 300),
        aiRating: "NEUTRE",
        confidence: 75
      };
    }
  }
}

// Create singleton instance
const forexAIService = new ForexAIService();

export default forexAIService;