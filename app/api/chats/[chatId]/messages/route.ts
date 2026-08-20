import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getAuthUser } from '../../../../lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await params;
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

    // Verify chat belongs to user
    const chat = await db
      .prepare('SELECT id FROM chats WHERE id = ? AND user_id = ?')
      .bind(chatId, user.userId)
      .first();

    if (!chat) {
      return Response.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Fetch messages
    const result = await db
      .prepare('SELECT id, role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC')
      .bind(chatId)
      .all();

    if (!result.success) {
      return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return Response.json({ messages: result.results || [] });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
}
