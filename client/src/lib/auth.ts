// src/lib/auth.ts
export const checkAuth = async (): Promise<boolean> => {
  try {
    const response = await fetch("http://localhost:8000/me", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Auth check passed:", data.email);
      return true;
    }

    // ✅ If 401, check if we have a token in cookie (browser side check)
    if (response.status === 401) {
      // Check if cookie exists
      const hasToken = document.cookie.includes("access_token");
      if (hasToken) {
        console.warn("⚠️ Have token but auth failed - possible backend issue");
      }
    }

    console.log("❌ Auth check failed:", response.status);
    return false;
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
};

// ✅ Add a helper to clear auth
export const clearAuth = () => {
  // Clear cookie
  document.cookie =
    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // Clear any local storage
  localStorage.removeItem("user");

  console.log("🧹 Auth cleared");
};
