import { create } from 'zustand';

export type MetricKey = 'composite' | 'low_income_pct' | 'minority_pct' | 'senior_pct' | 'lone_parent_pct' | 'recent_immigrant_pct' | 'youth_pct';

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
  activeMetric: MetricKey;
  
  // Simulation State
  removedRoutes: string[];
  
  // Actions
  setWeight: (key: keyof RouteState['weights'], value: number) => void;
  setWeights: (weights: RouteState['weights']) => void;
  toggleWeightEnabled: (key: keyof RouteState['weights']) => void;
  setSelectedRoute: (routeId: string | null) => void;
  setHoveredRoute: (routeId: string | null) => void;
  setSelectedDa: (daId: string | null) => void;
  setSelectedGrade: (grade: string | null) => void;
  setActiveMetric: (metric: MetricKey) => void;
  toggleRemovedRoute: (routeId: string) => void;
  resetSimulation: () => void;
  disabledWeights: (keyof RouteState['weights'])[];
  
  // Meta Resiliency Filter Mode State
  mapFilterMode: 'grade' | 'stability';
  selectedStabilityClasses: string[];
  setMapFilterMode: (mode: 'grade' | 'stability') => void;
  toggleStabilityClass: (stabilityClass: string) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  weights: {
    vulnerability: 15,
    resilience: 40,
    monopoly: 10,
    opportunity: 35,
  },
  
  disabledWeights: [],
  selectedRoute: null,
  hoveredRoute: null,
  selectedDa: null,
  selectedGrade: null,
  activeMetric: 'composite',
  
  removedRoutes: [],
  
  setWeight: (key, value) => set((state) => {
    if (state.disabledWeights.includes(key)) return {};

    const STEP = 5;
    const TOTAL_STEPS = 20; // 100% / 5%

    // Convert new value to integer steps
    const targetSteps = Math.min(Math.max(Math.round(value / STEP), 0), TOTAL_STEPS);
    const remainingSteps = TOTAL_STEPS - targetSteps;

    const others = (Object.keys(state.weights) as Array<keyof typeof state.weights>)
      .filter((k) => k !== key && !state.disabledWeights.includes(k));

    if (others.length === 0) {
      return {};
    }

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
  
  setWeights: (weights) => set({ weights, disabledWeights: [] }),
  
  toggleWeightEnabled: (key) => set((state) => {
    const isCurrentlyDisabled = state.disabledWeights.includes(key);
    
    // Safety check: Cannot disable all weights. Must leave at least one enabled.
    if (!isCurrentlyDisabled && state.disabledWeights.length >= Object.keys(state.weights).length - 1) {
      return {};
    }

    const newDisabled = isCurrentlyDisabled
      ? state.disabledWeights.filter((k) => k !== key)
      : [...state.disabledWeights, key];

    const STEP = 5;
    const TOTAL_STEPS = 20;

    const newWeights = { ...state.weights };

    if (!isCurrentlyDisabled) {
      newWeights[key] = 0;
      
      const others = (Object.keys(state.weights) as Array<keyof typeof state.weights>)
        .filter((k) => k !== key && !newDisabled.includes(k));
      
      const otherSteps = others.map((k) => ({
        key: k,
        steps: Math.round(state.weights[k] / STEP)
      }));
      const otherTotalSteps = otherSteps.reduce((sum, item) => sum + item.steps, 0);

      if (otherTotalSteps === 0) {
        const baseShare = Math.floor(TOTAL_STEPS / others.length);
        const extraSteps = TOTAL_STEPS % others.length;
        others.forEach((k, idx) => {
          newWeights[k] = (baseShare + (idx < extraSteps ? 1 : 0)) * STEP;
        });
      } else {
        const allocations = otherSteps.map((item) => {
          const ideal = (item.steps / otherTotalSteps) * TOTAL_STEPS;
          const floor = Math.floor(ideal);
          const remainder = ideal - floor;
          return { key: item.key, allocated: floor, remainder };
        });

        const allocatedTotal = allocations.reduce((sum, a) => sum + a.allocated, 0);
        const leftover = TOTAL_STEPS - allocatedTotal;
        allocations.sort((a, b) => b.remainder - a.remainder);
        for (let i = 0; i < leftover; i++) {
          allocations[i].allocated += 1;
        }
        allocations.forEach((a) => {
          newWeights[a.key] = a.allocated * STEP;
        });
      }
    } else {
      const targetWeight = 10; // 10% baseline
      newWeights[key] = targetWeight;
      const targetSteps = targetWeight / STEP;
      const remainingSteps = TOTAL_STEPS - targetSteps;

      const others = (Object.keys(state.weights) as Array<keyof typeof state.weights>)
        .filter((k) => k !== key && !newDisabled.includes(k));

      const otherSteps = others.map((k) => ({
        key: k,
        steps: Math.round(state.weights[k] / STEP)
      }));
      const otherTotalSteps = otherSteps.reduce((sum, item) => sum + item.steps, 0);

      if (otherTotalSteps === 0) {
        const baseShare = Math.floor(remainingSteps / others.length);
        const extraSteps = remainingSteps % others.length;
        others.forEach((k, idx) => {
          newWeights[k] = (baseShare + (idx < extraSteps ? 1 : 0)) * STEP;
        });
      } else {
        const allocations = otherSteps.map((item) => {
          const ideal = (item.steps / otherTotalSteps) * remainingSteps;
          const floor = Math.floor(ideal);
          const remainder = ideal - floor;
          return { key: item.key, allocated: floor, remainder };
        });

        const allocatedTotal = allocations.reduce((sum, a) => sum + a.allocated, 0);
        const leftover = remainingSteps - allocatedTotal;
        allocations.sort((a, b) => b.remainder - a.remainder);
        for (let i = 0; i < leftover; i++) {
          allocations[i].allocated += 1;
        }
        allocations.forEach((a) => {
          newWeights[a.key] = a.allocated * STEP;
        });
      }
    }

    // Special case: If only vulnerability and opportunity are enabled (resilience and monopoly are disabled)
    if (newDisabled.includes('resilience') && newDisabled.includes('monopoly')) {
      newWeights.vulnerability = 30;
      newWeights.opportunity = 70;
      newWeights.resilience = 0;
      newWeights.monopoly = 0;
    }

    return {
      disabledWeights: newDisabled,
      weights: newWeights
    };
  }),
  
  setSelectedRoute: (routeId) => set({ selectedRoute: routeId }),
  setHoveredRoute: (routeId) => set({ hoveredRoute: routeId }),
  setSelectedDa: (daId) => set({ selectedDa: daId }),
  setSelectedGrade: (grade) => set({ selectedGrade: grade }),
  setActiveMetric: (metric) => set({ activeMetric: metric }),
  
  toggleRemovedRoute: (routeId) => set((state) => {
    const isRemoved = state.removedRoutes.includes(routeId);
    return {
      removedRoutes: isRemoved 
      ? state.removedRoutes.filter(id => id !== routeId)
      : [...state.removedRoutes, routeId]
    };
  }),
  
  resetSimulation: () => set({ removedRoutes: [] }),
  
  mapFilterMode: 'grade',
  selectedStabilityClasses: [],
  setMapFilterMode: (mode) => set({ mapFilterMode: mode, selectedGrade: null, selectedStabilityClasses: [] }),
  toggleStabilityClass: (stabilityClass) => set((state) => {
    const isSelected = state.selectedStabilityClasses.includes(stabilityClass);
    return {
      selectedStabilityClasses: isSelected
        ? state.selectedStabilityClasses.filter(c => c !== stabilityClass)
        : [...state.selectedStabilityClasses, stabilityClass]
    };
  })
}));
