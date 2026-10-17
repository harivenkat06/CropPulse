import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const getBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  // Try to auto-detect the local server IP in development Expo Go environment
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostname = new URL(`http://${hostUri}`).hostname;
    return `http://${hostname}:3000`;
  }
  return 'http://localhost:3000';
};

export const API_BASE_URL = getBaseUrl();
export const SOCKET_URL = API_BASE_URL;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export const apiClient = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = await AsyncStorage.getItem('token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = `${API_BASE_URL}/api${endpoint}`;

    // Append query params if any
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, val]) => {
        if (val === undefined || val === null || val === '') return;
        searchParams.append(key, String(val));
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.error || 'Something went wrong', response.status);
      }

      return data as T;
    } catch (error: any) {
      console.error(`API Request Error [${endpoint}]:`, error.message);
      throw error;
    }
  },

  get<T>(endpoint: string, params?: Record<string, any>, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params, ...options });
  },

  post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  },
};
