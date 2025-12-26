import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "./AuthProvider";

export default function AuthGate({ children }: any) {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const route = segments[0];

    const isPublicRoute =
      route === undefined ||      // index.tsx
      route === "login" ||
      route === "verify-otp";

    // ❌ Not logged in → block protected routes
    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    // ❌ Logged in → block login & index ONLY
    if (
      isAuthenticated &&
      (route === "login" || route === undefined)
    ) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading, segments]);

  if (loading) return null;

  return children;
}
