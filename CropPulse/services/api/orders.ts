import { apiClient } from './apiClient';
import { Listing } from './listings';
import { User } from './auth';

export interface Order {
  id: string;
  listingId?: string;
  listing?: Listing;
  buyerId: string;
  buyer: User;
  sellerId: string;
  seller: User;
  quantity: number;
  price: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONFIRMED' | 'LOGISTICS_PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export const ordersService = {
  createOrder(data: { listingId: string; quantity: number; price: number }): Promise<Order> {
    return apiClient.post<Order>('/orders', data);
  },

  getOrders(): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders');
  },

  getOrderById(id: string): Promise<Order> {
    return apiClient.get<Order>(`/orders/${id}`);
  },

  updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    return apiClient.patch<Order>(`/orders/${id}/status`, { status });
  },
};
