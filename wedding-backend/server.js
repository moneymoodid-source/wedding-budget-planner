import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool, types } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET belum diset di file .env');
    process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(uploadsDir));

types.setTypeParser(types.builtins.DATE, (val) => val);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

function deleteFile(filePath) {
    const absolutePath = path.resolve(filePath);
    console.log('[deleteFile] input path:', filePath);
    console.log('[deleteFile] resolved absolute path:', absolutePath);
    fs.access(absolutePath, fs.constants.F_OK, (err) => {
        if (!err) {
            fs.unlink(absolutePath, (err) => {
                if (err) console.error('Gagal hapus file:', absolutePath, err);
                else console.log('File berhasil dihapus:', absolutePath);
            });
        } else {
            console.log('File tidak ditemukan:', absolutePath);
        }
    });
}

function normalizeUploadFileName(fileNameOrUrl) {
    if (!fileNameOrUrl) return null;
    return path.basename(String(fileNameOrUrl).split('?')[0]);
}

async function isFileStillReferenced(fileName, db = pool) {
    const normalizedFileName = normalizeUploadFileName(fileName);
    if (!normalizedFileName) return false;

    const result = await db.query(
        `SELECT EXISTS (
            SELECT 1 FROM wedding_details WHERE header_image = $1
            UNION ALL
            SELECT 1 FROM vendors WHERE $1 = ANY(images)
            UNION ALL
            SELECT 1 FROM prewed_locations WHERE $1 = ANY(images)
        ) AS in_use`,
        [normalizedFileName]
    );

    return Boolean(result.rows[0]?.in_use);
}

async function shouldDeleteUnusedFile(fileName, db = pool) {
    const normalizedFileName = normalizeUploadFileName(fileName);
    if (!normalizedFileName) return null;

    const stillReferenced = await isFileStillReferenced(normalizedFileName, db);
    return stillReferenced ? null : normalizedFileName;
}

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

// --- EMAIL TRANSPORTER ---
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

emailTransporter.verify()
    .then(() => console.log('SMTP transporter siap digunakan.'))
    .catch((err) => console.error('SMTP transporter gagal diverifikasi:', err.message));

