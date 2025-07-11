import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller';
import { userAuth } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { createAnnouncementSchema } from '../validations/announcementSchema';
import { uploadAnnouncementFiles } from '../middleware/uploadAnnouncementFiles';
const router = express.Router();

router.post(
  '/',
  userAuth,
  uploadAnnouncementFiles.array('attachments', 5),
  validate(createAnnouncementSchema),
  createAnnouncement,
);
router.get('/:id', getAnnouncementById);
router.get('/', getAnnouncements);
router.patch('/:id', userAuth, uploadAnnouncementFiles.array('attachments', 5), updateAnnouncement);
router.delete('/:id', userAuth, deleteAnnouncement);

export default router;
