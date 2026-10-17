import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { calculateDistance } from '../utils/geo';
import { getRouteParam } from '../utils/request';

export const createLogisticsRequest = async (req: AuthRequest, res: Response) => {
  try {
    const {
      orderId,
      pickupLocation,
      destination,
      cropName,
      quantity,
      preferredDate,
      preferredTime,
      vehicleType,
      offeredPrice,
      vehicleCapacity,
      estimatedCost,
      maxFarmers,
      notes,
    } = req.body;
    const requesterId = req.user.userId;
    if (req.user.role !== 'FARMER') {
      res.status(403).json({ error: 'Only farmers can create shared transport requests' });
      return;
    }
    const parsedQuantity = Number(quantity);
    const parsedDate = preferredDate ? new Date(preferredDate) : null;

    if (
      typeof pickupLocation !== 'string' ||
      !pickupLocation.trim() ||
      typeof destination !== 'string' ||
      !destination.trim() ||
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0 ||
      (vehicleCapacity !== undefined && (!Number.isFinite(Number(vehicleCapacity)) || Number(vehicleCapacity) < parsedQuantity)) ||
      (estimatedCost !== undefined && (!Number.isFinite(Number(estimatedCost)) || Number(estimatedCost) < 0)) ||
      (maxFarmers !== undefined && (!Number.isInteger(Number(maxFarmers)) || Number(maxFarmers) < 1)) ||
      (parsedDate && Number.isNaN(parsedDate.getTime()))
    ) {
      res.status(400).json({ error: 'Valid pickup, destination, quantity and preferred date are required' });
      return;
    }

    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.logisticsRequest.create({
        data: {
          requesterId,
          orderId: orderId || null,
          pickupLocation: pickupLocation.trim(),
          destination: destination.trim(),
          cropName: typeof cropName === 'string' ? cropName.trim() : null,
          quantity: parsedQuantity,
          preferredDate: parsedDate,
          preferredTime: typeof preferredTime === 'string' ? preferredTime : null,
          vehicleType,
          offeredPrice: Number.isFinite(Number(offeredPrice)) ? Number(offeredPrice) : null,
          vehicleCapacity: Number.isFinite(Number(vehicleCapacity)) ? Number(vehicleCapacity) : null,
          estimatedCost: Number.isFinite(Number(estimatedCost)) ? Number(estimatedCost) : null,
          maxFarmers: Number.isInteger(Number(maxFarmers)) && Number(maxFarmers) > 0 ? Number(maxFarmers) : null,
          notes: typeof notes === 'string' ? notes.trim() : null,
          status: 'PENDING',
        },
        include: { requester: { select: { id: true, name: true, district: true, state: true, village: true } } },
      });
      await tx.conversation.create({
        data: {
          logisticsRequestId: created.id,
          title: `${created.cropName || 'Transport'} group`,
          members: { create: { userId: requesterId } },
        },
      });
      return created;
    });

    const io = req.app.get('io');
    io?.to('role:FARMER').emit('logistics:request_created', request);
    io?.to(`user:${requesterId}`).emit('logistics:request_updated', request);
    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLogisticsRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let requests;
    if (role === 'LOGISTICS_PROVIDER') {
      // Providers can browse all pending requests near their service area
      const provider = await prisma.logisticsProvider.findUnique({
        where: { userId },
      });

      const serviceAreas = provider?.serviceAreas ? provider.serviceAreas.split(',') : [];

      requests = await prisma.logisticsRequest.findMany({
        where: {
          status: 'PENDING',
        },
        include: {
          requester: { select: { name: true, phone: true, district: true, state: true } },
          order: { include: { listing: { include: { crop: true } } } },
          participants: { include: { farmer: { select: { id: true, name: true } } } },
        },
      });

      // Filter by service area if provider has configured it
      if (serviceAreas.length > 0) {
        requests = requests.filter((r) =>
          serviceAreas.some(
            (area) =>
              r.pickupLocation.toLowerCase().includes(area.toLowerCase()) ||
              r.destination.toLowerCase().includes(area.toLowerCase())
          )
        );
      }
    } else {
      requests = await prisma.logisticsRequest.findMany({
        where: role === 'ADMIN' ? undefined : { status: { not: 'CANCELLED' } },
        include: {
          requester: { select: { id: true, name: true, district: true, state: true, village: true } },
          order: { include: { listing: { include: { crop: true } } } },
          participants: { include: { farmer: { select: { id: true, name: true } } } },
          matches: {
            include: {
              provider: {
                include: { user: { select: { name: true, phone: true } } },
              },
            },
          },
          joinRequests: {
            where: role === 'ADMIN'
              ? undefined
              : { OR: [{ farmerId: userId }, { request: { requesterId: userId } }] },
            include: { farmer: { select: { id: true, name: true, district: true, state: true, village: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logistics Optimization & Shared Transport Matching Algorithm
export const findMatches = async (req: AuthRequest, res: Response) => {
  try {
    const id = getRouteParam(req, res, 'id');
    if (id === null) return;

    const userId = req.user.userId;

    const request = await prisma.logisticsRequest.findUnique({
      where: { id },
      include: { requester: true },
    });

    if (!request) {
      res.status(404).json({ error: 'Logistics request not found' });
      return;
    }

    // Coordinates mapping or calculations
    // In a production app, we would geocode pickupLocation and destination to get lat/long
    // For local SQLite, we will simulate lat/long based on requester coordinates, or fallback to default
    const pickupLat = request.requester.latitude || 11.0168;
    const pickupLng = request.requester.longitude || 76.9558;
    
    // Assume Coimbatore mandi destination coordinates
    const destLat = 11.0168; 
    const destLng = 76.9558;

    const distance = calculateDistance(pickupLat, pickupLng, destLat, destLng);
    const transportRatePerKmKg = 0.05; // rate per km per kg
    const individualCost = distance * request.quantity * transportRatePerKmKg;

    // 1. Search for other PENDING logistics requests that can be shared
    // Criteria: pickup is within 25km, destination is the same or within 10km, and scheduled for same/similar time
    const otherRequests = await prisma.logisticsRequest.findMany({
      where: {
        id: { not: id },
        status: 'PENDING',
      },
      include: { requester: true },
    });

    const shareableCandidates = otherRequests
      .map((other) => {
        const otherPickupLat = other.requester.latitude || 11.0168;
        const otherPickupLng = other.requester.longitude || 76.9558;
        const pickupDist = calculateDistance(pickupLat, pickupLng, otherPickupLat, otherPickupLng);
        
        // Let's assume they are going to the same general location (within 15km)
        const destDist = 0; // Same mandi

        return { request: other, pickupDistance: pickupDist, destDistance: destDist };
      })
      .filter((candidate) => candidate.pickupDistance <= 25); // Close enough for sharing

    // 2. Find eligible logistics providers with available capacity
    const providers = await prisma.logisticsProvider.findMany({
      where: { isAvailable: true },
      include: { user: true },
    });

    const matches = [];

    // Individual Provider Matches
    for (const p of providers) {
      if (p.capacity !== null && p.capacity >= request.quantity) {
        const providerLat = p.user.latitude || 11.0168;
        const providerLng = p.user.longitude || 76.9558;
        const distToPickup = calculateDistance(providerLat, providerLng, pickupLat, pickupLng);

        matches.push({
          type: 'INDIVIDUAL',
          providerId: p.id,
          providerName: p.user.name,
          vehicleType: p.vehicleType,
          capacity: p.capacity,
          rating: p.rating,
          distanceToPickupKm: Math.round(distToPickup * 10) / 10,
          estimatedCost: Math.round(individualCost),
          savings: 0,
          sharedWith: null,
        });
      }
    }

    // Shared Transport Matches
    for (const candidate of shareableCandidates) {
      const combinedQty = request.quantity + candidate.request.quantity;
      
      // Find providers with capacity to carry both
      for (const p of providers) {
        if (p.capacity !== null && p.capacity >= combinedQty) {
          // Combined route: Provider -> Pickup A -> Pickup B -> Destination
          // Total distance = Dist(A to B) + Dist(B to Dest)
          const distAToB = candidate.pickupDistance;
          const distBToDest = calculateDistance(
            candidate.request.requester.latitude || 11.0168,
            candidate.request.requester.longitude || 76.9558,
            destLat,
            destLng
          );
          
          const combinedDistance = distAToB + distBToDest;
          const combinedSharedCost = combinedDistance * combinedQty * transportRatePerKmKg;

          // Split the cost proportionally to quantity
          const myShare = (request.quantity / combinedQty) * combinedSharedCost;
          const savings = individualCost - myShare;

          if (savings > 0) {
            const providerLat = p.user.latitude || 11.0168;
            const providerLng = p.user.longitude || 76.9558;
            const distToPickup = calculateDistance(providerLat, providerLng, pickupLat, pickupLng);

            matches.push({
              type: 'SHARED',
              providerId: p.id,
              providerName: p.user.name,
              vehicleType: p.vehicleType,
              capacity: p.capacity,
              rating: p.rating,
              distanceToPickupKm: Math.round(distToPickup * 10) / 10,
              estimatedCost: Math.round(myShare),
              savings: Math.round(savings),
              sharedWith: {
                requestId: candidate.request.id,
                farmerName: candidate.request.requester.name,
                quantity: candidate.request.quantity,
                pickupLocation: candidate.request.pickupLocation,
              },
            });
          }
        }
      }
    }

    // Sort matches by cost/savings (highest savings first, then lowest cost)
    matches.sort((a, b) => b.savings - a.savings || a.estimatedCost - b.estimatedCost);

    res.status(200).json({
      requestId: id,
      individualCost: Math.round(individualCost),
      matches,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const acceptMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId, providerId, estimatedCost } = req.body;

    if (req.user.role !== 'LOGISTICS_PROVIDER') {
      res.status(403).json({ error: 'Only a logistics provider can accept a transport request' });
      return;
    }

    const provider = await prisma.logisticsProvider.findUnique({
      where: { userId: req.user.userId },
      include: { user: true },
    });
    if (!provider || provider.id !== providerId || !provider.isAvailable) {
      res.status(409).json({ error: 'This provider is unavailable' });
      return;
    }
    const cost = Number(estimatedCost);
    if (!Number.isFinite(cost) || cost < 0 || typeof requestId !== 'string') {
      res.status(400).json({ error: 'Valid request and estimated cost are required' });
      return;
    }

    const match = await prisma.$transaction(async (tx) => {
      const request = await tx.logisticsRequest.findUnique({ where: { id: requestId } });
      if (!request || request.status !== 'PENDING') {
        throw new Error('REQUEST_UNAVAILABLE');
      }
      const serviceAreas = provider.serviceAreas?.split(',').map((area) => area.trim().toLowerCase()).filter(Boolean) || [];
      if (provider.capacity === null || provider.capacity < request.quantity) {
        throw new Error('PROVIDER_CAPACITY');
      }
      if (
        serviceAreas.length > 0 &&
        !serviceAreas.some((area) =>
          request.pickupLocation.toLowerCase().includes(area) ||
          request.destination.toLowerCase().includes(area)
        )
      ) {
        throw new Error('PROVIDER_OUT_OF_AREA');
      }

      const acceptedMatch = await tx.logisticsMatch.findFirst({
        where: { requestId, status: 'ACCEPTED' },
        select: { id: true },
      });
      if (acceptedMatch) throw new Error('REQUEST_UNAVAILABLE');

      const createdMatch = await tx.logisticsMatch.create({
        data: { requestId, providerId, estimatedCost: cost, status: 'ACCEPTED' },
      });
      await tx.logisticsRequest.update({ where: { id: requestId }, data: { status: 'MATCHED' } });
      await tx.logisticsProvider.update({ where: { id: providerId }, data: { isAvailable: false } });

      const conversation = await tx.conversation.upsert({
        where: { logisticsRequestId: requestId },
        create: {
          logisticsRequestId: requestId,
          title: `${request.cropName || 'Transport'} group`,
          members: { create: { userId: request.requesterId } },
        },
        update: {},
      });
      await tx.conversationMember.upsert({
        where: { conversationId_userId: { conversationId: conversation.id, userId: provider.userId } },
        create: { conversationId: conversation.id, userId: provider.userId },
        update: {},
      });
      await tx.notification.create({
        data: {
          userId: request.requesterId,
          title: 'Transport Accepted',
          body: `${provider.user.name} accepted your ${request.cropName || 'transport'} request.`,
          type: 'LOGISTICS_MATCHED',
        },
      });
      return createdMatch;
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message === 'REQUEST_UNAVAILABLE') return null;
      if (error instanceof Error && error.message === 'PROVIDER_CAPACITY') {
        return { error: 'PROVIDER_CAPACITY' } as const;
      }
      if (error instanceof Error && error.message === 'PROVIDER_OUT_OF_AREA') {
        return { error: 'PROVIDER_OUT_OF_AREA' } as const;
      }
      throw error;
    });

    if (match && 'error' in match) {
      res.status(409).json({
        error: match.error === 'PROVIDER_CAPACITY'
          ? 'Your vehicle capacity is not sufficient for this request'
          : 'This request is outside your service area',
      });
      return;
    }
    if (!match) {
      res.status(409).json({ error: 'This transport request has already been accepted or is unavailable' });
      return;
    }
    const request = await prisma.logisticsRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: { select: { id: true, name: true, district: true, state: true, village: true } },
        matches: { include: { provider: { include: { user: { select: { id: true, name: true } } } } } },
        participants: { include: { farmer: { select: { id: true, name: true } } } },
      },
    });
    if (!request) {
      res.status(404).json({ error: 'Logistics request not found' });
      return;
    }
    const io = req.app.get('io');
    io?.to('role:FARMER').emit('logistics:request_updated', request);
    io?.to(`logistics:${requestId}`).emit('logistics:request_updated', request);
    io?.to(`user:${request.requesterId}`).emit('notification:new', {
      title: 'Transport Accepted',
      type: 'LOGISTICS_MATCHED',
    });
    res.status(200).json(match);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLogisticsStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = getRouteParam(req, res, 'id');
    if (id === null) return;

    const { status } = req.body; // MATCHED, ACCEPTED, IN_TRANSIT, DELIVERED, CANCELLED

    const request = await prisma.logisticsRequest.findUnique({
      where: { id },
    });

    if (!request) {
      res.status(404).json({ error: 'Logistics request not found' });
      return;
    }

    const isOwner = request.requesterId === req.user.userId;
    const isProvider = req.user.role === 'LOGISTICS_PROVIDER' && await prisma.logisticsMatch.findFirst({
      where: { requestId: id, status: 'ACCEPTED', provider: { userId: req.user.userId } },
      select: { id: true },
    });
    if (!isOwner && !isProvider) {
      res.status(403).json({ error: 'Only the requester or assigned provider can update this shipment' });
      return;
    }
    const allowedStatuses = ['MATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
    if (typeof status !== 'string' || !allowedStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid shipment status' });
      return;
    }
    if (
      (status === 'IN_TRANSIT' && request.status !== 'MATCHED') ||
      (status === 'DELIVERED' && request.status !== 'IN_TRANSIT') ||
      (status === 'CANCELLED' && ['DELIVERED', 'CANCELLED'].includes(request.status))
    ) {
      res.status(409).json({ error: `Shipment cannot move from ${request.status} to ${status}` });
      return;
    }
    if (isProvider && !['IN_TRANSIT', 'DELIVERED'].includes(status)) {
      res.status(403).json({ error: 'Providers can only update an assigned shipment to in transit or delivered' });
      return;
    }

    const updated = await prisma.logisticsRequest.update({
      where: { id },
      data: { status },
    });

    if (status === 'DELIVERED' || status === 'CANCELLED') {
      const activeMatch = await prisma.logisticsMatch.findFirst({
        where: { requestId: id, status: 'ACCEPTED' },
        select: { id: true, providerId: true },
      });
      if (activeMatch) {
        await prisma.$transaction([
          prisma.logisticsMatch.update({
            where: { id: activeMatch.id },
            data: { status: status === 'DELIVERED' ? 'COMPLETED' : 'REJECTED' },
          }),
          prisma.logisticsProvider.update({
            where: { id: activeMatch.providerId },
            data: { isAvailable: true },
          }),
        ]);
      }
    }

    // Also update order status if linked
    if (request.orderId) {
      let orderStatus = status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED';
      if (status === 'IN_TRANSIT') orderStatus = 'IN_TRANSIT';
      if (status === 'DELIVERED') orderStatus = 'DELIVERED';
      
      await prisma.order.update({
        where: { id: request.orderId },
        data: { status: orderStatus },
      });
    }

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: request.requesterId,
        title: 'Shipment Update',
        body: `Your logistics shipment is now ${status}.`,
        type: 'LOGISTICS_STATUS',
      },
    });

    const io = req.app.get('io');
    const payload = { ...updated, requester: { id: request.requesterId } };
    io?.to('role:FARMER').emit('logistics:request_updated', payload);
    io?.to(`logistics:${id}`).emit('logistics:request_updated', payload);
    io?.to(`user:${request.requesterId}`).emit('notification:new', {
      title: 'Shipment Update',
      type: 'LOGISTICS_STATUS',
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const joinLogisticsRequest = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = getRouteParam(req, res, 'id');
    if (requestId === null) return;
    if (req.user.role !== 'FARMER') {
      res.status(403).json({ error: 'Only farmers can join shared transport requests' });
      return;
    }
    const quantity = Number(req.body.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      res.status(400).json({ error: 'A valid quantity greater than zero is required' });
      return;
    }

    const request = await prisma.logisticsRequest.findUnique({
      where: { id: requestId },
      include: { participants: true },
    });
    if (!request || request.status !== 'PENDING') {
      res.status(404).json({ error: 'This transport request is no longer open' });
      return;
    }
    if (request.requesterId === req.user.userId) {
      res.status(400).json({ error: 'You cannot join your own request' });
      return;
    }
    const existingParticipant = request.participants.some((participant) => participant.farmerId === req.user.userId);
    if (existingParticipant) {
      res.status(409).json({ error: 'You are already part of this transport group' });
      return;
    }
    const occupiedCapacity = request.quantity + request.participants.reduce((total, participant) => total + participant.quantity, 0);
    if (request.vehicleCapacity !== null && occupiedCapacity + quantity > request.vehicleCapacity) {
      res.status(400).json({ error: 'Requested quantity exceeds the remaining vehicle capacity' });
      return;
    }
    const joinRequest = await prisma.logisticsJoinRequest.upsert({
      where: { requestId_farmerId: { requestId, farmerId: req.user.userId } },
      create: {
        requestId,
        farmerId: req.user.userId,
        quantity,
        farmerLocation: typeof req.body.farmerLocation === 'string' ? req.body.farmerLocation : null,
      },
      update: {
        quantity,
        farmerLocation: typeof req.body.farmerLocation === 'string' ? req.body.farmerLocation : null,
        status: 'PENDING',
      },
      include: { farmer: { select: { id: true, name: true, district: true, state: true, village: true } } },
    });
    const notification = await prisma.notification.create({
      data: {
        userId: request.requesterId,
        title: 'New Transport Join Request',
        body: `${joinRequest.farmer.name} wants to join your ${request.cropName || 'transport'} group.`,
        type: 'JOIN_REQUEST',
        logisticsRequestId: request.id,
      },
    });

    const io = req.app.get('io');
    io?.to(`user:${request.requesterId}`).emit('logistics:join_requested', joinRequest);
    io?.to(`user:${request.requesterId}`).emit('notification:new', notification);
    res.status(201).json(joinRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const respondToJoinRequest = async (req: AuthRequest, res: Response) => {
  try {
    const joinRequestId = getRouteParam(req, res, 'id');
    if (joinRequestId === null) return;
    const { status } = req.body;
    if (status !== 'ACCEPTED' && status !== 'REJECTED') {
      res.status(400).json({ error: 'Status must be ACCEPTED or REJECTED' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const joinRequest = await tx.logisticsJoinRequest.findUnique({
        where: { id: joinRequestId },
        include: { request: true, farmer: { select: { id: true, name: true } } },
      });
      if (!joinRequest) return { kind: 'NOT_FOUND' as const };
      if (joinRequest.request.requesterId !== req.user.userId) return { kind: 'FORBIDDEN' as const };
      if (joinRequest.status !== 'PENDING') return { kind: 'CONFLICT' as const };
      if (joinRequest.request.status !== 'PENDING') return { kind: 'CONFLICT' as const };

      if (status === 'ACCEPTED') {
        const participants = await tx.logisticsParticipant.findMany({ where: { requestId: joinRequest.requestId } });
        const occupiedCapacity = joinRequest.request.quantity + participants.reduce((total, p) => total + p.quantity, 0);
        const farmerCount = participants.length + 1;
        if (
          (joinRequest.request.vehicleCapacity !== null && occupiedCapacity + joinRequest.quantity > joinRequest.request.vehicleCapacity) ||
          (joinRequest.request.maxFarmers !== null && farmerCount + 1 > joinRequest.request.maxFarmers)
        ) {
          return { kind: 'CAPACITY' as const };
        }
        await tx.logisticsParticipant.create({
          data: {
            requestId: joinRequest.requestId,
            farmerId: joinRequest.farmerId,
            quantity: joinRequest.quantity,
          },
        });
        const conversation = await tx.conversation.upsert({
          where: { logisticsRequestId: joinRequest.requestId },
          create: {
            logisticsRequestId: joinRequest.requestId,
            title: `${joinRequest.request.cropName || 'Transport'} group`,
            members: { create: { userId: joinRequest.request.requesterId } },
          },
          update: {},
        });
        await tx.conversationMember.upsert({
          where: { conversationId_userId: { conversationId: conversation.id, userId: joinRequest.farmerId } },
          create: { conversationId: conversation.id, userId: joinRequest.farmerId },
          update: {},
        });
      }

      const updatedJoinRequest = await tx.logisticsJoinRequest.update({
        where: { id: joinRequestId },
        data: { status },
        include: { farmer: { select: { id: true, name: true } } },
      });
      const notification = await tx.notification.create({
        data: {
          userId: joinRequest.farmerId,
          title: status === 'ACCEPTED' ? 'Transport Join Request Accepted' : 'Transport Join Request Declined',
          body: status === 'ACCEPTED'
            ? `You are now part of the ${joinRequest.request.cropName || 'transport'} group. Group chat is ready.`
            : `Your request to join the ${joinRequest.request.cropName || 'transport'} group was declined.`,
          type: status === 'ACCEPTED' ? 'JOIN_ACCEPTED' : 'JOIN_REJECTED',
          logisticsRequestId: joinRequest.requestId,
        },
      });
      return { kind: 'OK' as const, joinRequest: updatedJoinRequest, notification };
    });

    if (result.kind !== 'OK') {
      const statusCode = result.kind === 'NOT_FOUND' ? 404 : result.kind === 'FORBIDDEN' ? 403 : result.kind === 'CAPACITY' ? 409 : 409;
      res.status(statusCode).json({ error: result.kind === 'CAPACITY' ? 'Accepting this farmer would exceed group capacity' : 'Join request cannot be updated' });
      return;
    }

    const io = req.app.get('io');
    io?.to(`user:${result.joinRequest.farmerId}`).emit('notification:new', result.notification);
    io?.to(`user:${result.joinRequest.farmerId}`).emit('logistics:join_responded', result.joinRequest);
    io?.to(`logistics:${result.joinRequest.requestId}`).emit('logistics:participants_updated', {
      requestId: result.joinRequest.requestId,
      joinRequest: result.joinRequest,
    });
    io?.to('role:FARMER').emit('logistics:request_updated', { id: result.joinRequest.requestId });
    res.status(200).json(result.joinRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLogisticsMessages = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = getRouteParam(req, res, 'id');
    if (requestId === null) return;
    const member = await prisma.conversationMember.findFirst({
      where: {
        userId: req.user.userId,
        conversation: { logisticsRequestId: requestId },
      },
      include: { conversation: { select: { id: true } } },
    });
    if (!member) {
      res.status(403).json({ error: 'Only members of this transport group can access its chat' });
      return;
    }
    const messages = await prisma.message.findMany({
      where: { conversationId: member.conversationId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendLogisticsMessage = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = getRouteParam(req, res, 'id');
    if (requestId === null) return;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content || content.length > 4000) {
      res.status(400).json({ error: 'Message must contain between 1 and 4000 characters' });
      return;
    }
    const member = await prisma.conversationMember.findFirst({
      where: { userId: req.user.userId, conversation: { logisticsRequestId: requestId } },
      include: { conversation: { select: { id: true, title: true } } },
    });
    if (!member) {
      res.status(403).json({ error: 'Only members of this transport group can send messages' });
      return;
    }
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId: member.conversationId, senderId: req.user.userId, content },
        include: { sender: { select: { id: true, name: true, role: true } } },
      });
      await tx.conversation.update({ where: { id: member.conversationId }, data: { updatedAt: new Date() } });
      const recipients = await tx.conversationMember.findMany({
        where: { conversationId: member.conversationId, userId: { not: req.user.userId } },
        select: { userId: true },
      });
      if (recipients.length > 0) {
        await tx.notification.createMany({
          data: recipients.map((recipient) => ({
            userId: recipient.userId,
            title: 'New Transport Group Message',
            body: `${created.sender.name}: ${content.slice(0, 180)}`,
            type: 'NEW_MESSAGE',
          })),
        });
      }
      return created;
    });
    const io = req.app.get('io');
    io?.to(`logistics:${requestId}`).emit('logistics:message', {
      requestId,
      message: { ...message, requestId, senderName: message.sender.name, message: message.content },
    });
    const recipients = await prisma.conversationMember.findMany({
      where: { conversationId: member.conversationId, userId: { not: req.user.userId } },
      select: { userId: true },
    });
    recipients.forEach((recipient) => {
      io?.to(`user:${recipient.userId}`).emit('notification:new', {
        title: 'New Transport Group Message',
        body: `${message.sender.name}: ${content.slice(0, 180)}`,
        type: 'NEW_MESSAGE',
      });
    });
    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
