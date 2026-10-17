import { apiClient } from './apiClient';

export interface WeatherForecastDay {
  day: string;
  tempMax: number;
  tempMin: number;
  rainSum: number;
}

export interface WeatherResponse {
  temperature: number;
  humidity: number;
  rain: number;
  wind: number;
  condition: string;
  forecast: WeatherForecastDay[];
  timestamp: string;
  fallback?: boolean;
}

export const weatherService = {
  getWeather(lat: number, lng: number): Promise<WeatherResponse> {
    return apiClient.get<WeatherResponse>('/weather', { lat, lng });
  },
};
