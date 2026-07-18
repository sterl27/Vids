import React, { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import {
  googleSignIn,
  initAuth,
} from "../lib/firebaseAuth";
import {
  MessageSquare,
  Send,
  RefreshCw,
  AlertCircle,
  Info,
  Sparkles,
  Share2,
  Check,
  User as UserIcon,
  MessageCircle,
} from "lucide-react";
import { VideoFeature, VideoAnalysisResult } from "../types";

interface ChatSpace {
  name: string;
  displayName: string;
  spaceType: "SPACE" | "DIRECT_MESSAGE" | "GROUP_CHAT" | "SPACE_TYPE_UNSPECIFIED";
}

interface ChatMessage {
  name: string;
  sender?: {
    displayName: string;
    avatarUrl?: string;
    type: "HUMAN" | "BOT" | "TYPE_UNSPECIFIED";
  };
  text: string;
  createTime: string;
}

interface GoogleChatPanelProps {
  theme: "light" | "dark-hc";
  activeVideoTitle: string;
  selectedFeature: VideoFeature;
  activeAnalysis: VideoAnalysisResult | null;
}

export function GoogleChatPanel({
  theme,
  activeVideoTitle,
  selectedFeature,
  activeAnalysis,
}: GoogleChatPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Chat API states
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ChatSpace | null>(null);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Status feedback state
  const [status, setStatus] = useState<{ text: string; type: "success" | "error" | null }>({
    text: "",
    type: null,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync auth state
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

  // Fetch spaces when authenticated
  useEffect(() => {
    if (accessToken) {
      fetchSpaces();
    }
  }, [accessToken]);

  // Fetch messages when a space is selected
  useEffect(() => {
    if (accessToken && selectedSpace) {
      fetchMessages(selectedSpace.name);
    } else {
      setMessages([]);
    }
  }, [accessToken, selectedSpace]);

  // Scroll to bottom of chat list on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSpaces = async () => {
    if (!accessToken) return;
    setIsLoadingSpaces(true);
    setAuthError(null);
    try {
      // List user spaces
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Google Chat Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const fetchedSpaces: ChatSpace[] = data.spaces || [];
      setSpaces(fetchedSpaces);

      if (fetchedSpaces.length > 0 && !selectedSpace) {
        setSelectedSpace(fetchedSpaces[0]);
      }
    } catch (err: any) {
      console.error("Error fetching spaces:", err);
      setAuthError(`Could not fetch Chat spaces: ${err.message}`);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const fetchMessages = async (spaceName: string) => {
    if (!accessToken) return;
    setIsLoadingMessages(true);
    try {
      // List messages in the space
      // Endpoint format: GET https://chat.googleapis.com/v1/spaces/{space_id}/messages
      const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=20`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Google Chat Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      // Reverse messages so they list chronologically (oldest to newest) for chat stream
      const fetchedMessages: ChatMessage[] = (data.messages || []).reverse();
      setMessages(fetchedMessages);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setStatus({ text: `Could not load recent chat stream: ${err.message}`, type: "error" });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: any) {
      console.error("Chat Auth error:", err);
      setAuthError(err.message || "Google Chat OAuth connection failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSendMessage = async (textToSend: string, isReport = false) => {
    if (!accessToken || !selectedSpace || !textToSend.trim()) return;

    // MUTATION SAFEGUARD: Require user confirmation before sending on behalf of user
    const confirmMsg = isReport
      ? `Do you want to post the formatted Video Intelligence Report for "${activeVideoTitle}" into the Chat space "${selectedSpace.displayName}"?`
      : `Are you sure you want to send this message to the Chat space "${selectedSpace.displayName}"?`;

    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    setIsSending(true);
    setStatus({ text: "", type: null });

    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpace.name}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToSend,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to send message: HTTP ${res.status}`);
      }

      if (!isReport) {
        setNewMessageText("");
      }

      setStatus({
        text: isReport ? "Intelligence report posted successfully!" : "Message posted successfully!",
        type: "success",
      });

      // Reload messages to show the new one
      await fetchMessages(selectedSpace.name);
    } catch (err: any) {
      console.error("Error posting message:", err);
      setStatus({ text: `Failed to send message: ${err.message}`, type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  const handleShareAnalysisReport = () => {
    if (!activeAnalysis) return;

    const formattedFeatureName = selectedFeature
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    let reportText = `🎬 *Video Intelligence Report* \n`;
    reportText += `*Video Clip:* _${activeVideoTitle}_\n`;
    reportText += `*Evaluation Feature:* \`${formattedFeatureName}\`\n\n`;

    reportText += `📝 *Analysis Summary:* \n`;
    reportText += `${activeAnalysis.summary}\n\n`;

    if (activeAnalysis.insights && activeAnalysis.insights.length > 0) {
      reportText += `💡 *Key Findings:* \n`;
      activeAnalysis.insights.slice(0, 5).forEach((insight) => {
        reportText += `• ${insight}\n`;
      });
      if (activeAnalysis.insights.length > 5) {
        reportText += `• _And ${activeAnalysis.insights.length - 5} more detailed records..._\n`;
      }
      reportText += `\n`;
    }

    reportText += `📡 _Shared securely from the Video Intelligence Explorer sandbox._`;

    handleSendMessage(reportText, true);
  };

  // Theme support
  const isLight = theme === "light";
  const containerClass = isLight
    ? "bg-white border-zinc-300 text-zinc-900 shadow-sm"
    : "bg-zinc-950 border-zinc-700 text-white shadow-md shadow-black/80";

  const cardBgClass = isLight ? "bg-zinc-100 border-zinc-300" : "bg-zinc-900/60 border-zinc-800";

  const buttonPrimaryClass = isLight
    ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border border-indigo-700 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
    : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white border border-indigo-400 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black";

  const buttonSecondaryClass = isLight
    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 focus:ring-2 focus:ring-zinc-600"
    : "bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-700 focus:ring-2 focus:ring-white";

  const inputClass = isLight
    ? "bg-white text-zinc-900 border-zinc-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
    : "bg-zinc-900 text-white border-zinc-700 focus:border-white focus:ring-1 focus:ring-white";

  return (
    <div className={`border rounded-2xl p-4 md:p-5 space-y-4 transition-all duration-200 ${containerClass}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-base md:text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-500" />
          Google Chat Collaborate
        </h3>
        {selectedSpace && (
          <span
            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
              isLight
                ? "bg-indigo-50 border-indigo-300 text-indigo-800"
                : "bg-indigo-950/40 border-indigo-700 text-indigo-400"
            }`}
          >
            Connected
          </span>
        )}
      </div>

      {!user ? (
        <div className={`border rounded-xl p-5 text-center space-y-4 ${cardBgClass}`}>
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <MessageSquare className="h-6 w-6 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Collaborate via Google Chat</h4>
            <p className={`text-xs leading-relaxed max-w-sm mx-auto ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
              Connect Google Chat to stream telemetry reports, discuss video analytics events, and converse with team spaces directly.
            </p>
          </div>
          <button
            onClick={handleSignIn}
            disabled={isAuthLoading}
            className={`w-full font-semibold text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${buttonPrimaryClass}`}
          >
            {isAuthLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Synchronizing OAuth...
              </>
            ) : (
              <>
                <MessageSquare className="h-3.5 w-3.5" />
                Sign in to Google Chat
              </>
            )}
          </button>
          {authError && (
            <div
              className={`p-3 border rounded-lg flex items-start gap-2 text-left ${
                isLight
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-red-950/20 border-red-800/40 text-red-300"
              }`}
            >
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-normal">{authError}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Space Selection Dropdown */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Chat Space
              </label>
              <button
                onClick={fetchSpaces}
                disabled={isLoadingSpaces}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
                title="Refresh space listing"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingSpaces ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {isLoadingSpaces ? (
              <div className="py-2 flex items-center gap-2 text-xs text-slate-500">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                Loading spaces...
              </div>
            ) : spaces.length === 0 ? (
              <div className="p-3 rounded-lg border border-dashed border-slate-800 bg-slate-900/10 text-center">
                <p className="text-xs text-slate-400">No Google Chat spaces found.</p>
                <p className="text-[9px] text-slate-500 mt-1">
                  Create a Space in your Google Chat app, then click Refresh.
                </p>
              </div>
            ) : (
              <select
                value={selectedSpace?.name || ""}
                onChange={(e) => {
                  const space = spaces.find((s) => s.name === e.target.value);
                  if (space) setSelectedSpace(space);
                }}
                className={`w-full text-xs p-2 rounded-lg outline-none transition-colors ${inputClass}`}
              >
                {spaces.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.displayName || `Space (${s.name.split("/").pop()})`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Action: Share Active Analysis Report */}
          {activeAnalysis ? (
            <button
              onClick={handleShareAnalysisReport}
              disabled={isSending || !selectedSpace}
              className={`w-full font-semibold text-xs py-2 px-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all min-h-[38px] ${buttonPrimaryClass}`}
            >
              <Share2 className="h-3.5 w-3.5" />
              Post Video Report to Chat
            </button>
          ) : (
            <div
              className={`p-2.5 rounded-lg border flex gap-2 items-start ${
                isLight
                  ? "bg-slate-50 border-slate-200 text-slate-600"
                  : "bg-slate-900/20 border-slate-800/40 text-slate-400"
              }`}
            >
              <Info className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <p className="text-[10px] leading-relaxed">
                Analyze this video clip using any visual feature first to unlock instant Google Chat reporting.
              </p>
            </div>
          )}

          {/* Live Chat Stream Box */}
          {selectedSpace && (
            <div className={`border rounded-xl flex flex-col h-[200px] overflow-hidden ${cardBgClass}`}>
              {/* Box header */}
              <div className="px-3 py-2 border-b border-slate-900/60 flex items-center justify-between bg-slate-950/20">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400 flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5 text-indigo-400" />
                  Recent Chat Messages
                </span>
                <button
                  onClick={() => fetchMessages(selectedSpace.name)}
                  disabled={isLoadingMessages}
                  className="text-[9px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-0.5"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${isLoadingMessages ? "animate-spin" : ""}`} />
                  Sync
                </button>
              </div>

              {/* Chat messages listing */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                    <span className="text-[10px] font-mono">Syncing room...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <MessageSquare className="h-6 w-6 text-slate-600 stroke-1" />
                    <p className="text-[10px] text-slate-500 mt-1">This space's timeline is empty.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isCurrentUser = msg.sender?.displayName === user?.displayName;
                    return (
                      <div
                        key={msg.name || index}
                        className={`flex flex-col max-w-[85%] ${
                          isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">
                            {msg.sender?.displayName || "Member"}
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono">
                            {msg.createTime
                              ? new Date(msg.createTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <div
                          className={`px-3 py-1.5 rounded-2xl text-xs leading-normal font-sans whitespace-pre-wrap break-all ${
                            isCurrentUser
                              ? "bg-indigo-600 text-white rounded-tr-sm"
                              : isLight
                              ? "bg-zinc-200 text-zinc-900 rounded-tl-sm"
                              : "bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Custom Chat Message Input form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(newMessageText);
                }}
                className="p-2 border-t border-slate-900/60 bg-slate-950/40 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  placeholder="Type a group chat message..."
                  value={newMessageText}
                  disabled={isSending}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className={`flex-1 text-xs p-1.5 rounded-lg outline-none transition-colors border ${inputClass}`}
                />
                <button
                  type="submit"
                  disabled={isSending || !newMessageText.trim()}
                  className={`p-1.5 rounded-lg transition-all shadow-sm flex items-center justify-center cursor-pointer min-h-[32px] min-w-[32px] ${
                    newMessageText.trim()
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800/40"
                  }`}
                  title="Send message"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Status feedback alerts */}
          {status.text && (
            <div
              className={`p-2.5 border rounded-lg flex items-center gap-2 text-xs ${
                status.type === "success"
                  ? isLight
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                  : isLight
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-red-950/20 border-red-800/40 text-red-300"
              }`}
            >
              <Info
                className={`h-4 w-4 flex-shrink-0 ${
                  status.type === "success" ? "text-emerald-500" : "text-red-500"
                }`}
              />
              <span className="flex-1 leading-snug">{status.text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
