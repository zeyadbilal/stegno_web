const crypto = require('crypto');

const SALT_SIZE = 16;
const KEY_SIZE = 32;
const ITERATIONS = 100000;

function encryptPassword(password, passphrase) {
    const salt = crypto.randomBytes(SALT_SIZE);
    const key = crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_SIZE, 'sha256');

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(password, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const tag = cipher.getAuthTag();
    const payload = Buffer.concat([salt, iv, encrypted, tag]);

    return payload.toString('base64');
}

function decryptPassword(payloadBase64, passphrase) {
    const data = Buffer.from(payloadBase64, 'base64');

    const salt = data.slice(0, SALT_SIZE);
    const nonce = data.slice(SALT_SIZE, SALT_SIZE + 16);
    const tag = data.slice(-16);
    const ciphertext = data.slice(SALT_SIZE + 16, -16);

    const key = crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_SIZE, 'sha256');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
}

module.exports = { encryptPassword, decryptPassword };
