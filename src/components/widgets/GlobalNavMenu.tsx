import React from 'react';
import { X } from 'lucide-react';
import LineSidebar from '@/components/widgets/LineSidebar';

export type PageView = 
  | 'landing' 
  | 'dashboard' 
  | 'scrollytelling' 
  | 'scrollytelling-two-pillar' 
  | 'directory' 
  | 'bus-stop-analysis'
  | 'bus-stop-directory';

interface GlobalNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: PageView) => void;
  onViewDirectory?: () => void;
  onViewBusStopDirectory?: () => void;
  activeItemIndex?: number;
}

export const MENU_ITEMS = [
  'Landing Page',
  'Explain this to me!',
  'Equity Scorecard Dashboard',
  'Route Directory',
  'Bus Stop Analysis',
  'Bus Stop Directory'
];

export const GlobalNavMenu: React.FC<GlobalNavMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onViewDirectory,
  onViewBusStopDirectory,
  activeItemIndex = 0
}) => {
  if (!isOpen) return null;

  const handleMenuItemClick = (index: number, label: string) => {
    onClose();
    if (label === 'Landing Page') {
      onNavigate?.('landing');
    } else if (label === 'Explain this to me!') {
      onNavigate?.('scrollytelling');
    } else if (label === 'Equity Scorecard Dashboard') {
      onNavigate?.('dashboard');
    } else if (label === 'Route Directory') {
      if (onViewDirectory) {
        onViewDirectory();
      } else {
        onNavigate?.('dashboard');
      }
    } else if (label === 'Bus Stop Analysis') {
      onNavigate?.('bus-stop-analysis');
    } else if (label === 'Bus Stop Directory') {
      onNavigate?.('bus-stop-directory');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md transition-all duration-300 flex items-start justify-start p-6 md:p-10"
      onClick={onClose}
    >
      {/* Menu Dropdown Container */}
      <div 
        className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <span className="text-xs font-black uppercase tracking-widest text-[#1e3a8a]">
            ETS ROUTE SCORECARD MENU
          </span>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <LineSidebar
          items={MENU_ITEMS}
          accentColor="#1e3a8a"
          textColor="#1e3a8a"
          markerColor="#94a3b8"
          showIndex={true}
          showMarker={true}
          proximityRadius={110}
          maxShift={46}
          falloff="smooth"
          markerLength={55}
          markerGap={28}
          tickScale={0.08}
          scaleTick={true}
          itemGap={13}
          fontSize={1.1}
          smoothing={800}
          defaultActive={activeItemIndex}
          onItemClick={handleMenuItemClick}
        />
      </div>
    </div>
  );
};
