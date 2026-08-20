import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
  generateSalt,
  hashPassword,
  validateEmail,
  validatePassword,
  validateUsername,
  createToken,
  createAuthCookie,
} from '../../../lib/auth';



export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    // Validate inputs
    if (!username || !email || !password) {
      return Response.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return Response.json({ error: usernameError }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return Response.json({ error: passwordError }, { status: 400 });
    }

    // Access D1 database via Cloudflare context
    const { env } = getCloudflareContext();
    const db = (env as Record<string, unknown>).DB as D1Database;

    if (!db) {
      return Response.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Check if email or username already exists
    const existing = await db
      .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
      .bind(email.toLowerCase(), username.toLowerCase())
      .first();

    if (existing) {
      return Response.json(
        { error: 'Email or username already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await generateSalt();
    const passwordHash = await hashPassword(password, salt);

    // Insert user
    const result = await db
      .prepare(
        'INSERT INTO users (username, email, password_hash, salt) VALUES (?, ?, ?, ?)'
      )
      .bind(username.toLowerCase(), email.toLowerCase(), passwordHash, salt)
      .run();

    const userId = result.meta?.last_row_id;
    if (!userId) {
      return Response.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create JWT
    const jwtSecret = (env as Record<string, unknown>).JWT_SECRET as string
      || (globalThis.process?.env?.JWT_SECRET as string | undefined);
    if (!jwtSecret) {
      return Response.json(
        { error: 'JWT secret not configured' },
        { status: 500 }
      );
    }

    const token = await createToken(
      userId as number,
      username.toLowerCase(),
      email.toLowerCase(),
      jwtSecret
    );

    return new Response(
      JSON.stringify({
        user: {
          id: userId,
          username: username.toLowerCase(),
          email: email.toLowerCase(),
        },
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': createAuthCookie(token),
        },
      }
    );
  } catch (error) {
    console.error('Register error:', error);
    const msg =
      error instanceof Error ? error.message : 'Registration failed';
    return Response.json({ error: msg }, { status: 500 });
  }
}

// D1Database type for Cloudflare
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

interface D1Result {
  meta?: { last_row_id?: number };
  success: boolean;
}
