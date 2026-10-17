import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'FARMER' | 'BUYER' | 'LOGISTICS_PROVIDER' | 'ADMIN';
  email?: string;
  district?: string;
  state?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async register(data: any): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    await AsyncStorage.setItem('token', res.token);
    await AsyncStorage.setItem('user', JSON.stringify(res.user));
    return res;
  },

  async login(phone: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', { phone, password });
    await AsyncStorage.setItem('token', res.token);
    await AsyncStorage.setItem('user', JSON.stringify(res.user));
    return res;
  },

  async getMe(): Promise<User> {
    const user = await apiClient.get<User>('/auth/me');
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  async getStoredUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        return null;
      }
    }
    return null;
  },

  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  },
};
