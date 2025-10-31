// 쿠키 옵션
export function getSessionCookieOptions(req: any) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
  };
}

