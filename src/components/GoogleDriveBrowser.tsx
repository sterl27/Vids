import React, { useState, useEffect } from "react";
import {
  googleSignIn,
  logout,
  initAuth,
} from "../lib/firebaseAuth";
import { User } from "firebase/auth";
import {
  Folder,
  FileVideo,
  ChevronRight,
  Search,
  ArrowLeft,
  LogOut,
  RefreshCw,
  AlertCircle,
  Cloud,
  FileText,
  User as UserIcon,
} from "lucide-react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  thumbnailLink?: string;
  iconLink?: string;
}

interface GoogleDriveBrowserProps {
  onVideoSelect: (url: string, title: string, duration: number) => void;
  activeUrl: string;
  theme?: "light" | "dark-hc";
}

export function GoogleDriveBrowser({ onVideoSelect, activeUrl, theme = "dark-hc" }: GoogleDriveBrowserProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // File browser states
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "My Drive" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"video" | "all">("video");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const currentFolder = folderHistory[folderHistory.length - 1];

  // Initialize auth state listener
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

  // Fetch files when folder, search query, filter type, or token changes
  useEffect(() => {
    if (accessToken) {
      fetchDriveFiles();
    }
  }, [accessToken, currentFolder.id, filterType]);

  const fetchDriveFiles = async (loadMore = false) => {
    if (!accessToken) return;
    setIsLoadingFiles(true);
    setAuthError(null);

    try {
      let q = "trashed = false";

      // Apply folder constraint
      if (!searchQuery) {
        q += ` and '${currentFolder.id}' in parents`;
      }

      // Apply mimeType filter
      if (filterType === "video") {
        q += " and mimeType contains 'video/'";
      } else {
        // Show folders and videos only to keep it relevant
        q += " and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'video/')";
      }

      const params = new URLSearchParams({
        token: accessToken,
        q,
        pageToken: loadMore && nextPageToken ? nextPageToken : "",
      });

      const response = await fetch(`/api/drive/files?${params.toString()}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const fetchedFiles = data.files || [];

      if (loadMore) {
        setFiles((prev) => [...prev, ...fetchedFiles]);
      } else {
        setFiles(fetchedFiles);
      }
      setNextPageToken(data.nextPageToken || null);
    } catch (err: any) {
      console.error("Error fetching drive files:", err);
      setAuthError(`Failed to fetch files from Google Drive: ${err.message}`);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDriveFiles();
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
      console.error("Sign-in error:", err);
      setAuthError(err.message || "OAuth sign-in failed. Check popup blocking.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsAuthLoading(true);
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setFiles([]);
      setFolderHistory([{ id: "root", name: "My Drive" }]);
    } catch (err: any) {
      console.error("Sign-out error:", err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleFolderClick = (folderId: string, folderName: string) => {
    setSearchQuery(""); // Clear search to show folder content
    setFolderHistory((prev) => [...prev, { id: folderId, name: folderName }]);
  };

  const handleBackClick = () => {
    if (folderHistory.length > 1) {
      setFolderHistory((prev) => prev.slice(0, -1));
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setFolderHistory((prev) => prev.slice(0, index + 1));
  };

  const handleFileClick = (file: DriveFile) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      handleFolderClick(file.id, file.name);
    } else if (file.mimeType.startsWith("video/")) {
      // Build proxy video stream URL
      const proxyUrl = `/api/drive/video?fileId=${file.id}&token=${accessToken}`;
      // Pass file details to player
      // We set a default duration of 15 seconds, which will update when the video metadata loads in player.
      onVideoSelect(proxyUrl, file.name, 15);
    }
  };

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return "";
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div id="drive-browser-root" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm text-slate-200 flex items-center gap-2">
          <Cloud className="h-4 w-4 text-sky-400" />
          Google Drive Source
        </h3>
        {user && (
          <button
            onClick={handleSignOut}
            className="text-[10px] text-slate-400 hover:text-red-400 font-mono flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-red-500/30 px-2 py-1 rounded-md transition-colors"
          >
            <LogOut className="h-3 w-3" />
            Sign Out
          </button>
        )}
      </div>

      {!user ? (
        <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-5 text-center space-y-4">
          <div className="mx-auto w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <Cloud className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-200">Connect Google Drive</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              Access your personal Drive folders, choose custom videos, and stream them securely through the API playground.
            </p>
          </div>
          <button
            onClick={handleSignIn}
            disabled={isAuthLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium text-xs py-2 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isAuthLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <UserIcon className="h-3.5 w-3.5" />
                Sign in with Google
              </>
            )}
          </button>
          {authError && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-left">
              <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-300 leading-normal">{authError}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 bg-slate-950/40 border border-slate-900 rounded-xl p-3">
          {/* User Profile Banner */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-7 h-7 rounded-full border border-slate-800"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs text-indigo-400 font-semibold uppercase">
                {user.displayName?.charAt(0) || "U"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user.displayName}</p>
              <p className="text-[9px] text-slate-500 font-mono truncate">{user.email}</p>
            </div>
          </div>

          {/* Breadcrumbs Navigation */}
          <div className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none text-[11px] text-slate-400">
            {folderHistory.map((folder, index) => (
              <React.Fragment key={folder.id}>
                {index > 0 && <ChevronRight className="h-3 w-3 text-slate-600 flex-shrink-0" />}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`hover:text-indigo-400 hover:underline truncate max-w-[100px] flex-shrink-0 font-medium ${
                    index === folderHistory.length - 1 ? "text-indigo-400 font-bold" : ""
                  }`}
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search files in folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors font-sans"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            </form>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono">Filter:</span>
              <button
                onClick={() => setFilterType("video")}
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono border transition-all ${
                  filterType === "video"
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Videos Only
              </button>
              <button
                onClick={() => setFilterType("all")}
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono border transition-all ${
                  filterType === "all"
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                All & Folders
              </button>
            </div>
          </div>

          {/* Directory list */}
          <div className="border border-slate-900 bg-slate-950/80 rounded-lg overflow-hidden max-h-[220px] overflow-y-auto">
            {isLoadingFiles ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-500/70" />
                <p className="text-[10px] font-mono">Fetching index...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-1">
                <FileText className="h-5 w-5 mx-auto text-slate-600" />
                <p className="text-xs">No compatible files found</p>
                <p className="text-[10px] text-slate-600 font-mono">Try switching filter to 'All & Folders'</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-900 font-sans">
                {folderHistory.length > 1 && !searchQuery && (
                  <button
                    onClick={handleBackClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-indigo-400 hover:bg-slate-900/40 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="font-medium">.. Go back up</span>
                  </button>
                )}
                {files.map((file) => {
                  const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                  const isActive = activeUrl.includes(file.id);

                  return (
                    <button
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-900/30 ${
                        isActive ? "bg-indigo-500/5 text-indigo-400" : "text-slate-300"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isFolder ? (
                          <Folder className="h-4 w-4 text-amber-500/80 fill-amber-500/10" />
                        ) : (
                          <FileVideo className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-sky-400"}`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-medium text-[11px] leading-tight ${isActive ? "text-indigo-300 font-semibold" : ""}`}>
                          {file.name}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          {isFolder ? "Folder" : formatSize(file.size)}
                          {!isFolder && <span>•</span>}
                          <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
