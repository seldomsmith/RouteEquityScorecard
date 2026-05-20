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
  selectedGrade: string | null;
  
  // Simulation State
  removedRoutes: string[];
  
  // Actions
  setWeight: (key: keyof RouteState['weights'], value: number) => void;
  setWeights: (weights: RouteState['weights']) => void;
  setSelectedRoute: (routeId: string | null) => void;
  setHoveredRoute: (routeId: string | null) => void;
  setSelectedDa: (daId: string | null) => void;
  setSelectedGrade: (grade: string | null) => void;
  toggleRemovedRoute: (routeId: string) => void;
  resetSimulation: () => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  weights: {
    vulnerability: 15,
    resilience: 40,
    monopoly: 10,
    opportunity: 35,
  },
  
  selectedRoute: null,
  hoveredRoute: null,
  selectedDa: null,
  selectedGrade: null,
  
  removedRoutes: [],
  
  setWeight: (key, value) => set((state) => {
    const STEP = 5;
    const TOTAL_STEPS = 20; // 100% / 5%

    // Convert new value to integer steps
    const targetSteps = Math.min(Math.max(Math.round(value / STEP), 0), TOTAL_STEPS);
    const remainingSteps = TOTAL_STEPS - targetSteps;

    const others = (Object.keys(state.weights) as Array<keyof typeof state.weights>)
      .filter((k) => k !== key);

    // Convert current other weights to steps
    const otherSteps = others.map((k) => ({
      key: k,
      steps: Math.round(state.weights[k] / STEP)
    }));

    const otherTotalSteps = otherSteps.reduce((sum, item) => sum + item.steps, 0);

    const newWeights = { ...state.weights, [key]: targetSteps * STEP };

    if (otherTotalSteps === 0) {
      // Distribute remaining steps equally among others
      const baseShare = Math.floor(remainingSteps / others.length);
      const extraSteps = remainingSteps % others.length;

      others.forEach((k, idx) => {
        const share = baseShare + (idx < extraSteps ? 1 : 0);
        newWeights[k] = share * STEP;
      });
    } else {
      // Proportional allocation using the Largest Remainder Method (Hamilton Method)
      const allocations = otherSteps.map((item) => {
        const ideal = (item.steps / otherTotalSteps) * remainingSteps;
        const floor = Math.floor(ideal);
        const remainder = ideal - floor;
        return {
          key: item.key,
          allocated: floor,
          remainder
        };
      });

      const allocatedTotal = allocations.reduce((sum, a) => sum + a.allocated, 0);
      const leftover = remainingSteps - allocatedTotal;

      // Sort allocations by remainder descending
      allocations.sort((a, b) => b.remainder - a.remainder);

      // Distribute leftover steps
      for (let i = 0; i < leftover; i++) {
        allocations[i].allocated += 1;
      }

      // Convert back to percentages
      allocations.forEach((a) => {
        newWeights[a.key] = a.allocated * STEP;
      });
    }

    return { weights: newWeights };
  }),
  
  setWeights: (weights) => set({ weights }),
  
  setSelectedRoute: (routeId) => set({ selectedRoute: routeId }),
  setHoveredRoute: (routeId) => set({ hoveredRoute: routeId }),
  setSelectedDa: (daId) => set({ selectedDa: daId }),
  setSelectedGrade: (grade) => set({ selectedGrade: grade }),
  
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
