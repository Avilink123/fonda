# ForexAI - Plateforme d'Analyse Fondamentale Forex par IA

## 🚀 Vue d'ensemble

ForexAI est une plateforme révolutionnaire d'analyse fondamentale forex entièrement automatisée par intelligence artificielle. Elle combine Perplexity AI pour l'analyse profonde et FRED pour les données économiques en temps réel.

## 🎯 Fonctionnalités Principales

### ✅ Déjà Implémentées
- ✅ Interface française moderne et épurée
- ✅ Analyse des 7 devises majeures (EUR, USD, GBP, JPY, CHF, CAD, AUD)
- ✅ Tableau de bord responsive
- ✅ Calendrier économique intelligent
- ✅ Rapports quotidiens automatisés (interface)
- ✅ Design professionnel pour traders forex
- ✅ Structure prête pour intégrations API

### 🔄 En Attente d'API Keys
- 🔄 Daily Market Recap automatique par Perplexity AI
- 🔄 Currency Analysis fondamentale en temps réel
- 🔄 Deep Research automatisé
- 🔄 Données économiques FRED en temps réel

## 🔑 Configuration des API Keys

### APIs Requises

#### 1. Perplexity AI (Analyse IA)
- **URL**: https://www.perplexity.ai/settings/api
- **Coût**: ~$0.50-$2 par million de tokens
- **Usage**: Analyse fondamentale automatisée, rapports quotidiens

#### 2. FRED Economic Data (Données Économiques)
- **URL**: https://fred.stlouisfed.org/docs/api/api_key.html
- **Coût**: Gratuit
- **Usage**: Indicateurs économiques US, EU, UK, JP, CA, AU

### Installation des API Keys

1. Obtenez vos clés API des services ci-dessus
2. Créez un fichier `.env.local` dans `/app/frontend/`:

```bash
# API Keys for ForexAI
REACT_APP_PERPLEXITY_API_KEY=your_perplexity_key_here
REACT_APP_FRED_API_KEY=your_fred_key_here
```

3. Redémarrez l'application:
```bash
cd /app && sudo supervisorctl restart frontend
```

## 🏗️ Architecture Technique

### Structure des Fichiers
```
/app/frontend/src/
├── components.js          # Tous les composants React
├── App.js                # Application principale  
├── App.css              # Styles CSS personnalisés
└── services/
    ├── apiConfig.js     # Configuration des APIs
    └── forexAIService.js # Service d'intégration IA
```

## 🤖 Intégration IA

### Perplexity AI
- **Modèle**: `llama-3.1-sonar-small-128k-online`
- **Température**: 0.2 (analyse factuelle)
- **Tokens Max**: 4000
- **Prompts spécialisés** pour l'analyse forex

### FRED Economic Data
- **Indicateurs surveillés**:
  - Taux d'intérêt (Fed, BCE, BoE, BoJ, BoC, RBA)
  - Inflation (CPI pour toutes les zones)
  - PIB, Emploi, Ventes au détail

## 🎨 Design & UX

### Palette de Couleurs
- **Primaire**: Bleu marine (#1e3a8a)
- **Accent**: Doré (#f59e0b)
- **Arrière-plan**: Slate (#0f172a)

## 🚀 Scripts Disponibles

### `yarn start`
Lance l'application en mode développement sur [http://localhost:3000](http://localhost:3000)

### `yarn build`
Compile l'application pour la production

### `yarn test`
Lance les tests

## 📊 Données Mockées

En l'absence d'API keys, la plateforme utilise des données mockées réalistes pour toutes les fonctionnalités.

## 🔧 Support Technique

Pour l'intégration des APIs, consultez:
- `/src/services/apiConfig.js` - Configuration
- `/src/services/forexAIService.js` - Service principal

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
