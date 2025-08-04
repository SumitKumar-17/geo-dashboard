import axios from 'axios';

const API_BASE_URL = 'https://archive-api.open-meteo.com/v1/archive';

export const getTemperatureForCoord = async (
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<number | null> => {
  try {
    const response = await axios.get(API_BASE_URL, {
      params: {
        latitude: lat.toFixed(2),
        longitude: lng.toFixed(2),
        start_date: startDate,
        end_date: endDate,
        hourly: 'temperature_2m',
      },
    });

    const temps = response.data?.hourly?.temperature_2m;
    if (!temps || temps.length === 0) return null;

    const validTemps = temps.filter((t: number | null) => t !== null);
    if (validTemps.length === 0) return null;

    const averageTemp = validTemps.reduce((a: number, b: number) => a + b, 0) / validTemps.length;
    return averageTemp;
  } catch (error) {
    console.error("Failed to fetch temperature data:", error);
    return null;
  }
};