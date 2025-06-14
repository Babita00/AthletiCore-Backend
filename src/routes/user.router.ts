import { Router } from 'express';
import { register, login } from '../controllers/user.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validations/userValidation';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;
