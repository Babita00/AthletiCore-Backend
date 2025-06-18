import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/announcements/'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

export const uploadAnnouncementFiles = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (['application/pdf', 'image/png', 'image/jpeg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, JPEG allowed.'));
    }
  },
});
