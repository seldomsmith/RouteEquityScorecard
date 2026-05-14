import { create } from 'zustand';

interface RouteState {
  // Analytical Weights
  weights: {
    vulnerability: number;
    resilience: number;
    monopoly: number;
    opportunity: number;
  };
  
  // Interaction State
  selectedRoute: string | null;
  hoveredRoute: string | null;
  selectedDa: string | null;
  
  // Simulation State
  removedRoutes: string[];
  
  // Actions
  setWeight: (key: keyof RouteState['weights'], value: number) => void;
  setSelectedRoute: (routeId: string | null) => void;
  setHoveredRoute: (routeId: string | null) => void;
  setSelectedDa: (daId: string | null) => void;
  toggleRemovedRoute: (routeId: string) => void;
  resetSimulation: () => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  weights: {
    vulnerability: 35,
    resilience: 25,
    monopoly: 25,
    opportunity: 15,
  },
  
  selectedRoute: null,
  hoveredRoute: null,
  selectedDa: null,
  
  removedRoutes: [],
  
  setWeight: (key, value) => set((state) => ({
    weights: { ...state.weights, [key]: value }
  })),
  
  setSelectedRoute: (routeId) => set({ selectedRoute: routeId }),
  setHoveredRoute: (routeId) => set({ hoveredRoute: routeId }),
  setSelectedDa: (daId) => set({ selectedDa: daId }),
  
  toggleRemovedRoute: (routeId) => set((state) => {
    const isRemoved = state.removedRoutes.includes(routeId);
    return {
      removedRoutes: isRemoved 
        ? state.removedRoutes.filter(id => id !== routeId)
        : [...state.removedRoutes, routeId]
    };
  }),
  
  resetSimulation: () => set({ removedRoutes: [] })
}));
