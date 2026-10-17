import jwt from 'jsonwebtoken';

const DEVELOPMENT_JWT_SECRET = 'super-secret-key-for-development-only';
const JWT_SECRET = process.env.JWT_SECRET || DEVELOPMENT_JWT_SECRET;

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEVELOPMENT_JWT_SECRET)
) {
  throw new Error('Set a unique JWT_SECRET before starting CropPulse in production');
}

export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
