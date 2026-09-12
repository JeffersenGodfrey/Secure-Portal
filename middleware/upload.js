const multer = require('multer');

const MIME_BY_EXT = {
  'video/mp4': 'mp4',
  'application/pdf': 'pdf',
  'text/html': 'html',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const expected = MIME_BY_EXT[file.mimetype];
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    if (expected && ext === expected) return cb(null, true);
    cb(Object.assign(new Error('Only .mp4, .pdf, and .html files are allowed'), { status: 400 }));
  },
});

module.exports = upload.single('file');