import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
  verifyPassword,
  createToken,
  createAuthCookie,
  validateEmail,
} from '../../../lib/auth';



export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
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

    // Find user by email
    const user = await db
      .prepare(
        'SELECT id, username, email, password_hash, salt FROM users WHERE email = ?'
      )
      .bind(email.toLowerCase())
      .first<UserRow>();

    if (!user) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT
    const jwtSecret = (env as Record<string, unknown>).JWT_SECRET as string
      || process.env.JWT_SECRET;
    if (!jwtSecret) {
      return Response.json(
        { error: 'JWT secret not configured' },
        { status: 500 }
      );
    }

    const token = await createToken(user.id, user.username, user.email, jwtSecret);

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': createAuthCookie(token),
        },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    const msg = error instanceof Error ? error.message : 'Login failed';
    return Response.json({ error: msg }, { status: 500 });
  }
}

// Types
interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  salt: string;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}
