import { apiClient } from './apiClient';

export interface Crop {
  id: string;
  name: string;
  icon?: string;
}

export interface Market {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
}

export interface MarketPrice {
  id: string;
  cropId: string;
  marketId: string;
  crop: Crop;
  market: Market;
  variety?: string;
  minPrice?: number;
  maxPrice?: number;
  modalPrice: number;
  unit: string;
  arrivalQty?: number;
  date: string;
  source?: string;
}

export interface MarketRecommendation {
  marketId: string;
  marketName: string;
  district: string;
  distanceKm: number;
  currentPricePerQuintal: number;
  expectedRevenue: number;
  transportCost: number;
  totalCost: number;
  estimatedNetProfit: number;
  recommendationScore: number;
}

export const cropsService = {
  getCrops(): Promise<Crop[]> {
    return apiClient.get<Crop[]>('/crops/crops');
  },

  getMarkets(): Promise<Market[]> {
    return apiClient.get<Market[]>('/crops/markets');
  },

  getNearbyMarkets(lat: number, lng: number, maxDistanceKm?: number): Promise<Market[]> {
    return apiClient.get<Market[]>('/crops/markets/nearby', { lat, lng, maxDistanceKm });
  },

  getLatestPrices(cropId?: string): Promise<MarketPrice[]> {
    return apiClient.get<MarketPrice[]>('/crops/prices/latest', { cropId });
  },

  getPriceHistory(cropId: string, marketId: string, limit?: number): Promise<MarketPrice[]> {
    return apiClient.get<MarketPrice[]>('/crops/prices/history', { cropId, marketId, limit });
  },

  getMarketRecommendations(cropId: string, quantity: number, lat: number, lng: number): Promise<MarketRecommendation[]> {
    return apiClient.get<MarketRecommendation[]>('/crops/markets/recommend', { cropId, quantity, lat, lng });
  },
};
