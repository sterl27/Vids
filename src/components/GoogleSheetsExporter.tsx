import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { googleSignIn, initAuth } from "../lib/firebaseAuth";
import { Table, RefreshCw, AlertCircle, Share2, Loader2, Check } from "lucide-react";
import { VideoAnalysisResult } from "../types";

interface GoogleSheetsExporterProps {
  theme: "light" | "dark-hc";
  activeVideoTitle: string;
  activeAnalysis: VideoAnalysisResult | null;
}

export function GoogleSheetsExporter({
  theme,
  activeVideoTitle,
  activeAnalysis,
}: GoogleSheetsExporterProps) {
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

  const exportToSheets = async () => {
    if (!accessToken || !activeAnalysis) return;

    setIsExporting(true);
    setStatus({ text: "Creating spreadsheet...", type: null });

    try {
      // 1. Create a new Spreadsheet
      const sheetsRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: { title: `Analysis: ${activeVideoTitle}` },
        }),
      });

      if (!sheetsRes.ok) throw new Error("Failed to create Google Sheet.");
      const { spreadsheetId } = await sheetsRes.json();

      // 2. Add content via spreadsheets.values.update
      const values = [
        ["Insight"],
        ...activeAnalysis.insights.map((insight) => [insight]),
      ];

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=RAW`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values }),
      });

      setStatus({ text: "Report exported to Google Sheets!", type: "success" });
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
        <Table className="h-5 w-5 text-indigo-500" />
        Google Sheets Exporter
      </h3>
      
      {!user ? (
        <button
          onClick={handleSignIn}
          className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${isLight ? "bg-zinc-100 hover:bg-zinc-200" : "bg-zinc-900 hover:bg-zinc-800"}`}
        >
          Sign in to Google Sheets
        </button>
      ) : (
        <button
          onClick={exportToSheets}
          disabled={isExporting || !activeAnalysis}
          className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${
            isExporting ? "opacity-50" : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          Export to Sheets
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
