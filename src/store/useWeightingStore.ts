import { create } from 'zustand';

interface WeightingState {
  vulnerability: number;
  temporal: number;
  monopoly: number;
  opportunity: number;
  setWeight: (key: 'vulnerability' | 'temporal' | 'monopoly' | 'opportunity', value: number) => void;
}

export const useWeightingStore = create<WeightingState>((set) => ({
  vulnerability: 0.40,
  temporal: 0.20,
  monopoly: 0.20,
  opportunity: 0.20,

  setWeight: (key, newValue) => set((state) => {
    const remainingValue = 1 - newValue;
    const keys = ['vulnerability', 'temporal', 'monopoly', 'opportunity'] as const;
    const otherKeys = keys.filter(k => k !== key);
    const currentOthersSum = otherKeys.reduce((sum, k) => sum + state[k], 0);
    
    const newState = { ...state, [key]: newValue };
    
    otherKeys.forEach(k => {
      if (currentOthersSum === 0) {
        newState[k] = remainingValue / 3;
      } else {
        newState[k] = (state[k] / currentOthersSum) * remainingValue;
      }
    });

    return newState;
  }),
}));
