import { WeatherData, Banner } from "@/types";

export const weatherData: WeatherData = {
  location: "Coimbatore, TN",
  temperatureC: 29,
  condition: "Partly Cloudy",
  icon: "⛅",
  humidity: 68,
  windKph: 14,
  rainChance: 30,
  forecast: [
    { day: "Mon", icon: "⛅", high: 30, low: 22 },
    { day: "Tue", icon: "🌦️", high: 28, low: 21 },
    { day: "Wed", icon: "☀️", high: 31, low: 23 },
    { day: "Thu", icon: "☀️", high: 32, low: 23 },
    { day: "Fri", icon: "⛈️", high: 27, low: 21 },
  ],
};

export const banners: Banner[] = [
  {
    id: "b1",
    title: "Cotton prices up 4.6%",
    subtitle: "Best time to sell in Erode Mandi",
    icon: "📈",
    colorFrom: "#2E7D32",
    colorTo: "#66BB6A",
  },
  {
    id: "b2",
    title: "Monsoon advisory",
    subtitle: "Light rain expected this week",
    icon: "🌧️",
    colorFrom: "#1976D2",
    colorTo: "#66BB6A",
  },
  {
    id: "b3",
    title: "New: AI Price Prediction",
    subtitle: "Forecast your next harvest's value",
    icon: "🤖",
    colorFrom: "#FFC107",
    colorTo: "#2E7D32",
  },
];
