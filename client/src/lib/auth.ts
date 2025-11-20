// frontend/src/lib/auth.ts

// ✅ Use localhost (not 127.0.0.1)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/me`, {
      method: "GET",
      credentials: "include", // ✅ Critical: Send cookies
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const userData = await response.json();
      console.log("✅ User authenticated:", userData);
      return true;
    }

    console.log("❌ Not authenticated");
    return false;
  } catch (error) {
    console.error("Auth check failed:", error);
    return false;
  }
}
