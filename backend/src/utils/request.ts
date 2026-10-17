import { Request, Response } from 'express';

export const getRouteParam = (
  req: Request,
  res: Response,
  name: string
): string | null => {
  const value = req.params[name];
  if (typeof value === 'string') {
    return value;
  }

  res.status(400).json({ error: `Invalid ${name} parameter` });
  return null;
};
