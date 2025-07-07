import { Request, Response } from 'express';

const GL_CONSTANTS = {
  male: { A: 1199.72839, B: 102.18609, C: 0.00921 },
  female: { A: 1249.07955, B: 110.0103, C: 0.008731 },
};

export const calculateGLPoints = async (req: Request, res: Response) => {
  try {
    const { gender, bodyWeight, liftedWeight } = req.body;

    if (!gender || !bodyWeight || !liftedWeight) {
      return res
        .status(400)
        .json({ message: 'gender, bodyWeight, and liftedWeight are required.' });
    }

    const genderKey = gender.toLowerCase();
    const constants = GL_CONSTANTS[genderKey as 'male' | 'female'];

    if (!constants) {
      return res.status(400).json({ message: 'Invalid gender. Must be male or female.' });
    }

    const { A, B, C } = constants;
    const e = Math.E;

    const denominator = A - B * Math.pow(e, -C * bodyWeight);
    const glPoints = (liftedWeight * 100) / denominator;

    res.status(200).json({
      glPoints: glPoints.toFixed(2),
      bodyWeight,
      liftedWeight,
      gender,
    });
  } catch (error) {
    console.error('GL Point Calculation Error:', error);
    res.status(500).json({ message: 'Server error while calculating GL points.' });
  }
};

export const calculateRequiredWeightLift = async (req: Request, res: Response) => {
  try {
    const { gender, bodyWeight, targetGLPoints } = req.body;

    if (!gender || !bodyWeight || !targetGLPoints) {
      return res.status(400).json({
        message: 'gender, bodyWeight, and targetGLPoints are required.',
      });
    }

    const genderKey = gender.toLowerCase();
    const constants = GL_CONSTANTS[genderKey as 'male' | 'female'];

    if (!constants) {
      return res.status(400).json({ message: 'Invalid gender. Must be male or female.' });
    }

    const { A, B, C } = constants;
    const e = Math.E;

    const denominator = A - B * Math.pow(e, -C * bodyWeight);
    const requiredLift = (targetGLPoints * denominator) / 100;

    res.status(200).json({
      targetGLPoints,
      bodyWeight,
      gender,
      requiredLift: requiredLift.toFixed(2),
      message: `To achieve ${targetGLPoints} GL points at ${bodyWeight}kg bodyweight, you need to lift approximately ${requiredLift.toFixed(
        2,
      )}kg.`,
    });
  } catch (error) {
    console.error('Required Lift Calculation Error:', error);
    res.status(500).json({ message: 'Server error while calculating required lift.' });
  }
};