async function sendEmail({ to, subject, html }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Email config belum lengkap. Email tidak dikirim.');
        return;
    }

    try {
        await emailTransporter.sendMail({
            from: `"MoneyMood" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });

        console.log(`Email berhasil dikirim ke ${to}`);
    } catch (err) {
        console.error('Gagal mengirim email:', err.message);
        if (err.code) {
            console.error('SMTP error code:', err.code);
        }
        if (err.response) {
            console.error('SMTP response:', err.response);
        }
    }
}

// ==========================================
// JWT MIDDLEWARE
// ==========================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token tidak ditemukan.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Sesi login kamu sudah berakhir. Silakan login ulang untuk melanjutkan.' });
        }

        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya admin.' });
    }

    next();
}

function getUserIdFromToken(req) {
    return req.user.id;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, '_');
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const fileName = `${timestamp}-${Date.now()}-${safeName}`;
        cb(null, fileName);
    }
});

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageSize = 5 * 1024 * 1024; // 5MB

const upload = multer({
    storage: storage,
    limits: { fileSize: maxImageSize },
    fileFilter: (req, file, cb) => {
        if (!allowedImageTypes.includes(file.mimetype)) {
        return cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.'));
        }
        cb(null, true);
    }
});


// ENDPOINT UPLOAD FILE
app.post('/api/upload', authenticateToken, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err.message);

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    message: 'Ukuran file terlalu besar. Maksimal 5 MB.'
                });
            }

            return res.status(400).json({
                message: err.message || 'Gagal mengupload file.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: 'Tidak ada file yang diupload.'
            });
        }

        console.log('[upload] process.pid:', process.pid);
        console.log('Nama file di server (req.file.filename):', req.file.filename);
        console.log('[upload] uploadsDir:', uploadsDir);
        console.log('[upload] req.file.path:', req.file.path);
        console.log('[upload] req.file.absolutePath:', path.resolve(req.file.path));

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.json({
            fileName: req.file.filename,
            originalName: req.file.originalname,
            url: fileUrl
        });
    });
});

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedUsername = String(username || '').trim();
    const normalizedPassword = String(password || '');

    const allowedDomains = [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'icloud.com'
    ];

    const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

    if (!normalizedUsername) {
      return res.status(400).json({ message: 'Username wajib diisi.' });
    }

    if (normalizedUsername.length < 3) {
      return res.status(400).json({ message: 'Username minimal 3 karakter.' });
    }

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email wajib diisi.' });
    }

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Format email tidak valid.' });
    }

    const emailDomain = normalizedEmail.split('@')[1];

    if (!allowedDomains.includes(emailDomain)) {
      return res.status(400).json({
        message: 'Gunakan email yang valid'
      });
    }

    if (!normalizedPassword) {
      return res.status(400).json({ message: 'Password wajib diisi.' });
    }

    if (normalizedPassword.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [normalizedEmail, normalizedUsername]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email atau username sudah terdaftar.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(normalizedPassword, salt);

    const userCountResult = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userCountResult.rows[0].count);

    let role = 'user';
    let status = 'pending';

    if (userCount === 0) {
      role = 'admin';
      status = 'approved';
    }

    const newUser = await pool.query(
      'INSERT INTO users (username, email, password, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, status',
      [normalizedUsername, normalizedEmail, hashedPassword, role, status]
    );

    if (role === 'user') {
        const defaultDate = new Date().toISOString().split('T')[0];

        await pool.query(
            `INSERT INTO wedding_details (user_id, wedding_title, wedding_date, total_budget, theme_id) 
            VALUES ($1, $2, $3, $4, $5)`,
            [newUser.rows[0].id, 'The Wedding of Us', defaultDate, 100000000, 'gold']
        );
        await sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: 'User baru mendaftar di MoneyMood Wedding Planner',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
                    <h2 style="color: #ec4899;">User Baru Mendaftar</h2>

                    <p>Ada user baru yang mendaftar di MoneyMood Wedding Planner.</p>

                    <table style="border-collapse: collapse; margin-top: 16px;">
                    <tr>
                        <td style="padding: 6px 12px; font-weight: bold;">Username</td>
                        <td style="padding: 6px 12px;">${normalizedUsername}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 12px; font-weight: bold;">Email</td>
                        <td style="padding: 6px 12px;">${normalizedEmail}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 12px; font-weight: bold;">Status</td>
                        <td style="padding: 6px 12px;">Pending Approval</td>
                    </tr>
                    </table>

                    <p style="margin-top: 20px;">
                    Silakan cek pembayaran di Lynk.id, lalu approve user melalui Admin Dashboard.
                    </p>

                    <div style="margin: 24px 0;">
                        <a 
                            href="${frontendUrl}/login" 
                            style="background-color: #ec4899; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;"
                        >
                            Buka Admin Dashboard
                        </a>
                    </div>

                    <p style="font-size: 12px; color: #64748b;">
                    Email ini dikirim otomatis oleh sistem MoneyMood.
                    </p>
                </div>
                `
        });
    }

    res.json(newUser.rows[0]);

  } catch (err) {
    console.error(err.message);

    if (err.code === '23505') {
      return res.status(400).json({ message: 'Username atau Email sudah terdaftar' });
    }

    res.status(500).send('Server Error');
  }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, username, identifier, password } = req.body;
    const loginKey = email || username || identifier;

    if (!loginKey || !password) return res.status(400).json("Mohon isi Username/Email dan Password");

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [loginKey]);
        
        if (userResult.rows.length === 0) return res.status(401).json("User tidak ditemukan");
        const user = userResult.rows[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json("Password salah");

        if (user.status !== 'approved') {
            return res.status(403).json({ 
                error: "PENDING_APPROVAL", 
                message: "Akun belum disetujui Admin." 
            });
        }

        // Ambil theme_id dari wedding_details
        let theme_id = 'gold'; // Default fallback
        const detailsResult = await pool.query('SELECT theme_id FROM wedding_details WHERE user_id = $1', [user.id]);
        if (detailsResult.rows.length > 0 && detailsResult.rows[0].theme_id) {
            theme_id = detailsResult.rows[0].theme_id;
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ 
            message: "Login Berhasil",
            token,
            user: { 
                id: user.id, 
                username: user.username,
                role: user.role,
                theme_id: theme_id 
            } 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// 2. MASTER DATA (THEMES)
// ==========================================
ensureWeddingDetailsHeaderPositionColumns().catch((err) => {
    console.error('Gagal memastikan kolom posisi header image:', err);
});

app.get('/api/themes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM themes ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// ==========================================
// 3. SUMMARY / WEDDING DETAILS ROUTES (BARU)
// ==========================================

// GET Summary
app.get('/api/summary', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(400).json("User ID required");

    try {
        // ✅ Paksa format YYYY-MM-DD dengan TO_CHAR
        let result = await pool.query(
            `SELECT 
                user_id,
                wedding_title, 
                TO_CHAR(wedding_date, 'YYYY-MM-DD') as wedding_date,
                total_budget, 
                header_image, 
                header_image_pos_x,
                header_image_pos_y,
                theme_id 
            FROM wedding_details 
            WHERE user_id = $1`,
            [userId]
        );
        
        // Lazy Load: Jika user lama belum punya data summary, buatkan default sekarang
        if (result.rows.length === 0) {
            const defaultDate = new Date().toISOString().split('T')[0];
            const insert = await pool.query(
                `INSERT INTO wedding_details (user_id, wedding_title, wedding_date, total_budget, theme_id) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING 
                 user_id,
                wedding_title, 
                TO_CHAR(wedding_date, 'YYYY-MM-DD') as wedding_date,
                total_budget, 
                header_image, 
                header_image_pos_x,
                header_image_pos_y,
                theme_id`,
                [userId, 'The Wedding of Us', defaultDate, 100000000, 'gold']
            );
            result = insert;
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// UPDATE Summary (Termasuk Ganti Tema)
app.put('/api/summary', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);
    const { wedding_title, wedding_date, total_budget, header_image, header_image_pos_x, header_image_pos_y, theme_id } = req.body;

    try {
        // Menggunakan COALESCE agar field yang tidak dikirim tidak tertimpa NULL (partial update)
        const result = await pool.query(
            `UPDATE wedding_details 
             SET wedding_title = COALESCE($1, wedding_title),
                 wedding_date = COALESCE($2, wedding_date),
                 total_budget = COALESCE($3, total_budget),
                 header_image = COALESCE($4, header_image),
                 header_image_pos_x = COALESCE($5, header_image_pos_x),
                 header_image_pos_y = COALESCE($6, header_image_pos_y),
                 theme_id = COALESCE($7, theme_id),
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $8 
             RETURNING *`,
            [wedding_title, wedding_date, total_budget, header_image, header_image_pos_x, header_image_pos_y, theme_id, userId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

async function ensureWeddingDetailsHeaderPositionColumns() {
    await pool.query(`
        ALTER TABLE wedding_details
        ADD COLUMN IF NOT EXISTS header_image_pos_x DOUBLE PRECISION DEFAULT 50,
        ADD COLUMN IF NOT EXISTS header_image_pos_y DOUBLE PRECISION DEFAULT 50
    `);

    await pool.query(`
        ALTER TABLE wedding_details
        ALTER COLUMN header_image_pos_x TYPE DOUBLE PRECISION USING header_image_pos_x::double precision,
        ALTER COLUMN header_image_pos_y TYPE DOUBLE PRECISION USING header_image_pos_y::double precision,
        ALTER COLUMN header_image_pos_x SET DEFAULT 50,
        ALTER COLUMN header_image_pos_y SET DEFAULT 50
    `);
}

app.post('/api/summary/remove-header-image', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);
    const { imageName, imageUrl } = req.body;
    const client = await pool.connect();

    try {
        const resolvedImageName = imageName || (imageUrl ? path.basename(String(imageUrl).split('?')[0]) : null);
        await client.query('BEGIN');
        await client.query(
            `UPDATE wedding_details
             SET header_image = NULL,
                 header_image_pos_x = 50,
                 header_image_pos_y = 50,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [userId]
        );

        const removableFileName = resolvedImageName
            ? await shouldDeleteUnusedFile(resolvedImageName, client)
            : null;

        await client.query('COMMIT');

        if (removableFileName) {
            const filePath = path.join(uploadsDir, removableFileName);
            console.log('[remove-header-image] process.pid:', process.pid);
            console.log('[remove-header-image] imageName:', imageName);
            console.log('[remove-header-image] imageUrl:', imageUrl);
            console.log('[remove-header-image] resolvedImageName:', removableFileName);
            console.log('[remove-header-image] target filePath:', filePath);
            deleteFile(filePath);
        }

        res.json({ message: 'Header image berhasil dihapus' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Gagal menghapus header image summary:', err);
        res.status(500).json({ message: 'Gagal menghapus header image' });
    } finally {
        client.release();
    }
});

// ==========================================
// 4. DATA ROUTES (ISOLASI DATA PER USER)
// ==========================================

// --- EXPENSES ---
app.get('/api/expenses', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);
    try {
        // ✅ Paksa format YYYY-MM-DD dengan TO_CHAR
        const result = await pool.query(
            `SELECT 
                id, 
                item, 
                amount, 
                category, 
                status, 
                TO_CHAR(date, 'YYYY-MM-DD') as date,
                note, 
                checked 
            FROM expenses 
            WHERE user_id = $1 
            ORDER BY date DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);
    const { date, item, amount, category, status, note } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO expenses (user_id, date, item, amount, category, status, note, checked, paid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [userId, date, item, amount, category, status, note, status === 'Lunas', status === 'Lunas']
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).send(err.message); }
});

app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);
    const { date, item, amount, category, status, note } = req.body;
    try {
        const check = await pool.query('SELECT * FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) return res.status(403).json("Not authorized");

        const result = await pool.query(
            'UPDATE expenses SET date=$1, item=$2, amount=$3, category=$4, status=$5, note=$6, checked=$7, paid=$8 WHERE id=$9 RETURNING *',
            [date, item, amount, category, status, note, status === 'Lunas', status === 'Lunas', id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);
    try {
        const check = await pool.query('SELECT * FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) return res.status(403).json("Not authorized");
        await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).send(err.message); }
});

// --- GUESTS ---
app.get('/api/guests', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);
    try {
        const result = await pool.query(
            `SELECT 
                id, 
                user_id, 
                name, 
                category, 
                side, 
                pax, 
                phone,
                invited,
                TO_CHAR(sent_at, 'DD/MM/YYYY HH24:MI') as sent_at,
                selected
            FROM guests 
            WHERE user_id = $1 
            ORDER BY name ASC`, 
            [userId]
        );
        res.json(result.rows);
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

app.post('/api/guests', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);
    const { name, category, side, pax, phone } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO guests (user_id, name, category, side, pax, phone, invited) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [userId, name, category, side, pax, phone, false]
        );
        res.json(result.rows[0]);
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

app.put('/api/guests/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);
    const { name, category, side, pax, phone, invited, selected, sent_at } = req.body;

    try {
        const check = await pool.query('SELECT * FROM guests WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) return res.status(403).json("Not authorized");

        const result = await pool.query(
            `UPDATE guests 
             SET name=$1, category=$2, side=$3, pax=$4, phone=$5, invited=$6, selected=$7, sent_at=$8
             WHERE id=$9 
             RETURNING *`,
            [name, category, side, pax, phone, invited || false, selected || false, sent_at || null, id]
        );
        res.json(result.rows[0]);
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

app.delete('/api/guests/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);

    try {
        const check = await pool.query('SELECT * FROM guests WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) return res.status(403).json("Not authorized");
        await pool.query('DELETE FROM guests WHERE id = $1', [id]);
        res.json({ message: "Deleted" });
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

// ENDPOINT: Update status WhatsApp (menggunakan invited)
app.patch('/api/guests/:id/whatsapp-status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);
    const { invited, sent_at } = req.body;
    
    try {
        const check = await pool.query('SELECT * FROM guests WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) return res.status(403).json("Not authorized");

        const result = await pool.query(
            `UPDATE guests 
             SET invited = $1, sent_at = $2 
             WHERE id = $3 
             RETURNING id, invited, TO_CHAR(sent_at, 'DD/MM/YYYY HH24:MI') as sent_at`,
            [invited, sent_at, id]
        );
        res.json(result.rows[0]);
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

app.patch('/api/guests/:id/selected', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);
    const { selected } = req.body;

    if (typeof selected !== 'boolean') {
        return res.status(400).json({
            message: 'selected harus bernilai boolean.'
        });
    }

    try {
        const check = await pool.query(
            'SELECT id FROM guests WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (check.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const result = await pool.query(
            `UPDATE guests 
             SET selected = $1 
             WHERE id = $2 AND user_id = $3
             RETURNING id, selected`,
            [selected, id, userId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            message: 'Gagal update checklist tamu.'
        });
    }
});

// --- TODOS ---
app.get('/api/todos', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);

    try {
        // PERBAIKAN 3: Format Due Date
        const result = await pool.query(
            `SELECT id, user_id, task, completed, TO_CHAR(due_date, 'YYYY-MM-DD') as due_date, created_at 
             FROM todos WHERE user_id = $1 ORDER BY created_at ASC`, 
             [userId]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/todos', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);
    const { task, due_date } = req.body;

    try {
        const result = await pool.query('INSERT INTO todos (user_id, task, due_date) VALUES ($1, $2, $3) RETURNING *', [userId, task, due_date || null]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).send(err.message); }
});

app.put('/api/todos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);
    const { task, completed, due_date } = req.body;

    try {
        const check = await pool.query('SELECT * FROM todos WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) return res.status(403).json("Not authorized");
        const result = await pool.query('UPDATE todos SET task=$1, completed=$2, due_date=$3 WHERE id=$4 RETURNING *', [task, completed, due_date, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/todos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);

    try {
        const check = await pool.query('SELECT * FROM todos WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) return res.status(403).json("Not authorized");
        await pool.query('DELETE FROM todos WHERE id = $1', [id]);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).send(err.message); }
});

// --- VENDORS ---
app.get('/api/vendors', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);

    try {
        const result = await pool.query(
            'SELECT * FROM vendors WHERE user_id = $1 ORDER BY id DESC',
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET Categories
app.get('/api/vendors-categories', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);

    try {
        const result = await pool.query(
            `SELECT id, user_id, name, is_main_checklist
            FROM vendors_categories
            WHERE user_id = $1
            ORDER BY id ASC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/vendors', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);
    const { name, category, location, social_link, images, price } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO vendors (user_id, name, category, location, social_link, images, price) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [userId, name, category, location, social_link, images, price] // images harus berupa array []
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/vendors/:id/remove-image', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { imageName } = req.body;
    const userId = getUserIdFromToken(req);
    const client = await pool.connect();

    try {
        console.log('[remove-image vendor] process.pid:', process.pid);
        await client.query('BEGIN');
        await client.query(
            'UPDATE vendors SET images = array_remove(images, $1) WHERE id = $2 AND user_id = $3',
            [imageName, id, userId]
        );

        const removableFileName = await shouldDeleteUnusedFile(imageName, client);
        await client.query('COMMIT');

        if (removableFileName) {
            const filePath = path.join(uploadsDir, removableFileName);
            console.log('[remove-image vendor] uploadsDir:', uploadsDir);
            console.log('[remove-image vendor] imageName:', imageName);
            console.log('[remove-image vendor] target filePath:', filePath);
            deleteFile(filePath);
        }

        res.json({ message: 'Image vendor berhasil dihapus' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Gagal menghapus image vendor:', err);
        res.status(500).json({ message: 'Gagal menghapus image vendor' });
    } finally {
        client.release();
    }
});

// POST Category (Tambah)
app.post('/api/vendors-categories', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);
    const { name } = req.body;

    try {
        const normalizedName = String(name || '').trim();

        if (!normalizedName) {
            return res.status(400).json({
                message: 'Nama kategori vendor wajib diisi.'
            });
        }

        const result = await pool.query(
            `INSERT INTO vendors_categories (user_id, name, is_main_checklist)
             VALUES ($1, $2, FALSE)
             RETURNING id, user_id, name, is_main_checklist`,
            [userId, normalizedName]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Gagal tambah kategori vendor:', err.message);

        if (err.code === '23505') {
            return res.status(400).json({
                message: 'Kategori vendor sudah ada.'
            });
        }

        res.status(500).json({
            message: 'Gagal menambah kategori vendor.'
        });
    }
});

app.patch('/api/vendors-categories/:id/main-checklist', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);
    const { is_main_checklist } = req.body;

    if (typeof is_main_checklist !== 'boolean') {
        return res.status(400).json({
            message: 'is_main_checklist harus bernilai boolean.'
        });
    }

    try {
        if (is_main_checklist) {
            const countResult = await pool.query(
                `SELECT COUNT(*)::int AS total
                 FROM vendors_categories
                 WHERE user_id = $1
                 AND is_main_checklist = TRUE
                 AND id <> $2`,
                [userId, id]
            );

            const activeCount = Number(countResult.rows[0].total || 0);

            if (activeCount >= 5) {
                return res.status(400).json({
                    message: 'Maksimal hanya 5 kategori yang bisa ditampilkan di Checklist Utama.'
                });
            }
        }

        const result = await pool.query(
            `UPDATE vendors_categories
             SET is_main_checklist = $1
             WHERE id = $2 AND user_id = $3
             RETURNING id, user_id, name, is_main_checklist`,
            [is_main_checklist, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Kategori vendor tidak ditemukan.'
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Gagal update Checklist Utama kategori vendor:', err.message);
        res.status(500).json({
            message: 'Gagal update Checklist Utama kategori vendor.'
        });
    }
});

app.put('/api/vendors/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);
    const { name, category, location, social_link, images, price, selected } = req.body;
    try {
        const check = await pool.query(
            'SELECT * FROM vendors WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        if (check.rows.length === 0) return res.status(403).json("Not authorized");
        const result = await pool.query(
            'UPDATE vendors SET name=$1, category=$2, location=$3, social_link=$4, images=$5, price=$6, selected=$7 WHERE id=$8 RETURNING *',
            [name, category, location, social_link, images, price, selected || false, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/vendors/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const check = await client.query('SELECT * FROM vendors WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json("Not authorized");
        }
        const vendorImages = check.rows[0].images || [];
        await client.query('DELETE FROM vendors WHERE id = $1', [id]);
        const removableFiles = [];
        for (const imageName of vendorImages) {
            const removableFileName = await shouldDeleteUnusedFile(imageName, client);
            if (removableFileName) {
                removableFiles.push(removableFileName);
            }
        }
        await client.query('COMMIT');
        removableFiles.forEach(fileName => deleteFile(path.join(uploadsDir, fileName)));
        res.json({ message: "Deleted" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});
// DELETE Category (Hapus)
app.delete('/api/vendors-categories/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req); // Security check
    try {
        const check = await pool.query('SELECT * FROM vendors_categories WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) return res.status(403).json("Not authorized");
        
        await pool.query('DELETE FROM vendors_categories WHERE id = $1', [id]);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).send(err.message); }
});

// --- PREWED LOCATIONS ---
app.get('/api/prewed-locations', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);

    try {
        const result = await pool.query(
            'SELECT * FROM prewed_locations WHERE user_id = $1 ORDER BY id ASC',
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/prewed-locations', authenticateToken, async (req, res) => {
    const userId = getUserIdFromToken(req);
    const { name, location_name, maps_link, note, price, images } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO prewed_locations 
             (user_id, name, location_name, maps_link, note, price, images) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [
                userId,
                name,
                location_name,
                maps_link || '',
                note || '',
                price || 0,
                images || []
            ]
        );

        res.json(result.rows[0]);
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

app.post('/api/prewed-locations/:id/remove-image', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { imageName } = req.body;
    const userId = getUserIdFromToken(req);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query(
            'UPDATE prewed_locations SET images = array_remove(images, $1) WHERE id = $2 AND user_id = $3',
            [imageName, id, userId]
        );

        const removableFileName = await shouldDeleteUnusedFile(imageName, client);
        await client.query('COMMIT');

        if (removableFileName) {
            const filePath = path.join(uploadsDir, removableFileName);
            console.log('[remove-image prewed] uploadsDir:', uploadsDir);
            console.log('[remove-image prewed] imageName:', imageName);
            console.log('[remove-image prewed] target filePath:', filePath);
            deleteFile(filePath);
        }

        res.json({ message: 'Image prewed berhasil dihapus' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Gagal menghapus image prewed' });
    } finally {
        client.release();
    }
});

app.put('/api/prewed-locations/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);
    const { name, location_name, maps_link, note, price, images, selected } = req.body;

    try {
        const check = await pool.query(
            'SELECT * FROM prewed_locations WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (check.rows.length === 0) {
            return res.status(403).json("Not authorized");
        }

        const result = await pool.query(
            `UPDATE prewed_locations 
             SET name = $1,
                 location_name = $2,
                 maps_link = $3,
                 note = $4,
                 price = $5,
                 images = $6,
                 selected = $7
             WHERE id = $8 AND user_id = $9
             RETURNING *`,
            [
                name,
                location_name,
                maps_link || '',
                note || '',
                price || 0,
                images || [],
                selected || false,
                id,
                userId
            ]
        );

        res.json(result.rows[0]);
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

app.delete('/api/prewed-locations/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = getUserIdFromToken(req);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const check = await client.query('SELECT * FROM prewed_locations WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json("Not authorized");
        }
        const prewedImages = check.rows[0].images || [];
        await client.query('DELETE FROM prewed_locations WHERE id = $1', [id]);
        const removableFiles = [];
        for (const imageName of prewedImages) {
            const removableFileName = await shouldDeleteUnusedFile(imageName, client);
            if (removableFileName) {
                removableFiles.push(removableFileName);
            }
        }
        await client.query('COMMIT');
        removableFiles.forEach(fileName => deleteFile(path.join(uploadsDir, fileName)));
        res.json({ message: "Deleted" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});


// ==========================================
// 5. ADMIN ROUTES
// ==========================================

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await pool.query(
            'SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC'
        );

        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
});

app.post('/api/admin/approve', authenticateToken, requireAdmin, async (req, res) => {
    const { userId } = req.body;

    try {
        const approvedUser = await pool.query(
            `UPDATE users 
            SET status = 'approved' 
            WHERE id = $1 
            RETURNING id, username, email, role, status`,
            [userId]
        );

        if (approvedUser.rows.length === 0) {
            return res.status(404).json({
                message: 'User tidak ditemukan.'
            });
        }

        const user = approvedUser.rows[0];

        await sendEmail({
            to: user.email,
            subject: 'Akun MoneyMood Anda sudah aktif',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
                    <h2 style="color: #ec4899;">Akun MoneyMood Anda Sudah Aktif</h2>

                    <p>Halo <b>${user.username}</b>, Terima kasih sudah membeli produk kami.</p>

                    <p>
                        Akun MoneyMood Wedding Planner Anda sudah disetujui oleh admin dan sudah bisa digunakan.
                    </p>

                    <p>
                        Silakan login menggunakan username/email dan password yang sudah Anda daftarkan. Semoga bermanfaat
                    </p>

                    <div style="margin: 24px 0;">
                        <a 
                            href="${frontendUrl}/login"
                            style="background-color: #ec4899; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;"
                        >
                            Login ke MoneyMood
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #64748b;">
                        Email ini dikirim otomatis oleh sistem MoneyMood.
                    </p>
                </div>
            `
        });

        res.json({
            message: 'User berhasil disetujui.',
            user
        });
    } catch (err) {
        console.error('Approve user error:', err);
        res.status(500).json({ message: "Server Error" });
    }
});

app.post('/api/admin/reject', authenticateToken, requireAdmin, async (req, res) => {
    const { userId } = req.body;

    try {
        await pool.query(
            "DELETE FROM users WHERE id = $1 AND role != 'admin'",
            [userId]
        );

        res.json({ message: "User ditolak dan dihapus" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
});

app.post('/api/admin/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
        return res.status(400).json({ 
            message: 'userId dan newPassword wajib diisi.' 
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ 
            message: 'Password minimal 6 karakter.' 
        });
    }

    try {
        // Jangan izinkan reset password admin lain
        const targetUser = await pool.query(
            'SELECT id, role FROM users WHERE id = $1',
            [userId]
        );

        if (targetUser.rows.length === 0) {
            return res.status(404).json({ 
                message: 'User tidak ditemukan.' 
            });
        }

        if (targetUser.rows[0].role === 'admin') {
            return res.status(403).json({ 
                message: 'Password admin tidak boleh direset dari fitur ini.' 
            });
        }

        // Hash password baru
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const updateResult = await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
            [hashedPassword, userId]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({
                message: 'User gagal diupdate.'
            });
        }

        res.json({ 
            message: 'Password user berhasil direset.' 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ 
            message: 'Gagal reset password.' 
        });
    }
});

app.post('/api/admin/duplicate-vendors', authenticateToken, requireAdmin, async (req, res) => {
    const { sourceUserId, targetUserIds } = req.body;

    if (!sourceUserId || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        return res.status(400).json({
            message: 'sourceUserId dan targetUserIds wajib diisi.'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Cek akun sumber
        const sourceUserCheck = await client.query(
            'SELECT id, username FROM users WHERE id = $1 AND role != $2',
            [sourceUserId, 'admin']
        );

        if (sourceUserCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                message: 'Akun sumber tidak ditemukan atau akun sumber adalah admin.'
            });
        }

        // 2. Cek target user valid
        const validTargetUsers = await client.query(
            `SELECT id 
             FROM users 
             WHERE id = ANY($1::int[]) 
             AND role != 'admin'`,
            [targetUserIds]
        );

        if (validTargetUsers.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                message: 'Tidak ada akun tujuan yang valid.'
            });
        }

        // 3. Ambil vendor dari akun sumber
        const sourceVendors = await client.query(
            `SELECT name, category, location, social_link, images, price
             FROM vendors
             WHERE user_id = $1
             ORDER BY id ASC`,
            [sourceUserId]
        );

        if (sourceVendors.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                message: 'Akun sumber belum memiliki vendor.'
            });
        }

        // 4. Ambil kategori vendor dari akun sumber
        const sourceCategories = await client.query(
            `SELECT name, is_main_checklist
            FROM vendors_categories 
            WHERE user_id = $1 
            ORDER BY id ASC`,
            [sourceUserId]
        );

        let insertedCount = 0;
        let insertedCategoryCount = 0;
        let skippedCategoryCount = 0;
        let skippedVendorCount = 0;

        // 5. Copy ke setiap akun target
        for (const target of validTargetUsers.rows) {
            const targetUserId = target.id;

            // Copy kategori vendor dulu
            for (const cat of sourceCategories.rows) {
                const insertedCategory = await client.query(
                    `INSERT INTO vendors_categories (user_id, name, is_main_checklist)
                    SELECT v.user_id, v.name, v.is_main_checklist
                    FROM (VALUES ($1::int, $2::varchar, $3::boolean)) AS v(user_id, name, is_main_checklist)
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM vendors_categories vc
                        WHERE vc.user_id = v.user_id
                        AND LOWER(TRIM(vc.name)) = LOWER(TRIM(v.name))
                    )
                    RETURNING id`,
                    [
                        Number(targetUserId),
                        String(cat.name || ''),
                        Boolean(cat.is_main_checklist)
                    ]
                );

                if (insertedCategory.rows.length > 0) {
                    insertedCategoryCount++;
                } else {
                    skippedCategoryCount++;
                }
            }

            // Copy vendor
            for (const vendor of sourceVendors.rows) {
                const insertedVendor = await client.query(
                    `INSERT INTO vendors 
                    (user_id, name, category, location, social_link, images, price, selected)
                    SELECT $1::int, $2::varchar, $3::varchar, $4::text, $5::text, $6, $7::numeric, false
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM vendors
                        WHERE user_id = $1::int
                        AND LOWER(TRIM(name)) = LOWER(TRIM($2::varchar))
                        AND LOWER(TRIM(category)) = LOWER(TRIM($3::varchar))
                    )
                    RETURNING id`,
                    [
                        Number(targetUserId),
                        String(vendor.name || ''),
                        String(vendor.category || ''),
                        vendor.location || '',
                        vendor.social_link || '',
                        vendor.images || [],
                        Number(vendor.price || 0)
                    ]
                );

                if (insertedVendor.rows.length > 0) {
                    insertedCount++;
                } else {
                    skippedVendorCount++;
                }
            }
        }

        await client.query('COMMIT');

        res.json({
            message: 'Vendor berhasil diduplikasi.',
            sourceUserId,
            targetUserIds: validTargetUsers.rows.map(u => u.id),
            vendorCountPerUser: sourceVendors.rows.length,
            insertedCategoryCount,
            skippedCategoryCount,
            insertedCount,
            skippedVendorCount
        });

    } catch (err) {
        await client.query('ROLLBACK');

        console.error('Duplicate vendor error:', err);

        res.status(500).json({
            message: 'Gagal duplicate vendor.',
            detail: err.message
        });
    } finally {
        client.release();
    }
});

app.post('/api/admin/duplicate-prewed-locations', authenticateToken, requireAdmin, async (req, res) => {
    const { sourceUserId, targetUserIds } = req.body;

    if (!sourceUserId || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        return res.status(400).json({
            message: 'sourceUserId dan targetUserIds wajib diisi.'
        });
    }

    const normalizedSourceUserId = Number(sourceUserId);
    const normalizedTargetUserIds = targetUserIds.map(id => Number(id));

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Cek akun sumber
        const sourceUserCheck = await client.query(
            'SELECT id, username FROM users WHERE id = $1::int AND role != $2::text',
            [normalizedSourceUserId, 'admin']
        );

        if (sourceUserCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                message: 'Akun sumber tidak ditemukan atau akun sumber adalah admin.'
            });
        }

        // 2. Cek akun tujuan valid
        const validTargetUsers = await client.query(
            `SELECT id 
             FROM users 
             WHERE id = ANY($1::int[]) 
             AND role != 'admin'`,
            [normalizedTargetUserIds]
        );

        if (validTargetUsers.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                message: 'Tidak ada akun tujuan yang valid.'
            });
        }

        // 3. Ambil lokasi prewed dari akun sumber
        const sourcePrewedLocations = await client.query(
            `SELECT name, location_name, maps_link, note, price, images
             FROM prewed_locations
             WHERE user_id = $1::int
             ORDER BY id ASC`,
            [normalizedSourceUserId]
        );

        if (sourcePrewedLocations.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                message: 'Akun sumber belum memiliki lokasi prewed.'
            });
        }

        let insertedCount = 0;
        let skippedCount = 0;

        // 4. Copy ke setiap akun tujuan
        for (const target of validTargetUsers.rows) {
            const targetUserId = Number(target.id);

            for (const loc of sourcePrewedLocations.rows) {
                const insertedLocation = await client.query(
                    `INSERT INTO prewed_locations
                    (user_id, name, location_name, maps_link, note, price, images, selected)
                    SELECT 
                        $1::int,
                        $2::varchar,
                        $3::varchar,
                        $4::text,
                        $5::text,
                        $6::numeric,
                        $7::text[],
                        false
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM prewed_locations
                        WHERE user_id = $1::int
                        AND LOWER(TRIM(name)) = LOWER(TRIM($2::varchar))
                        AND LOWER(TRIM(location_name)) = LOWER(TRIM($3::varchar))
                    )
                    RETURNING id`,
                    [
                        targetUserId,
                        String(loc.name || ''),
                        String(loc.location_name || ''),
                        loc.maps_link || '',
                        loc.note || '',
                        Number(loc.price || 0),
                        loc.images || []
                    ]
                );

                if (insertedLocation.rows.length > 0) {
                    insertedCount++;
                } else {
                    skippedCount++;
                }
            }
        }

        await client.query('COMMIT');

        res.json({
            message: 'Lokasi prewed berhasil diduplikasi.',
            sourceUserId: normalizedSourceUserId,
            targetUserIds: validTargetUsers.rows.map(u => u.id),
            locationCountPerUser: sourcePrewedLocations.rows.length,
            insertedCount,
            skippedCount
        });

    } catch (err) {
        await client.query('ROLLBACK');

        console.error('Duplicate prewed location error:', err);

        res.status(500).json({
            message: 'Gagal duplicate lokasi prewed.',
            detail: err.message
        });
    } finally {
        client.release();
    }
});

// --- PUBLIC STATS ---
app.get('/api/public/stats', async (req, res) => {
    try {
        const userCountResult = await pool.query(
            `SELECT COUNT(*)::int AS total_users 
             FROM users 
             WHERE role != 'admin' 
             AND status = 'approved'`
        );

        res.json({
            totalUsers: userCountResult.rows[0].total_users
        });
    } catch (err) {
        console.error('Public stats error:', err);
        res.status(500).json({
            message: 'Gagal mengambil statistik publik.'
        });
    }
});

app.listen(port, () => {
  console.log(`Server backend berjalan di http://localhost:${port}`);
});
