import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { VideoFeature, VideoAnalysisResult } from "../types";
import {
  X,
  Trash2,
  Search,
  History,
  Clock,
  Play,
  Tag,
  Smile,
  ShieldAlert,
  Award,
  Box,
  UserCheck,
  Film,
  Languages,
  Type,
  Bookmark,
  Sparkles,
} from "lucide-react";

export interface AnalysisHistoryItem {
  id: string;
  videoUrl: string;
  videoTitle: string;
  duration: number;
  feature: VideoFeature;
  customPrompt?: string;
  timestamp: number;
  result: VideoAnalysisResult;
}

interface AnalysisHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: AnalysisHistoryItem[];
  onSelectHistoryItem: (item: AnalysisHistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  theme?: "light" | "dark-hc";
}

const getFeatureIcon = (feature: VideoFeature, className = "h-4 w-4") => {
  switch (feature) {
    case "label_detection":
      return <Tag className={`${className} text-indigo-500`} />;
    case "face_detection":
      return <Smile className={`${className} text-emerald-500`} />;
    case "explicit_content":
      return <ShieldAlert className={`${className} text-rose-500`} />;
    case "logo_recognition":
      return <Award className={`${className} text-sky-500`} />;
    case "object_tracking":
      return <Box className={`${className} text-amber-500`} />;
    case "person_detection":
      return <UserCheck className={`${className} text-indigo-500`} />;
    case "shot_change":
      return <Film className={`${className} text-emerald-500`} />;
    case "speech_transcription":
      return <Languages className={`${className} text-indigo-500`} />;
    case "text_detection":
      return <Type className={`${className} text-rose-500`} />;
    default:
      return <Bookmark className={`${className} text-indigo-500`} />;
  }
};

