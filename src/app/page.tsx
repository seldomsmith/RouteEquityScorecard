"use client";

import React, { useState } from 'react';
import { CommandCentre } from "@/components/CommandCentre";
import { LandingPage } from "@/components/LandingPage";
import { Scrollytelling } from "@/components/Scrollytelling";
import { ScrollytellingTwoPillar } from "@/components/ScrollytellingTwoPillar";
import { BusStopAnalysis } from "@/components/BusStopAnalysis";

export default function Home() {
  const [view, setView] = useState<'landing' | 'dashboard' | 'scrollytelling' | 'scrollytelling-two-pillar' | 'bus-stop-analysis'>('landing');

  const handleNavigate = (page: 'landing' | 'dashboard' | 'scrollytelling' | 'scrollytelling-two-pillar' | 'directory' | 'bus-stop-analysis') => {
    if (page === 'landing') setView('landing');
    else if (page === 'dashboard') setView('dashboard');
    else if (page === 'scrollytelling') setView('scrollytelling');
    else if (page === 'scrollytelling-two-pillar') setView('scrollytelling-two-pillar');
    else if (page === 'bus-stop-analysis') setView('bus-stop-analysis');
  };

  if (view === 'dashboard') {
    return <CommandCentre onNavigate={handleNavigate} />;
  }

  if (view === 'bus-stop-analysis') {
    return <BusStopAnalysis onNavigate={handleNavigate} />;
  }

  if (view === 'scrollytelling') {
    return (
      <Scrollytelling 
        onBack={() => setView('landing')} 
        onJumpIn={() => setView('dashboard')} 
        onToggleVersion={() => setView('scrollytelling-two-pillar')}
      />
    );
  }

  if (view === 'scrollytelling-two-pillar') {
    return (
      <ScrollytellingTwoPillar 
        onBack={() => setView('landing')} 
        onJumpIn={() => setView('dashboard')} 
        onToggleVersion={() => setView('scrollytelling')}
      />
    );
  }

  return (
    <LandingPage 
      onTellMeHow={() => setView('scrollytelling')} 
      onJumpIn={() => setView('dashboard')} 
    />
  );
}
