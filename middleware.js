import { NextResponse } from "next/server";

export function middleware(request) {
//   console.log(request.cookies.get('token'));
// 
//   if (request.headers.Authorization) {
//     console.log(request.headers.Authorization);
//     return NextResponse.next();
//   }
  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};
