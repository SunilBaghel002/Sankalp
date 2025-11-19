// src/lib/auth.ts
export const checkAuth = async (): Promise<boolean> => {
  try {
    const res = await fetch("http://127.0.0.1:8000/me", {
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
};