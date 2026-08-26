import fs from "fs";
import path from "path";
import { generateKeyPair } from "./crypto";
import {
  Conversation,
  Contact,
  MessagingKeyPair,
  Message,
  MessagingSnapshot,
  EMPTY_SNAPSHOT,
} from "./types";

export class MessageStore {
  private file: string;
  private data: MessagingSnapshot;

  constructor(filePath: string) {
    this.file = filePath;
    this.data = { ...EMPTY_SNAPSHOT, keys: {}, contacts: [], conversations: [], messages: [] };
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.file)) {
        const parsed = JSON.parse(fs.readFileSync(this.file, "utf8"));
        this.data = {
          keys: parsed.keys || {},
          contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
          conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
          messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        };
      } else {
        this.persist();
      }
    } catch (e) {
      console.error(`[MessageStore] Falha ao ler ${this.file}: ${(e as Error).message}`);
      this.data = { keys: {}, contacts: [], conversations: [], messages: [] };
    }
  }

  private persist(): void {
    try {
      const dir = path.dirname(this.file);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), "utf8");
      if (fs.existsSync(this.file)) fs.unlinkSync(this.file);
      fs.renameSync(tmp, this.file);
    } catch (e) {
      console.error(`[MessageStore] Falha ao gravar ${this.file}: ${(e as Error).message}`);
    }
  }

  ensureKeyPair(userId: string): MessagingKeyPair {
    if (!this.data.keys[userId]) {
      this.data.keys[userId] = generateKeyPair();
      this.persist();
    }
    return this.data.keys[userId];
  }

  // ── Contacts ───────────────────────────────────────────────
  listContacts(ownerId: string): Contact[] {
    return this.data.contacts.filter((c) => c.ownerId === ownerId);
  }

  addContact(contact: Contact): Contact {
    const existing = this.data.contacts.find(
      (c) => c.ownerId === contact.ownerId && c.userId === contact.userId
    );
    if (existing) {
      existing.name = contact.name;
      existing.email = contact.email;
      existing.publicKey = contact.publicKey;
      this.persist();
      return existing;
    }
    this.data.contacts.push(contact);
    this.persist();
    return contact;
  }

  // ── Conversations ──────────────────────────────────────────
  listConversations(userId: string): Conversation[] {
    return this.data.conversations.filter((c) => c.members.includes(userId));
  }

  getConversation(id: string): Conversation | undefined {
    return this.data.conversations.find((c) => c.id === id);
  }

  createConversation(input: {
    type: Conversation["type"];
    members: string[];
    name?: string | null;
  }): Conversation {
    const conversation: Conversation = {
      id: `conv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      type: input.type,
      name: input.name || null,
      members: input.members,
      createdAt: new Date().toISOString(),
    };
    this.data.conversations.push(conversation);
    this.persist();
    return conversation;
  }

  // ── Messages ───────────────────────────────────────────────
  listMessages(conversationId: string): Message[] {
    return this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  addMessage(message: Message): Message {
    this.data.messages.push(message);
    this.persist();
    return message;
  }

  markRead(conversationId: string, userId: string): void {
    let changed = false;
    for (const message of this.data.messages) {
      if (message.conversationId !== conversationId) continue;
      if (message.senderId === userId) continue;
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        changed = true;
      }
    }
    if (changed) this.persist();
  }

  count(): { conversations: number; messages: number; contacts: number } {
    return {
      conversations: this.data.conversations.length,
      messages: this.data.messages.length,
      contacts: this.data.contacts.length,
    };
  }
}
