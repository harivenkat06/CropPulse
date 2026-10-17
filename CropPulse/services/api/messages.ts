import { apiClient } from './apiClient';
import { User } from './auth';

export interface Conversation {
  id: string;
  otherUser: User;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const messagesService = {
  getConversations(): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>('/messages');
  },

  createConversation(otherUserId: string): Promise<Conversation> {
    return apiClient.post<Conversation>('/messages', { otherUserId });
  },

  getMessages(conversationId: string): Promise<Message[]> {
    return apiClient.get<Message[]>(`/messages/${conversationId}/messages`);
  },

  sendMessage(conversationId: string, content: string): Promise<Message> {
    return apiClient.post<Message>(`/messages/${conversationId}/messages`, { content });
  },
};
