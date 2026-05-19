import { create } from 'zustand';

interface UIState {
  allRouteMetrics: any[];
  selectedRoute: string | null;
  isWidgetsCollapsed: boolean;
  setAllRouteMetrics: (metrics: any[]) => void;
  setSelectedRoute: (routeId: string | null) => void;
  toggleWidgets: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  allRouteMetrics: [],
  selectedRoute: null,
  isWidgetsCollapsed: false,
  setAllRouteMetrics: (metrics) => set({ allRouteMetrics: metrics }),
  setSelectedRoute: (routeId) => set({ selectedRoute: routeId }),
  toggleWidgets: () => set((state) => ({ isWidgetsCollapsed: !state.isWidgetsCollapsed })),
}));
