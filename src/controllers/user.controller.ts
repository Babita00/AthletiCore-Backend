// ----- 4. controllers/authController.ts -----
import { Request, Response } from 'express';
import User from '../models/user.model';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils';
import jwt from 'jsonwebtoken';

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
    const { emailOrUsername, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user || !(await user.matchPassword(password))) {
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

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET as string) as {
      userId: string;
    };
    const accessToken = generateAccessToken(decoded.userId);
    res.json({ accessToken });
  } catch {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};
