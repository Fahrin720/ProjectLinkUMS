import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {INITIAL_PROFILES} from './seed-data';
import {AppUserRole, Profile} from './types';

export const ADMIN_EMAILS: readonly string[] = ['fahrinmuneer3@gmail.com'];

const LEGACY_EXAMPLE_USER_IDS = new Set([
  'usr-aiman',
  'usr-izzah',
  'usr-daniel',
  'usr-farah',
  'usr-keith',
]);

export function resolveRoleByEmail(email?: string | null): AppUserRole {
  if (!email) return 'user';
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized) ? 'admin' : 'user';
}

// Mirrors public.profile_private in Supabase
export interface ProfilePrivateRecord {
  user_id: string;
  email: string;
  matric_no: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

// Mirrors public.user_roles in Supabase
export interface UserRoleRecord {
  user_id: string;
  role: AppUserRole;
  assigned_at: string;
}

export interface AuthAccountRecord {
  user_id: string;
  email: string;
  alt_email?: string;
  matric_no: string;
  display_name: string;
  faculty_short: string;
  faculty: string;
  role: AppUserRole;
  salt: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSessionRecord {
  token: string;
  user_id: string;
  email: string;
  role: AppUserRole;
  created_at: string;
  expires_at: string;
}

export interface PendingEmailVerification {
  email: string;
  code: string;
  display_name: string;
  faculty_short: string;
  faculty: string;
  matric_no: string;
  phone: string;
  salt: string;
  password_hash: string;
  created_at: string;
  expires_at: string;
}

export interface PendingPasswordReset {
  user_id: string;
  email: string;
  code: string;
  created_at: string;
  expires_at: string;
}

export interface AuthDatabaseSchema {
  accounts: AuthAccountRecord[];
  sessions: AuthSessionRecord[];
  profiles: Profile[];
  profilePrivate: ProfilePrivateRecord[];
  userRoles: UserRoleRecord[];
  pendingVerifications: PendingEmailVerification[];
  pendingPasswordResets: PendingPasswordReset[];
}

const DB_FILE_PATH = path.join(process.cwd(), '.projectlink-auth-db.json');

export function hashPasswordWithSalt(password: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(`${salt}:projectlink_ums:${password}`)
    .digest('hex');
}

function buildSeededAuthDb(): AuthDatabaseSchema {
  const defaultSalt = 'ums_seed_salt_2026';
  const defaultHash = hashPasswordWithSalt('ums2026', defaultSalt);
  const now = '2026-11-01T08:00:00Z';

  const accounts: AuthAccountRecord[] = [
    {
      user_id: 'usr-admin',
      email: 'fahrinmuneer3@gmail.com',
      matric_no: 'A2412345',
      display_name: 'Fahrin Muneer',
      faculty_short: 'FKI',
      faculty: 'Fakulti Komputeran dan Informatik (FKI), UMS',
      role: 'admin',
      salt: defaultSalt,
      password_hash: defaultHash,
      created_at: now,
      updated_at: now,
    },
  ];

  const profilePrivate: ProfilePrivateRecord[] = [
    {
      user_id: 'usr-admin',
      email: 'fahrinmuneer3@gmail.com',
      matric_no: 'A2412345',
      phone: '+60 13-884 2412',
      created_at: now,
      updated_at: now,
    },
  ];

  const userRoles: UserRoleRecord[] = [
    {
      user_id: 'usr-admin',
      role: 'admin',
      assigned_at: now,
    },
  ];

  return {
    accounts,
    sessions: [],
    profiles: [...INITIAL_PROFILES],
    profilePrivate,
    userRoles,
    pendingVerifications: [],
    pendingPasswordResets: [],
  };
}

function normalizeRolesInDb(db: AuthDatabaseSchema): AuthDatabaseSchema {
  const defaultSalt = 'ums_seed_salt_2026';
  const defaultHash = hashPasswordWithSalt('ums2026', defaultSalt);
  const now = new Date().toISOString();

  // Strip any legacy example student accounts from previous runs
  db.accounts = (db.accounts || []).filter(
    (a) => !LEGACY_EXAMPLE_USER_IDS.has(a.user_id)
  );
  db.profiles = (db.profiles || []).filter(
    (p) => !LEGACY_EXAMPLE_USER_IDS.has(p.id)
  );
  db.sessions = (db.sessions || []).filter(
    (s) => !LEGACY_EXAMPLE_USER_IDS.has(s.user_id)
  );
  db.profilePrivate = (db.profilePrivate || []).filter(
    (pp) => !LEGACY_EXAMPLE_USER_IDS.has(pp.user_id)
  );
  db.userRoles = (db.userRoles || []).filter(
    (ur) => !LEGACY_EXAMPLE_USER_IDS.has(ur.user_id)
  );
  db.pendingPasswordResets = db.pendingPasswordResets || [];

  // Ensure predefined admin email account exists in accounts
  const hasAdminAcc = db.accounts.some(
    (a) => a.email.toLowerCase() === 'fahrinmuneer3@gmail.com'
  );
  if (!hasAdminAcc) {
    db.accounts.unshift({
      user_id: 'usr-admin',
      email: 'fahrinmuneer3@gmail.com',
      matric_no: 'A2412345',
      display_name: 'Fahrin Muneer',
      faculty_short: 'FKI',
      faculty: 'Fakulti Komputeran dan Informatik (FKI), UMS',
      role: 'admin',
      salt: defaultSalt,
      password_hash: defaultHash,
      created_at: now,
      updated_at: now,
    });
  }

  // Enforce 2-role abstraction on all accounts and sync profilePrivate + userRoles
  db.accounts = db.accounts.map((acc) => {
    const resolvedRole = resolveRoleByEmail(acc.email);
    return {
      ...acc,
      role: resolvedRole,
    };
  });

  // Sync userRoles table
  const roleMap = new Map<string, UserRoleRecord>();
  for (const acc of db.accounts) {
    const role = resolveRoleByEmail(acc.email);
    roleMap.set(acc.user_id, {
      user_id: acc.user_id,
      role,
      assigned_at: acc.created_at || now,
    });
  }
  db.userRoles = Array.from(roleMap.values());

  // Sync profilePrivate table
  const privateMap = new Map<string, ProfilePrivateRecord>();
  for (const pp of db.profilePrivate) {
    privateMap.set(pp.user_id, pp);
  }
  for (const acc of db.accounts) {
    const existingPp = privateMap.get(acc.user_id);
    privateMap.set(acc.user_id, {
      user_id: acc.user_id,
      email: acc.email,
      matric_no: acc.matric_no,
      phone: existingPp?.phone || '+60 13-884 2412',
      created_at: existingPp?.created_at || acc.created_at || now,
      updated_at: now,
    });
  }
  db.profilePrivate = Array.from(privateMap.values());

  // Ensure predefined admin profile exists in profiles
  const adminSeeds = INITIAL_PROFILES.find((p) => p.id === 'usr-admin');
  const hasAdminProf = db.profiles.some(
    (p) =>
      p.id === 'usr-admin' ||
      (p.email && p.email.toLowerCase() === 'fahrinmuneer3@gmail.com')
  );
  if (!hasAdminProf && adminSeeds) {
    db.profiles.unshift({...adminSeeds});
  }

  // Enforce 2-role abstraction ('admin' vs 'user') on all profiles
  db.profiles = db.profiles.map((prof) => {
    const matchingAcc = db.accounts.find((a) => a.user_id === prof.id);
    const emailToCheck = prof.email || matchingAcc?.email || '';
    const role = resolveRoleByEmail(emailToCheck);
    return {
      ...prof,
      role,
      is_admin: role === 'admin',
    };
  });

  db.sessions = db.sessions
    .filter((sess) => new Date(sess.expires_at).getTime() > Date.now())
    .map((sess) => ({
      ...sess,
      role: resolveRoleByEmail(sess.email),
    }));

  return db;
}

let memoryAuthDb: AuthDatabaseSchema | null = null;

export function loadAuthDb(): AuthDatabaseSchema {
  if (memoryAuthDb) {
    return memoryAuthDb;
  }
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<AuthDatabaseSchema>;
      if (Array.isArray(parsed.accounts) && Array.isArray(parsed.profiles)) {
        memoryAuthDb = normalizeRolesInDb({
          accounts: parsed.accounts,
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
          profiles: parsed.profiles,
          profilePrivate: Array.isArray(parsed.profilePrivate)
            ? parsed.profilePrivate
            : [],
          userRoles: Array.isArray(parsed.userRoles) ? parsed.userRoles : [],
          pendingVerifications: Array.isArray(parsed.pendingVerifications)
            ? parsed.pendingVerifications
            : [],
          pendingPasswordResets: Array.isArray(parsed.pendingPasswordResets)
            ? parsed.pendingPasswordResets
            : [],
        });
        saveAuthDb(memoryAuthDb);
        return memoryAuthDb;
      }
    }
  } catch {
    // Fallback to seeded in-memory DB if disk read fails
  }
  memoryAuthDb = normalizeRolesInDb(buildSeededAuthDb());
  saveAuthDb(memoryAuthDb);
  return memoryAuthDb;
}