const formatFeatureName = (feature: VideoFeature) => {
  return feature.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const formatTimestamp = (ts: number) => {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
};

export const AnalysisHistorySidebar: React.FC<AnalysisHistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onDeleteHistoryItem,
  onClearHistory,
  theme = "dark-hc",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<VideoFeature | "all">("all");

  const isLight = theme === "light";

  // Filter & Search logic
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        item.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.customPrompt && item.customPrompt.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFeature = selectedFilter === "all" || item.feature === selectedFilter;
      return matchesSearch && matchesFeature;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [history, searchQuery, selectedFilter]);

  const uniqueFeaturesUsed = useMemo(() => {
    const set = new Set<VideoFeature>();
    history.forEach((item) => set.add(item.feature));
    return Array.from(set);
  }, [history]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className={`fixed top-0 left-0 h-full w-full max-w-md z-50 shadow-2xl flex flex-col border-r transition-colors duration-200 ${
              isLight
                ? "bg-white border-zinc-200 text-zinc-900"
                : "bg-zinc-950 border-zinc-900 text-zinc-100"
            }`}
          >
            {/* Header */}
            <div className={`p-5 flex items-center justify-between border-b ${
              isLight ? "border-zinc-100" : "border-zinc-900"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${
                  isLight ? "bg-zinc-100 border-zinc-200 text-indigo-600" : "bg-zinc-900 border-zinc-800 text-indigo-400"
                }`}>
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base">Analysis History</h3>
                  <p className={`text-[10px] font-mono leading-none mt-0.5 ${isLight ? "text-zinc-500" : "text-zinc-550"}`}>
                    {history.length} records saved locally
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear your full analysis history?")) {
                        onClearHistory();
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors border cursor-pointer ${
                      isLight
                        ? "hover:bg-rose-50 text-rose-600 border-zinc-200 hover:border-rose-200"
                        : "hover:bg-rose-950/30 text-rose-400 border-zinc-900 hover:border-rose-900/60"
                    }`}
                    title="Clear All History"
                    aria-label="Clear All History"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors border cursor-pointer ${
                    isLight
                      ? "hover:bg-zinc-100 text-zinc-600 border-zinc-200"
                      : "hover:bg-zinc-900 text-zinc-400 border-zinc-900"
                  }`}
                  aria-label="Close Sidebar"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Filter and Search Panel */}
            <div className={`p-4 space-y-3 border-b ${
              isLight ? "border-zinc-100" : "border-zinc-900"
            }`}>
              <div className="relative">
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${isLight ? "text-zinc-400" : "text-zinc-600"}`} />
                <input
                  type="text"
                  placeholder="Search by video title or prompt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-hidden focus:ring-2 transition-all ${
                    isLight
                      ? "bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-indigo-500"
                      : "bg-zinc-900/40 border-zinc-900 text-zinc-100 focus:ring-indigo-500"
                  }`}
                />
              </div>

              {/* Tag filters */}
              {history.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  <button
                    onClick={() => setSelectedFilter("all")}
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                      selectedFilter === "all"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : isLight
                          ? "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850"
                    }`}
                  >
                    All Features
                  </button>
                  {uniqueFeaturesUsed.map((feat) => (
                    <button
                      key={feat}
                      onClick={() => setSelectedFilter(feat)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        selectedFilter === feat
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : isLight
                            ? "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850"
                      }`}
                    >
                      {getFeatureIcon(feat, "h-3 w-3")}
                      {formatFeatureName(feat)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`group relative p-3.5 border rounded-2xl transition-all duration-200 cursor-pointer flex flex-col gap-2.5 hover:shadow-md ${
                      isLight
                        ? "bg-zinc-50/50 hover:bg-white border-zinc-200 hover:border-indigo-200"
                        : "bg-zinc-900/30 hover:bg-zinc-900/80 border-zinc-900 hover:border-indigo-950/80"
                    }`}
                    onClick={() => onSelectHistoryItem(item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${
                          isLight ? "bg-white border border-zinc-200" : "bg-zinc-950/80 border border-zinc-900"
                        }`}>
                          {getFeatureIcon(item.feature, "h-4.5 w-4.5")}
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold leading-tight line-clamp-2 ${
                            isLight ? "text-zinc-800 group-hover:text-indigo-600" : "text-zinc-100 group-hover:text-indigo-400"
                          }`}>
                            {item.videoTitle}
                          </h4>
                          <span className={`text-[10px] font-mono block mt-1 ${isLight ? "text-zinc-500" : "text-zinc-550"}`}>
                            {formatFeatureName(item.feature)}
                          </span>
                        </div>
                      </div>

                      {/* Individual Delete Action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistoryItem(item.id);
                        }}
                        className={`p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 border cursor-pointer ${
                          isLight
                            ? "hover:bg-rose-50 text-rose-500 border-zinc-200 hover:border-rose-200"
                            : "hover:bg-rose-950/30 text-rose-400 border-zinc-900 hover:border-rose-900/60"
                        }`}
                        title="Delete record"
                        aria-label="Delete history item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex items-center gap-2 flex-wrap text-[9px] font-mono mt-1 pt-2 border-t border-dashed border-zinc-800/10 dark:border-zinc-800/40">
                      <span className={`flex items-center gap-1 ${isLight ? "text-zinc-500" : "text-zinc-550"}`}>
                        <Clock className="h-3 w-3 text-indigo-500" />
                        {item.duration}s clip
                      </span>
                      <span className={isLight ? "text-zinc-300" : "text-zinc-800"}>|</span>
                      <span className={isLight ? "text-zinc-500" : "text-zinc-550"}>
                        {formatTimestamp(item.timestamp)}
                      </span>
                      {item.customPrompt && (
                        <>
                          <span className={isLight ? "text-zinc-300" : "text-zinc-800"}>|</span>
                          <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm font-semibold text-[8px] uppercase ${
                            isLight
                              ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                              : "bg-indigo-950/30 text-indigo-400 border border-indigo-900/40"
                          }`}>
                            <Sparkles className="h-2 w-2" />
                            Custom Prompt
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4 space-y-4">
                  <div className={`p-4 rounded-full border border-dashed ${
                    isLight ? "bg-zinc-50 border-zinc-300 text-zinc-400" : "bg-zinc-950 border-zinc-800 text-zinc-600"
                  }`}>
                    <History className="h-10 w-10 stroke-1" />
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${isLight ? "text-zinc-700" : "text-zinc-300"}`}>No analysis records found</h5>
                    <p className={`text-[11px] mt-1.5 max-w-[240px] mx-auto leading-relaxed ${isLight ? "text-zinc-500" : "text-zinc-500"}`}>
                      {searchQuery || selectedFilter !== "all"
                        ? "Try resetting your filters or search query to find your analyses."
                        : "Analyze custom videos with different features. Your successful evaluations will be saved here automatically."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions footer */}
            <div className={`p-4 border-t text-center ${
              isLight ? "border-zinc-100 bg-zinc-50/50" : "border-zinc-900 bg-zinc-950/40"
            }`}>
              <span className={`text-[10px] font-mono block ${isLight ? "text-zinc-500" : "text-zinc-550"}`}>
                All evaluation records reside in client cache.
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
