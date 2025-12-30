// providers/AuthGate.tsx
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
      route === undefined || // index
      route === "language" ||
      route === "login" ||
      route === "verify-otp";

    // ❌ Not logged in → block protected routes
    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/");
      return;
    }

    // ❌ Logged in → block auth flow screens
    if (
      isAuthenticated &&
      (route === undefined ||
        route === "language" ||
        route === "login" ||
        route === "verify-otp")
    ) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading, segments]);

  if (loading) return null;

  return children;
}
