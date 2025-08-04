import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { LatLngExpression } from 'leaflet';
import { DATASETS } from '@/config/dataset';

export interface ColorRule {
  id: string;
  operator: '<' | '<=' | '>' | '>=' | '=';
  value: number;
  color: string;
}

export interface Polygon {
  id: string;
  name: string;
  latlngs: LatLngExpression[];
  rules: readonly ColorRule[]; // Changed to readonly
  fetchedTemp: number | null;
  isLoading: boolean;
  color: string;
}

interface AppState {
  polygons: Record<string, Polygon>;
  timeRange: [number, number];

  addPolygon: (polygon: { id: string; latlngs: LatLngExpression[] }) => void;
  updatePolygonShape: (id: string, latlngs: LatLngExpression[]) => void;
  removePolygon: (id: string) => void;
  renamePolygon: (id: string, name: string) => void;
  updatePolygonRule: (polygonId: string, ruleId: string, newRule: Partial<ColorRule>) => void;
  addPolygonRule: (polygonId: string) => void;
  removePolygonRule: (polygonId: string, ruleId: string) => void;
  setPolygonData: (id: string, temp: number | null, color: string) => void;
  setPolygonLoading: (id: string, isLoading: boolean) => void;
  setTimeRange: (range: [number, number]) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        polygons: {},
        timeRange: [0, 0],

        setTimeRange: (range) => set({ timeRange: range }),

        addPolygon: (polygon) =>
          set((state) => ({
            polygons: {
              ...state.polygons,
              [polygon.id]: {
                ...polygon,
                name: `Region ${polygon.id.slice(0, 6)}`,
                isLoading: true,
                rules: DATASETS.temperature_2m.defaultRules,
                fetchedTemp: null,
                color: '#9ca3af',
              },
            },
          })),

        updatePolygonShape: (id, latlngs) => {
          set((state) => ({
            polygons: { ...state.polygons, [id]: { ...state.polygons[id], latlngs } },
          }));
          get().setPolygonLoading(id, true);
        },

        removePolygon: (id) =>
          set((state) => {
            const newPolygons = { ...state.polygons };
            delete newPolygons[id];
            return { polygons: newPolygons };
          }),

        renamePolygon: (id, name) =>
          set((state) => ({
            polygons: { ...state.polygons, [id]: { ...state.polygons[id], name } },
          })),

        updatePolygonRule: (polygonId, ruleId, newRule) =>
          set((state) => {
            const polygon = state.polygons[polygonId];
            const updatedRules = polygon.rules.map(r => r.id === ruleId ? { ...r, ...newRule } : r);
            return {
              polygons: { ...state.polygons, [polygonId]: { ...polygon, rules: updatedRules } },
            };
          }),

        addPolygonRule: (polygonId) =>
          set((state) => {
            const polygon = state.polygons[polygonId];
            const newRule: ColorRule = {
              id: Math.random().toString(36).substr(2, 9),
              operator: '=', value: 0, color: '#ffffff',
            };
            return {
              polygons: { ...state.polygons, [polygonId]: { ...polygon, rules: [...polygon.rules, newRule] } },
            };
          }),

        removePolygonRule: (polygonId, ruleId) =>
          set((state) => {
            const polygon = state.polygons[polygonId];
            const filteredRules = polygon.rules.filter(r => r.id !== ruleId);
            return {
              polygons: { ...state.polygons, [polygonId]: { ...polygon, rules: filteredRules } },
            };
          }),

        setPolygonData: (id, temp, color) =>
          set((state) => ({
            polygons: state.polygons[id]
              ? { ...state.polygons, [id]: { ...state.polygons[id], fetchedTemp: temp, color, isLoading: false } }
              : state.polygons,
          })),

        setPolygonLoading: (id, isLoading) =>
          set((state) => ({
            polygons: state.polygons[id]
              ? { ...state.polygons, [id]: { ...state.polygons[id], isLoading } }
              : state.polygons,
          })),
      }),
      { name: 'geo-dashboard-storage-v2' }
    )
  )
);