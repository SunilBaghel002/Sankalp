// src/lib/api.ts
const API_URL = "http://127.0.0.1:8000";

export const api = {
  getMe: async () => {
    const res = await fetch(`${API_URL}/me`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Not logged in");
    return res.json();
  },

  markDepositPaid: async () => {
    const res = await fetch(`${API_URL}/deposit-paid`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to mark deposit");
    return res.json();
  },

  saveHabits: async (habits: any[]) => {
    const res = await fetch(`${API_URL}/habits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(habits),
    });
    if (!res.ok) throw new Error("Failed to save habits");
    return res.json();
  },

  getHabits: async () => {
    const res = await fetch(`${API_URL}/habits`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch habits");
    return res.json();
  },
};
