import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, TrendingUpIcon, TrendingDownIcon, ChartBarIcon, NewspaperIcon, CalendarIcon, CurrencyDollarIcon, GlobeAltIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import forexAIService from './services/forexAIService';

// Navigation Component
export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-8 w-8 text-amber-400" />
                <span className="text-xl font-bold text-white">ForexAI</span>
                <span className="text-xs bg-amber-400 text-slate-900 px-2 py-1 rounded-full font-semibold">PRO</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#accueil" className="text-white hover:text-amber-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">Accueil</a>
              <a href="#analyses" className="text-slate-300 hover:text-amber-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">Analyses</a>
              <a href="#devises" className="text-slate-300 hover:text-amber-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">Devises</a>
              <a href="#calendrier" className="text-slate-300 hover:text-amber-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">Calendrier</a>
              <a href="#tarifs" className="text-slate-300 hover:text-amber-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">Tarifs</a>
            </div>
          </div>
          
          <div className="hidden md:block">
            <button className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-6 py-2 rounded-lg font-semibold transition-colors">
              Essai Gratuit
            </button>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="md:hidden bg-slate-800/95 backdrop-blur-sm">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#accueil" className="text-white block px-3 py-2 rounded-md text-base font-medium">Accueil</a>
            <a href="#analyses" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Analyses</a>
            <a href="#devises" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Devises</a>
            <a href="#calendrier" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Calendrier</a>
            <a href="#tarifs" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Tarifs</a>
            <button className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-6 py-2 rounded-lg font-semibold mt-2 w-full">
              Essai Gratuit
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

