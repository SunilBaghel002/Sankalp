// src/lib/api.ts
const API_URL = "http://127.0.0.1:8000"

export const api = {
  // Google login - sends token to backend
  googleLogin: async (googleToken: string) => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important for cookies
      body: JSON.stringify({ token: googleToken })
    })
    return res.json()
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/me`, { credentials: "include" })
    if (!res.ok) throw new Error("Not logged in")
    return res.json()
  },

  saveHabits: async (habits: any[]) => {
    await fetch(`${API_URL}/habits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(habits)
    })
  },

  markDepositPaid: async () => {
    await fetch(`${API_URL}/deposit-paid`, {
      method: "POST",
      credentials: "include"
    })
  }
}