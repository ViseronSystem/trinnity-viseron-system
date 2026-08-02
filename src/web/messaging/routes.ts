import { Router } from "express";
import { Server } from "socket.io";
import { AccountStore } from "../auth/store";
import { AuthedRequest, requireAuth } from "../auth/middleware";
import { MessageStore } from "./store";
import { decrypt, encrypt, sharedSecret } from "./crypto";
import { Message } from "./types";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";

function fingerprint(publicKey: string): string {
  return publicKey.slice(0, 8);
}

export function createMessagingRouter(
  store: AccountStore,
  messaging: MessageStore,
  io: Server,
  logger: ILogger,
  metrics: IMetrics
): Router {
  const router = Router();

  router.get("/messaging/status", (_req, res) => {
    const counts = messaging.count();
    res.json({
      ok: true,
      enabled: true,
      crypto: "x25519 + aes-256-gcm",
      conversations: counts.conversations,
      messages: counts.messages,
      contacts: counts.contacts,
    });
  });

  router.post("/messaging/key", requireAuth, (req: AuthedRequest, res) => {
    const key = messaging.ensureKeyPair(req.user!.sub);
    res.json({ ok: true, publicKey: key.publicKey, fingerprint: fingerprint(key.publicKey) });
  });

  router.get("/messaging/contacts", requireAuth, (req: AuthedRequest, res) => {
    const contacts = messaging.listContacts(req.user!.sub);
    res.json({ ok: true, contacts });
  });

  router.post("/messaging/contacts", requireAuth, (req: AuthedRequest, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email é obrigatório" });
    const target = store.findUserByEmail(email);
    if (!target) return res.status(404).json({ error: "Utilizador não encontrado" });
    if (target.id === req.user!.sub) return res.status(400).json({ error: "Não podes adicionar-te a ti próprio" });
    const key = messaging.ensureKeyPair(target.id);
    const contact = messaging.addContact({
      ownerId: req.user!.sub,
      userId: target.id,
      name: target.name,
      email: target.email,
      publicKey: key.publicKey,
      addedAt: new Date().toISOString(),
    });
    metrics.inc("messaging_contacts_total");
    logger.info(`Contacto adicionado: ${req.user!.sub} → ${target.email}`);
    res.json({ ok: true, contact });
  });

  router.get("/messaging/conversations", requireAuth, (req: AuthedRequest, res) => {
    const conversations = messaging.listConversations(req.user!.sub).map((c) => {
      const messages = messaging.listMessages(c.id);
      const unread = messages.filter((m) => m.senderId !== req.user!.sub && !m.readBy.includes(req.user!.sub)).length;
      const last = messages[messages.length - 1];
      return {
        ...c,
        unread,
        lastMessageAt: last?.createdAt || null,
        lastMessageSender: last?.senderName || null,
        memberCount: c.members.length,
      };
    });
    res.json({ ok: true, conversations });
  });

  router.post("/messaging/conversations", requireAuth, (req: AuthedRequest, res) => {
    const peerId = String(req.body?.userId || "");
    if (!peerId) return res.status(400).json({ error: "userId é obrigatório" });
    const peer = store.getUserById(peerId);
    if (!peer) return res.status(404).json({ error: "Utilizador não encontrado" });
    if (peer.id === req.user!.sub) return res.status(400).json({ error: "Conversa consigo próprio não é suportada" });
    const conversation = messaging.createConversation({
      type: "direct",
      members: [req.user!.sub, peerId],
      name: peer.name,
    });
    metrics.inc("messaging_conversations_total");
    logger.info(`Conversa criada: ${req.user!.sub} ↔ ${peerId}`);
    res.json({ ok: true, conversation });
  });

  router.post("/messaging/groups", requireAuth, (req: AuthedRequest, res) => {
    const name = String(req.body?.name || "").trim();
    const membersRaw = Array.isArray(req.body?.members) ? req.body.members : [];
    const members = [...new Set([req.user!.sub, ...membersRaw.filter((m: string) => typeof m === "string")])];
    if (members.length < 2) return res.status(400).json({ error: "Um grupo precisa de pelo menos 2 membros" });
    for (const member of members) {
      if (!store.getUserById(member)) return res.status(400).json({ error: `Utilizador desconhecido: ${member}` });
    }
    if (!name) return res.status(400).json({ error: "Nome do grupo é obrigatório" });
    const conversation = messaging.createConversation({ type: "group", members, name });
    metrics.inc("messaging_groups_total");
    logger.info(`Grupo criado: ${name} (${members.length} membros)`);
    res.json({ ok: true, conversation });
  });

  function isMember(req: AuthedRequest, conversationId: string): boolean {
    const conversation = messaging.getConversation(conversationId);
    return !!conversation && conversation.members.includes(req.user!.sub);
  }

  router.get("/messaging/conversations/:id/messages", requireAuth, (req: AuthedRequest, res) => {
    const conversation = messaging.getConversation(String(req.params.id));
    if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });
    if (!isMember(req, conversation.id)) return res.status(403).json({ error: "Sem acesso a esta conversa" });
    const priv = messaging.ensureKeyPair(req.user!.sub).privateKey;
    const messages = messaging.listMessages(conversation.id).map((m) => {
      const mine = m.payloads.find((p) => p.userId === req.user!.sub);
      let text: string | null = null;
      if (mine) {
        try {
          text = decrypt(sharedSecret(priv, m.senderPublicKey), mine.iv, mine.ct);
        } catch (e: any) {
          text = null;
        }
      }
      return {
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.senderName,
        readBy: m.readBy,
        createdAt: m.createdAt,
        encrypted: !mine,
        text,
      };
    });
    metrics.inc("messaging_messages_read_total");
    res.json({ ok: true, messages });
  });

  router.post("/messaging/conversations/:id/messages", requireAuth, (req: AuthedRequest, res) => {
    const conversation = messaging.getConversation(String(req.params.id));
    if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });
    if (!isMember(req, conversation.id)) return res.status(403).json({ error: "Sem acesso a esta conversa" });
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "Mensagem vazia" });
    if (text.length > 10000) return res.status(400).json({ error: "Mensagem demasiado longa (máx 10000)" });

    const sender = store.getUserById(req.user!.sub);
    if (!sender) return res.status(404).json({ error: "Utilizador não encontrado" });
    const senderKey = messaging.ensureKeyPair(sender.id);
    const now = new Date().toISOString();
    const payloads = conversation.members.map((memberId) => {
      const memberKey = messaging.ensureKeyPair(memberId);
      const secret = sharedSecret(senderKey.privateKey, memberKey.publicKey);
      const encrypted = encrypt(secret, text);
      return { userId: memberId, iv: encrypted.iv, ct: encrypted.ct };
    });

    const message: Message = {
      id: `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      conversationId: conversation.id,
      senderId: sender.id,
      senderName: sender.name,
      senderPublicKey: senderKey.publicKey,
      payloads,
      readBy: [sender.id],
      createdAt: now,
    };
    messaging.addMessage(message);
    metrics.inc("messaging_messages_sent_total");
    logger.info(`Mensagem enviada: ${sender.email} → ${conversation.id}`);

    for (const memberId of conversation.members) {
      if (memberId === sender.id) continue;
      io.to(`user:${memberId}`).emit("messaging:new", {
        conversationId: conversation.id,
        messageId: message.id,
        senderId: sender.id,
        senderName: sender.name,
        createdAt: now,
      });
    }
    res.json({ ok: true, message: { id: message.id, conversationId: conversation.id, createdAt: now, deliveredTo: conversation.members.length } });
  });

  router.post("/messaging/conversations/:id/read", requireAuth, (req: AuthedRequest, res) => {
    const conversation = messaging.getConversation(String(req.params.id));
    if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });
    if (!isMember(req, conversation.id)) return res.status(403).json({ error: "Sem acesso a esta conversa" });
    messaging.markRead(conversation.id, req.user!.sub);
    metrics.inc("messaging_reads_total");
    io.to(`user:${req.user!.sub}`).emit("messaging:read", { conversationId: conversation.id });
    res.json({ ok: true });
  });

  return router;
}
