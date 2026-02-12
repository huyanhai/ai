import { create } from "zustand";

interface SmartHomeState {
  lightIntensity: number;
  lightColor: string;
  isDoorOpen: boolean;
  temperature: number;
  
  // Actions
  setLightIntensity: (intensity: number) => void;
  setLightColor: (color: string) => void;
  setDoorOpen: (isOpen: boolean) => void;
  setTemperature: (temp: number) => void;
  
  // Update multiple states
  updateStates: (states: Partial<Omit<SmartHomeState, "setLightIntensity" | "setLightColor" | "setDoorOpen" | "setTemperature" | "updateStates">>) => void;
}

export const useSmartHomeStore = create<SmartHomeState>((set) => ({
  lightIntensity: 1,
  lightColor: "#ffffff",
  isDoorOpen: false,
  temperature: 24,

  setLightIntensity: (intensity) => set({ lightIntensity: intensity }),
  setLightColor: (color) => set({ lightColor: color }),
  setDoorOpen: (isOpen) => set({ isDoorOpen: isOpen }),
  setTemperature: (temp) => set({ temperature: temp }),
  
  updateStates: (states) => set((state) => ({ ...state, ...states })),
}));
