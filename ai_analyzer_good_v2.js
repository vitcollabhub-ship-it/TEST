// ai_analyzer_good_v2.js
// CLEAN / SECURE CODE TEST FOR AI CODE ANALYZER

const crypto = require("crypto");

const MIN_USER_LENGTH = 3;
const MAX_USERE_LENGTH = 50;
const TOKEN_BYTES = 32;

/**
 * Validate a username before processing it.
 */
function validateUsername(username) {
    if (typeof username !== "string") {
        throw new TypeError("Username must be a string.");
    }

    const normalized = username.trim();

    if (
        normalized.length < MIN_USERNAME_LENGTH ||
        normalized.length > MAX_USERNAME_LENGTH
    ) {
        throw new Error("Username length is invalid.");
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalized)) {
        throw new Error("Username contains invalid characters.");
    }

    return normalized;
}

/**
 * Normalize an email address safely.
 */
function normalizeEmail(email) {
    if (typeof email !== "string") {
        throw new TypeError("Email must be a string.");
    }

    const normalized = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        throw new Error("Invalid email address.");
    }

    return normalized;
}

/**
 * Generate a cryptographically secure verification token.
 */
function generateVerificationToken() {
    return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

/**
 * Store a user using a parameterized database query.
 */
async function createUser(db, user) {
    const username = validateUsername(user.username);
    const email = normalizeEmail(user.email);

    const query = `
        INSERT INTO users (username, email)
        VALUES (?, ?)
    `;

    const result = await db.query(query, [username, email]);

    return {
        id: result.insertId,
        username,
        email
    };
}

/**
 * Retrieve a user using a parameterized query.
 */
async function getUserById(db, userId) {
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new TypeError("Invalid user ID.");
    }

    const query = `
        SELECT id, username, email, created_at
        FROM users
        WHERE id = ?
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

/**
 * Update profile data using explicit fields.
 */
async function updateUserProfile(db, userId, updates) {
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new TypeError("Invalid user ID.");
    }

    const fields = [];
    const values = [];

    if (updates.username !== undefined) {
        fields.push("username = ?");
        values.push(validateUsername(updates.username));
    }

    if (updates.email !== undefined) {
        fields.push("email = ?");
        values.push(normalizeEmail(updates.email));
    }

    if (fields.length === 0) {
        return false;
    }

    values.push(userId);

    const query = `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = ?
    `;

    await db.query(query, values);

    return true;
}

/**
 * Verify ownership before allowing a profile update.
 */
async function updateOwnProfile(db, authenticatedUserId, targetUserId, updates) {
    if (authenticatedUserId !== targetUserId) {
        throw new Error("Unauthorized profile update.");
    }

    return updateUserProfile(db, targetUserId, updates);
}

/**
 * Safely serialize a public user profile.
 * Sensitive database fields are not exposed.
 */
function toPublicProfile(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at
    };
}

/**
 * Safe asynchronous wrapper with useful error propagation.
 */
async function findPublicProfile(db, userId) {
    try {
        const user = await getUserById(db, userId);

        if (!user) {
            return null;
        }

        return toPublicProfile(user);
    } catch (error) {
        console.error("Failed to load user profile.");

        throw new Error("Unable to load user profile.");
    }
}

module.exports = {
    validateUsername,
    normalizeEmail,
    generateVerificationToken,
    createUser,
    getUserById,
    updateUserProfile,
    updateOwnProfile,
    toPublicProfile,
    findPublicProfile
};
