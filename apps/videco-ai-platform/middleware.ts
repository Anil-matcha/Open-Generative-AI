import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/recorder/')) {
    console.log("its running")
    return NextResponse.rewrite(new URL(request.nextUrl.pathname, 'https://record.videco.io'))
  }
}