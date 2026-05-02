const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { encryptPassword, decryptPassword } = require('./crypto');
const { embed, extract } = require('./stego');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only PNG images are supported'));
        }
    },
});

app.post('/api/encode', upload.single('image'), (req, res) => {
    try {
        const { password, passphrase } = req.body;

        if (!req.file || !password || !passphrase) {
            return res.status(400).json({ error: 'Image, password, and passphrase are required' });
        }

        const encrypted = encryptPassword(password, passphrase);

        embed(req.file.buffer, encrypted)
            .then(stegoBuffer => {
                res.set('Content-Type', 'image/png');
                res.set('Content-Disposition', 'attachment; filename="stego_image.png"');
                res.send(stegoBuffer);
            })
            .catch(err => {
                res.status(400).json({ error: err.message });
            });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/decode', upload.single('image'), (req, res) => {
    try {
        const { passphrase } = req.body;

        if (!req.file || !passphrase) {
            return res.status(400).json({ error: 'Image and passphrase are required' });
        }

        const extracted = extract(req.file.buffer);
        const decrypted = decryptPassword(extracted, passphrase);

        res.json({ password: decrypted });
    } catch (err) {
        res.status(400).json({ error: 'Decryption failed. Wrong passphrase or invalid image.' });
    }
});

app.listen(PORT, () => {
    console.log(`StegnoWeb backend running on http://localhost:${PORT}`);
});
