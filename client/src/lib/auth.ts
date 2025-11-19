// src/lib/auth.ts
export const checkAuth = async (): Promise<boolean> => {
  try {
    const res = await fetch("http://127.0.0.1:8000/me", {
      method: "GET",
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    // If we get ANY response (even 401), cookie exists → just not logged in yet
    // Only network error means not ready
    return res.ok;
  } catch (error) {
    console.log("Auth check failed (likely no cookie yet):", error);
    return false;
  }
};
