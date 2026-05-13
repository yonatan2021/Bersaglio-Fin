import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  encryptionKey?: string;
  unlockedAt?: number;
}

const SESSION_OPTIONS = {
  cookieName: 'bersaglio-session',
  password: process.env.SESSION_SECRET ?? 'dev-secret-must-be-32-chars-minimum!!',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 30, // 30 minutes
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

export async function getEncryptionKey(): Promise<string | null> {
  const session = await getSession();
  if (!session.encryptionKey) return null;
  const age = Date.now() - (session.unlockedAt ?? 0);
  if (age > 30 * 60 * 1000) {
    session.encryptionKey = undefined;
    await session.save();
    return null;
  }
  return session.encryptionKey;
}
