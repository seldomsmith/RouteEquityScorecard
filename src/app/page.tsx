"use client";

import React, { useState } from 'react';
import { CommandCentre } from "@/components/CommandCentre";
import { LandingPage } from "@/components/LandingPage";
import { Scrollytelling } from "@/components/Scrollytelling";
import { ScrollytellingTwoPillar } from "@/components/ScrollytellingTwoPillar";

export default function Home() {
  const [view, setView] = useState<'landing' | 'dashboard' | 'scrollytelling' | 'scrollytelling-two-pillar'>('landing');

  if (view === 'dashboard') {
    return <CommandCentre />;
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
