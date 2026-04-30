"use client";

import { useEffect } from "react";

export default function LineCallback() {
  useEffect(() => {
    const url = window.location.href;
    const redirect = url.replace(
      "https://user.thepaseo.co.th/line-callback",
      "paseomember://callback"
    );

    window.location.href = redirect;
  }, []);

  return <p>Logging you in...</p>;
}