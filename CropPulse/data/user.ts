import { QuickAction } from "@/types";

export const quickActions: QuickAction[] = [
  { id: "qa1", label: "Predict Price", icon: "chart-line", route: "/(tabs)/prediction" },
  { id: "qa2", label: "Marketplace", icon: "store-outline", route: "/(tabs)/marketplace" },
  { id: "qa3", label: "Logistics", icon: "truck-outline", route: "/logistics" },
  { id: "qa4", label: "Orders", icon: "clipboard-list-outline", route: "/orders" },
];
