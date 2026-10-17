import { Request, Response } from 'express';
import prisma from '../utils/db';
import { calculateDistance } from '../utils/geo';

export const getCrops = async (req: Request, res: Response) => {
  try {
    const crops = await prisma.crop.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(crops);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMarkets = async (req: Request, res: Response) => {
  try {
    const markets = await prisma.market.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(markets);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNearbyMarkets = async (req: Request, res: Response) => {
  try {
    const { lat, lng, maxDistanceKm } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng parameters are required' });
      return;
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const maxDist = maxDistanceKm ? parseFloat(maxDistanceKm as string) : 100; // default 100km

    const markets = await prisma.market.findMany();
    const nearbyMarkets = markets
      .map((market) => {
        const distance = market.latitude && market.longitude
          ? calculateDistance(userLat, userLng, market.latitude, market.longitude)
          : null;
        return { ...market, distance };
      })
      .filter((m) => m.distance !== null && m.distance <= maxDist)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    res.status(200).json(nearbyMarkets);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLatestPrices = async (req: Request, res: Response) => {
  try {
    const { cropId } = req.query;
    
    // Subquery-like approach using Prisma to get the latest price for each crop-market combination
    const whereClause = cropId ? { cropId: cropId as string } : {};
    
    const prices = await prisma.marketPrice.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        crop: true,
        market: true,
      },
    });

    // Group by cropId + marketId and keep only the latest one
    const uniqueMap = new Map();
    for (const p of prices) {
      const key = `${p.cropId}-${p.marketId}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, p);
      }
    }

    res.status(200).json(Array.from(uniqueMap.values()));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPriceHistory = async (req: Request, res: Response) => {
  try {
    const { cropId, marketId, limit } = req.query;
    if (!cropId || !marketId) {
      res.status(400).json({ error: 'cropId and marketId are required' });
      return;
    }

    const history = await prisma.marketPrice.findMany({
      where: {
        cropId: cropId as string,
        marketId: marketId as string,
      },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit as string) : 30,
    });

    res.status(200).json(history.reverse()); // return in chronological order
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Recommendation engine
export const recommendMarkets = async (req: Request, res: Response) => {
  try {
    const { cropId, quantity, lat, lng } = req.query;
    if (!cropId || !quantity || !lat || !lng) {
      res.status(400).json({ error: 'cropId, quantity, lat, and lng are required' });
      return;
    }

    const qty = parseFloat(quantity as string);
    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);

    // Fetch all markets
    const markets = await prisma.market.findMany();
    
    // Fetch latest price for each market
    const latestPrices = await prisma.marketPrice.findMany({
      where: { cropId: cropId as string },
      orderBy: { date: 'desc' },
    });

    const marketLatestPriceMap = new Map();
    for (const p of latestPrices) {
      if (!marketLatestPriceMap.has(p.marketId)) {
        marketLatestPriceMap.set(p.marketId, p);
      }
    }

    // Transport Rate: ₹0.05 per kg per km
    // Loading cost: ₹1 per kg
    // Market charges: 1% of total revenue
    const TRANSPORT_RATE_PER_KG_KM = 0.05;
    const LOADING_COST_PER_KG = 1.0;
    const MARKET_CHARGES_PCT = 0.01;

    const recommendations = markets
      .map((market) => {
        const distance = market.latitude && market.longitude
          ? calculateDistance(userLat, userLng, market.latitude, market.longitude)
          : null;
        
        const priceRecord = marketLatestPriceMap.get(market.id);
        const currentPricePerQuintal = priceRecord ? priceRecord.modalPrice : null;

        if (distance === null || currentPricePerQuintal === null) return null;

        // Note: price is per quintal (100 kg), quantity is in kg
        const currentPricePerKg = currentPricePerQuintal / 100;
        
        const expectedRevenue = currentPricePerKg * qty;
        const transportCost = distance * qty * TRANSPORT_RATE_PER_KG_KM;
        const loadingCost = qty * LOADING_COST_PER_KG;
        const marketCharges = expectedRevenue * MARKET_CHARGES_PCT;
        
        const totalCost = transportCost + loadingCost + marketCharges;
        const netProfit = expectedRevenue - totalCost;
        
        // Recommendation score: scaled by net profit, penalized by distance
        // Higher net profit = higher score, max score = 100
        const score = Math.max(0, Math.min(100, Math.round((netProfit / (qty * 100)) * 10 - distance * 0.1)));

        return {
          marketId: market.id,
          marketName: market.name,
          district: market.district,
          distanceKm: Math.round(distance * 10) / 10,
          currentPricePerQuintal,
          expectedRevenue: Math.round(expectedRevenue),
          transportCost: Math.round(transportCost),
          totalCost: Math.round(totalCost),
          estimatedNetProfit: Math.round(netProfit),
          recommendationScore: score,
        };
      })
      .filter((rec) => rec !== null)
      .sort((a, b) => (b?.estimatedNetProfit || 0) - (a?.estimatedNetProfit || 0));

    res.status(200).json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
