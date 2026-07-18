import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { googleSignIn, initAuth } from "../lib/firebaseAuth";
import { CheckSquare, RefreshCw, AlertCircle, Plus, Loader2 } from "lucide-react";
import { VideoAnalysisResult } from "../types";

interface GoogleTasksIntegratorProps {
  theme: "light" | "dark-hc";
  activeVideoTitle: string;
  activeAnalysis: VideoAnalysisResult | null;
}

export function GoogleTasksIntegrator({
  theme,
  activeVideoTitle,
  activeAnalysis,
}: GoogleTasksIntegratorProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
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

  const addToTasks = async () => {
    if (!accessToken || !activeAnalysis) return;

    setIsAdding(true);
    setStatus({ text: "Creating task...", type: null });

    try {
      // 1. Create a task
      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Review analysis: ${activeVideoTitle}`,
          notes: `Summary: ${activeAnalysis.summary}`,
        }),
      });

      setStatus({ text: "Task added to Google Tasks!", type: "success" });
      setTimeout(() => setStatus({ text: "", type: null }), 3000);
    } catch (err: any) {
      setStatus({ text: `Failed to add task: ${err.message}`, type: "error" });
    } finally {
      setIsAdding(false);
    }
  };

  const isLight = theme === "light";
  
  return (
    <div className={`border rounded-2xl p-5 space-y-4 ${isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800"}`}>
      <h3 className="font-bold text-base flex items-center gap-2">
        <CheckSquare className="h-5 w-5 text-indigo-500" />
        Google Tasks Integrator
      </h3>
      
      {!user ? (
        <button
          onClick={handleSignIn}
          className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${isLight ? "bg-zinc-100 hover:bg-zinc-200" : "bg-zinc-900 hover:bg-zinc-800"}`}
        >
          Sign in to Google Tasks
        </button>
      ) : (
        <button
          onClick={addToTasks}
          disabled={isAdding || !activeAnalysis}
          className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${
            isAdding ? "opacity-50" : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add Task
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
