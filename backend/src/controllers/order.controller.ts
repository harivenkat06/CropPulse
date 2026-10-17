import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getRouteParam } from '../utils/request';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, quantity, price } = req.body;
    const buyerId = req.user.userId;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    if (listing.sellerId === buyerId) {
      res.status(400).json({ error: 'Cannot purchase your own listing' });
      return;
    }

    if (listing.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Listing is no longer active' });
      return;
    }

    if (listing.quantity < parseFloat(quantity)) {
      res.status(400).json({ error: 'Insufficient quantity available' });
      return;
    }

    const order = await prisma.order.create({
      data: {
        listingId,
        buyerId,
        sellerId: listing.sellerId,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        status: 'PENDING',
      },
      include: {
        listing: {
          include: {
            crop: true,
          },
        },
        seller: {
          select: { name: true, phone: true },
        },
        buyer: {
          select: { name: true, phone: true },
        },
      },
    });

    // Create a notification for the seller
    await prisma.notification.create({
      data: {
        userId: listing.sellerId,
        title: 'New Offer Received',
        body: `You received an offer for ${quantity} ${listing.unit} of ${listing.cropId} at ₹${price} per unit.`,
        type: 'ORDER_OFFER',
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let orders;
    if (role === 'FARMER') {
      orders = await prisma.order.findMany({
        where: { sellerId: userId },
        include: {
          listing: { include: { crop: true } },
          buyer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'BUYER') {
      orders = await prisma.order.findMany({
        where: { buyerId: userId },
        include: {
          listing: { include: { crop: true } },
          seller: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Admin or Logistics Provider might want to query all orders they are involved in
      orders = await prisma.order.findMany({
        include: {
          listing: { include: { crop: true } },
          seller: { select: { name: true, phone: true } },
          buyer: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const id = getRouteParam(req, res, 'id');
    if (id === null) return;

    const userId = req.user.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        listing: { include: { crop: true } },
        seller: { select: { id: true, name: true, phone: true, district: true, state: true, village: true } },
        buyer: { select: { id: true, name: true, phone: true, district: true, state: true, village: true } },
        logisticsRequests: {
          include: {
            matches: {
              include: {
                provider: {
                  include: {
                    user: { select: { name: true, phone: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.buyerId !== userId && order.sellerId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'LOGISTICS_PROVIDER') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = getRouteParam(req, res, 'id');
    if (id === null) return;

    const { status } = req.body;
    const userId = req.user.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { listing: { include: { crop: true } } },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Role-based authorization check for state transitions
    const isSeller = order.sellerId === userId;
    const isBuyer = order.buyerId === userId;

    if (status === 'ACCEPTED' || status === 'REJECTED') {
      if (!isSeller) {
        res.status(403).json({ error: 'Only the seller can accept or reject an offer' });
        return;
      }
    } else if (status === 'CONFIRMED' || status === 'CANCELLED') {
      if (!isBuyer && !isSeller) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    // If order is ACCEPTED, we can subtract the listing stock
    if (status === 'ACCEPTED' && order.listing) {
      const remainingQty = order.listing.quantity - order.quantity;
      await prisma.listing.update({
        where: { id: order.listing.id },
        data: {
          quantity: remainingQty,
          status: remainingQty <= 0 ? 'SOLD' : 'ACTIVE',
        },
      });
    }

    // Send notifications to the appropriate parties
    const notifyUser = isSeller ? order.buyerId : order.sellerId;
    await prisma.notification.create({
      data: {
        userId: notifyUser,
        title: `Order Update`,
        body: `Order status for ${order.listing?.crop.name ?? 'your product'} has changed to ${status}.`,
        type: 'ORDER_STATUS',
      },
    });

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
