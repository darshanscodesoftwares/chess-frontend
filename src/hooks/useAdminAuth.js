// src/hooks/useAdminAuth.js
export function useAdminAuth() {
  const isLoggedIn = localStorage.getItem("isAdmin") === "true";

  const login = () => {
    localStorage.setItem("isAdmin", "true");
  };

  const logout = () => {
    localStorage.removeItem("isAdmin");
  };

  return { isLoggedIn, login, logout };
}
