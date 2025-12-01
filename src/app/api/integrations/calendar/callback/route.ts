import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const CALENDAR_REDIRECT_URI = process.env.CALENDAR_REDIRECT_URI || 'http://localhost:3000/api/integrations/calendar/callback';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/settings?error=calendar_auth_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=calendar_no_code', request.url));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      CALENDAR_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    const cookieStore = await cookies();

    // Store tokens in HTTP-only cookies
    cookieStore.set('calendar_access_token', tokens.access_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });

    if (tokens.refresh_token) {
      cookieStore.set('calendar_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return NextResponse.redirect(new URL('/settings?success=calendar_connected', request.url));
  } catch (error) {
    console.error('Calendar OAuth callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=calendar_auth_failed', request.url));
  }
}
