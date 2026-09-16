const express = require('express');
const pool = require('../db');
const cloudinary = require('../config/cloudinary');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// mp4 streams as "video", pdf/html stream as "raw".
const CONTENT_TYPE_BY_MIME = {
  'video/mp4': 'video',
  'application/pdf': 'pdf',
  'text/html': 'html',
};

// file_path stores the full Cloudinary secure_url. Signed URLs need the
// public_id, so pull it back out of that URL.
function getPublicId(filePath, type) {
  try {
    const parts = new URL(filePath).pathname.split('/').filter(Boolean);
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    const rest = parts.slice(uploadIndex + 1);
    if (/^v\d+$/.test(rest[0])) rest.shift();
    if (type === 'video' && rest.length) {
      rest[rest.length - 1] = rest[rest.length - 1].replace(/\.[^.]+$/, '');
    }
    return rest.join('/');
  } catch {
    return null;
  }
}

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const resourceType = file.mimetype === 'video/mp4' ? 'video' : 'raw';
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'secure_content', resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(file.buffer);
  });
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, description, category, type, views_count, created_at
       FROM contents
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/access', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });

    const [rows] = await pool.query(
      'SELECT id, title, type, file_path FROM contents WHERE id = ?',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Content not found' });
    const content = rows[0];

    // Signed URLs need the Cloudinary public_id, not the stored full URL.
    const publicId = getPublicId(content.file_path, content.type);
    if (!publicId) {
      return res.status(500).json({ message: 'Could not generate download link' });
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 60;
    const signedUrl = cloudinary.url(publicId, {
      resource_type: content.type === 'video' ? 'video' : 'raw',
      sign_url: true,
      expires_at: expiresAt,
      secure: true,
    });

    await pool.query(
      'UPDATE contents SET views_count = views_count + 1 WHERE id = ?',
      [id]
    );

    res.json({
      id: content.id,
      title: content.title,
      type: content.type,
      signedUrl,
      expiresInSeconds: 60,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, requireAdmin, upload, async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!req.file) return res.status(400).json({ message: 'A file is required.' });

    const uploaded = await uploadToCloudinary(req.file);
    const type = CONTENT_TYPE_BY_MIME[req.file.mimetype];

    const [result] = await pool.query(
      `INSERT INTO contents (title, description, category, type, file_path)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description || null, category || null, type, uploaded.secure_url]
    );

    const [rows] = await pool.query(
      `SELECT id, title, description, category, type, views_count, created_at
       FROM contents WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });
    if (title === undefined && description === undefined && category === undefined) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const [result] = await pool.query(
      `UPDATE contents
       SET title = COALESCE(?, title), description = COALESCE(?, description), category = COALESCE(?, category)
       WHERE id = ?`,
      [title ?? null, description ?? null, category ?? null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const [rows] = await pool.query(
      `SELECT id, title, description, category, type, views_count, created_at
       FROM contents WHERE id = ?`,
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });

    const [rows] = await pool.query(
      'SELECT id, type, file_path FROM contents WHERE id = ?',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Content not found' });
    const content = rows[0];

    // Remove the stored asset so a deleted item is really gone from storage.
    // A Cloudinary hiccup must not block the deletion, though — the MySQL row
    // is the source of truth for the library, so we log and continue.
    const publicId = getPublicId(content.file_path, content.type);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: content.type === 'video' ? 'video' : 'raw',
          invalidate: true,
        });
      } catch (cloudErr) {
        console.error(`[Cloudinary] Failed to delete asset ${publicId}:`, cloudErr.message);
      }
    }

    const [result] = await pool.query('DELETE FROM contents WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json({ message: 'Content deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;