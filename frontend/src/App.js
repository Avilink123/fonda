import React from "react";
import "./App.css";
import { Navigation, HeroSection, DailyMarketRecap, CurrencyAnalysis, EconomicCalendar, FeaturesSection, PricingSection, Footer } from './components';

function App() {
  return (
    <div className="App">
      <Navigation />
      <HeroSection />
      <DailyMarketRecap />
      <CurrencyAnalysis />
      <EconomicCalendar />
      <FeaturesSection />
      <PricingSection />
      <Footer />
    </div>
  );
}

export default App;