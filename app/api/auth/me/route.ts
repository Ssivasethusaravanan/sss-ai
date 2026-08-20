import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getAuthUser } from '../../../lib/auth';



export async function GET(req: Request) {
  try {
    const { env } = getCloudflareContext();
    const jwtSecret = (env as Record<string, unknown>).JWT_SECRET as string | undefined
      || process.env.JWT_SECRET;

    if (!jwtSecret) {
      return Response.json({ user: null }, { status: 200 });
    }

    const user = await getAuthUser(req, jwtSecret);
    if (!user) {
      return Response.json({ user: null }, { status: 200 });
    }

    return Response.json({
      user: {
        id: user.userId,
        username: user.username,
        email: user.email,
      },
    });
  } catch {
    return Response.json({ user: null }, { status: 200 });
  }
}