// Hero Section Component
export const HeroSection = () => {
  return (
    <section id="accueil" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.pexels.com/photos/7789849/pexels-photo-7789849.jpeg" 
          alt="Financial Chart Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/80"></div>
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-10">
        <div className="absolute top-20 left-10 w-2 h-2 bg-amber-400/60 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-blue-400/40 rounded-full animate-bounce"></div>
        <div className="absolute bottom-32 left-20 w-1 h-1 bg-green-400/50 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-purple-400/30 rounded-full animate-pulse"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-20 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-amber-400/20 text-amber-300 border border-amber-400/30">
            <SparklesIcon className="w-4 h-4 mr-2" />
            IA de Nouvelle Génération
          </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Analyse Fondamentale
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
            Forex par IA
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Révolutionnez votre trading avec notre IA qui analyse automatiquement les marchés, 
          génère des rapports quotidiens et fournit des insights fondamentaux en temps réel.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button className="bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg">
            Commencer l'Analyse
          </button>
          <button className="border-2 border-slate-400 text-white hover:bg-slate-400 hover:text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all">
            Voir la Démo
          </button>
        </div>
        
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-amber-400">24/7</div>
            <div className="text-sm text-slate-400">Analyse Continue</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">7</div>
            <div className="text-sm text-slate-400">Devises Majeures</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">AI</div>
            <div className="text-sm text-slate-400">Deep Research</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">FR</div>
            <div className="text-sm text-slate-400">Interface Française</div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Daily Market Recap Component
export const DailyMarketRecap = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [marketRecapData, setMarketRecapData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadDailyRecap();
  }, []);

  const loadDailyRecap = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading daily market recap...');
      const data = await forexAIService.generateDailyRecap();
      setMarketRecapData(data);
      console.log('✅ Daily recap loaded:', data.source);
    } catch (error) {
      console.error('❌ Error loading daily recap:', error);
      // Fallback to mock data
      setMarketRecapData({
        date: new Date().toLocaleDateString('fr-FR'),
        summary: "Erreur lors du chargement de l'analyse IA. Veuillez réessayer.",
        keyPoints: [],
        aiInsights: {
          sentiment: "Non disponible",
          confidence: 0,
          mainTrend: "Erreur de chargement",
          recommendation: "Réessayer plus tard"
        }
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section id="analyses" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-slate-600">🤖 Génération de l'analyse IA en cours...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!marketRecapData) {
    return (
      <section id="analyses" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">❌ Erreur lors du chargement de l'analyse</p>
            <button 
              onClick={loadDailyRecap}
              className="mt-4 bg-amber-400 hover:bg-amber-500 text-slate-900 px-6 py-2 rounded-lg font-semibold"
            >
              Réessayer
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="analyses" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Récapitulatif Quotidien du Marché
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Analyse automatisée par IA des événements marquants et de leur impact sur les devises majeures
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <NewspaperIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Rapport IA du {marketRecapData.date}</h3>
                <p className="text-sm text-slate-500">Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">Date:</span>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1 text-sm"
              />
            </div>
          </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">Résumé Exécutif IA</h4>
                <p className="text-slate-700 leading-relaxed">{marketRecapData.summary}</p>
                
                {/* Show raw AI report if available */}
                {marketRecapData.rawReport && (
                  <details className="mt-4">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                      📄 Voir le rapport IA complet
                    </summary>
                    <div className="mt-3 p-4 bg-white rounded-lg border border-blue-200">
                      <div className="text-sm text-slate-700 whitespace-pre-line">
                        {marketRecapData.rawReport}
                      </div>
                    </div>
                  </details>
                )}
                
                {marketRecapData.economicData && Object.keys(marketRecapData.economicData).length > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <h5 className="text-sm font-semibold text-slate-800 mb-2">📊 Données Économiques FRED (Officielles)</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {Object.entries(marketRecapData.economicData).map(([indicator, data]) => (
                        <div key={indicator} className="bg-slate-50 p-2 rounded">
                          <div className="font-medium text-slate-700">{indicator}</div>
                          <div className="text-blue-600 font-semibold">{data.value}</div>
                          <div className="text-slate-500">{data.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Points Clés du Jour</h4>
              <div className="space-y-4">
                {marketRecapData.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-slate-50">
                    <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                      point.impact === 'positif' ? 'bg-green-400' : 
                      point.impact === 'négatif' ? 'bg-red-400' : 'bg-yellow-400'
                    }`}></div>
                    <div>
                      <h5 className="font-medium text-slate-900">{point.title}</h5>
                      <p className="text-sm text-slate-600 mt-1">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Insights IA</h4>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-slate-400">Sentiment Global</div>
                    <div className="text-lg font-semibold text-amber-400">{marketRecapData.aiInsights.sentiment}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Confiance IA</div>
                    <div className="text-lg font-semibold text-green-400">{marketRecapData.aiInsights.confidence}%</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-slate-400 mb-2">Tendance Principale</div>
                  <div className="text-sm">{marketRecapData.aiInsights.mainTrend}</div>
                </div>
                
                <div>
                  <div className="text-sm text-slate-400 mb-2">Recommandation IA</div>
                  <div className="text-sm text-amber-300">{marketRecapData.aiInsights.recommendation}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Currency Analysis Component
export const CurrencyAnalysis = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [currencyData, setCurrencyData] = useState({});
  const [loading, setLoading] = useState(false);
  
  const currencies = {
    EUR: { name: "Euro", flag: "🇪🇺", currentRate: "1.0847", change: "+0.23%", trend: "up" },
    USD: { name: "Dollar US", flag: "🇺🇸", currentRate: "1.0000", change: "-0.18%", trend: "down" },
    GBP: { name: "Livre Sterling", flag: "🇬🇧", currentRate: "1.2734", change: "+0.45%", trend: "up" },
    JPY: { name: "Yen Japonais", flag: "🇯🇵", currentRate: "156.89", change: "-0.31%", trend: "down" },
    CHF: { name: "Franc Suisse", flag: "🇨🇭", currentRate: "0.8954", change: "+0.12%", trend: "up" },
    CAD: { name: "Dollar Canadien", flag: "🇨🇦", currentRate: "1.3642", change: "+0.08%", trend: "up" },
    AUD: { name: "Dollar Australien", flag: "🇦🇺", currentRate: "0.6698", change: "+0.27%", trend: "up" }
  };

  useEffect(() => {
    loadCurrencyAnalysis(selectedCurrency);
  }, [selectedCurrency]);

  const loadCurrencyAnalysis = async (currency) => {
    setLoading(true);
    try {
      console.log(`🔄 Loading analysis for ${currency}...`);
      const analysis = await forexAIService.generateCurrencyAnalysis(currency);
      setCurrencyData(prev => ({...prev, [currency]: analysis}));
      console.log(`✅ Analysis loaded for ${currency}:`, analysis.source || 'Mock data');
    } catch (error) {
      console.error(`❌ Error loading analysis for ${currency}:`, error);
    }
    setLoading(false);
  };

  const selectedCurr = currencies[selectedCurrency];
  const analysisData = currencyData[selectedCurrency];

  return (
    <section id="devises" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Analyse Fondamentale des Devises
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Analyse IA approfondie des 7 devises majeures avec scores fondamentaux et techniques
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            {Object.entries(currencies).map(([code, currency]) => (
              <button
                key={code}
                onClick={() => setSelectedCurrency(code)}
                className={`p-4 rounded-xl text-center transition-all transform hover:scale-105 ${
                  selectedCurrency === code 
                    ? 'bg-amber-400 text-slate-900' 
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                <div className="text-2xl mb-2">{currency.flag}</div>
                <div className="font-semibold text-sm">{code}</div>
                <div className={`text-xs mt-1 ${
                  currency.trend === 'up' ? 'text-green-400' : 'text-red-400'
                } ${selectedCurrency === code ? 'text-slate-700' : ''}`}>
                  {currency.change}
                </div>
              </button>
            ))}
          </div>

            <div className="bg-white rounded-xl p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-slate-600">🤖 Analyse IA en cours pour {selectedCurrency}...</p>
              </div>
            ) : (
              <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{selectedCurr.flag}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedCurr.name} ({selectedCurrency})</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-slate-700">{selectedCurr.currentRate}</span>
                      <span className={`text-sm font-medium ${
                        selectedCurr.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedCurr.trend === 'up' ? '↗' : '↘'} {selectedCurr.change}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-bold px-4 py-2 rounded-lg ${
                    analysisData?.aiRating === 'ACHAT' ? 'bg-green-100 text-green-800' :
                    analysisData?.aiRating === 'VENTE' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {analysisData?.aiRating || 'CHARGEMENT...'}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    Confiance: {analysisData?.confidence || 0}%
                  </div>
                  {analysisData?.source && (
                    <div className="text-xs text-blue-600 mt-1">
                      📡 {analysisData.source}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">Scores d'Analyse</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Score Fondamental</span>
                        <span className="text-sm font-bold text-slate-900">{analysisData?.fundamentalScore || 0}/100</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                          style={{width: `${analysisData?.fundamentalScore || 0}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Score Technique</span>
                        <span className="text-sm font-bold text-slate-900">{analysisData?.technicalScore || 0}/100</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                          style={{width: `${analysisData?.technicalScore || 0}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <span className="text-sm font-medium text-slate-700">Sentiment IA:</span>
                      <span className="ml-2 text-sm font-semibold text-slate-900">{analysisData?.sentiment || 'Chargement...'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">Facteurs Clés</h4>
                  <div className="space-y-3">
                    {analysisData?.keyFactors ? (
                      analysisData.keyFactors.map((factor, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                          <span className="text-sm text-slate-700">{factor}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500 italic">Chargement des facteurs...</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">Prévision IA</h4>
                <p className="text-slate-700 leading-relaxed">
                  {analysisData?.forecast || 'Génération de la prévision IA en cours...'}
                </p>
                
                {/* Show raw AI analysis if available */}
                {analysisData?.rawAnalysis && (
                  <details className="mt-4">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                      📄 Voir l'analyse IA complète
                    </summary>
                    <div className="mt-3 p-4 bg-white rounded-lg border border-blue-200">
                      <div className="text-sm text-slate-700 whitespace-pre-line">
                        {analysisData.rawAnalysis}
                      </div>
                    </div>
                  </details>
                )}
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Economic Calendar Component
export const EconomicCalendar = () => {
  const [selectedWeek, setSelectedWeek] = useState('current');
  
  const economicEvents = [
    {
      date: "2025-06-09",
      time: "14:30",
      country: "🇺🇸",
      event: "Indice des Prix à la Consommation (IPC)",
      importance: "high",
      forecast: "2.1%",
      previous: "2.4%",
      impact: "USD",
      aiAnalysis: "Impact majeur attendu sur USD si déviation >0.2% vs prévision"
    },
    {
      date: "2025-06-10",
      time: "08:45",
      country: "🇪🇺",
      event: "Décision de Taux BCE",
      importance: "high",
      forecast: "4.25%",
      previous: "4.25%",
      impact: "EUR",
      aiAnalysis: "Maintien attendu, surveiller les commentaires de Lagarde"
    },
    {
      date: "2025-06-10",
      time: "14:30",
      country: "🇺🇸",
      event: "Demandes d'Allocations Chômage",
      importance: "medium",
      forecast: "225K",
      previous: "232K",
      impact: "USD",
      aiAnalysis: "Amélioration continue du marché du travail américain"
    },
    {
      date: "2025-06-11",
      time: "12:00",
      country: "🇬🇧",
      event: "Décision de Taux BoE",
      importance: "high",
      forecast: "5.00%",
      previous: "5.00%",
      impact: "GBP",
      aiAnalysis: "Pause attendue, focus sur l'inflation core UK"
    },
    {
      date: "2025-06-12",
      time: "01:30",
      country: "🇯🇵",
      event: "PIB Trimestriel Japonais",
      importance: "medium",
      forecast: "0.2%",
      previous: "0.1%",
      impact: "JPY",
      aiAnalysis: "Croissance modeste attendue, BoJ restera accommodante"
    },
    {
      date: "2025-06-13",
      time: "14:30",
      country: "🇺🇸",
      event: "Ventes au Détail",
      importance: "medium",
      forecast: "0.3%",
      previous: "0.1%",
      impact: "USD",
      aiAnalysis: "Consommation américaine robuste soutient USD"
    }
  ];

  const getImportanceColor = (importance) => {
    switch(importance) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <section id="calendrier" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Calendrier Économique IA
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Événements économiques majeurs avec analyse d'impact IA en temps réel
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CalendarIcon className="h-6 w-6 text-amber-400" />
                <h3 className="text-xl font-semibold text-white">Semaine du 9-13 Juin 2025</h3>
              </div>
              <div className="text-sm text-slate-300">
                Mise à jour en temps réel
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {economicEvents.map((event, index) => (
                <div key={index} className="border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{event.country}</div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-slate-600">
                            {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                          <span className="text-sm font-medium text-slate-600">{event.time}</span>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">{event.event}</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getImportanceColor(event.importance)}`}>
                        {event.importance === 'high' ? 'ÉLEVÉ' : 
                         event.importance === 'medium' ? 'MOYEN' : 'FAIBLE'}
                      </span>
                      <span className="text-sm font-medium text-slate-600">Impact: {event.impact}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm text-slate-600">Prévision</div>
                      <div className="text-lg font-semibold text-blue-600">{event.forecast}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-slate-600">Précédent</div>
                      <div className="text-lg font-semibold text-slate-700">{event.previous}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-slate-600">Analyse IA</div>
                      <div className="text-sm text-slate-700 italic">{event.aiAnalysis}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Features Section Component
export const FeaturesSection = () => {
  const features = [
    {
      icon: <SparklesIcon className="h-8 w-8" />,
      title: "IA Deep Research",
      description: "Recherche automatisée et analyse approfondie des facteurs économiques impactant les devises",
      image: "https://images.unsplash.com/photo-1710497626368-12404890be90?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxlY29ub21pYyUyMGRhdGElMjB2aXN1YWxpemF0aW9ufGVufDB8fHxibHVlfDE3NDk0MDM5NTN8MA&ixlib=rb-4.1.0&q=85"
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: "Analyses Fondamentales",
      description: "Scores et évaluations automatiques des 7 devises majeures basés sur les données économiques",
      image: "https://images.unsplash.com/photo-1645226880663-81561dcab0ae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxjdXJyZW5jeSUyMHRyYWRpbmd8ZW58MHx8fGJsdWV8MTc0OTQwMzk0OXww&ixlib=rb-4.1.0&q=85"
    },
    {
      icon: <NewspaperIcon className="h-8 w-8" />,
      title: "Rapports Quotidiens",
      description: "Synthèses automatiques des événements de marché et de leur impact sur les devises",
      image: "https://images.pexels.com/photos/7663144/pexels-photo-7663144.jpeg"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Fonctionnalités IA Avancées
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Notre intelligence artificielle révolutionne l'analyse fondamentale forex
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="aspect-w-16 aspect-h-9 relative">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Pricing Section Component
export const PricingSection = () => {
  const plan = {
    name: "ForexAI Pro",
    price: "47",
    period: "mois",
    originalPrice: "97",
    features: [
      "Analyses IA quotidiennes automatisées",
      "Deep Research en temps réel",
      "7 devises majeures analysées",
      "Calendrier économique intelligent",
      "Alertes et notifications",
      "Interface française complète",
      "Support technique prioritaire",
      "Historique d'analyses illimité"
    ]
  };

  return (
    <section id="tarifs" className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tarification Simple et Transparente
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Accédez à l'analyse fondamentale forex automatisée par IA
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-2xl transform rotate-1"></div>
          <div className="relative bg-white rounded-2xl p-8 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <SparklesIcon className="h-4 w-4" />
                <span>Offre de Lancement</span>
              </div>
              
              <h3 className="text-3xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-5xl font-bold text-slate-900">{plan.price}€</span>
                <div>
                  <div className="text-lg text-slate-600">/{plan.period}</div>
                  <div className="text-sm text-slate-500 line-through">{plan.originalPrice}€</div>
                </div>
              </div>
              
              <p className="text-slate-600 mb-6">
                Économisez 52% avec notre offre de lancement limitée
              </p>
              
              <button className="w-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-900 font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg mb-8">
                Commencer l'Essai Gratuit de 14 Jours
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Tout ce dont vous avez besoin :</h4>
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-xl text-center">
              <p className="text-sm text-slate-600">
                <strong>Garantie satisfait ou remboursé 30 jours</strong><br/>
                Aucun engagement, annulation à tout moment
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer Component
export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <SparklesIcon className="h-8 w-8 text-amber-400" />
              <span className="text-xl font-bold">ForexAI</span>
              <span className="text-xs bg-amber-400 text-slate-900 px-2 py-1 rounded-full font-semibold">PRO</span>
            </div>
            <p className="text-slate-300 mb-6 max-w-md">
              La première plateforme d'analyse fondamentale forex entièrement automatisée par intelligence artificielle. 
              Révolutionnez votre trading avec nos insights IA.
            </p>
            <div className="flex space-x-4">
              <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </button>
              <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Produit</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-300 hover:text-amber-400 transition-colors">Fonctionnalités</a></li>
              <li><a href="#" className="text-slate-300 hover:text-amber-400 transition-colors">Tarifs</a></li>
              <li><a href="#" className="text-slate-300 hover:text-amber-400 transition-colors">API</a></li>
              <li><a href="#" className="text-slate-300 hover:text-amber-400 transition-colors">Documentation</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-300 hover:text-amber-400 transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="text-slate-300 hover:text-amber-400 transition-colors">Contact</a></li>
              <li><a href="#" className="text-slate-300 hover:text-amber-400 transition-colors">Statut</a></li>
              <li><a href="#" className="text-slate-300 hover:text-amber-400 transition-colors">Communauté</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-slate-400 text-sm">
              © 2025 ForexAI. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};