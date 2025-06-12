// ----- 4. controllers/authController.ts -----
import { Request, Response } from 'express';
import User from '../models/user.model';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils';
import jwt from 'jsonwebtoken';
export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phoneNumber, username, role, gender, password, age, weight } =
      req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

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
    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET as string) as {
      userId: string;
    };
    const accessToken = generateAccessToken(decoded.userId);
    return res.json({ accessToken });
  } catch {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
};
