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
    const submissions = await PlayerSubmission.find({ event: eventId, status: 'approved' }).lean();

    const scoreboard = [];

    for (const submission of submissions) {
      const userId = submission.user.toString();
      const userAttempts = attempts
        .filter((a) => a.user.toString() === userId)
        .sort((a, b) => a.attemptNumber - b.attemptNumber);

      const firstName = getField(submission.formFields, 'firstName');
      const lastName = getField(submission.formFields, 'lastName');
      const gender =
        getField(submission.formFields, 'gender')?.toLowerCase() === 'female' ? 'female' : 'male';

      const bodyWeight =
        submission.finalWeight || parseFloat(getField(submission.formFields, 'bodyWeight')) || 0;

      const attemptsFormatted = userAttempts.map((attempt) => {
        const weight = attempt.actualWeight ?? 0;
        const ipfgl = calculateIPFGLScore(bodyWeight, weight, gender);
        return {
          weight,
          ipfgl: parseFloat(ipfgl.toFixed(2)),
          status: attempt.status === 'pass' ? 'success' : 'fail',
        };
      });

      const bestIPFGL = Math.max(
        ...attemptsFormatted.filter((a) => a.status === 'success').map((a) => a.ipfgl || 0),
      );

      scoreboard.push({
        id: submission._id.toString(),
        playerName: `${firstName} ${lastName}`,
        attempts: attemptsFormatted,
        overallIPFGL: parseFloat(bestIPFGL.toFixed(2)),
      });
    }

    res.status(200).json({
      count: scoreboard.length,
      scoreboard,
    });
  } catch (err) {
    console.error('Live scoreboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Individual player breakdown for detailed lift analysis

export const getIndividualLiftBreakdown = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const attempts = await LiftAttempt.find({ event: eventId }).lean();
    const submissions = await PlayerSubmission.find({ event: eventId, status: 'approved' }).lean();

    const getField = (formFields: { key: string; value: string }[], key: string): string => {
      return formFields.find((f) => f.key === key)?.value || '';
    };

    const players = [];

    for (const submission of submissions) {
      const userId = submission.user.toString();
      const userAttempts = attempts.filter((a) => a.user.toString() === userId);

      const gender =
        getField(submission.formFields, 'gender')?.toLowerCase() === 'female' ? 'female' : 'male';
      const bodyWeight =
        submission.finalWeight || parseFloat(getField(submission.formFields, 'bodyWeight')) || 0;
      const firstName = getField(submission.formFields, 'firstName');
      const lastName = getField(submission.formFields, 'lastName');

      const playerData: any = {
        id: submission._id.toString(),
        name: `${firstName} ${lastName}`,
        data: {
          squat: {},
          benchPress: {},
          deadlift: {},
          overallTotal: 0,
        },
      };

      let overallTotal = 0;

      ['squat', 'bench', 'deadlift'].forEach((liftType) => {
        const liftKey = liftType === 'bench' ? 'benchPress' : liftType;
        const liftAttempts = userAttempts
          .filter((a) => a.liftType === liftType)
          .sort((a, b) => a.attemptNumber - b.attemptNumber);

        let bestIPFGL = 0;

        liftAttempts.forEach((attempt) => {
          const weight = attempt.actualWeight ?? 0;
          const ipfgl = calculateIPFGLScore(bodyWeight, weight, gender);
          const ipfglRounded = parseFloat(ipfgl.toFixed(1));

          playerData.data[liftKey][`attempt${attempt.attemptNumber}`] = {
            weight,
            ipfgl: ipfglRounded,
          };

          if (attempt.status === 'pass' && ipfgl > bestIPFGL) {
            bestIPFGL = ipfgl;
          }
        });

        playerData.data[liftKey].total = parseFloat(bestIPFGL.toFixed(1));
        overallTotal += bestIPFGL;
      });

      playerData.data.overallTotal = parseFloat(overallTotal.toFixed(1));
      players.push(playerData);
    }

    res.status(200).json(players);
  } catch (err) {
    console.error('Individual player breakdown error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPlayerMeasurements = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const submissions = await PlayerSubmission.find({ event: eventId, status: 'approved' }).lean();

    const getField = (formFields: { key: string; value: string }[], key: string): string => {
      return formFields.find((f) => f.key === key)?.value || '';
    };

    const result = submissions.map((submission) => {
      const firstName = getField(submission.formFields, 'firstName');
      const lastName = getField(submission.formFields, 'lastName');
      const playerName = `${firstName} ${lastName}`;

      const initialHeight = getField(submission.formFields, 'height');
      const initialWeight = parseFloat(getField(submission.formFields, 'bodyWeight')) || 0;
      const initialRackHeight = parseInt(getField(submission.formFields, 'rackHeight')) || 0;

      return {
        id: submission._id.toString(),
        playerName,
        initialData: {
          height: initialHeight,
          weight: initialWeight,
          rackHeight: initialRackHeight,
        },
        weighInData: {
          height: initialHeight, // optionally use submission.finalHeight if needed
          weight: submission.finalWeight ?? initialWeight,
          rackHeight: submission.finalRackHeight ?? initialRackHeight,
        },
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('Player measurement fetch error:', err);
    res.status(500).json({ message: 'Server error' });
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
        a.status === 'pass' ? a.actualWeight : '✗',
      );

      const bestSquat = Math.max(
        ...sortedAttempts.filter((a) => a.status === 'pass').map((a) => a.actualWeight || 0),
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
        a.status === 'pass' ? a.actualWeight : '✗',
      );

      const bestBench = Math.max(
        ...sortedAttempts.filter((a) => a.status === 'pass').map((a) => a.actualWeight || 0),
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
        a.status === 'pass' ? a.actualWeight : '✗',
      );

      const bestDeadlift = Math.max(
        ...sortedAttempts.filter((a) => a.status === 'pass').map((a) => a.actualWeight || 0),
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
