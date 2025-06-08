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
      console.log('⏰ Not in generation window. Next report:', this.getNextReportTime());
      
      // Return last report or mock data with next generation time
      if (reportInfo.lastReport) {
        reportInfo.lastReport.nextGeneration = this.getNextReportTime();
        return reportInfo.lastReport;
      } else {
        const mockData = this.getMockDailyRecap();
        mockData.summary = `Prochain rapport IA programmé à ${this.getNextReportTime()}. Données de démonstration affichées.`;
        mockData.nextGeneration = this.getNextReportTime();
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
      
      let prompt = `Act as a professional forex analyst creating a market overview report for ${generationCheck.session}. 

Analyze the current market sentiment toward the major currency pairs (EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, NZD/USD, USD/CAD). 

Include fundamental insights such as:
- Key economic data releases and their impact
- Central bank statements and monetary policy decisions
- Geopolitical tensions affecting currencies
- Market trends and institutional positioning
- Risk sentiment and safe-haven flows

${sessionContext}

Highlight what traders are paying attention to, and forecast potential movement or volatility triggers for this upcoming trading session.

Make sure your report is easy to understand by a high school student. The report must be in French.`;
      
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
        nextGeneration: this.getNextReportTime()
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
      
      const prompt = `Tu es un analyste forex expert. Analyse la devise ${currency} aujourd'hui de manière professionnelle et accessible.

STRUCTURE REQUISE:

**Score Fondamental:** [nombre entre 1-100]
**Score Technique:** [nombre entre 1-100]  
**Sentiment:** [Description courte du sentiment actuel]

**Facteurs Clés:**
• [Facteur économique 1]
• [Facteur économique 2] 
• [Facteur économique 3]
• [Facteur politique/monetary 4]

**Prévision:**
[Paragraphe de 2-3 phrases expliquant les perspectives à court/moyen terme pour cette devise, en français simple mais professionnel]

**Recommandation:** [ACHAT/VENTE/NEUTRE]
**Confiance:** [nombre entre 1-100]%

Sois précis, factuel, et accessible à un lycéen. Maximum 150 mots.`;
      
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

  // Parse AI generated report into structured data
  parseAIReport(aiResponse) {
    try {
      // Extract sections using regex patterns
      const summaryMatch = aiResponse.match(/\*\*RÉSUMÉ EXÉCUTIF:\*\*(.*?)(?=\*\*POINTS CLÉS|$)/s);
      const sentiment = aiResponse.match(/\*\*SENTIMENT GLOBAL:\*\*(.*?)(?=\*\*|$)/s)?.[1]?.trim() || "Neutre";
      const trendMatch = aiResponse.match(/\*\*TENDANCE PRINCIPALE:\*\*(.*?)(?=\*\*|$)/s);
      const recommendationsMatch = aiResponse.match(/\*\*RECOMMANDATIONS:\*\*(.*?)(?=\*\*|$)/s);
      
      // Extract key points
      const keyPointsSection = aiResponse.match(/\*\*POINTS CLÉS DU JOUR:\*\*(.*?)(?=\*\*SENTIMENT|$)/s)?.[1] || '';
      const keyPoints = [];
      
      // Parse numbered points
      const pointMatches = keyPointsSection.match(/\d+\.\s*\*\*([^*]+)\*\*(.*?)(?=\d+\.|$)/gs);
      if (pointMatches) {
        pointMatches.forEach((point, index) => {
          const titleMatch = point.match(/\*\*([^*]+)\*\*/);
          const description = point.replace(/\d+\.\s*\*\*[^*]+\*\*/, '').trim();
          
          if (titleMatch) {
            // Determine impact based on keywords
            const title = titleMatch[1].trim();
            let impact = "neutre";
            if (title.toLowerCase().includes('hausse') || title.toLowerCase().includes('positif') || title.toLowerCase().includes('soutien')) {
              impact = "positif";
            } else if (title.toLowerCase().includes('baisse') || title.toLowerCase().includes('négatif') || title.toLowerCase().includes('pression')) {
              impact = "négatif";
            }
            
            keyPoints.push({
              title: title,
              impact: impact,
              description: description
            });
          }
        });
      }
      
      // If no key points found, create default ones
      if (keyPoints.length === 0) {
        keyPoints.push(
          { title: "Analyse générée par IA", impact: "neutre", description: "Rapport détaillé disponible ci-dessous" },
          { title: "Données en temps réel", impact: "positif", description: "Utilisation de données FRED officielles" },
          { title: "Marchés volatils", impact: "neutre", description: "Surveillance continue recommandée" }
        );
      }
      
      return {
        summary: summaryMatch?.[1]?.trim() || aiResponse.substring(0, 200) + "...",
        keyPoints: keyPoints,
        sentiment: sentiment,
        mainTrend: trendMatch?.[1]?.trim() || "Analyse en cours",
        recommendations: recommendationsMatch?.[1]?.trim() || "Surveiller les développements"
      };
      
    } catch (error) {
      console.error('❌ Error parsing AI report:', error);
      return {
        summary: aiResponse,
        keyPoints: [
          { title: "Rapport IA", impact: "neutre", description: "Analyse complète disponible" }
        ],
        sentiment: "Analyse générée",
        mainTrend: "Données en temps réel",
        recommendations: "Voir rapport complet"
      };
    }
  }

  // Parse currency analysis from AI response
  parseCurrencyAnalysis(aiResponse) {
    try {
      // Extract scores
      const fundamentalMatch = aiResponse.match(/\*\*Score Fondamental:\*\*\s*(\d+)/);
      const technicalMatch = aiResponse.match(/\*\*Score Technique:\*\*\s*(\d+)/);
      const sentimentMatch = aiResponse.match(/\*\*Sentiment:\*\*(.*?)(?=\*\*|$)/s);
      const recommendationMatch = aiResponse.match(/\*\*Recommandation:\*\*\s*(ACHAT|VENTE|NEUTRE)/);
      const confidenceMatch = aiResponse.match(/\*\*Confiance:\*\*\s*(\d+)/);
      const forecastMatch = aiResponse.match(/\*\*Prévision:\*\*(.*?)(?=\*\*Recommandation|$)/s);
      
      // Extract key factors
      const factorsSection = aiResponse.match(/\*\*Facteurs Clés:\*\*(.*?)(?=\*\*Prévision|$)/s)?.[1] || '';
      const keyFactors = [];
      const factorMatches = factorsSection.match(/•\s*([^\n•]+)/g);
      if (factorMatches) {
        factorMatches.forEach(factor => {
          const cleaned = factor.replace(/•\s*/, '').trim();
          if (cleaned) keyFactors.push(cleaned);
        });
      }
      
      // Default factors if none found
      if (keyFactors.length === 0) {
        keyFactors.push(
          "Analyse économique en cours",
          "Données de marché récentes",
          "Tendances monétaires",
          "Facteurs géopolitiques"
        );
      }
      
      return {
        fundamentalScore: parseInt(fundamentalMatch?.[1]) || 70,
        technicalScore: parseInt(technicalMatch?.[1]) || 65,
        sentiment: sentimentMatch?.[1]?.trim() || "Neutre",
        keyFactors: keyFactors,
        forecast: forecastMatch?.[1]?.trim() || aiResponse,
        aiRating: recommendationMatch?.[1] || "NEUTRE",
        confidence: parseInt(confidenceMatch?.[1]) || 75
      };
      
    } catch (error) {
      console.error('❌ Error parsing currency analysis:', error);
      return {
        fundamentalScore: 70,
        technicalScore: 65,
        sentiment: "Analyse générée par IA",
        keyFactors: ["Données en temps réel", "Analyse automatisée", "Marchés dynamiques", "Surveillance continue"],
        forecast: aiResponse,
        aiRating: "NEUTRE",
        confidence: 75
      };
    }
  }
}

// Create singleton instance
const forexAIService = new ForexAIService();

export default forexAIService;