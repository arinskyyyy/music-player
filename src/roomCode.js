const CODE_CHARS = "0123456789abcdef";

// Generates a short hash-style room code, e.g. "a4k2f8hf" (displayed with a "#" prefix).
export function generateRoomCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// Normalizes user-typed room codes: trims, lowercases, and strips a leading "#".
export function normalizeRoomCode(raw) {
  return String(raw || "").trim().toLowerCase().replace(/^#/, "");
}

// Display form: "#a4k2f8hf", or "LOBBY" when not in a real room.
export function formatRoomCode(code) {
  return code && code !== "LOBBY" ? `#${code}` : "LOBBY";
}
