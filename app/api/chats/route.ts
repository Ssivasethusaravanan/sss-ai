import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getAuthUser } from '../../lib/auth';

export async function GET(req: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const cfEnv = env as Record<string, unknown>;

    const jwtSecret = (cfEnv.JWT_SECRET as string) || (globalThis.process?.env?.JWT_SECRET as string | undefined);
    if (!jwtSecret) {
      return Response.json({ error: 'JWT secret not configured' }, { status: 500 });
    }

    const user = await getAuthUser(req, jwtSecret);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = cfEnv.DB as D1Database;
    if (!db) {
      return Response.json({ error: 'Database not configured' }, { status: 500 });
    }

    const result = await db
      .prepare('SELECT id, title, updated_at, created_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC')
      .bind(user.userId)
      .all();

    return Response.json({ chats: result.results || [] });
  } catch (error) {
    console.error('Fetch chats error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
}
