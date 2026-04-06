import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export function signToken(userId: number) {
  return jwt.sign({ id: userId }, JWT_SECRET)
}

export function verifyToken(token: string): { id: number } {
  return jwt.verify(token, JWT_SECRET) as { id: number }
}

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.split(' ')[1]
}