// frontend/src/lib/auth.ts
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/me`, {
      method: "GET",
      credentials: "include", // ✅ Important: Send cookies
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const userData = await response.json();
      console.log("User authenticated:", userData);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Auth check failed:", error);
    return false;
  }
}
