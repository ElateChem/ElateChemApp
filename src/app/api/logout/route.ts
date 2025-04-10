import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Create redirect response before modifying cookies
  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 303, // Using 303 See Other for POST -> GET redirect
  });

  // Remove authentication cookie
  response.cookies.delete('admin-auth');

  return response;
}