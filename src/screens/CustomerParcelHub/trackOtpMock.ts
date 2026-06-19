/**
 * UI-only OTP helpers for public parcel tracking.
 * Replace with real API calls when backend endpoints are available.
 */

/** Temporary: skip real OTP checks while backend is not wired up. */
export const TRACK_OTP_BYPASS = true;

const OTP_TTL_MS = 5 * 60 * 1000;

interface OtpSession {
  code: string;
  expiresAt: number;
}

const sessions = new Map<string, OtpSession>();

function sessionKey(phone: string): string {
  return phone.replace(/\D/g, "");
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendTrackOtp(phone: string): Promise<{ success: boolean; message: string }> {
  await new Promise(r => setTimeout(r, 800));
  const key = sessionKey(phone);
  if (!key) return { success: false, message: "Invalid phone number." };

  const code = generateCode();
  sessions.set(key, { code, expiresAt: Date.now() + OTP_TTL_MS });

  if (import.meta.env.DEV) {
    console.info(`[Track OTP mock] Code for ${phone}: ${code}`);
  }

  return { success: true, message: "Verification code sent to your phone." };
}

export async function verifyTrackOtp(
  phone: string,
  otp: string,
): Promise<{ success: boolean; message: string }> {
  await new Promise(r => setTimeout(r, 600));

  if (TRACK_OTP_BYPASS) {
    return { success: true, message: "Phone verified successfully." };
  }

  const key = sessionKey(phone);
  const session = sessions.get(key);

  if (!session) {
    return { success: false, message: "No active code. Please request a new one." };
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(key);
    return { success: false, message: "Code expired. Please request a new one." };
  }

  if (otp.trim() !== session.code) {
    return { success: false, message: "Incorrect code. Please try again." };
  }

  sessions.delete(key);
  return { success: true, message: "Phone verified successfully." };
}
