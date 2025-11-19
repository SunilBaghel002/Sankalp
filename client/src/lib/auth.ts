export const checkAuth = async () => {
  const res = await fetch("http://127.0.0.1:8000/me", {
    method: "GET",
    credentials: "include", // ← THIS IS REQUIRED FOR COOKIES
  });

  if (!res.ok) throw new Error("Unauthorized");
  return await res.json();
};
