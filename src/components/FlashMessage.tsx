"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function FlashMessage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);

  useEffect(() => {
    const msg = searchParams.get("message");
    const type = searchParams.get("type") || "success";
    if (msg) {
      setMessage({ text: msg, type });
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    } else {
      setMessage(null);
    }
  }, [searchParams]);

  if (!message) return null;

  const colors = {
    success: "bg-green-100 border-green-400 text-green-700",
    danger: "bg-red-100 border-red-400 text-red-700",
    warning: "bg-yellow-100 border-yellow-400 text-yellow-700",
  };

  const colorClass = colors[message.type as keyof typeof colors] || colors.success;

  return (
    <div className={`border px-4 py-3 rounded mb-4 ${colorClass}`}>
      {message.text}
    </div>
  );
}
