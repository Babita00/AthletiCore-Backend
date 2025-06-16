// ----- 4. controllers/authController.ts -----
import { Request, Response } from 'express';
import User from '../models/user.model';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phoneNumber, username, role, gender, password, age, weight } =
      req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const newUser = new User({
      fullName,
      email,
      username,
      phoneNumber,
      role,
      gender,
      password,
      ...(role === 'Player' && { age, weight }),
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: 'No user found with this email' });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token required' });
      return;
    }

    // Remove this refresh token from DB
    const deleted = await User.findOneAndDelete({ token: refreshToken });

    if (!deleted) {
      res.status(400).json({ message: 'Refresh token not found or already invalidated' });
      return;
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const generateAccessAndRefreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET as string) as {
      userId: string;
    };

    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    // Optionally store or update newRefreshToken in DB

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(403).json({ message: 'Invalid token' });
  }
};
