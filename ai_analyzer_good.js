/**
 * AI Code Analyzer Test — GOOD CODE
 *
 * Purpose:
 * A clean, reasonably secure refeence implementation.
 * Expected result: few or no significant findings.
 */

const crypto = require("crypto");
const path = require("path");
const fs = require("fs/promises");

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Secure password hashing using scrypt and a unique random salt.
 */
function hashPassword(password) {
    if (typeof password !== "string" || password.length < 8) {
        throw new Error("Password does not meet minimum requirements.");
    }

    const salt = crypto.randomBytes(16);

    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(
                `${salt.toString("hex")}:${derivedKey.toString("hex")}`
            );
        });
    });
}

/**
 * Verify password using timing-safe comparison.
 */
function verifyPassword(password, storedHash) {
    const [saltHex, keyHex] = String(storedHash).split(":");

    if (!saltHex || !keyHex) {
        return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const expectedKey = Buffer.from(keyHex, "hex");

    return new Promise((resolve, reject) => {
        crypto.scrypt(
            password,
            salt,
            expectedKey.length,
            (error, derivedKey) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(
                    derivedKey.length === expectedKey.length &&
                    crypto.timingSafeEqual(derivedKey, expectedKey)
                );
            }
        );
    });
}

/**
 * Parameterized query prevents SQL injection.
 */
async function getUserByEmail(db, email) {
    if (typeof email !== "string" || !email.includes("@")) {
        throw new Error("Invalid email.");
    }

    const query = "SELECT id, email FROM users WHERE email = ?";
    const result = await db.query(query, [
        email.trim().toLowerCase()
    ]);

    return result.rows;
}

/**
 * Avoid shell execution for arbitrary user input.
 */
async function isKnownHost(host, allowedHosts) {
    return allowedHosts.includes(host);
}

/**
 * Escape HTML before inserting user-controlled content.
 */
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function renderWelcome(username) {
    const safeUsername = escapeHtml(username);

    return `<div class="welcome">Welcome, ${safeUsername}</div>`;
}

/**
 * Prevent path traversal by resolving and validating the path.
 */
async function readUserFile(fileName) {
    const baseDir = path.resolve("/var/app/uploads");
    const target = path.resolve(baseDir, fileName);

    if (
        target !== baseDir &&
        !target.startsWith(`${baseDir}${path.sep}`)
    ) {
        throw new Error("Invalid file path.");
    }

    return fs.readFile(target, "utf8");
}

/**
 * Cryptographically secure token generation.
 */
function createResetToken() {
    return crypto.randomBytes(32).toString("hex");
}

function isSessionExpired(createdAt) {
    return Date.now() - createdAt > SESSION_TTL_MS;
}

/**
 * Centralized normalization avoids duplicated logic.
 */
function normalizeEmail(email) {
    return String(email).trim().toLowerCase();
}

module.exports = {
    hashPassword,
    verifyPassword,
    getUserByEmail,
    isKnownHost,
    escapeHtml,
    renderWelcome,
    readUserFile,
    createResetToken,
    isSessionExpired,
    normalizeEmail
};
