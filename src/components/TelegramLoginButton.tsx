"use client";

import { useEffect, useRef } from "react";

// Injects Telegram's official Login Widget script. On success Telegram
// redirects the browser to `authUrl` (our /api/auth/telegram route) with the
// signed payload in the query string.
export default function TelegramLoginButton({
  botUsername,
  authUrl,
}: {
  botUsername: string;
  authUrl: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container || container.querySelector("script")) return;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-auth-url", authUrl);
    container.appendChild(script);
  }, [botUsername, authUrl]);

  return <div ref={ref} className="flex justify-center" />;
}
