import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // If user is accessing protected routes without session, redirect to login
  const isAuthRoute = url.pathname.startsWith("/login");
  const isDashboardRoute = url.pathname.startsWith("/staff") || url.pathname.startsWith("/manager");

  if (!user && isDashboardRoute) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is already logged in and visiting login page, redirect to appropriate dashboard
  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "owner_manager") {
      url.pathname = "/manager";
    } else {
      url.pathname = "/staff";
    }
    return NextResponse.redirect(url);
  }

  // If user is staff but trying to access manager route, redirect to staff
  if (user && url.pathname.startsWith("/manager")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile && profile.role !== "owner_manager") {
      url.pathname = "/staff";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