export function saveAuthDb(db: AuthDatabaseSchema): void {
  memoryAuthDb = db;
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch {
    // Keep in-memory copy if filesystem is read-only
  }
}

export function createSessionForAccount(
  db: AuthDatabaseSchema,
  account: AuthAccountRecord
): AuthSessionRecord {
  const token = `pl_sess_${crypto.randomBytes(24).toString('hex')}`;
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14); // 14 days
  const role = resolveRoleByEmail(account.email);
  const session: AuthSessionRecord = {
    token,
    user_id: account.user_id,
    email: account.email,
    role,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };
  // Keep latest 50 sessions
  db.sessions = [session, ...db.sessions.slice(0, 49)];
  saveAuthDb(db);
  return session;
}

export function verifyActiveSession(
  db: AuthDatabaseSchema,
  token?: string | null
): AuthSessionRecord | null {
  if (!token) return null;
  const clean = token.trim();
  if (!clean) return null;
  const session = db.sessions.find((s) => s.token === clean);
  if (!session) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    db.sessions = db.sessions.filter((s) => s.token !== clean);
    saveAuthDb(db);
    return null;
  }
  return {
    ...session,
    role: resolveRoleByEmail(session.email),
  };
}

export function findAccountByIdentifier(
  db: AuthDatabaseSchema,
  identifier: string
): AuthAccountRecord | undefined {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return undefined;
  return db.accounts.find(
    (acc) =>
      acc.email.toLowerCase() === clean ||
      (acc.alt_email && acc.alt_email.toLowerCase() === clean) ||
      acc.matric_no.toLowerCase() === clean ||
      acc.display_name.toLowerCase() === clean
  );
}
