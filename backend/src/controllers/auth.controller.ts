import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/db';
import { generateToken } from '../utils/auth';

const normalizePhone = (phone: string) => phone.replace(/[\s()-]/g, '');

export const register = async (req: Request, res: Response) => {
  try {
    const { role, name, phone, email, password } = req.body;
    const normalizedPhone = typeof phone === 'string' ? normalizePhone(phone) : '';

    if (!normalizedPhone || typeof password !== 'string' || !password) {
      res.status(400).json({ error: 'Phone and password are required' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (existingUser) {
      res.status(400).json({ error: 'Phone number already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        role,
        name,
        phone: normalizedPhone,
        email,
        password: hashedPassword,
      },
    });

    // Create related profile based on role
    if (role === 'FARMER') {
      await prisma.farmerProfile.create({ data: { userId: user.id } });
    } else if (role === 'BUYER') {
      await prisma.buyerProfile.create({ data: { userId: user.id } });
    } else if (role === 'LOGISTICS_PROVIDER') {
      await prisma.logisticsProvider.create({ data: { userId: user.id } });
    }

    const token = generateToken(user.id, user.role);
    res.status(201).json({ user: { id: user.id, name: user.name, role: user.role }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    const normalizedPhone = typeof phone === 'string' ? normalizePhone(phone) : '';

    if (!normalizedPhone || typeof password !== 'string' || !password) {
      res.status(400).json({ error: 'Phone and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      res.status(401).json({ error: 'Invalid phone or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid phone or password' });
      return;
    }

    const token = generateToken(user.id, user.role);
    res.status(200).json({ user: { id: user.id, name: user.name, role: user.role }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, phone: true, email: true, district: true, state: true }
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, email, district, state, village, latitude, longitude } = req.body;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email, district, state, village, latitude, longitude }
    });
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { oldPassword, newPassword } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ error: 'Incorrect old password' });
      return;
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
