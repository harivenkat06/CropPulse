/**
 * Type definitions for the Farmer Shared Logistics feature.
 */

export type LogisticsStatus =
  | "OPEN"
  | "PENDING"
  | "CONFIRMED"
  | "FULL"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type JoinRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type VehicleType = "Mini Truck" | "Truck" | "Tractor Trolley" | "Auto" | "Pickup Van";

export interface FarmerLocation {
  town: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface LogisticsRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  crop: string;
  cropIcon: string;
  quantity: number; // in kg
  pickupLocation: FarmerLocation;
  destination: FarmerLocation;
  preferredDate: string; // ISO date string YYYY-MM-DD
  preferredTime: string; // e.g. "06:00 AM"
  vehicleType: VehicleType;
  maxFarmers: number;
  vehicleCapacity: number; // in kg
  estimatedCost: number; // in ₹
  notes: string;
  status: LogisticsStatus;
  createdAt: string; // ISO datetime
}

export interface LogisticsParticipant {
  id: string;
  requestId: string;
  farmerId: string;
  farmerName: string;
  quantity: number; // in kg
  status: JoinRequestStatus;
  joinedAt: string; // ISO datetime
}

export interface LogisticsMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string; // ISO datetime
}

export interface JoinRequest {
  id: string;
  requestId: string;
  farmerId: string;
  farmerName: string;
  farmerLocation: string; // display string e.g. "Sriperumbudur, Kancheepuram"
  quantity: number;
  crop: string;
  status: JoinRequestStatus;
  createdAt: string; // ISO datetime
}

export type LogisticsNotificationType =
  | "JOIN_REQUEST"
  | "JOIN_ACCEPTED"
  | "JOIN_REJECTED"
  | "NEW_MESSAGE"
  | "REQUEST_UPDATED"
  | "DATE_APPROACHING"
  | "LOGISTICS_STATUS"
  | "LOGISTICS_MATCHED";

export interface LogisticsNotification {
  id: string;
  type: LogisticsNotificationType;
  requestId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO datetime
}
