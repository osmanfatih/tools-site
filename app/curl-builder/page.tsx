"use client";

import { useState } from "react";
import Link from "next/link";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type AuthMethod = "none" | "basic" | "bearer";

interface Header {
  id: string;
  key: string;
  value: string;
}

function generateCurl({
  method,
  url,
  headers,
  authMethod,
  username,
  password,
  bearerToken,
  body,
}: {
  method: Method;
  url: string;
  headers: Header[];
  authMethod: AuthMethod;
  username: string;
  password: string;
  bearerToken: string;
  body: string;
}): string {
  if (!url) return "";
  const parts = ["curl"];
  if (method !== "GET") parts.push(`-X ${method}`);

  // Auth
  if (authMethod === "basic" && (username || password)) {
    parts.push(`-u "${username}:${password}"`);
  } else if (authMethod === "bearer" && bearerToken) {
    parts.push(`-H "Authorization: Bearer ${bearerToken}"`);
  }

  // Headers
  headers.forEach(({ key, value }) => {
    if (key.trim()) parts.push(`-H "${key.trim()}: ${value.trim()}"`);
  });

  // Body
  if (body.trim()) {
    parts.push(`-d '${body.trim()}'`);
  }

  parts.push(`"${url}"`);
  return parts.join(" \\\n  ");
}

export default function CurlBuilder() {
  const [method, setMethod] = useState<Method>("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<Header[]>([{ id: "1", key: "", value: "" }]);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("none");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  const command = generateCurl({ method, url, headers, authMethod, username, password, bearerToken, body });

  function addHeader() {
    setHeaders((h) => [...h, { id: crypto.randomUUID(), key: "", value: "" }]);
  }

  function removeHeader(id: string) {
    setHeaders((h) => h.filter((r) => r.id !== id));
  }

  function updateHeader(id: string, field: "key" | "value", val: string) {
    setHeaders((h) => h.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  }

  async function copyToClipboard() {
    if (!command) return;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputCls = "w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition-all";
  const labelCls = "block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 flex items-center justify-between py-6 border-b border-stone-200">
        <Link href="/" className="text-sm font-medium text-stone-900 hover:text-stone-500 transition-colors">
          Tools
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-800">Curl Builder</span>
          <span className="text-stone-300 mx-1">·</span>
          <span className="text-sm text-stone-400">Generate curl commands instantly</span>
        </div>
        <Link href="https://osmanfatihkilic.dev" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
          osmanfatihkilic.dev
        </Link>
      </nav>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input panel */}
        <div className="space-y-5">
          {/* Method + URL */}
          <div className="bg-white border border-stone-100 rounded-2xl p-5 space-y-4">
            <div>
              <label className={labelCls}>Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as Method)}
                className={inputCls}
              >
                {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/v1/resource"
                className={inputCls}
              />
            </div>
          </div>

          {/* Headers */}
          <div className="bg-white border border-stone-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls + " mb-0"}>Headers</label>
              <button
                onClick={addHeader}
                className="text-xs text-stone-400 hover:text-stone-700 transition-colors flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add
              </button>
            </div>
            <div className="space-y-2">
              {headers.map((h) => (
                <div key={h.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={h.key}
                    onChange={(e) => updateHeader(h.id, "key", e.target.value)}
                    placeholder="Key"
                    className={inputCls + " flex-1"}
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={(e) => updateHeader(h.id, "value", e.target.value)}
                    placeholder="Value"
                    className={inputCls + " flex-1"}
                  />
                  <button
                    onClick={() => removeHeader(h.id)}
                    className="text-stone-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Auth */}
          <div className="bg-white border border-stone-100 rounded-2xl p-5 space-y-3">
            <div>
              <label className={labelCls}>Authentication</label>
              <select
                value={authMethod}
                onChange={(e) => setAuthMethod(e.target.value as AuthMethod)}
                className={inputCls}
              >
                <option value="none">None</option>
                <option value="basic">Basic Auth</option>
                <option value="bearer">Bearer Token</option>
              </select>
            </div>
            {authMethod === "basic" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
                </div>
              </div>
            )}
            {authMethod === "bearer" && (
              <div>
                <label className={labelCls}>Token</label>
                <input type="text" value={bearerToken} onChange={(e) => setBearerToken(e.target.value)} placeholder="ey..." className={inputCls} />
              </div>
            )}
          </div>

          {/* Body */}
          <div className="bg-white border border-stone-100 rounded-2xl p-5">
            <label className={labelCls}>Request Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder={'{"key": "value"}'}
              className={inputCls + " font-mono text-xs resize-none"}
            />
          </div>
        </div>

        {/* Right: Output panel */}
        <div className="lg:sticky lg:top-8 h-fit">
          <div className="bg-stone-900 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                Generated Command
              </span>
              <button
                onClick={copyToClipboard}
                disabled={!command}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="text-sm text-stone-200 font-mono whitespace-pre-wrap break-all min-h-[200px]">
              {command || (
                <span className="text-stone-600">Enter a URL to generate your curl command...</span>
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
