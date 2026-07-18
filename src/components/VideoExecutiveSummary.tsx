import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface VideoExecutiveSummaryProps {
  summary: string;
  theme?: "light" | "dark-hc";
}

export const VideoExecutiveSummary: React.FC<VideoExecutiveSummaryProps> = ({
  summary,
  theme = "dark-hc",
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isLight = theme === "light";

  return (
    <div className={`border rounded-2xl p-5 mb-6 transition-all duration-300 ${
      isLight ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950 border-zinc-900 shadow-zinc-950/50"
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left focus:outline-hidden"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isLight ? "bg-indigo-50" : "bg-indigo-950/40"}`}>
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </div>
          <h3 className={`font-display font-bold text-base ${isLight ? "text-zinc-900" : "text-zinc-100"}`}>
            Executive Summary
          </h3>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5 text-zinc-500" /> : <ChevronDown className="h-5 w-5 text-zinc-500" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`mt-4 pt-4 border-t text-sm leading-relaxed ${
              isLight ? "border-zinc-100 text-zinc-700" : "border-zinc-800 text-zinc-400"
            }`}>
              {summary}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
