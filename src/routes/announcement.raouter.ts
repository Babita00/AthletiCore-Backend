import express from 'express';
import { createAnnouncement, getAnnouncements } from '../controllers/announcement.controller';
import { userAuth } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { createAnnouncementSchema } from '../validations/announcementSchema';

const router = express.Router();

router.post('/', userAuth, validate(createAnnouncementSchema), createAnnouncement);
router.get('/', getAnnouncements);

export default router;
