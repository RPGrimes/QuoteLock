import { randomBytes } from "crypto";

/**
 * Generate an unguessable, URL-safe public slug
 * Uses cryptographically secure random bytes
 * Returns a 24-character base64url-encoded string
 */
export function generatePublicSlug(): string {
  // Generate 18 random bytes (144 bits of entropy)
  // Base64url encoding will produce ~24 characters
  const bytes = randomBytes(18);
  
  // Convert to base64url (URL-safe base64)
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Verify that a slug is valid format (optional validation)
 */
export function isValidPublicSlug(slug: string): boolean {
  // Check length (should be 24 chars for our generation)
  if (slug.length < 20) {
    return false;
  }
  
  // Check it only contains URL-safe base64 characters
  return /^[A-Za-z0-9_-]+$/.test(slug);
}

