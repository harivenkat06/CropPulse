import { CropPrice, TrendingCrop, RecommendedCrop, MarketOption } from "@/types";

export const cropPrices: CropPrice[] = [
  { id: "cp1", cropName: "Wheat", icon: "🌾", pricePerUnit: 2340, unit: "quintal", market: "Coimbatore Mandi", trend: "up", changePercent: 3.2 },
  { id: "cp2", cropName: "Tomato", icon: "🍅", pricePerUnit: 1820, unit: "quintal", market: "Ooty Market", trend: "down", changePercent: -2.1 },
  { id: "cp3", cropName: "Rice (Paddy)", icon: "🌾", pricePerUnit: 2105, unit: "quintal", market: "Thanjavur Mandi", trend: "up", changePercent: 1.4 },
  { id: "cp4", cropName: "Onion", icon: "🧅", pricePerUnit: 1650, unit: "quintal", market: "Salem Market", trend: "flat", changePercent: 0.2 },
  { id: "cp5", cropName: "Cotton", icon: "☁️", pricePerUnit: 6720, unit: "quintal", market: "Erode Mandi", trend: "up", changePercent: 4.6 },
  { id: "cp6", cropName: "Sugarcane", icon: "🎋", pricePerUnit: 315, unit: "quintal", market: "Coimbatore Mandi", trend: "down", changePercent: -1.1 },
];

export const trendingCrops: TrendingCrop[] = [
  { id: "tc1", cropName: "Cotton", icon: "☁️", demandScore: 92, changePercent: 4.6 },
  { id: "tc2", cropName: "Turmeric", icon: "🟡", demandScore: 87, changePercent: 6.8 },
  { id: "tc3", cropName: "Wheat", icon: "🌾", demandScore: 78, changePercent: 3.2 },
  { id: "tc4", cropName: "Banana", icon: "🍌", demandScore: 74, changePercent: 2.0 },
  { id: "tc5", cropName: "Chilli", icon: "🌶️", demandScore: 69, changePercent: 1.5 },
];

export const recommendedCrops: RecommendedCrop[] = [
  { id: "rc1", cropName: "Turmeric", icon: "🟡", reason: "High demand and favorable soil match", suitability: 91 },
  { id: "rc2", cropName: "Groundnut", icon: "🥜", reason: "Good rainfall forecast this season", suitability: 84 },
  { id: "rc3", cropName: "Maize", icon: "🌽", reason: "Stable prices, low input cost", suitability: 79 },
];

export const marketOptions: MarketOption[] = [
  { id: "m1", name: "Coimbatore Mandi", district: "Coimbatore" },
  { id: "m2", name: "Salem Market", district: "Salem" },
  { id: "m3", name: "Erode Mandi", district: "Erode" },
  { id: "m4", name: "Thanjavur Mandi", district: "Thanjavur" },
  { id: "m5", name: "Ooty Market", district: "Nilgiris" },
];

export const predictionCropOptions = [
  { id: "pc1", name: "Wheat", icon: "🌾" },
  { id: "pc2", name: "Rice (Paddy)", icon: "🌾" },
  { id: "pc3", name: "Cotton", icon: "☁️" },
  { id: "pc4", name: "Tomato", icon: "🍅" },
  { id: "pc5", name: "Turmeric", icon: "🟡" },
  { id: "pc6", name: "Onion", icon: "🧅" },
];
