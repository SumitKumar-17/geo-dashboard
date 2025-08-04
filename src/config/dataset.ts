export const DATASETS = {
  temperature_2m: { 
    label: 'Temperature', 
    unit: '°C',
    defaultRules: [
        { id: '1', operator: '<', value: 10, color: '#3b82f6' },
        { id: '2', operator: '>=', value: 10, color: '#22c55e' },
        { id: '3', operator: '>=', value: 25, color: '#ef4444' },
    ]
  },
  precipitation_sum: { 
    label: 'Precipitation', 
    unit: 'mm',
    defaultRules: [
        { id: '1', operator: '=', value: 0, color: '#fde68a' },
        { id: '2', operator: '>', value: 0, color: '#60a5fa' },
        { id: '3', operator: '>', value: 5, color: '#2563eb' },
    ]
  },
  wind_speed_10m_max: { 
    label: 'Max Wind Speed', 
    unit: 'km/h',
    defaultRules: [
        { id: '1', operator: '<', value: 10, color: '#a7f3d0' },
        { id: '2', operator: '>=', value: 10, color: '#facc15' },
        { id: '3', operator: '>=', value: 30, color: '#f97316' },
    ]
  },
};

export type DatasetKey = keyof typeof DATASETS;