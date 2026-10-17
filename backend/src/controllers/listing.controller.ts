import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getRouteParam } from '../utils/request';

export const getListings = async (req: AuthRequest, res: Response) => {
  try {
    const { cropId, district, minPrice, maxPrice, minQty } = req.query;

    const filters: any = {
      status: 'ACTIVE',
    };

    if (cropId) {
      filters.cropId = cropId as string;
    }

    if (minPrice || maxPrice) {
      filters.expectedPrice = {};
      if (minPrice) filters.expectedPrice.gte = parseFloat(minPrice as string);
      if (maxPrice) filters.expectedPrice.lte = parseFloat(maxPrice as string);
    }

    if (minQty) {
      filters.quantity = { gte: parseFloat(minQty as string) };
    }

    if (district) {
      filters.seller = {
        district: district as string,
      };
    }

    const listings = await prisma.listing.findMany({
      where: filters,
      include: {
        crop: true,
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            district: true,
            state: true,
            village: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    const { cropId, quantity, unit, expectedPrice, quality, harvestDate, location } = req.body;
    const sellerId = req.user.userId;

    // Check if crop exists
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) {
      res.status(400).json({ error: 'Invalid cropId' });
      return;
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId,
        cropId,
        quantity: parseFloat(quantity),
        unit,
        expectedPrice: parseFloat(expectedPrice),
        quality,
        harvestDate: harvestDate ? new Date(harvestDate) : null,
        location,
        status: 'ACTIVE',
      },
      include: {
        crop: true,
      },
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
    const id = getRouteParam(req, res, 'id');
    if (id === null) return;

    const { quantity, expectedPrice, quality, status, location } = req.body;
    const userId = req.user.userId;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    if (listing.sellerId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not own this listing' });
      return;
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        quantity: quantity ? parseFloat(quantity) : undefined,
        expectedPrice: expectedPrice ? parseFloat(expectedPrice) : undefined,
        quality,
        status,
        location,
      },
    });

    res.status(200).json(updatedListing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteListing = async (req: AuthRequest, res: Response) => {
  try {
    const id = getRouteParam(req, res, 'id');
    if (id === null) return;

    const userId = req.user.userId;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    if (listing.sellerId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not own this listing' });
      return;
    }

    // Instead of deleting, we set status to CANCELLED for record keeping
    const cancelledListing = await prisma.listing.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.status(200).json(cancelledListing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
