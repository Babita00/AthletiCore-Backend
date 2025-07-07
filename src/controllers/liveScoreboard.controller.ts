import { Request, Response } from 'express';
import LiftAttempt from '../models/liftAttempt.model';
import PlayerSubmission from '../models/playerSubmission.model';
import { calculateIPFGLScore, calculateIPFCoefficient } from '../utils/ipfgl';

export const getLiveScoreboard = async (req: Request, res: Response) => {
  try {
    const getField = (formFields: { key: string; value: string }[], key: string): string => {
      return formFields.find((f) => f.key === key)?.value || '';
    };

    const { eventId } = req.params;

    const attempts = await LiftAttempt.find({ event: eventId }).lean();
    const submissions = await PlayerSubmission.find({ event: eventId }).lean();

    const scoreboard = [];

    for (const submission of submissions) {
      const userId = submission.user.toString();
      const userAttempts = attempts.filter((a) => a.user.toString() === userId);

      const getAttempts = (liftType: 'squat' | 'bench' | 'deadlift') => {
        const lifts = userAttempts
          .filter((a) => a.liftType === liftType)
          .sort((a, b) => a.attemptNumber - b.attemptNumber);

        const attempts = lifts.map((l) => (l.status === 'good' ? l.actualWeight : '✗'));
        const best = Math.max(
          ...lifts.filter((l) => l.status === 'good').map((l) => l.actualWeight || 0),
        );

        return { attempts, best };
      };

      const { attempts: squats, best: bestSQ } = getAttempts('squat');
      const { attempts: benches, best: bestBP } = getAttempts('bench');
      const { attempts: deadlifts, best: bestDL } = getAttempts('deadlift');

      const total = bestSQ + bestBP + bestDL;

      const form = submission.formFields || [];
      const firstName = getField(form, 'firstName');
      const lastName = getField(form, 'lastName');
      const team = getField(form, 'team');
      const birthYear = getField(form, 'birthYear');
      const division = getField(form, 'division');
      const gender = getField(form, 'gender')?.toLowerCase() || 'male';
      const bodyWeight = parseFloat(getField(form, 'bodyWeight')) || 0;
      const weightClass = Math.ceil(bodyWeight);

      const ipfGL = calculateIPFGLScore(bodyWeight, total, gender === 'female' ? 'female' : 'male');
      const ipfCoeff = calculateIPFCoefficient(gender === 'female' ? 'female' : 'male', bodyWeight);

      scoreboard.push({
        lastName,
        firstName,
        team,
        birthYear,
        division,
        bodyWeight,
        weightClass,
        squat: squats,
        bestSquat: bestSQ,
        bench: benches,
        bestBench: bestBP,
        deadlift: deadlifts,
        bestDeadlift: bestDL,
        total,
        ipfGLPts: parseFloat(ipfGL.toFixed(6)),
        ipfCoeff: parseFloat(ipfCoeff.toFixed(6)),
      });
    }

    res.status(200).json(scoreboard);
    return;
  } catch (err) {
    console.error('Live scoreboard error:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

//-------- For Squat only ------------
export const getSquatLeaderboard = async (req: Request, res: Response) => {
  try {
    const getField = (formFields: { key: string; value: string }[], key: string): string => {
      return formFields.find((f) => f.key === key)?.value || '';
    };

    const { eventId } = req.params;

    const attempts = await LiftAttempt.find({ event: eventId, liftType: 'squat' }).lean();
    const submissions = await PlayerSubmission.find({ event: eventId }).lean();

    const leaderboard = [];

    for (const submission of submissions) {
      const userId = submission.user.toString();
      const userAttempts = attempts.filter((a) => a.user.toString() === userId);

      const sortedAttempts = userAttempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
      const attemptResults = sortedAttempts.map((a) =>
        a.status === 'good' ? a.actualWeight : '✗',
      );

      const bestSquat = Math.max(
        ...sortedAttempts.filter((a) => a.status === 'good').map((a) => a.actualWeight || 0),
      );

      if (bestSquat === 0) continue;

      const form = submission.formFields || [];
      leaderboard.push({
        lastName: getField(form, 'lastName'),
        firstName: getField(form, 'firstName'),
        team: getField(form, 'team'),
        birthYear: getField(form, 'birthYear'),
        division: getField(form, 'division'),
        bodyWeight: parseFloat(getField(form, 'bodyWeight')) || 0,
        weightClass: Math.ceil(parseFloat(getField(form, 'bodyWeight')) || 0),
        squatAttempts: attemptResults,
        bestSquat,
      });
    }

    // Sort leaderboard by bestSquat descending
    leaderboard.sort((a, b) => b.bestSquat - a.bestSquat);

    res.status(200).json(leaderboard);
  } catch (err) {
    console.error('Squat leaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ----- For Bench press only -------------
export const getBenchLeaderboard = async (req: Request, res: Response) => {
  try {
    const getField = (formFields: { key: string; value: string }[], key: string): string => {
      return formFields.find((f) => f.key === key)?.value || '';
    };

    const { eventId } = req.params;

    const attempts = await LiftAttempt.find({ event: eventId, liftType: 'bench' }).lean();
    const submissions = await PlayerSubmission.find({ event: eventId }).lean();

    const leaderboard = [];

    for (const submission of submissions) {
      const userId = submission.user.toString();
      const userAttempts = attempts.filter((a) => a.user.toString() === userId);

      const sortedAttempts = userAttempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
      const attemptResults = sortedAttempts.map((a) =>
        a.status === 'good' ? a.actualWeight : '✗',
      );

      const bestBench = Math.max(
        ...sortedAttempts.filter((a) => a.status === 'good').map((a) => a.actualWeight || 0),
      );

      if (bestBench === 0) continue;

      const form = submission.formFields || [];
      leaderboard.push({
        lastName: getField(form, 'lastName'),
        firstName: getField(form, 'firstName'),
        team: getField(form, 'team'),
        birthYear: getField(form, 'birthYear'),
        division: getField(form, 'division'),
        bodyWeight: parseFloat(getField(form, 'bodyWeight')) || 0,
        weightClass: Math.ceil(parseFloat(getField(form, 'bodyWeight')) || 0),
        benchAttempts: attemptResults,
        bestBench,
      });
    }

    leaderboard.sort((a, b) => b.bestBench - a.bestBench);

    res.status(200).json(leaderboard);
  } catch (err) {
    console.error('Bench leaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------ For deadlift leader board

export const getDeadliftLeaderboard = async (req: Request, res: Response) => {
  try {
    const getField = (formFields: { key: string; value: string }[], key: string): string => {
      return formFields.find((f) => f.key === key)?.value || '';
    };

    const { eventId } = req.params;

    const attempts = await LiftAttempt.find({ event: eventId, liftType: 'deadlift' }).lean();
    const submissions = await PlayerSubmission.find({ event: eventId }).lean();

    const leaderboard = [];

    for (const submission of submissions) {
      const userId = submission.user.toString();
      const userAttempts = attempts.filter((a) => a.user.toString() === userId);

      const sortedAttempts = userAttempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
      const attemptResults = sortedAttempts.map((a) =>
        a.status === 'good' ? a.actualWeight : '✗',
      );

      const bestDeadlift = Math.max(
        ...sortedAttempts.filter((a) => a.status === 'good').map((a) => a.actualWeight || 0),
      );

      if (bestDeadlift === 0) continue;

      const form = submission.formFields || [];
      leaderboard.push({
        lastName: getField(form, 'lastName'),
        firstName: getField(form, 'firstName'),
        team: getField(form, 'team'),
        birthYear: getField(form, 'birthYear'),
        division: getField(form, 'division'),
        bodyWeight: parseFloat(getField(form, 'bodyWeight')) || 0,
        weightClass: Math.ceil(parseFloat(getField(form, 'bodyWeight')) || 0),
        deadliftAttempts: attemptResults,
        bestDeadlift,
      });
    }

    leaderboard.sort((a, b) => b.bestDeadlift - a.bestDeadlift);

    res.status(200).json(leaderboard);
  } catch (err) {
    console.error('Deadlift leaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
