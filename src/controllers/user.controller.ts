// ----- 4. controllers/authController.ts -----
import { Request, Response } from 'express';
import User from '../models/user.model';
import TokenModel from '../models/token.model';
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

    // Exclude password from the response
    const { password: _, ...userData } = newUser.toObject();

    res.status(201).json({
      message: 'User registered successfully',
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
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
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(400).json({ message: 'No refresh token provided' });
      return;
    }

    // Delete refresh token from DB
    await TokenModel.deleteOne({ token: refreshToken });

    // Clear the cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Internal server error' });
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
