import './loadEnv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { verifyToken } from './utils/auth';
import prisma from './utils/db';

// Import Routes
import authRoutes from './routes/auth.routes';
import cropRoutes from './routes/crop.routes';
import predictionRoutes from './routes/prediction.routes';
import weatherRoutes from './routes/weather.routes';
import listingRoutes from './routes/listing.routes';
import orderRoutes from './routes/order.routes';
import logisticsRoutes from './routes/logistics.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();
const server = http.createServer(app);
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && !allowedOrigins?.length) {
  throw new Error('Set CORS_ORIGIN to the allowed application origin(s) in production');
}
const io = new Server(server, {
  cors: {
    origin: allowedOrigins?.length ? allowedOrigins : '*',
  }
});

// Expose io instance to Express request objects
app.set('io', io);

app.use(cors({
  origin: allowedOrigins?.length ? allowedOrigins : process.env.NODE_ENV === 'production' ? false : true,
}));
app.use(express.json());

// Register API Routes
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== 'string') {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const decoded = verifyToken(token);
    if (typeof decoded === 'string' || typeof decoded.userId !== 'string' || typeof decoded.role !== 'string') {
      next(new Error('Invalid authentication token'));
      return;
    }

    socket.data.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch {
    next(new Error('Invalid authentication token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user as { userId: string; role: string };
  socket.join(`user:${user.userId}`);
  socket.join(`role:${user.role}`);

  socket.on('conversation:join', async (conversationId: unknown, acknowledge?: (result: { ok: boolean }) => void) => {
    if (typeof conversationId !== 'string') {
      acknowledge?.({ ok: false });
      return;
    }

    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.userId } },
      select: { id: true },
    });
    if (!member) {
      acknowledge?.({ ok: false });
      return;
    }

    await socket.join(`conversation:${conversationId}`);
    acknowledge?.({ ok: true });
  });

  socket.on('logistics:join', async (requestId: unknown, acknowledge?: (result: { ok: boolean }) => void) => {
    if (typeof requestId !== 'string') {
      acknowledge?.({ ok: false });
      return;
    }
    const [request, participant, conversationMember] = await Promise.all([
      prisma.logisticsRequest.findFirst({ where: { id: requestId, requesterId: user.userId }, select: { id: true } }),
      prisma.logisticsParticipant.findUnique({
        where: { requestId_farmerId: { requestId, farmerId: user.userId } },
        select: { id: true },
      }),
      prisma.conversation.findUnique({
        where: { logisticsRequestId: requestId },
        select: { members: { where: { userId: user.userId }, select: { id: true } } },
      }),
    ]);

    if (!request && !participant && !conversationMember?.members.length) {
      acknowledge?.({ ok: false });
      return;
    }
    await socket.join(`logistics:${requestId}`);
    acknowledge?.({ ok: true });
  });

  socket.on('logistics:leave', (requestId: unknown) => {
    if (typeof requestId === 'string') socket.leave(`logistics:${requestId}`);
  });

  socket.on('disconnect', () => undefined);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
