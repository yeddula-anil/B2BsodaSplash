"use client";

import { useEffect } from "react";

export default function RoleRedirect() {
  useEffect(() => {
    const authToken =
      localStorage.getItem("authToken");

    const storedStaff =
      localStorage.getItem("staff");

    // Not logged in → stay on home page
    if (!authToken || !storedStaff) {
      return;
    }

    try {
      const staff = JSON.parse(storedStaff);

      const role = String(
        staff?.role || ""
      ).toUpperCase();

      if (role === "ADMIN") {
        window.location.replace("/admin");
        return;
      }

      if (role === "BD") {
        window.location.replace("/bd");
        return;
      }

      // If it's some other role, do nothing.
    } catch {
      // Invalid stored staff data
      localStorage.removeItem("staff");
      localStorage.removeItem("authToken");
    }
  }, []);

  return null;
}