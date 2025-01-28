import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 对于 GET 请求，跳过身份验证
  if (request.method === 'GET') {
    return NextResponse.next();
  }

  // 从请求体中获取地址
  const body = request.body ? await request.json() : {};
  const address = body.address || body.user_address;
  
  if (!address) {
    return NextResponse.json({ 
      code: -1, 
      message: 'Unauthorized' 
    }, { status: 401 });
  }

  // 将用户地址传递给数据库查询
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-auth-role', 'authenticated');
  requestHeaders.set('x-auth-user', address);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 允许跨域
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export const config = {
  matcher: [
    '/api/get-user-credits',
    '/api/consume-credits',
    '/api/create-order',
    '/api/get-user-reports',
  ],
}; 