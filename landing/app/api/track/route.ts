import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<Response> {
  const backendUrl = process.env.BACKEND_API_URL ?? '';
  const body = await request.text();
  if (backendUrl) {
    try {
      await fetch(`${backendUrl}/api/analytics/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
    } catch {
      // silencieux : l'analytics ne doit jamais casser l'UX
    }
  }
  return new NextResponse(null, { status: 204 });
}
