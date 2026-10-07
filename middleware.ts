import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    if (user) {
      // Check if user is active admin with AAL2
      const { data: aalData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel === 'aal2') {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('is_active')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminUser?.is_active) {
          return NextResponse.redirect(
            new URL('/admin/dashboard', request.url),
          );
        }
      }
    }
    return supabaseResponse;
  }

  // Any other /admin or /admin/* route
  if (!user) {
    const loginUrl = new URL('/admin/login', request.url);
    if (pathname !== '/admin' && pathname !== '/admin/') {
      loginUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Check MFA level (must be AAL2)
  const { data: aalData } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalData?.currentLevel !== 'aal2') {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('mfa', '1');
    if (pathname !== '/admin' && pathname !== '/admin/') {
      loginUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Check active admin status
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('is_active')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminUser || !adminUser.is_active) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(loginUrl);
  }

  // If visiting exact /admin or /admin/, redirect to /admin/dashboard
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(
      new URL('/admin/dashboard', request.url),
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*'],
};
