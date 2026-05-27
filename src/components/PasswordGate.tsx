"use client";

import { useState, useEffect } from "react";
import { Pizza, Lock } from "lucide-react";

const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || "gallas2026";
const STORAGE_KEY = "gallas_auth";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === "true") setAuthenticated(true);
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === CORRECT_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setInput("");
    }
  };

  if (checking) return null;
  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gallas-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gallas-red rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Pizza className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Galla&apos;s Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Operations · Internal Access Only</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gallas-dark-card border border-gallas-dark-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-gray-500" />
            <label className="text-sm text-gray-400 font-medium">Password</label>
          </div>
          <input
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            placeholder="Enter password"
            autoFocus
            className={`w-full bg-gallas-dark border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all mb-4 ${
              error
                ? "border-red-500 focus:ring-red-500/30"
                : "border-gallas-dark-border focus:ring-gallas-red/30 focus:border-gallas-red"
            }`}
          />
          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">Incorrect password — try again</p>
          )}
          <button
            type="submit"
            className="w-full bg-gallas-red hover:bg-gallas-red-light text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
