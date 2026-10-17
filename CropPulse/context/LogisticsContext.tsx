import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";
import { logisticsService, type LogisticsRequest as ApiLogisticsRequest } from "@/services/api/logistics";
import { notificationsService } from "@/services/api/notifications";
import { API_BASE_URL } from "@/services/api/apiClient";
import { LOCATION_OPTIONS, LOGISTICS_CROP_OPTIONS } from "@/data/logistics-options";
import type {
  FarmerLocation,
  JoinRequest,
  LogisticsMessage,
  LogisticsNotification,
  LogisticsParticipant,
  LogisticsRequest,
  LogisticsStatus,
} from "@/types/logistics";

interface LogisticsState {
  requests: LogisticsRequest[];
  participants: LogisticsParticipant[];
  messages: LogisticsMessage[];
  joinRequests: JoinRequest[];
  notifications: LogisticsNotification[];
}

interface LogisticsContextValue {
  state: LogisticsState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  createRequest: (data: {
    crop: string;
    quantity: number;
    pickupLocation: FarmerLocation;
    destination: FarmerLocation;
    preferredDate: string;
    preferredTime: string;
    vehicleType: string;
    maxFarmers: number;
    vehicleCapacity: number;
    estimatedCost: number;
    notes: string;
  }) => Promise<void>;
  requestToJoin: (requestId: string, quantity: number, farmerLocation?: string) => Promise<void>;
  respondToJoin: (joinRequestId: string, status: "ACCEPTED" | "REJECTED") => Promise<void>;
  updateRequestStatus: (requestId: string, status: LogisticsStatus) => Promise<void>;
  loadMessages: (requestId: string) => Promise<void>;
  joinChat: (requestId: string) => Promise<() => void>;
  sendMessage: (requestId: string, content: string) => Promise<void>;
}

const emptyState: LogisticsState = {
  requests: [],
  participants: [],
  messages: [],
  joinRequests: [],
  notifications: [],
};

const LogisticsContext = createContext<LogisticsContextValue | null>(null);

const parseLocation = (value: string | null | undefined, district?: string | null, state?: string | null): FarmerLocation => {
  const [townPart, districtPart] = (value || "").split(",").map((part) => part.trim());
  const town = townPart || district || "Unknown";
  const match = LOCATION_OPTIONS.find(
    (location) => location.town.toLowerCase() === town.toLowerCase()
      || location.town.toLowerCase() === (district || "").toLowerCase()
  );
  return match || {
    town,
    district: districtPart || district || town,
    state: state || "Tamil Nadu",
    latitude: 0,
    longitude: 0,
  };
};

const toUiRequest = (request: ApiLogisticsRequest): LogisticsRequest => {
  const requester = request.requester;
  const status: LogisticsStatus =
    request.status === "MATCHED" ? "CONFIRMED"
      : request.status === "IN_TRANSIT" ? "IN_PROGRESS"
        : request.status === "DELIVERED" ? "COMPLETED"
          : request.status === "CANCELLED" ? "CANCELLED"
            : "OPEN";

  return {
    id: request.id,
    farmerId: request.requesterId,
    farmerName: requester?.name || "Farmer",
    crop: request.cropName || "Transport",
    cropIcon: LOGISTICS_CROP_OPTIONS.find((crop) => crop.name === request.cropName)?.icon || "🌱",
    quantity: request.quantity,
    pickupLocation: parseLocation(request.pickupLocation, requester?.district, requester?.state),
    destination: parseLocation(request.destination),
    preferredDate: request.preferredDate?.slice(0, 10) || "",
    preferredTime: request.preferredTime || "Not specified",
    vehicleType: (request.vehicleType || "Mini Truck") as LogisticsRequest["vehicleType"],
    maxFarmers: request.maxFarmers || 4,
    vehicleCapacity: request.vehicleCapacity || request.quantity,
    estimatedCost: request.estimatedCost ?? request.offeredPrice ?? 0,
    notes: request.notes || "",
    status,
    createdAt: request.createdAt,
  };
};

