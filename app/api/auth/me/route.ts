import { getAuthUser } from '../../../lib/auth';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
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
