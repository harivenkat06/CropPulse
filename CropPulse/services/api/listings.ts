import { apiClient } from './apiClient';
import { Crop } from './crops';
import { User } from './auth';

export interface Listing {
  id: string;
  sellerId: string;
  seller: User;
  cropId: string;
  crop: Crop;
  quantity: number;
  unit: string;
  expectedPrice: number;
  quality?: string;
  harvestDate?: string;
  location?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export const listingsService = {
  getListings(filters?: {
    cropId?: string;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    minQty?: number;
  }): Promise<Listing[]> {
    return apiClient.get<Listing[]>('/listings', filters);
  },

  createListing(data: {
    cropId: string;
    quantity: number;
    unit: string;
    expectedPrice: number;
    quality?: string;
    harvestDate?: string;
    location?: string;
  }): Promise<Listing> {
    return apiClient.post<Listing>('/listings', data);
  },

  updateListing(id: string, data: Partial<Listing>): Promise<Listing> {
    return apiClient.put<Listing>(`/listings/${id}`, data);
  },

  deleteListing(id: string): Promise<Listing> {
    return apiClient.delete<Listing>(`/listings/${id}`);
  },
};
