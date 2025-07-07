import { Request, Response } from 'express';
import PlayerProfile from '../models/PlayerProfile.model';
import mongoose from 'mongoose';

// Create Player Profile
export const createProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user; // your auth middleware sets this
    const { handle, bio, avatarUrl, location, isPremium, isVerified } = req.body;

    // Check if profile already exists for this user
    const existingProfile = await PlayerProfile.findOne({ user: userId });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists for this user' });
    }

    // Create new profile
    const profile = new PlayerProfile({
      user: userId,
      handle,
      bio,
      avatarUrl,
      location,
      isPremium,
      isVerified,
    });

    await profile.save();

    res.status(201).json({ message: 'Profile created successfully', profile });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ message: 'Server error while creating profile' });
  }
};

// Get Own Profile
export const getOwnProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;

    const profile = await PlayerProfile.findOne({ user: userId })
      .populate('playerPerformance')
      .populate('user', 'fullName email');
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Update Own Profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const updateData = req.body;

    // Prevent updating user field directly
    if ('user' in updateData) delete updateData.user;

    const updatedProfile = await PlayerProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Profile not found to update' });
    }

    res.status(200).json({ message: 'Profile updated', profile: updatedProfile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// Delete Own Profile
export const deleteProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;

    const deletedProfile = await PlayerProfile.findOneAndDelete({ user: userId });

    if (!deletedProfile) {
      return res.status(404).json({ message: 'Profile not found to delete' });
    }

    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ message: 'Server error while deleting profile' });
  }
};
