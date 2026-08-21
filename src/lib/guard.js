const { getServerSession } = require("next-auth");
const { authOptions } = require("./auth");
const { NextResponse } = require("next/server");

/**
 * Gets the current session, or returns null.
 */
async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Ensures the current request is authenticated and (optionally) has one of
 * the allowed roles. Returns { session } on success, or { error } (a
 * NextResponse) that the caller should return immediately.
 */
async function requireRole(allowedRoles = []) {
  const session = await getSession();

  if (!session) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }

  return { session };
}

module.exports = { getSession, requireRole };
