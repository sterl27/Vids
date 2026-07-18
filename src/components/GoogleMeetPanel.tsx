import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  googleSignIn,
  initAuth,
} from "../lib/firebaseAuth";
import {
  Video,
  Copy,
  ExternalLink,
  Settings2,
  Check,
  Loader2,
  Shield,
  Users,
  AlertCircle,
  Info,
  Lock,
  Unlock,
  Sparkles
} from "lucide-react";

interface MeetSpaceConfig {
  accessType?: "OPEN" | "TRUSTED" | "RESTRICTED" | "ACCESS_TYPE_UNSPECIFIED";
  entryPointAccess?: "ALL" | "CREATOR_ONLY" | "ENTRY_POINT_ACCESS_UNSPECIFIED";
}

interface MeetSpace {
  name: string;
  meetingUri: string;
  meetingCode: string;
  config?: MeetSpaceConfig;
}

interface GoogleMeetPanelProps {
  theme: "light" | "dark-hc";
  activeVideoTitle: string;
}

export function GoogleMeetPanel({ theme, activeVideoTitle }: GoogleMeetPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Meet space state
  const [meetSpace, setMeetSpace] = useState<MeetSpace | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | null }>({
    text: "",
    type: null
  });

  // Local settings form state
  const [accessType, setAccessType] = useState<string>("TRUSTED");
  const [entryPointAccess, setEntryPointAccess] = useState<string>("ALL");

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
      console.error("Meet Auth error:", err);
      setAuthError(err.message || "Google Workspace authentication failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateSpace = async () => {
    if (!accessToken) return;
    setIsCreating(true);
    setStatusMessage({ text: "", type: null });
    setAuthError(null);

    try {
      // API call to create space: POST https://meet.googleapis.com/v2/spaces
      const response = await fetch("https://meet.googleapis.com/v2/spaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          config: {
            accessType: "TRUSTED",
            entryPointAccess: "ALL"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as MeetSpace;
      setMeetSpace(data);
      if (data.config?.accessType) setAccessType(data.config.accessType);
      if (data.config?.entryPointAccess) setEntryPointAccess(data.config.entryPointAccess);

      setStatusMessage({ text: "Meet space successfully created!", type: "success" });
    } catch (err: any) {
      console.error("Error creating Meet space:", err);
      setStatusMessage({ text: `Failed to create meeting: ${err.message}`, type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateConfig = async (newAccess: string, newEntry: string) => {
    if (!accessToken || !meetSpace) return;
    setIsUpdating(true);
    setStatusMessage({ text: "", type: null });

    try {
      const response = await fetch(`https://meet.googleapis.com/v2/${meetSpace.name}?updateMask=config`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          config: {
            accessType: newAccess,
            entryPointAccess: newEntry
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as MeetSpace;
      setMeetSpace(data);
      if (data.config?.accessType) setAccessType(data.config.accessType);
      if (data.config?.entryPointAccess) setEntryPointAccess(data.config.entryPointAccess);

      setStatusMessage({ text: "Meeting configuration updated!", type: "success" });
    } catch (err: any) {
      console.error("Error patching config:", err);
      setStatusMessage({ text: `Failed to update configuration: ${err.message}`, type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = () => {
    if (!meetSpace) return;
    const shareText = `Let's watch and review video intelligence on: "${activeVideoTitle}" together! \nMeeting Link: ${meetSpace.meetingUri} \nMeeting Code: ${meetSpace.meetingCode}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Color theme selectors based on high-contrast setting
  const isLight = theme === "light";
  const containerClass = isLight
    ? "bg-white border-zinc-300 text-zinc-900 shadow-sm"
    : "bg-zinc-950 border-zinc-700 text-white shadow-md shadow-black/80";

  const cardBgClass = isLight
    ? "bg-zinc-100 border-zinc-300"
    : "bg-zinc-900/60 border-zinc-800";

  const buttonPrimaryClass = isLight
    ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border border-indigo-700 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
    : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white border border-indigo-400 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black";

  const buttonSecondaryClass = isLight
    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 focus:ring-2 focus:ring-zinc-600"
    : "bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-700 focus:ring-2 focus:ring-white";

  const inputSelectClass = isLight
    ? "bg-white text-zinc-900 border-zinc-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
    : "bg-zinc-900 text-white border-zinc-700 focus:border-white focus:ring-1 focus:ring-white";

  const labelClass = isLight
    ? "text-zinc-700"
    : "text-zinc-300";

  return (
    <div className={`border rounded-2xl p-4 md:p-5 space-y-4 transition-all duration-200 ${containerClass}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-base md:text-lg flex items-center gap-2">
          <Video className="h-5 w-5 text-indigo-500" />
          Google Meet Co-Watching
        </h3>
        {meetSpace && (
          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
            isLight ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-emerald-950/40 border-emerald-700 text-emerald-400"
          }`}>
            Live Space Active
          </span>
        )}
      </div>

      {!user ? (
        <div className={`border rounded-xl p-5 text-center space-y-4 ${cardBgClass}`}>
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Video className="h-6 w-6 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Launch Video Review Meetings</h4>
            <p className={`text-xs leading-relaxed max-w-sm mx-auto ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
              Create a real Google Meet space to share live telemetry, analyze spatial frame detections, and host interactive reviews with colleagues in real time.
            </p>
          </div>
          <button
            onClick={handleSignIn}
            disabled={isAuthLoading}
            className={`w-full font-semibold text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${buttonPrimaryClass}`}
          >
            {isAuthLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Synchronizing OAuth...
              </>
            ) : (
              <>
                <Video className="h-3.5 w-3.5" />
                Sign in to Google Meet
              </>
            )}
          </button>
          {authError && (
            <div className={`p-3 border rounded-lg flex items-start gap-2 text-left ${
              isLight ? "bg-red-50 border-red-200 text-red-900" : "bg-red-950/20 border-red-800/40 text-red-300"
            }`}>
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-normal">{authError}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!meetSpace ? (
            <div className={`border rounded-xl p-5 text-center space-y-4 ${cardBgClass}`}>
              <div className="mx-auto w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold">Generate Google Meet space for review sessions</p>
                <p className={`text-[11px] leading-relaxed max-w-xs mx-auto ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                  Click below to dynamically provision a real Google Meet conference. You will get immediate access to the URL, custom access permissions, and a shareable invitation.
                </p>
              </div>
              <button
                onClick={handleCreateSpace}
                disabled={isCreating}
                className={`w-full font-semibold text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${buttonPrimaryClass}`}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Provisioning Room...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Create Meeting Room
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className={`border rounded-xl p-4 space-y-4 ${cardBgClass}`}>
              {/* Meeting Space Details */}
              <div className="space-y-2">
                <span className={`text-[10px] uppercase font-mono tracking-wider font-bold block ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                  Meeting Room Credentials
                </span>
                
                <div className={`p-3 rounded-lg border font-mono text-xs flex items-center justify-between gap-3 ${
                  isLight ? "bg-zinc-50 border-zinc-200" : "bg-black border-zinc-800"
                }`}>
                  <div className="truncate">
                    <p className={`text-[10px] uppercase text-zinc-500 font-sans font-bold`}>Google Meet Code</p>
                    <p className="text-sm font-bold text-indigo-400">{meetSpace.meetingCode}</p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${buttonSecondaryClass}`}
                    title="Copy Invitation"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={meetSpace.meetingUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-semibold text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all min-h-[44px] text-center ${buttonPrimaryClass}`}
                >
                  <ExternalLink className="h-4 w-4" />
                  Launch Meet
                </a>
                <button
                  onClick={handleCopyLink}
                  className={`font-semibold text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${buttonSecondaryClass}`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Invite
                    </>
                  )}
                </button>
              </div>

              {/* Space settings edit section */}
              <div className={`p-3 border rounded-xl space-y-3 ${isLight ? "bg-zinc-50 border-zinc-200" : "bg-black/40 border-zinc-800/80"}`}>
                <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-800/20">
                  <Settings2 className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold">Space Configuration Settings</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${labelClass}`}>
                      Access Restriction Type
                    </label>
                    <select
                      value={accessType}
                      disabled={isUpdating}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAccessType(val);
                        handleUpdateConfig(val, entryPointAccess);
                      }}
                      className={`w-full text-xs p-2 rounded-lg outline-none transition-colors ${inputSelectClass}`}
                    >
                      <option value="OPEN">OPEN (Anyone can join directly)</option>
                      <option value="TRUSTED">TRUSTED (People in host org or invited join directly)</option>
                      <option value="RESTRICTED">RESTRICTED (Host must approve everyone)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${labelClass}`}>
                      Entry Point Access Restrictions
                    </label>
                    <select
                      value={entryPointAccess}
                      disabled={isUpdating}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEntryPointAccess(val);
                        handleUpdateConfig(accessType, val);
                      }}
                      className={`w-full text-xs p-2 rounded-lg outline-none transition-colors ${inputSelectClass}`}
                    >
                      <option value="ALL">ALL (Any entry point available)</option>
                      <option value="CREATOR_ONLY">CREATOR ONLY (Only space creator can join first)</option>
                    </select>
                  </div>
                </div>

                {isUpdating && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-1">
                    <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                    Propagating configurations...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback message indicator */}
          {statusMessage.text && (
            <div className={`p-2.5 border rounded-lg flex items-center gap-2 text-xs ${
              statusMessage.type === "success"
                ? isLight ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                : isLight ? "bg-red-50 border-red-200 text-red-900" : "bg-red-950/20 border-red-800/40 text-red-300"
            }`}>
              <Info className={`h-4 w-4 flex-shrink-0 ${statusMessage.type === "success" ? "text-emerald-500" : "text-red-500"}`} />
              <span className="flex-1 leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {/* Co-Watching Share Tip */}
          <div className={`p-2.5 rounded-lg border flex gap-2 items-start ${
            isLight ? "bg-indigo-50 border-indigo-100 text-indigo-900" : "bg-indigo-950/10 border-indigo-900/30 text-indigo-300"
          }`}>
            <Info className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed font-sans">
              <strong>Tip:</strong> Copy the invite link to let other people join your Meet space. The invitation automatically shares details about the active video <strong>"{activeVideoTitle}"</strong> so everyone can quickly review the identical footage together!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
