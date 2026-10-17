import type React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export type TrendDirection = "up" | "down" | "flat";

export interface CropPrice {
  id: string;
  cropName: string;
  variety?: string;
  icon: string; // emoji used as a lightweight illustration
  pricePerUnit: number;
  unit: string;
  market: string;
  trend: TrendDirection;
  changePercent: number;
}

export interface TrendingCrop {
  id: string;
  cropName: string;
  icon: string;
  demandScore: number; // 0-100
  changePercent: number;
}

export interface RecommendedCrop {
  id: string;
  cropName: string;
  icon: string;
  reason: string;
  suitability: number; // 0-100
}

export interface WeatherData {
  location: string;
  temperatureC: number;
  condition: string;
  icon: string;
  humidity: number;
  windKph: number;
  rainChance: number;
  forecast: { day: string; icon: string; high: number; low: number }[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: IconName;
  route: string;
}

export interface MarketOption {
  id: string;
  name: string;
  district: string;
}

export interface PricePredictionPoint {
  label: string;
  price: number;
}

export interface PredictionResult {
  cropId: string;
  marketId: string;
  expectedPrice: number;
  unit: string;
  confidence: number; // 0-100
  trend: TrendDirection;
  history: PricePredictionPoint[];
  recommendation: string;
}

export interface Seller {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  verified: boolean;
  avatarColor: string;
  initials: string;
}

export interface MarketplaceListing {
  id: string;
  cropName: string;
  icon: string;
  category: string;
  pricePerUnit: number;
  unit: string;
  quantityAvailable: string;
  location: string;
  seller: Seller;
  freshness: "Just harvested" | "1-3 days" | "4-7 days";
}

export interface MarketplaceCategory {
  id: string;
  label: string;
  icon: IconName;
}

export interface FarmerProfile {
  name: string;
  location: string;
  phone: string;
  avatarInitials: string;
  memberSince: string;
  farmsCount: number;
  totalAcreage: number;
  myCrops: { id: string; name: string; icon: string; acreage: number }[];
}
