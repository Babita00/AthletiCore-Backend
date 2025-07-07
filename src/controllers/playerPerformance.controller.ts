import PlayerPerformance from '../models/PlayerPerformance.model';
import { Request, Response } from 'express';

export const addLiftPerformance = async (req: Request, res: Response) => {
  try {
    const { event, liftType, weight } = req.body;
    const userId = (req as any).user._id;

    if (!['squat', 'bench', 'deadlift'].includes(liftType)) {
      return res.status(400).json({ message: 'Invalid lift type' });
    }

    const newEntry = await PlayerPerformance.create({
      user: userId,
      event,
      liftType,
      weight,
    });

    res.status(201).json({
      message: 'Lift performance recorded',
      data: newEntry,
    });
  } catch (error) {
    console.error('Error recording lift:', error);
    res.status(500).json({ message: 'Server error while recording lift' });
  }
};
export const getLiftProgress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { liftType } = req.query;

    const lifts = await PlayerPerformance.find({
      user: userId,
      liftType,
    }).sort({ date: 1 }); // chronological

    res.status(200).json(lifts);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Server error fetching progress' });
  }
};
