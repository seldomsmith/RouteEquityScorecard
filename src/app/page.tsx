"use client";

import React, { useState } from 'react';
import { CommandCentre } from "@/components/CommandCentre";
import { LandingPage } from "@/components/LandingPage";
import { Scrollytelling } from "@/components/Scrollytelling";

export default function Home() {
  const [view, setView] = useState<'landing' | 'dashboard' | 'scrollytelling'>('landing');

  if (view === 'dashboard') {
    return <CommandCentre />;
  }

  if (view === 'scrollytelling') {
    return (
      <Scrollytelling 
        onBack={() => setView('landing')} 
        onJumpIn={() => setView('dashboard')} 
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
