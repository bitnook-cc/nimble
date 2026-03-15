"use client";

import { useEffect } from "react";

import { apiUrl } from "@/lib/utils/api";

export default function AuthInitiatePage() {
  useEffect(() => {
    // Get the redirect URL from query params
    const params = new URLSearchParams(window.location.search);
    const redirectUri = params.get("redirect_uri");

    // Build the OAuth URL with the redirect URI
    const oauthUrl = redirectUri
      ? `${apiUrl}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`
      : `${apiUrl}/auth/google`;

    // Redirect to the OAuth endpoint
    window.location.href = oauthUrl;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
      <div className="text-center text-white p-8">
        <h1 className="text-3xl font-bold mb-4">Redirecting to Google...</h1>
        <p className="text-lg opacity-90">
          Please wait while we redirect you to Google for authentication.
        </p>
        <div className="mt-6">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    </div>
  );
}