const toUiMessage = (message: {
  id: string;
  requestId?: string;
  senderId: string;
  sender?: { name: string };
  senderName?: string;
  content?: string;
  message?: string;
  createdAt: string;
}, requestId: string): LogisticsMessage => ({
  id: message.id,
  requestId,
  senderId: message.senderId,
  senderName: message.sender?.name || message.senderName || "Member",
  message: message.content || message.message || "",
  createdAt: message.createdAt,
});

export function LogisticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<LogisticsState>(emptyState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const activeChatRooms = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    if (!user) {
      setState(emptyState);
      return;
    }
    try {
      const requests = await logisticsService.getRequests();
      setState((current) => ({
        ...current,
        requests: requests.map(toUiRequest),
        participants: requests.flatMap((request) =>
          (request.participants || []).map((participant) => ({
            id: participant.id,
            requestId: request.id,
            farmerId: participant.farmerId,
            farmerName: participant.farmer.name,
            quantity: participant.quantity,
            status: "ACCEPTED" as const,
            joinedAt: participant.joinedAt,
          }))
        ),
        joinRequests: requests.flatMap((request) =>
          (request.joinRequests || []).map((joinRequest) => ({
            id: joinRequest.id,
            requestId: request.id,
            farmerId: joinRequest.farmerId,
            farmerName: joinRequest.farmer.name,
            farmerLocation: joinRequest.farmerLocation
              || [joinRequest.farmer.district, joinRequest.farmer.state].filter(Boolean).join(", "),
            quantity: joinRequest.quantity,
            crop: request.cropName || "Transport",
            status: joinRequest.status,
            createdAt: joinRequest.createdAt,
          }))
        ),
      }));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load transport requests");
    }
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setState((current) => ({ ...current, notifications: [] }));
      return;
    }
    try {
      const notifications = await notificationsService.getNotifications();
      setState((current) => {
        const persisted = notifications.map((notification) => ({
          id: notification.id,
          type: (notification.type || "REQUEST_UPDATED") as LogisticsNotification["type"],
          requestId: notification.logisticsRequestId || "",
          title: notification.title,
          message: notification.body,
          read: notification.isRead,
          createdAt: notification.createdAt,
        }));
        const persistedIds = new Set(persisted.map((notification) => notification.id));
        return {
          ...current,
          notifications: [
            ...persisted,
            ...current.notifications.filter((notification) => !persistedIds.has(notification.id)),
          ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        };
      });
    } catch (cause) {
      console.error("Failed to load logistics notifications:", cause);
    }
  }, [user]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    await notificationsService.markAsRead(notificationId);
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await notificationsService.markAllAsRead();
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({ ...notification, read: true })),
    }));
  }, []);

  useEffect(() => {
    let disposed = false;
    let activeSocket: Socket | null = null;
    if (!user) {
      setState(emptyState);
      return;
    }

    setLoading(true);
    void refresh().finally(() => {
      if (!disposed) setLoading(false);
    });
    void refreshNotifications();

    void AsyncStorage.getItem("token").then((token) => {
      if (!token || disposed) return;
      activeSocket = io(API_BASE_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
      });
      setSocket(activeSocket);

      const refreshOnChange = () => { void refresh(); };
      activeSocket.on("logistics:request_created", refreshOnChange);
      activeSocket.on("logistics:request_updated", refreshOnChange);
      activeSocket.on("logistics:join_requested", refreshOnChange);
      activeSocket.on("logistics:join_responded", refreshOnChange);
      activeSocket.on("logistics:participants_updated", refreshOnChange);
      activeSocket.on("notification:new", (notification: {
        id?: string;
        title: string;
        body?: string;
        type?: string;
        logisticsRequestId?: string | null;
        createdAt?: string;
        isRead?: boolean;
      }) => {
        setState((current) => ({
          ...current,
          notifications: [
            {
              id: notification.id || `${Date.now()}`,
              type: (notification.type || "REQUEST_UPDATED") as LogisticsNotification["type"],
              requestId: notification.logisticsRequestId || "",
              title: notification.title,
              message: notification.body || notification.title,
              read: notification.isRead || false,
              createdAt: notification.createdAt || new Date().toISOString(),
            },
            ...current.notifications.filter((existing) => existing.id !== notification.id),
          ],
        }));
      });
      activeSocket.on("logistics:message", ({ requestId, message }: {
        requestId: string;
        message: Parameters<typeof toUiMessage>[0];
      }) => {
        setState((current) => {
          if (current.messages.some((existing) => existing.id === message.id)) return current;
          return { ...current, messages: [...current.messages, toUiMessage(message, requestId)] };
        });
      });
      activeSocket.on("connect_error", (cause) => {
        setError(`Realtime connection failed: ${cause.message}`);
      });
      activeSocket.on("connect", () => {
        setError(null);
        void refresh();
        void refreshNotifications();
        activeChatRooms.current.forEach((requestId) => {
          activeSocket?.emit("logistics:join", requestId);
        });
      });
    });

    return () => {
      disposed = true;
      activeSocket?.disconnect();
      setSocket(null);
    };
  }, [user?.id, refresh, refreshNotifications]);

  const createRequest = useCallback<LogisticsContextValue["createRequest"]>(async (data) => {
    setLoading(true);
    try {
      await logisticsService.createRequest({
        cropName: data.crop,
        quantity: data.quantity,
        pickupLocation: `${data.pickupLocation.town}, ${data.pickupLocation.district}`,
        destination: `${data.destination.town}, ${data.destination.district}`,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        vehicleType: data.vehicleType,
        maxFarmers: data.maxFarmers,
        vehicleCapacity: data.vehicleCapacity,
        estimatedCost: data.estimatedCost,
        offeredPrice: data.estimatedCost,
        notes: data.notes,
      });
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const requestToJoin = useCallback<LogisticsContextValue["requestToJoin"]>(async (requestId, quantity, farmerLocation) => {
    await logisticsService.requestToJoin(requestId, { quantity, farmerLocation });
    await refresh();
  }, [refresh]);

  const respondToJoin = useCallback<LogisticsContextValue["respondToJoin"]>(async (joinRequestId, status) => {
    await logisticsService.respondToJoin(joinRequestId, status);
    await refresh();
  }, [refresh]);

  const updateRequestStatus = useCallback<LogisticsContextValue["updateRequestStatus"]>(async (requestId, status) => {
    const statusMap: Record<LogisticsStatus, ApiLogisticsRequest["status"]> = {
      OPEN: "PENDING",
      PENDING: "PENDING",
      CONFIRMED: "MATCHED",
      FULL: "MATCHED",
      IN_PROGRESS: "IN_TRANSIT",
      COMPLETED: "DELIVERED",
      CANCELLED: "CANCELLED",
    };
    await logisticsService.updateRequestStatus(requestId, statusMap[status]);
    await refresh();
  }, [refresh]);

  const loadMessages = useCallback<LogisticsContextValue["loadMessages"]>(async (requestId) => {
    const messages = await logisticsService.getGroupMessages(requestId);
    setState((current) => ({
      ...current,
      messages: [
        ...current.messages.filter((message) => message.requestId !== requestId),
        ...messages.map((message) => toUiMessage(message, requestId)),
      ],
    }));
  }, []);

  const joinChat = useCallback<LogisticsContextValue["joinChat"]>(async (requestId) => {
    await loadMessages(requestId);
    if (!socket) throw new Error("Realtime chat is not connected. Check your network and retry.");
    activeChatRooms.current.add(requestId);
    await new Promise<void>((resolve, reject) => {
      socket.emit("logistics:join", requestId, (result: { ok: boolean }) => {
        if (result?.ok) resolve();
        else reject(new Error("You are not a member of this transport group"));
      });
    });
    return () => {
      activeChatRooms.current.delete(requestId);
      socket.emit("logistics:leave", requestId);
    };
  }, [loadMessages, socket]);

  const sendMessage = useCallback<LogisticsContextValue["sendMessage"]>(async (requestId, content) => {
    const message = await logisticsService.sendGroupMessage(requestId, content);
    setState((current) => {
      if (current.messages.some((existing) => existing.id === message.id)) return current;
      return { ...current, messages: [...current.messages, toUiMessage(message, requestId)] };
    });
  }, []);

  const value = useMemo(() => ({
    state,
    loading,
    error,
    refresh,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    createRequest,
    requestToJoin,
    respondToJoin,
    updateRequestStatus,
    loadMessages,
    joinChat,
    sendMessage,
  }), [
    state, loading, error, refresh, refreshNotifications, markNotificationRead,
    markAllNotificationsRead, createRequest, requestToJoin, respondToJoin,
    updateRequestStatus, loadMessages, joinChat, sendMessage,
  ]);

  return <LogisticsContext.Provider value={value}>{children}</LogisticsContext.Provider>;
}

function useLogisticsContext() {
  const value = useContext(LogisticsContext);
  if (!value) throw new Error("Logistics hooks require a LogisticsProvider");
  return value;
}

export function useLogistics() {
  return useLogisticsContext();
}

export function useLogisticsRequest(requestId: string) {
  const { state } = useLogisticsContext();
  return useMemo(() => {
    const request = state.requests.find((item) => item.id === requestId);
    const participants = state.participants.filter((item) => item.requestId === requestId);
    const pendingJoins = state.joinRequests.filter(
      (item) => item.requestId === requestId && item.status === "PENDING"
    );
    return {
      request,
      participants,
      pendingJoins,
      totalQuantity: (request?.quantity || 0) + participants.reduce((sum, item) => sum + item.quantity, 0),
      farmerCount: participants.length + (request ? 1 : 0),
    };
  }, [state, requestId]);
}

export function useMyLogistics() {
  const { state } = useLogisticsContext();
  const { user } = useAuth();
  return useMemo(() => {
    const myRequests = state.requests.filter((request) => request.farmerId === user?.id);
    const joinedIds = state.participants
      .filter((participant) => participant.farmerId === user?.id)
      .map((participant) => participant.requestId);
    const joinedRequests = state.requests.filter((request) => joinedIds.includes(request.id));
    const completed = [...myRequests, ...joinedRequests].filter((request) => request.status === "COMPLETED");
    return {
      myRequests: myRequests.filter((request) => !["COMPLETED", "CANCELLED"].includes(request.status)),
      joinedRequests: joinedRequests.filter((request) => !["COMPLETED", "CANCELLED"].includes(request.status)),
      completed,
    };
  }, [state, user?.id]);
}

export function useLogisticsMessages(requestId: string) {
  const { state } = useLogisticsContext();
  return useMemo(
    () => state.messages.filter((message) => message.requestId === requestId),
    [state.messages, requestId]
  );
}

export function useLogisticsNotifications() {
  const { state } = useLogisticsContext();
  return useMemo(() => ({
    notifications: state.notifications,
    unreadCount: state.notifications.filter((notification) => !notification.read).length,
  }), [state.notifications]);
}

export function useIsParticipant(requestId: string) {
  const { state } = useLogisticsContext();
  const { user } = useAuth();
  return useMemo(() => {
    const request = state.requests.find((item) => item.id === requestId);
    const isOwner = request?.farmerId === user?.id;
    const isJoined = state.participants.some(
      (participant) => participant.requestId === requestId && participant.farmerId === user?.id
    );
    const hasPendingJoin = state.joinRequests.some(
      (join) => join.requestId === requestId && join.farmerId === user?.id && join.status === "PENDING"
    );
    return { isOwner, isJoined, hasPendingJoin, isParticipant: Boolean(isOwner || isJoined) };
  }, [state, requestId, user?.id]);
}
