import multer from 'multer';
import path from 'path';

// Storage config (for local storage)
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, 'uploads/events/'); // Make sure this folder exists or create dynamically
  },
  filename: function (_req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File type filter
const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed (jpeg, jpg, png)'));
  }
};

export const uploadEventImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
}).single('eventImage'); // This is the field name you'll use in the form
