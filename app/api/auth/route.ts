import crypto from 'crypto';
import {NextRequest, NextResponse} from 'next/server';
import {
  ADMIN_EMAILS,
  AuthAccountRecord,
  createSessionForAccount,
  findAccountByIdentifier,
  hashPasswordWithSalt,
  loadAuthDb,
  resolveRoleByEmail,
  saveAuthDb,
  verifyActiveSession,
} from '@/lib/server-auth-db';
import {Profile} from '@/lib/types';

function extractRequestToken(req: NextRequest, bodyToken?: string): string {
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const {searchParams} = new URL(req.url);
  const queryToken = searchParams.get('token') || '';
  const cookieToken = req.cookies.get('projectlink_session')?.value || '';
  return bearerToken || String(bodyToken || '').trim() || queryToken || cookieToken;
}

function sanitizeAccountForOwnerOrAdmin(acc: AuthAccountRecord) {
  const role = resolveRoleByEmail(acc.email);
  return {
    user_id: acc.user_id,
    email: acc.email,
    alt_email: acc.alt_email,
    matric_no: acc.matric_no,
    display_name: acc.display_name,
    faculty_short: acc.faculty_short,
    faculty: acc.faculty,
    role,
    is_admin: role === 'admin',
    created_at: acc.created_at,
  };
}

// Public directory representation (mirrors public.profiles — NO email, NO matric_no, NO phone)
function sanitizeAccountForPublicDirectory(acc: AuthAccountRecord) {
  return {
    user_id: acc.user_id,
    display_name: acc.display_name,
    faculty_short: acc.faculty_short,
    faculty: acc.faculty,
  };
}

