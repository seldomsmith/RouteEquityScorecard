import React from 'react';
import { X } from 'lucide-react';
import LineSidebar, { SidebarItemObject } from '@/components/widgets/LineSidebar';

export type PageView = 
  | 'landing' 
  | 'dashboard' 
  | 'scrollytelling' 
  | 'scrollytelling-two-pillar' 
  | 'directory' 
  | 'bus-stop-analysis'
  | 'bus-stop-directory'
  | 'bus-stop-graphs';

interface GlobalNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: PageView) => void;
  onViewDirectory?: () => void;
  activeItemIndex?: number;
}

export interface NavMenuItem extends SidebarItemObject {
  page?: PageView;
}

export const STRUCTURED_MENU_ITEMS: NavMenuItem[] = [
  { label: 'Landing Page', page: 'landing' },
  { label: 'Route Equity Score Card', code: '1.0', isHeader: true, page: 'scrollytelling' },
  { label: 'Explain this to me!', code: '1.1', indent: true, page: 'scrollytelling' },
  { label: 'Route Equity Scorecard Dashboard', code: '1.2', indent: true, page: 'dashboard' },
  { label: 'Route Directory', code: '1.3', indent: true, page: 'directory' },
  { label: 'Bus Stop Equity Scorecard', code: '2.0', isHeader: true, page: 'bus-stop-analysis' },
  { label: 'Bus Stop Equity Dashboard', code: '2.1', indent: true, page: 'bus-stop-analysis' },
  { label: 'Bus Stop Directory', code: '2.2', indent: true, page: 'bus-stop-directory' },
  { label: 'Bus Stop Graphs and Figures', code: '2.3', indent: true, page: 'bus-stop-graphs' }
];

export const MENU_ITEMS = STRUCTURED_MENU_ITEMS.map(i => i.label);

export const GlobalNavMenu: React.FC<GlobalNavMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onViewDirectory,
  activeItemIndex = 0
}) => {
  if (!isOpen) return null;

  const handleMenuItemClick = (index: number, label: string, page?: PageView) => {
    onClose();
    const targetPage = page || STRUCTURED_MENU_ITEMS[index]?.page;
    if (targetPage) {
      onNavigate?.(targetPage);
    }
  };

  const legacyIndexMap: Record<number, number> = {
    0: 0, // Landing Page
    1: 2, // Explain this to me!
    2: 3, // Route Equity Scorecard Dashboard
    3: 4, // Route Directory
    4: 6, // Bus Stop Equity Dashboard
    5: 7, // Bus Stop Directory
    6: 8  // Bus Stop Graphs and Figures
  };

  const computedActiveIndex = (activeItemIndex in legacyIndexMap && activeItemIndex < 7) 
    ? legacyIndexMap[activeItemIndex] 
    : activeItemIndex;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md transition-all duration-300 flex items-start justify-start p-6 md:p-10"
      onClick={onClose}
    >
      {/* Menu Dropdown Container */}
      <div 
        className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 sm:p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200 relative max-h-[85vh] overflow-y-auto overflow-x-hidden"
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
          items={STRUCTURED_MENU_ITEMS}
          accentColor="#1e3a8a"
          textColor="#1e3a8a"
          markerColor="#94a3b8"
          showIndex={false}
          showMarker={false}
          proximityRadius={80}
          maxShift={0}
          falloff="smooth"
          scaleTick={false}
          itemGap={8}
          smoothing={300}
          defaultActive={computedActiveIndex}
          onItemClick={handleMenuItemClick}
        />
      </div>
    </div>
  );
};
