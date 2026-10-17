import { apiClient } from './apiClient';
import type { Crop, Market } from './crops';

export interface PredictionCatalog {
  crops: Crop[];
  markets: Market[];
}

export interface PredictionHistoryPoint {
  label: string;
  price: number;
}

export interface PredictionResponse {
  expected_price: number;
  min_price: number;
  max_price: number;
  confidence: number;
  horizon: number;
  model_version: string;
  last_trained: string;
  history: PredictionHistoryPoint[];
  message?: string;
}

export const predictionsService = {
  getCatalog(): Promise<PredictionCatalog> {
    return apiClient.get<PredictionCatalog>('/predictions/catalog');
  },

  getPrediction(cropId: string, marketId: string, horizon?: number): Promise<PredictionResponse> {
    return apiClient.get<PredictionResponse>('/predictions', { cropId, marketId, horizon });
  },
};