export async function GET(req: NextRequest) {
  const db = loadAuthDb();
  const token = extractRequestToken(req);
  const session = verifyActiveSession(db, token);

  const safePublicDirectory = db.accounts.map(sanitizeAccountForPublicDirectory);

  if (!session) {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      accounts: safePublicDirectory,
    });
  }

  const account = db.accounts.find((a) => a.user_id === session.user_id);
  const profile = db.profiles.find((p) => p.id === session.user_id);

  if (!account || !profile) {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      accounts: safePublicDirectory,
    });
  }

  const resolvedRole = resolveRoleByEmail(account.email);
  const isAdminCaller = resolvedRole === 'admin';
  const privateData = db.profilePrivate.find(
    (pp) => pp.user_id === account.user_id
  );

  const enrichedProfile: Profile = {
    ...profile,
    email: privateData?.email || account.email,
    matric_no: privateData?.matric_no || account.matric_no,
    phone: privateData?.phone || profile.phone,
    role: resolvedRole,
    is_admin: isAdminCaller,
  };

  return NextResponse.json({
    ok: true,
    authenticated: true,
    token: session.token,
    session: {...session, role: resolvedRole},
    account: sanitizeAccountForOwnerOrAdmin(account),
    profile: enrichedProfile,
    adminEmails: isAdminCaller ? ADMIN_EMAILS : undefined,
    accounts: isAdminCaller
      ? db.accounts.map(sanitizeAccountForOwnerOrAdmin)
      : safePublicDirectory,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || '').trim();
    const db = loadAuthDb();

    // ---------------------------------------------------------
    // 1. SIGN IN (Strict Email/Matric + Password Verification + 3-Layer Sync)
    // ---------------------------------------------------------
    if (action === 'signin') {
      const identifier = String(body.identifier || body.email || '').trim();
      const password = String(body.password || '');

      if (!identifier) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Sila masukkan alamat E-mel atau No. Matrik anda.',
          },
          {status: 400}
        );
      }

      if (!password) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Sila masukkan kata laluan akaun anda.',
          },
          {status: 400}
        );
      }

      const account = findAccountByIdentifier(db, identifier);
      if (!account) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Akaun e-mel atau No. Matrik ini belum didaftarkan. Sila daftar akaun baharu di tab Sign Up terlebih dahulu.',
          },
          {status: 404}
        );
      }

      const candidateHash = hashPasswordWithSalt(password, account.salt);
      if (candidateHash !== account.password_hash) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Kata laluan yang dimasukkan tidak tepat. Sila cuba lagi atau tekan "Forgot Password?" untuk tetapkan semula.',
          },
          {status: 401}
        );
      }

      const resolvedRole = resolveRoleByEmail(account.email);
      account.role = resolvedRole;

      let profile = db.profiles.find((p) => p.id === account.user_id);
      if (!profile) {
        const now = new Date().toISOString();
        profile = {
          id: account.user_id,
          display_name: account.display_name,
          matric_no: account.matric_no,
          faculty: account.faculty,
          faculty_short: account.faculty_short,
          programme: 'Software Engineering',
          year_of_study: 2,
          location: 'Kota Kinabalu, Sabah',
          availability_status: 'Available',
          role: resolvedRole,
          is_admin: resolvedRole === 'admin',
          bio: `Pelajar ${account.faculty} di Universiti Malaysia Sabah (UMS).`,
          avatar_url: null,
          avatar_variant: 0,
          weekly_hours: 10,
          preferred_project_types: ['Innovation', 'Competition'],
          active_filter_tags: [],
          email: account.email,
          phone: '+60 13-884 2412',
          linkedin: `linkedin.com/in/${account.display_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')}-ums`,
          discoverable: true,
          consent_at: now,
          created_at: account.created_at,
          updated_at: now,
        };
        db.profiles.unshift(profile);
      } else {
        profile.role = resolvedRole;
        profile.is_admin = resolvedRole === 'admin';
      }

      const session = createSessionForAccount(db, account);
      const res = NextResponse.json({
        ok: true,
        token: session.token,
        session,
        account: sanitizeAccountForOwnerOrAdmin(account),
        profile,
      });

      res.cookies.set('projectlink_session', session.token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 14,
      });

      return res;
    }

    // ---------------------------------------------------------
    // 2. DIRECT SIGN UP / REGISTER NEW ACCOUNT (Role strictly locked to 'user' unless Admin email)
    // ---------------------------------------------------------
    if (action === 'signup') {
      const displayName = String(body.displayName || '').trim();
      const email = String(body.email || '')
        .trim()
        .toLowerCase();
      const password = String(body.password || '');
      const facultyShort = String(body.facultyShort || 'FKI').trim();
      const facultyFull = String(
        body.facultyFull || 'Fakulti Komputeran dan Informatik (FKI), UMS'
      ).trim();
      const customMatric = String(body.matricNo || '')
        .trim()
        .toUpperCase();
      const customPhone = String(body.phone || '+60 12-883 4910').trim();

      if (!displayName || displayName.length < 2) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Sila masukkan Nama Penuh anda (sekurang-kurangnya 2 aksara).',
          },
          {status: 400}
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Format alamat e-mel tidak sah. Contoh: nama@student.ums.edu.my',
          },
          {status: 400}
        );
      }

      if (!password || password.length < 6) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Kata laluan mestilah sekurang-kurangnya 6 aksara untuk keselamatan akaun.',
          },
          {status: 400}
        );
      }

      const existingEmail = db.accounts.find(
        (acc) =>
          acc.email.toLowerCase() === email ||
          (acc.alt_email && acc.alt_email.toLowerCase() === email)
      );
      if (existingEmail) {
        return NextResponse.json(
          {
            ok: false,
            error: `Alamat e-mel "${email}" telah pun didaftarkan. Sila tekan Sign In untuk log masuk.`,
          },
          {status: 409}
        );
      }

      if (customMatric) {
        const existingMatric = db.accounts.find(
          (acc) => acc.matric_no.toLowerCase() === customMatric.toLowerCase()
        );
        if (existingMatric) {
          return NextResponse.json(
            {
              ok: false,
              error: `Nombor Matrik "${customMatric}" telah berdaftar dengan akaun lain.`,
            },
            {status: 409}
          );
        }
      }

      const newUserId = `usr-${Date.now().toString(36)}`;
      const now = new Date().toISOString();
      // Server-authoritative role resolution — client cannot pass role or is_admin
      const resolvedRole = resolveRoleByEmail(email);
      const matricPrefix =
        facultyShort === 'FKI'
          ? 'BI2411'
          : facultyShort === 'FKJ'
            ? 'BK2411'
            : facultyShort === 'FPEP'
              ? 'BE2411'
              : 'BA2411';
      const matricNo =
        customMatric ||
        `${matricPrefix}${Math.floor(1000 + Math.random() * 8999)}`;

      const salt = crypto.randomBytes(12).toString('hex');
      const passwordHash = hashPasswordWithSalt(password, salt);

      const newAccount: AuthAccountRecord = {
        user_id: newUserId,
        email,
        matric_no: matricNo,
        display_name: displayName,
        faculty_short: facultyShort,
        faculty: facultyFull,
        role: resolvedRole,
        salt,
        password_hash: passwordHash,
        created_at: now,
        updated_at: now,
      };

      const newProfile: Profile = {
        id: newUserId,
        display_name: displayName,
        matric_no: matricNo,
        faculty: facultyFull,
        faculty_short: facultyShort,
        programme:
          facultyShort === 'FKI'
            ? 'Software Engineering'
            : facultyShort === 'FKJ'
              ? 'Civil & Smart Engineering'
              : facultyShort === 'FPEP'
                ? 'Business & Digital Economy'
                : `Program Sarjana Muda (${facultyShort})`,
        year_of_study: 2,
        location: 'Kota Kinabalu, Sabah',
        availability_status: 'Available',
        role: resolvedRole,
        is_admin: resolvedRole === 'admin',
        bio: `Pelajar ${facultyFull} yang aktif mencari rakan sepasukan dan menyertai aktiviti inovasi kampus UMS.`,
        avatar_url: null,
        avatar_variant: 0,
        weekly_hours: 10,
        preferred_project_types: ['Innovation', 'Competition'],
        active_filter_tags: [],
        email,
        phone: customPhone || '+60 12-883 4910',
        linkedin: `linkedin.com/in/${displayName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')}-ums`,
        discoverable: true,
        consent_at: now,
        created_at: now,
        updated_at: now,
      };

      db.accounts.unshift(newAccount);
      db.profiles.unshift(newProfile);
      db.profilePrivate.unshift({
        user_id: newUserId,
        email,
        matric_no: matricNo,
        phone: customPhone || '+60 12-883 4910',
        created_at: now,
        updated_at: now,
      });
      db.userRoles.unshift({
        user_id: newUserId,
        role: resolvedRole,
        assigned_at: now,
      });
      const session = createSessionForAccount(db, newAccount);

      const res = NextResponse.json({
        ok: true,
        token: session.token,
        session,
        account: sanitizeAccountForOwnerOrAdmin(newAccount),
        profile: newProfile,
      });

      res.cookies.set('projectlink_session', session.token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 14,
      });

      return res;
    }

    // ---------------------------------------------------------
    // 2A. INITIATE SIGN UP (Send 6-Digit Email Verification Code)
    // ---------------------------------------------------------
    if (action === 'initiate_signup') {
      const displayName = String(body.displayName || '').trim();
      const email = String(body.email || '')
        .trim()
        .toLowerCase();
      const password = String(body.password || '');
      const facultyShort = String(body.facultyShort || 'FKI').trim();
      const facultyFull = String(
        body.facultyFull || 'Fakulti Komputeran dan Informatik (FKI), UMS'
      ).trim();
      const customMatric = String(body.matricNo || '')
        .trim()
        .toUpperCase();
      const customPhone = String(body.phone || '+60 12-883 4910').trim();

      if (!displayName || displayName.length < 2) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Sila masukkan Nama Penuh anda (sekurang-kurangnya 2 aksara).',
          },
          {status: 400}
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Format alamat e-mel tidak sah. Contoh: nama@student.ums.edu.my',
          },
          {status: 400}
        );
      }

      if (!password || password.length < 6) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Kata laluan mestilah sekurang-kurangnya 6 aksara untuk keselamatan akaun.',
          },
          {status: 400}
        );
      }

      const isPredefinedAdmin = resolveRoleByEmail(email) === 'admin';
      const existingEmail = db.accounts.find(
        (acc) =>
          acc.email.toLowerCase() === email ||
          (acc.alt_email && acc.alt_email.toLowerCase() === email)
      );
      if (existingEmail && !isPredefinedAdmin) {
        return NextResponse.json(
          {
            ok: false,
            error: `Alamat e-mel "${email}" telah pun didaftarkan. Sila tekan Sign In untuk log masuk.`,
          },
          {status: 409}
        );
      }

      if (customMatric && !isPredefinedAdmin) {
        const existingMatric = db.accounts.find(
          (acc) => acc.matric_no.toLowerCase() === customMatric.toLowerCase()
        );
        if (existingMatric) {
          return NextResponse.json(
            {
              ok: false,
              error: `Nombor Matrik "${customMatric}" telah berdaftar dengan akaun lain.`,
            },
            {status: 409}
          );
        }
      }

      const matricPrefix =
        facultyShort === 'FKI'
          ? 'BI2411'
          : facultyShort === 'FKJ'
            ? 'BK2411'
            : facultyShort === 'FPEP'
              ? 'BE2411'
              : 'BA2411';
      const matricNo =
        customMatric ||
        `${matricPrefix}${Math.floor(1000 + Math.random() * 8999)}`;

      const salt = crypto.randomBytes(12).toString('hex');
      const passwordHash = hashPasswordWithSalt(password, salt);
      const verificationCode = String(
        Math.floor(100000 + Math.random() * 900000)
      );
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString();

      db.pendingVerifications = (db.pendingVerifications || []).filter(
        (v) => v.email.toLowerCase() !== email
      );
      db.pendingVerifications.unshift({
        email,
        code: verificationCode,
        display_name: displayName,
        faculty_short: facultyShort,
        faculty: facultyFull,
        matric_no: matricNo,
        phone: customPhone || '+60 12-883 4910',
        salt,
        password_hash: passwordHash,
        created_at: now,
        expires_at: expiresAt,
      });
      saveAuthDb(db);

      return NextResponse.json({
        ok: true,
        pendingVerification: true,
        email,
        role: resolveRoleByEmail(email),
        verificationCode,
        expiresAt,
        message: `Kod pengesahan 6-digit telah dihantar ke ${email}.`,
      });
    }

    // ---------------------------------------------------------
    // 2B. VERIFY EMAIL / SIGN UP CODE & COMPLETE REGISTRATION
    // ---------------------------------------------------------
    if (action === 'verify_signup_code' || action === 'verify_email') {
      const email = String(body.email || '')
        .trim()
        .toLowerCase();
      const code = String(body.code || '').trim();

      if (!email || !code || code.length !== 6) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Sila masukkan kod pengesahan 6-digit yang lengkap.',
          },
          {status: 400}
        );
      }

      const pendingList = db.pendingVerifications || [];
      const pending = pendingList.find((v) => v.email.toLowerCase() === email);
      if (!pending) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Tiada permohonan pengesahan aktif untuk e-mel ini. Sila tekan "Hantar Semula Kod" atau Sign Up semula.',
          },
          {status: 404}
        );
      }

      if (new Date(pending.expires_at).getTime() < Date.now()) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Kod pengesahan ini telah tamat tempoh (10 minit). Sila tekan "Hantar Semula Kod" untuk dapatkan kod baharu.',
          },
          {status: 410}
        );
      }

      if (pending.code !== code) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Kod pengesahan 6-digit tidak tepat. Sila semak semula kod anda.',
          },
          {status: 400}
        );
      }

      db.pendingVerifications = pendingList.filter(
        (v) => v.email.toLowerCase() !== email
      );

      const now = new Date().toISOString();
      const resolvedRole = resolveRoleByEmail(email);
      const existingAccount = db.accounts.find(
        (a) => a.email.toLowerCase() === email
      );

      let targetAccount: AuthAccountRecord;
      let targetProfile: Profile;

      if (existingAccount) {
        existingAccount.display_name =
          pending.display_name || existingAccount.display_name;
        existingAccount.faculty_short =
          pending.faculty_short || existingAccount.faculty_short;
        existingAccount.faculty = pending.faculty || existingAccount.faculty;
        existingAccount.salt = pending.salt;
        existingAccount.password_hash = pending.password_hash;
        existingAccount.role = resolvedRole;
        existingAccount.updated_at = now;
        targetAccount = existingAccount;

        const foundProfile = db.profiles.find(
          (p) => p.id === existingAccount.user_id
        );
        if (foundProfile) {
          foundProfile.display_name = existingAccount.display_name;
          foundProfile.faculty_short = existingAccount.faculty_short;
          foundProfile.faculty = existingAccount.faculty;
          foundProfile.role = resolvedRole;
          foundProfile.is_admin = resolvedRole === 'admin';
          foundProfile.updated_at = now;
          targetProfile = foundProfile;
        } else {
          targetProfile = {
            id: existingAccount.user_id,
            display_name: existingAccount.display_name,
            matric_no: existingAccount.matric_no,
            faculty: existingAccount.faculty,
            faculty_short: existingAccount.faculty_short,
            programme: 'Software Engineering',
            year_of_study: 2,
            location: 'Kota Kinabalu, Sabah',
            availability_status: 'Available',
            role: resolvedRole,
            is_admin: resolvedRole === 'admin',
            bio: `Pelajar ${existingAccount.faculty} di Universiti Malaysia Sabah (UMS).`,
            avatar_url: null,
            avatar_variant: 0,
            weekly_hours: 10,
            preferred_project_types: ['Innovation', 'Competition'],
            active_filter_tags: [],
            email: existingAccount.email,
            phone: pending.phone || '+60 12-883 4910',
            linkedin: `linkedin.com/in/${existingAccount.display_name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')}-ums`,
            discoverable: true,
            consent_at: now,
            created_at: existingAccount.created_at,
            updated_at: now,
          };
          db.profiles.unshift(targetProfile);
        }
      } else {
        const newUserId =
          resolvedRole === 'admin'
            ? 'usr-admin'
            : `usr-${Date.now().toString(36)}`;
        targetAccount = {
          user_id: newUserId,
          email: pending.email,
          matric_no: pending.matric_no,
          display_name: pending.display_name,
          faculty_short: pending.faculty_short,
          faculty: pending.faculty,
          role: resolvedRole,
          salt: pending.salt,
          password_hash: pending.password_hash,
          created_at: now,
          updated_at: now,
        };

        targetProfile = {
          id: newUserId,
          display_name: pending.display_name,
          matric_no: pending.matric_no,
          faculty: pending.faculty,
          faculty_short: pending.faculty_short,
          programme:
            pending.faculty_short === 'FKI'
              ? 'Software Engineering'
              : pending.faculty_short === 'FKJ'
                ? 'Civil & Smart Engineering'
                : pending.faculty_short === 'FPEP'
                  ? 'Business & Digital Economy'
                  : `Program Sarjana Muda (${pending.faculty_short})`,
          year_of_study: 2,
          location: 'Kota Kinabalu, Sabah',
          availability_status: 'Available',
          role: resolvedRole,
          is_admin: resolvedRole === 'admin',
          bio: `Pelajar ${pending.faculty} yang aktif mencari rakan sepasukan dan menyertai aktiviti inovasi kampus UMS.`,
          avatar_url: null,
          avatar_variant: 0,
          weekly_hours: 10,
          preferred_project_types: ['Innovation', 'Competition'],
          active_filter_tags: [],
          email: pending.email,
          phone: pending.phone || '+60 12-883 4910',
          linkedin: `linkedin.com/in/${pending.display_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')}-ums`,
          discoverable: true,
          consent_at: now,
          created_at: now,
          updated_at: now,
        };

        db.accounts.unshift(targetAccount);
        db.profiles.unshift(targetProfile);
        db.profilePrivate.unshift({
          user_id: newUserId,
          email: pending.email,
          matric_no: pending.matric_no,
          phone: pending.phone || '+60 12-883 4910',
          created_at: now,
          updated_at: now,
        });
        db.userRoles.unshift({
          user_id: newUserId,
          role: resolvedRole,
          assigned_at: now,
        });
      }

      const session = createSessionForAccount(db, targetAccount);

      const res = NextResponse.json({
        ok: true,
        verified: true,
        token: session.token,
        session,
        account: sanitizeAccountForOwnerOrAdmin(targetAccount),
        profile: targetProfile,
        message: `Alamat e-mel ${email} telah berjaya disahkan!`,
      });

      res.cookies.set('projectlink_session', session.token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 14,
      });

      return res;
    }

    // ---------------------------------------------------------
    // 2C. RESEND EMAIL VERIFICATION CODE
    // ---------------------------------------------------------
    if (action === 'resend_verification_code' || action === 'resend_code') {
      const email = String(body.email || '')
        .trim()
        .toLowerCase();

      if (!email) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Alamat e-mel diperlukan untuk menghantar kod pengesahan.',
          },
          {status: 400}
        );
      }

      const newCode = String(Math.floor(100000 + Math.random() * 900000));
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString();

      const pendingList = db.pendingVerifications || [];
      const pending = pendingList.find((v) => v.email.toLowerCase() === email);

      if (pending) {
        pending.code = newCode;
        pending.expires_at = expiresAt;
      } else {
        const existingAcc = db.accounts.find(
          (a) => a.email.toLowerCase() === email
        );
        const defaultSalt = crypto.randomBytes(12).toString('hex');
        db.pendingVerifications = [
          {
            email,
            code: newCode,
            display_name:
              existingAcc?.display_name ||
              String(body.displayName || email.split('@')[0] || 'Pelajar UMS'),
            faculty_short:
              existingAcc?.faculty_short || String(body.facultyShort || 'FKI'),
            faculty:
              existingAcc?.faculty ||
              'Fakulti Komputeran dan Informatik (FKI), UMS',
            matric_no:
              existingAcc?.matric_no ||
              `BI2411${Math.floor(1000 + Math.random() * 8999)}`,
            phone: '+60 12-883 4910',
            salt: existingAcc?.salt || defaultSalt,
            password_hash:
              existingAcc?.password_hash ||
              hashPasswordWithSalt('ums2026', defaultSalt),
            created_at: now,
            expires_at: expiresAt,
          },
          ...pendingList,
        ];
      }

      saveAuthDb(db);

      return NextResponse.json({
        ok: true,
        email,
        verificationCode: newCode,
        expiresAt,
        message: `Kod pengesahan 6-digit baharu telah dihantar ke ${email}.`,
      });
    }

    // ---------------------------------------------------------
    // 3A. INITIATE PASSWORD RESET (Generate 6-Digit OTP for Forgot Password)
    // ---------------------------------------------------------
    if (action === 'initiate_password_reset') {
      const identifier = String(body.email || body.identifier || '').trim();
      if (!identifier) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Sila masukkan alamat E-mel atau No. Matrik akaun anda.',
          },
          {status: 400}
        );
      }

      const account = findAccountByIdentifier(db, identifier);
      if (!account) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Tiada akaun ditemui dengan e-mel atau No. Matrik tersebut.',
          },
          {status: 404}
        );
      }

      const resetCode = String(Math.floor(100000 + Math.random() * 900000));
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString();

      db.pendingPasswordResets = (db.pendingPasswordResets || []).filter(
        (r) => r.user_id !== account.user_id
      );
      db.pendingPasswordResets.unshift({
        user_id: account.user_id,
        email: account.email,
        code: resetCode,
        created_at: now,
        expires_at: expiresAt,
      });
      saveAuthDb(db);

      return NextResponse.json({
        ok: true,
        email: account.email,
        resetCode,
        expiresAt,
        message: `Kod OTP 6-digit untuk tetapan semula kata laluan telah dijana untuk ${account.email}.`,
      });
    }

    // ---------------------------------------------------------
    // 3B. RESET PASSWORD (Strict 6-Digit OTP Verification Required)
    // ---------------------------------------------------------
    if (action === 'reset_password') {
      const identifier = String(body.email || body.identifier || '').trim();
      const newPassword = String(body.newPassword || '');
      const code = String(body.code || body.resetCode || '').trim();

      if (!identifier) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Sila masukkan alamat E-mel atau No. Matrik akaun anda.',
          },
          {status: 400}
        );
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.',
          },
          {status: 400}
        );
      }

      const account = findAccountByIdentifier(db, identifier);
      if (!account) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Tiada akaun ditemui dengan e-mel atau No. Matrik tersebut.',
          },
          {status: 404}
        );
      }

      if (!code || code.length !== 6) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Sila mohon dan masukkan kod OTP 6-digit terlebih dahulu sebelum menukar kata laluan.',
          },
          {status: 400}
        );
      }

      const pendingReset = (db.pendingPasswordResets || []).find(
        (r) => r.user_id === account.user_id
      );
      if (!pendingReset) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Tiada kod OTP aktif untuk akaun ini. Sila tekan butang "Mohon Kod OTP (6-Digit)" terlebih dahulu.',
          },
          {status: 400}
        );
      }

      if (new Date(pendingReset.expires_at).getTime() < Date.now()) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Kod OTP telah tamat tempoh (10 minit). Sila mohon kod OTP baharu.',
          },
          {status: 410}
        );
      }

      if (pendingReset.code !== code) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Kod OTP 6-digit tidak tepat. Sila semak semula kod anda.',
          },
          {status: 400}
        );
      }

      db.pendingPasswordResets = (db.pendingPasswordResets || []).filter(
        (r) => r.user_id !== account.user_id
      );

      const newSalt = crypto.randomBytes(12).toString('hex');
      account.salt = newSalt;
      account.password_hash = hashPasswordWithSalt(newPassword, newSalt);
      account.updated_at = new Date().toISOString();
      saveAuthDb(db);

      return NextResponse.json({
        ok: true,
        message: `Kata laluan untuk ${account.email} telah disahkan melalui OTP dan berjaya dikemas kini!`,
      });
    }

    // ---------------------------------------------------------
    // 4. LOGOUT (Revoke Server Session & Cookie)
    // ---------------------------------------------------------
    if (action === 'logout') {
      const token = extractRequestToken(req, body.token);
      if (token) {
        db.sessions = db.sessions.filter((s) => s.token !== token);
        saveAuthDb(db);
      }
      const res = NextResponse.json({
        ok: true,
        message: 'Sesi log masuk telah ditamatkan.',
      });
      res.cookies.delete('projectlink_session');
      return res;
    }

    // ---------------------------------------------------------
    // 5. ADMIN ACTION: DELETE USER ACCOUNT (Strict Admin Session Verification)
    // ---------------------------------------------------------
    if (action === 'admin_delete_user') {
      const callerToken = extractRequestToken(req, body.token);
      const callerSession = verifyActiveSession(db, callerToken);

      if (!callerSession || callerSession.role !== 'admin') {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Akses ditolak: Hanya Pentadbir Sistem (Admin) dengan sesi aktif yang sah boleh memadam akaun pengguna.',
          },
          {status: 403}
        );
      }

      const targetUserId = String(body.targetUserId || '').trim();
      if (!targetUserId) {
        return NextResponse.json(
          {ok: false, error: 'ID pengguna diperlukan.'},
          {status: 400}
        );
      }

      const targetAcc = db.accounts.find((a) => a.user_id === targetUserId);
      if (
        targetUserId === 'usr-admin' ||
        (targetAcc && resolveRoleByEmail(targetAcc.email) === 'admin')
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Akaun Admin utama tidak boleh dipadamkan.',
          },
          {status: 403}
        );
      }

      db.accounts = db.accounts.filter((a) => a.user_id !== targetUserId);
      db.profiles = db.profiles.filter((p) => p.id !== targetUserId);
      db.profilePrivate = db.profilePrivate.filter(
        (pp) => pp.user_id !== targetUserId
      );
      db.userRoles = db.userRoles.filter((ur) => ur.user_id !== targetUserId);
      db.sessions = db.sessions.filter((s) => s.user_id !== targetUserId);
      saveAuthDb(db);

      return NextResponse.json({
        ok: true,
        message: 'Akaun pengguna telah dipadamkan daripada pangkalan data.',
      });
    }

    return NextResponse.json(
      {ok: false, error: `Action tidak dikenali: ${action}`},
      {status: 400}
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Ralat pelayan semasa memproses pengesahan.',
      },
      {status: 500}
    );
  }
}
