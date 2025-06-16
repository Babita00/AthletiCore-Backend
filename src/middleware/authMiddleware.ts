// ----- 5. middlewares/authMiddleware.ts -----
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const userAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET as string) as {
      userId: string;
    };
    (req as any).user = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
