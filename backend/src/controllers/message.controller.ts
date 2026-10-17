import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getRouteParam } from '../utils/request';

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;

    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: {
              where: { userId: { not: userId } },
              include: {
                user: {
                  select: { id: true, name: true, phone: true, role: true, profileImage: true },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const conversations = memberships.map((m) => {
      const otherMember = m.conversation.members[0];
      return {
        id: m.conversation.id,
        otherUser: otherMember ? otherMember.user : null,
        lastMessage: m.conversation.messages[0] || null,
        createdAt: m.conversation.createdAt,
        updatedAt: m.conversation.updatedAt,
      };
    });

    res.status(200).json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user.userId;

    if (userId === otherUserId) {
      res.status(400).json({ error: 'Cannot start conversation with yourself' });
      return;
    }

    // Check if conversation already exists between these two users
    const existingConversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: true,
      },
    });

    const existing = existingConversations.find((c) =>
      c.members.some((m) => m.userId === otherUserId)
    );

    if (existing) {
      res.status(200).json(existing);
      return;
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        members: {
          create: [
            { userId },
            { userId: otherUserId },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const id = getRouteParam(req, res, 'id');
    if (id === null) return;

    const userId = req.user.userId;

    // Check if user is a member of this conversation
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId: id, userId },
    });

    if (!member) {
      res.status(403).json({ error: 'Forbidden: You are not a member of this conversation' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const id = getRouteParam(req, res, 'id');
    if (id === null) return;

    const { content } = req.body;
    const userId = req.user.userId;

    // Check membership
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId: id, userId },
    });

    if (!member) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Emit message to Socket.io room (real-time chat!)
    const io = req.app.get('io');
    if (io) {
      io.to(id).emit('new_message', message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
