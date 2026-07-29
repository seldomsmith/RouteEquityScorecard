"use client";

import React, { useState } from 'react';
import { CommandCentre } from "@/components/CommandCentre";
import { LandingPage } from "@/components/LandingPage";
import { Scrollytelling } from "@/components/Scrollytelling";
import { ScrollytellingTwoPillar } from "@/components/ScrollytellingTwoPillar";
import { BusStopAnalysis } from "@/components/BusStopAnalysis";
import { BusStopDirectoryPage } from "@/components/BusStopDirectoryPage";
import { RouteDirectoryPage } from "@/components/RouteDirectoryPage";
import { PageView } from "@/components/widgets/GlobalNavMenu";

export default function Home() {
  const [view, setView] = useState<PageView>('landing');
  const [targetBusStopId, setTargetBusStopId] = useState<string | null>(null);

  const handleNavigate = (page: PageView) => {
    setView(page);
  };

  if (view === 'directory') {
    return <RouteDirectoryPage onNavigate={handleNavigate} />;
  }

  if (view === 'dashboard') {
    return <CommandCentre onNavigate={handleNavigate} />;
  }

  if (view === 'bus-stop-analysis') {
    return (
      <BusStopAnalysis 
        onNavigate={handleNavigate} 
        initialSelectedStopId={targetBusStopId}
      />
    );
  }

  if (view === 'bus-stop-directory') {
    return (
      <BusStopDirectoryPage 
        onNavigate={handleNavigate}
        onSelectStopOnMap={(stopId) => {
          setTargetBusStopId(stopId);
          setView('bus-stop-analysis');
        }}
      />
    );
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
      onNavigate={handleNavigate}
    />
  );
}
