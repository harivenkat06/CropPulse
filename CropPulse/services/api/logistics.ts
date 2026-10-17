import { apiClient } from './apiClient';
import { User } from './auth';

export interface LogisticsJoinRequest {
  id: string;
  requestId: string;
  farmerId: string;
  quantity: number;
  farmerLocation?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  farmer: {
    id: string;
    name: string;
    district?: string | null;
    state?: string | null;
    village?: string | null;
  };
}

export interface LogisticsRequest {
  id: string;
  requesterId: string;
  orderId?: string;
  pickupLocation: string;
  destination: string;
  cropName?: string;
  quantity: number;
  preferredDate?: string;
  vehicleType?: string;
  offeredPrice?: number;
  vehicleCapacity?: number;
  estimatedCost?: number;
  maxFarmers?: number;
  preferredTime?: string;
  notes?: string;
  requester?: { id: string; name: string; district?: string | null; state?: string | null; village?: string | null };
  participants?: Array<{ id: string; farmerId: string; quantity: number; farmer: { id: string; name: string }; joinedAt: string }>;
  joinRequests?: LogisticsJoinRequest[];
  status: 'PENDING' | 'MATCHED' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface SharedMatchInfo {
  requestId: string;
  farmerName: string;
  quantity: number;
  pickupLocation: string;
}

export interface LogisticsMatch {
  type: 'INDIVIDUAL' | 'SHARED';
  providerId: string;
  providerName: string;
  vehicleType: string;
  capacity: number;
  rating: number;
  distanceToPickupKm: number;
  estimatedCost: number;
  savings: number;
  sharedWith: SharedMatchInfo | null;
}

export interface MatchResponse {
  requestId: string;
  individualCost: number;
  matches: LogisticsMatch[];
}

export const logisticsService = {
  createRequest(data: {
    orderId?: string;
    pickupLocation: string;
    destination: string;
    cropName?: string;
    quantity: number;
    preferredDate?: string;
    vehicleType?: string;
    offeredPrice?: number;
    vehicleCapacity?: number;
    estimatedCost?: number;
    maxFarmers?: number;
    preferredTime?: string;
    notes?: string;
  }): Promise<LogisticsRequest> {
    return apiClient.post<LogisticsRequest>('/logistics/requests', data);
  },

  getRequests(): Promise<LogisticsRequest[]> {
    return apiClient.get<LogisticsRequest[]>('/logistics/requests');
  },

  findMatches(requestId: string): Promise<MatchResponse> {
    return apiClient.get<MatchResponse>(`/logistics/requests/${requestId}/matches`);
  },

  acceptMatch(data: { requestId: string; providerId: string; estimatedCost: number }): Promise<any> {
    return apiClient.post<any>('/logistics/matches/accept', data);
  },

  requestToJoin(requestId: string, data: { quantity: number; farmerLocation?: string }): Promise<LogisticsJoinRequest> {
    return apiClient.post<LogisticsJoinRequest>(`/logistics/requests/${requestId}/join`, data);
  },

  respondToJoin(joinRequestId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<LogisticsJoinRequest> {
    return apiClient.patch<LogisticsJoinRequest>(`/logistics/join-requests/${joinRequestId}`, { status });
  },

  getGroupMessages(requestId: string): Promise<Array<{
    id: string;
    senderId: string;
    sender: { id: string; name: string; role: string };
    content: string;
    createdAt: string;
  }>> {
    return apiClient.get(`/logistics/requests/${requestId}/messages`);
  },

  sendGroupMessage(requestId: string, content: string): Promise<{
    id: string;
    senderId: string;
    sender: { id: string; name: string; role: string };
    content: string;
    createdAt: string;
  }> {
    return apiClient.post(`/logistics/requests/${requestId}/messages`, { content });
  },

  updateRequestStatus(id: string, status: LogisticsRequest['status']): Promise<LogisticsRequest> {
    return apiClient.patch<LogisticsRequest>(`/logistics/requests/${id}/status`, { status });
  },
};
