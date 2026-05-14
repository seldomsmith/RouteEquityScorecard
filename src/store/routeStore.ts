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
  
  setWeight: (key, value) => set((state) => {
    const clamped = Math.min(Math.max(Math.round(value), 0), 100);
    const others = (Object.keys(state.weights) as Array<keyof typeof state.weights>)
      .filter((k) => k !== key);
    
    const remaining = 100 - clamped;
    const otherTotal = others.reduce((sum, k) => sum + state.weights[k], 0);
    
    const newWeights = { ...state.weights, [key]: clamped };
    
    if (otherTotal === 0) {
      // Edge case: all others are 0, distribute equally
      others.forEach((k) => { newWeights[k] = Math.round(remaining / others.length); });
    } else {
      // Proportionally redistribute remaining budget
      let distributed = 0;
      others.forEach((k, i) => {
        if (i === others.length - 1) {
          // Last one gets the remainder to avoid rounding drift
          newWeights[k] = remaining - distributed;
        } else {
          const share = Math.round((state.weights[k] / otherTotal) * remaining);
          newWeights[k] = share;
          distributed += share;
        }
      });
    }
    
    return { weights: newWeights };
  }),
  
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
