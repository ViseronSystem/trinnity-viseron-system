export interface MessagingKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface Contact {
  ownerId: string;
  userId: string;
  name: string;
  email: string;
  publicKey: string;
  addedAt: string;
}

export type ConversationType = "direct" | "group";

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  members: string[];
  createdAt: string;
}

export interface MessagePayload {
  userId: string;
  iv: string;
  ct: string;
}

export type MessageStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPublicKey: string;
  payloads: MessagePayload[];
  readBy: string[];
  createdAt: string;
}

export interface MessagingSnapshot {
  keys: Record<string, MessagingKeyPair>;
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
}

export const EMPTY_SNAPSHOT: MessagingSnapshot = {
  keys: {},
  contacts: [],
  conversations: [],
  messages: [],
};
