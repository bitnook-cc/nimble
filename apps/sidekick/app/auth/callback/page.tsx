"use client";

import { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    // Get the status from URL parameters
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    // Send message to parent window (if in popup)
    if (window.opener) {
      if (status === "success") {
        window.opener.postMessage({ type: "auth-success" }, window.location.origin);
      } else if (status === "failed") {
        window.opener.postMessage({ type: "auth-failed" }, window.location.origin);
      }

      // Auto-close after a short delay
      setTimeout(
        () => {
          window.close();
        },
        status === "success" ? 1500 : 3000,
      );
    } else {
      // If not in popup, redirect to home
      window.location.href = "/";
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="text-center text-white p-8">
        <h1 className="text-3xl font-bold mb-4">Authentication Processing...</h1>
        <p className="text-lg opacity-90 mb-6">
          Please wait while we complete your authentication.
        </p>
        <button
          onClick={() => window.close()}
          className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
        >
          Close Window
        </button>
      </div>
    </div>
  );
}
