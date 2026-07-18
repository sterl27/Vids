import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { googleSignIn, initAuth } from "../lib/firebaseAuth";
import { FileText, RefreshCw, AlertCircle, Share2, Loader2, Check } from "lucide-react";
import { VideoAnalysisResult } from "../types";

interface GoogleDocsExporterProps {
  theme: "light" | "dark-hc";
  activeVideoTitle: string;
  activeAnalysis: VideoAnalysisResult | null;
}

export function GoogleDocsExporter({
  theme,
  activeVideoTitle,
  activeAnalysis,
}: GoogleDocsExporterProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<{ text: string; type: "success" | "error" | null }>({
    text: "",
    type: null,
  });

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: any) {
      setStatus({ text: `Auth failed: ${err.message}`, type: "error" });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const exportToDocs = async () => {
    if (!accessToken || !activeAnalysis) return;

    setIsExporting(true);
    setStatus({ text: "Creating document...", type: null });

    try {
      // 1. Create a new Doc via Drive API
      const driveRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Analysis: ${activeVideoTitle}`,
          mimeType: "application/vnd.google-apps.document",
        }),
      });

      if (!driveRes.ok) throw new Error("Failed to create Google Doc.");
      const { id: docId } = await driveRes.json();

      // 2. Add content via Docs API batchUpdate
      const content = `Analysis Report: ${activeVideoTitle}\n\nSummary:\n${activeAnalysis.summary}\n\nInsights:\n${activeAnalysis.insights.join("\n")}`;
      
      await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                text: content,
                endOfSegmentLocation: { segmentId: "" },
              },
            },
          ],
        }),
      });

      setStatus({ text: "Report exported to Google Docs!", type: "success" });
      setTimeout(() => setStatus({ text: "", type: null }), 3000);
    } catch (err: any) {
      setStatus({ text: `Export failed: ${err.message}`, type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  const isLight = theme === "light";
  
  return (
    <div className={`border rounded-2xl p-5 space-y-4 ${isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800"}`}>
      <h3 className="font-bold text-base flex items-center gap-2">
        <FileText className="h-5 w-5 text-indigo-500" />
        Google Docs Exporter
      </h3>
      
      {!user ? (
        <button
          onClick={handleSignIn}
          className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${isLight ? "bg-zinc-100 hover:bg-zinc-200" : "bg-zinc-900 hover:bg-zinc-800"}`}
        >
          Sign in to Google Docs
        </button>
      ) : (
        <button
          onClick={exportToDocs}
          disabled={isExporting || !activeAnalysis}
          className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${
            isExporting ? "opacity-50" : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          Export Report
        </button>
      )}

      {status.text && (
        <div className={`p-2 rounded text-[10px] ${status.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
          {status.text}
        </div>
      )}
    </div>
  );
}
