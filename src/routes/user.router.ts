import { Router } from 'express';
import { register, login, logout } from '../controllers/user.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validations/userValidation';
import { userAuth } from '../middleware/authMiddleware';
const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post(
  '/logout',
  // userAuth,
  logout,
);

export default router;
