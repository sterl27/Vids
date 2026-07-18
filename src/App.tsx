import React, { useState } from "react";
import { VideoFeature, VideoAnalysisResult, KeyframeData } from "./types";
import { CuratedVideos, CURATED_VIDEOS } from "./components/CuratedVideos";
import { FeatureSelector } from "./components/FeatureSelector";
import { VideoOverlayPlayer } from "./components/VideoOverlayPlayer";
import { AnalysisResultsDisplay } from "./components/AnalysisResultsDisplay";
import { GoogleDriveBrowser } from "./components/GoogleDriveBrowser";
import { GoogleMeetPanel } from "./components/GoogleMeetPanel";
import { GoogleChatPanel } from "./components/GoogleChatPanel";
import { GoogleDocsExporter } from "./components/GoogleDocsExporter";
import { GoogleSheetsExporter } from "./components/GoogleSheetsExporter";
import { GoogleTasksIntegrator } from "./components/GoogleTasksIntegrator";
import { VideoExecutiveSummary } from "./components/VideoExecutiveSummary";
import {
  AnalysisHistorySidebar,
  AnalysisHistoryItem,
} from "./components/AnalysisHistorySidebar";
import {
  Eye,
  Tv,
  Info,
  ShieldCheck,
  Video,
  ExternalLink,
  Cpu,
  Zap,
  Sun,
  Moon,
  History,
} from "lucide-react";

// Pre-cached high-quality analysis data for the stock clips to enable instant playground interaction
const PRE_CACHED_ANALYSES: Record<string, Partial<Record<VideoFeature, VideoAnalysisResult>>> = {
  "https://assets.mixkit.co/videos/preview/mixkit-traffic-in-a-large-city-street-from-above-41712-large.mp4": {
    label_detection: {
      summary: "High-angle urban monitoring of a signalized city crossroads with busy multi-lane traffic flow.",
      insights: [
        "Peak flow densities observed between seconds 2.0 and 8.0.",
        "Smooth vehicle speed distribution with negligible gridlock risks.",
        "Successful crosswalk tracking for pedestrians."
      ],
      labels: [
        {
          entity: "motor vehicle",
          categories: ["transportation", "vehicle"],
          confidence: 0.98,
          segments: [{ startTime: 0, endTime: 10, confidence: 0.98 }]
        },
        {
          entity: "metropolitan road crossing",
          categories: ["infrastructure", "cityscape"],
          confidence: 0.94,
          segments: [{ startTime: 0, endTime: 10, confidence: 0.94 }]
        },
        {
          entity: "pedestrians walking",
          categories: ["human activity", "crowd"],
          confidence: 0.89,
          segments: [{ startTime: 1.5, endTime: 7.2, confidence: 0.89 }]
        }
      ]
    },
    object_tracking: {
      summary: "Real-time temporal bounding track logs of individual vehicle classes moving across the signalized zone.",
      insights: [
        "Consistently tracks 4 primary passenger cars simultaneously.",
        "Tracks vehicle path vectors in high coordinate precision.",
        "No major speed deviations detected."
      ],
      objects: [
        {
          entity: "sedan",
          confidence: 0.95,
          trackId: 101,
          boxes: [
            { timestamp: 1.0, box: { xMin: 15, yMin: 10, xMax: 30, yMax: 28 } },
            { timestamp: 3.0, box: { xMin: 20, yMin: 25, xMax: 36, yMax: 44 } },
            { timestamp: 5.0, box: { xMin: 28, yMin: 45, xMax: 46, yMax: 65 } },
            { timestamp: 7.0, box: { xMin: 35, yMin: 60, xMax: 55, yMax: 82 } },
            { timestamp: 9.0, box: { xMin: 40, yMin: 75, xMax: 62, yMax: 95 } }
          ]
        },
        {
          entity: "suv",
          confidence: 0.91,
          trackId: 102,
          boxes: [
            { timestamp: 2.0, box: { xMin: 50, yMin: 40, xMax: 68, yMax: 58 } },
            { timestamp: 4.0, box: { xMin: 44, yMin: 48, xMax: 60, yMax: 68 } },
            { timestamp: 6.0, box: { xMin: 36, yMin: 56, xMax: 52, yMax: 76 } },
            { timestamp: 8.0, box: { xMin: 28, yMin: 65, xMax: 44, yMax: 85 } }
          ]
        },
        {
          entity: "delivery van",
          confidence: 0.88,
          trackId: 103,
          boxes: [
            { timestamp: 3.0, box: { xMin: 70, yMin: 5, xMax: 88, yMax: 22 } },
            { timestamp: 5.0, box: { xMin: 65, yMin: 18, xMax: 82, yMax: 36 } },
            { timestamp: 7.0, box: { xMin: 58, yMin: 34, xMax: 75, yMax: 52 } }
          ]
        }
      ]
    },
    person_detection: {
      summary: "Pedestrian detection tracking along the marked crosswalk and outer pavements.",
      insights: [
        "Identified two pedestrians crossing street.",
        "Attire classifier detected high contrast outer garments.",
        "Coordinates mapped to standard sidewalk limits."
      ],
      people: [
        {
          personId: 1,
          clothing: ["dark jacket", "denim trousers"],
          boxes: [
            { timestamp: 2.0, box: { xMin: 12, yMin: 68, xMax: 18, yMax: 84 } },
            { timestamp: 4.0, box: { xMin: 18, yMin: 64, xMax: 24, yMax: 80 } },
            { timestamp: 6.0, box: { xMin: 25, yMin: 60, xMax: 31, yMax: 76 } },
            { timestamp: 8.0, box: { xMin: 32, yMin: 56, xMax: 38, yMax: 72 } }
          ]
        },
        {
          personId: 2,
          clothing: ["light t-shirt", "shorts"],
          boxes: [
            { timestamp: 3.0, box: { xMin: 80, yMin: 45, xMax: 85, yMax: 62 } },
            { timestamp: 5.0, box: { xMin: 74, yMin: 49, xMax: 79, yMax: 66 } },
            { timestamp: 7.0, box: { xMin: 68, yMin: 53, xMax: 73, yMax: 70 } }
          ]
        }
      ]
    }
  },
  "https://assets.mixkit.co/videos/preview/mixkit-woman-talking-to-camera-at-office-42318-large.mp4": {
    face_detection: {
      summary: "Continuous tracking of a female subject exhibiting confident, warm, and professional expressions inside an office workspace.",
      insights: [
        "High facial feature tracking confidence throughout.",
        "Emotions are predominantly Joy (approachable smirk) with extremely high confidence.",
        "Excellent eye contact relative to the camera vector."
      ],
      faces: [
        {
          faceId: 1,
          boundingBoxes: [
            {
              timestamp: 1.0,
              box: { xMin: 38, yMin: 22, xMax: 62, yMax: 58 },
              emotions: { joy: 0.85, sorrow: 0.01, surprise: 0.10, anger: 0.01 }
            },
            {
              timestamp: 3.0,
              box: { xMin: 37, yMin: 20, xMax: 63, yMax: 56 },
              emotions: { joy: 0.92, sorrow: 0.01, surprise: 0.05, anger: 0.01 }
            },
            {
              timestamp: 6.0,
              box: { xMin: 39, yMin: 21, xMax: 61, yMax: 57 },
              emotions: { joy: 0.78, sorrow: 0.02, surprise: 0.02, anger: 0.01 }
            },
            {
              timestamp: 9.0,
              box: { xMin: 38, yMin: 23, xMax: 62, yMax: 59 },
              emotions: { joy: 0.88, sorrow: 0.01, surprise: 0.04, anger: 0.01 }
            },
            {
              timestamp: 12.0,
              box: { xMin: 40, yMin: 22, xMax: 60, yMax: 58 },
              emotions: { joy: 0.94, sorrow: 0.01, surprise: 0.02, anger: 0.01 }
            }
          ]
        }
      ]
    },
    speech_transcription: {
      summary: "Dialogue transcription of the technology presenter greeting the camera.",
      insights: [
        "Extremely high vocal intelligibility index.",
        "Perfect cadence and spacing matching professional presentations.",
        "No overlapping vocal streams detected."
      ],
      speech: [
        {
          startTime: 0.5,
          endTime: 4.5,
          text: "Hello and welcome to today's showcase of modern web engineering features.",
          confidence: 0.98
        },
        {
          startTime: 5.0,
          endTime: 9.2,
          text: "We are actively compiling, tracking, and displaying visual analytics in single-view dashboard matrices.",
          confidence: 0.96
        },
        {
          startTime: 10.0,
          endTime: 13.5,
          text: "Let us test dynamic filters on the fly and explore how Cloud Intelligence transforms video streams.",
          confidence: 0.95
        }
      ]
    },
    text_detection: {
      summary: "Detected clean lower-third graphical overlays and workspace text markers.",
      insights: [
        "Visual lower-thirds matches professional template layouts.",
        "Optical characters extracted without resolution distortion.",
        "Signage is steady and readable."
      ],
      textDetections: [
        {
          text: "PROJECT MANAGER Showcase",
          confidence: 0.97,
          boxes: [
            { timestamp: 2.0, box: { xMin: 10, yMin: 78, xMax: 35, yMax: 84 } },
            { timestamp: 5.0, box: { xMin: 10, yMin: 78, xMax: 35, yMax: 84 } }
          ]
        },
        {
          text: "STUDIO LABS",
          confidence: 0.93,
          boxes: [
            { timestamp: 7.0, box: { xMin: 80, yMin: 8, xMax: 95, yMax: 14 } },
            { timestamp: 10.0, box: { xMin: 80, yMin: 8, xMax: 95, yMax: 14 } }
          ]
        }
      ]
    }
  },
  "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-his-laptop-42171-large.mp4": {
    logo_recognition: {
      summary: "Recognized branded emblems and device insignias in the creative workspace.",
      insights: [
        "Detected primary laptop manufacturer brand marks.",
        "Tracking stable even when obscured by hand movements.",
        "No brand false-positives registered."
      ],
      logos: [
        {
          description: "ThinkPad / Lenovo",
          confidence: 0.92,
          boxes: [
            { timestamp: 2.0, box: { xMin: 45, yMin: 32, xMax: 54, yMax: 40 } },
            { timestamp: 5.0, box: { xMin: 46, yMin: 30, xMax: 55, yMax: 38 } },
            { timestamp: 8.0, box: { xMin: 45, yMin: 33, xMax: 54, yMax: 41 } }
          ]
        }
      ]
    }
  },
  "https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-corridor-40348-large.mp4": {
    explicit_content: {
      summary: "Content moderation safety sweep across the empty industrial surveillance corridor.",
      insights: [
        "Zero indications of explicit visual content or violence found.",
        "Low light/contrast levels did not produce false-positives.",
        "Safe for all enterprise and public audience playback."
      ],
      explicitContent: {
        adult: "VERY_UNLIKELY",
        medical: "VERY_UNLIKELY",
        violence: "VERY_UNLIKELY",
        racy: "VERY_UNLIKELY",
        spoof: "UNLIKELY",
        summary: "The video sequence is fully cleared of any explicit, sensitive, violent, or medical content. Likelihood indices across all categories remain at or below VERY_UNLIKELY."
      }
    }
  }
};

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark-hc">(() => {
    const saved = localStorage.getItem("app-theme");
    if (saved === "light" || saved === "dark-hc") return saved;
    return "dark-hc"; // Default is high-contrast dark
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark-hc" : "light";
      localStorage.setItem("app-theme", next);
      return next;
    });
  };

  const [selectedVideo, setSelectedVideo] = useState(CURATED_VIDEOS[0]);
  const [selectedFeature, setSelectedFeature] = useState<VideoFeature>("label_detection");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // History State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>(() => {
    const saved = localStorage.getItem("analysis-history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    return [];
  });

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem("analysis-history", JSON.stringify(next));
      return next;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("analysis-history");
  };

  const handleSelectHistoryItem = (item: AnalysisHistoryItem) => {
    const curated = CURATED_VIDEOS.find((v) => v.url === item.videoUrl);
    if (curated) {
      setSelectedVideo(curated);
    } else {
      setSelectedVideo({
        id: "custom-" + item.timestamp,
        title: item.videoTitle,
        category: "Uploaded Video",
        url: item.videoUrl,
        duration: item.duration,
        recommendedFeatures: ["label_detection", "object_tracking"],
        description: "Loaded from custom analysis history."
      });
    }

    setSelectedFeature(item.feature);
    setCustomPrompt(item.customPrompt || "");

    setAnalysisCaches((prev) => ({
      ...prev,
      [item.videoUrl]: {
        ...(prev[item.videoUrl] || {}),
        [item.feature]: item.result,
      },
    }));
  };

  // Maintain active analysis state caches
  const [analysisCaches, setAnalysisCaches] = useState<Record<string, Record<VideoFeature, VideoAnalysisResult>>>({});

  // Get active analysis: check dynamic cache first, then stock pre-cache
  const getActiveAnalysis = (): VideoAnalysisResult | null => {
    const videoUrl = selectedVideo.url;

    // Check dynamic state cache
    if (analysisCaches[videoUrl]?.[selectedFeature]) {
      return analysisCaches[videoUrl][selectedFeature];
    }

    // Check pre-cached stock indices
    if (PRE_CACHED_ANALYSES[videoUrl]?.[selectedFeature]) {
      return PRE_CACHED_ANALYSES[videoUrl][selectedFeature] as VideoAnalysisResult;
    }

    return null;
  };

  const handleVideoSelect = (url: string, title: string, duration: number) => {
    // Find if it's one of our curated videos
    const curated = CURATED_VIDEOS.find((v) => v.url === url);
    if (curated) {
      setSelectedVideo(curated);
      // Auto-toggle to the first recommended feature if current feature isn't recommended
      if (!curated.recommendedFeatures.includes(selectedFeature) && curated.recommendedFeatures.length > 0) {
        setSelectedFeature(curated.recommendedFeatures[0]);
      }
    } else {
      // Custom uploaded video
      setSelectedVideo({
        id: "custom",
        title,
        category: "Uploaded Video",
        url,
        duration,
        recommendedFeatures: ["label_detection", "object_tracking"],
        description: "User uploaded local video source file."
      });
    }
  };

  // Perform full visual extraction & analyzer request
  const handleAnalyze = async (keyframes: KeyframeData[]) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feature: selectedFeature,
          keyframes,
          videoDuration: selectedVideo.duration,
          customPrompt: customPrompt || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const result: VideoAnalysisResult = await response.json();

      // Update state cache dictionary
      setAnalysisCaches((prev) => {
        const videoUrl = selectedVideo.url;
        const videoCache = prev[videoUrl] || {};
        return {
          ...prev,
          [videoUrl]: {
            ...videoCache,
            [selectedFeature]: result,
          },
        };
      });

      // Save custom analysis to local storage history automatically
      const newHistoryItem: AnalysisHistoryItem = {
        id: "hist-" + Date.now(),
        videoUrl: selectedVideo.url,
        videoTitle: selectedVideo.title,
        duration: selectedVideo.duration,
        feature: selectedFeature,
        customPrompt: customPrompt || undefined,
        timestamp: Date.now(),
        result,
      };

      setHistory((prev) => {
        const updated = [newHistoryItem, ...prev];
        localStorage.setItem("analysis-history", JSON.stringify(updated));
        return updated;
      });

    } catch (err: any) {
      console.error(err);
      alert(`Analysis Failed: ${err.message || "An unexpected error occurred."}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeAnalysis = getActiveAnalysis();

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${
      theme === "light" ? "bg-zinc-50 text-zinc-900" : "bg-black text-zinc-100"
    }`}>
      {/* Visual Header Banner */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors duration-200 ${
        theme === "light" ? "border-zinc-200 bg-white/90" : "border-zinc-900 bg-black/80"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-950/40">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className={`font-display font-bold text-base md:text-lg tracking-tight flex items-center gap-1.5 ${
                theme === "light" ? "text-zinc-900" : "text-zinc-100"
              }`}>
                Video Intelligence Explorer
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                  API Playground
                </span>
              </h1>
              <p className={`text-[10px] font-mono ${
                theme === "light" ? "text-zinc-650" : "text-zinc-500"
              }`}>
                Powered by Gemini 3.5 & Google Cloud Vision SDK
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* History Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`relative p-2 rounded-xl border transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                theme === "light"
                  ? "bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-900 focus:ring-2 focus:ring-zinc-600"
                  : "bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white focus:ring-2 focus:ring-white"
              }`}
              aria-label="Open Analysis History"
              title="Open Analysis History"
            >
              <History className="h-5 w-5 text-indigo-500" />
              {history.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] font-bold font-mono h-5 w-5 rounded-full flex items-center justify-center animate-pulse border border-white dark:border-black">
                  {history.length}
                </span>
              )}
            </button>

            {/* Accessibility Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                theme === "light"
                  ? "bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-900 focus:ring-2 focus:ring-zinc-600"
                  : "bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white focus:ring-2 focus:ring-white"
              }`}
              aria-label={`Switch to ${theme === "light" ? "High-Contrast Dark" : "Light"} mode`}
              title={`Switch to ${theme === "light" ? "High-Contrast Dark" : "Light"} mode`}
            >
              {theme === "light" ? <Moon className="h-5 w-5 text-zinc-800" /> : <Sun className="h-5 w-5 text-amber-400" />}
            </button>

            <span className={`text-xs font-mono px-2 py-1 rounded-full border hidden sm:flex items-center gap-1 ${
              theme === "light" ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}>
              <ShieldCheck className="h-3.5 w-3.5" /> Engine Live
            </span>
            <a
              href="https://cloud.google.com/video-intelligence"
              target="_blank"
              referrerPolicy="no-referrer"
              className={`text-xs font-medium transition-colors hidden md:flex items-center gap-1 ${
                theme === "light" ? "text-zinc-600 hover:text-indigo-650" : "text-zinc-400 hover:text-indigo-400"
              }`}
            >
              Google Cloud API <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Info Explainer block */}
        <div className={`p-4 border rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm transition-colors duration-200 ${
          theme === "light"
            ? "bg-white border-zinc-200 text-zinc-900 shadow-zinc-100"
            : "bg-zinc-950 border-zinc-900 text-zinc-100 shadow-zinc-950/50"
        }`}>
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2.5 rounded-xl text-indigo-500 flex-shrink-0 border transition-colors ${
              theme === "light" ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900 border-zinc-800"
            }`}>
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-display font-semibold text-sm ${theme === "light" ? "text-zinc-900" : "text-zinc-200"}`}>
                Interactive Video Intelligence Demonstration
              </h3>
              <p className={`text-xs mt-0.5 leading-relaxed ${theme === "light" ? "text-zinc-650" : "text-zinc-400"}`}>
                Interact with predefined tracks immediately. To run fully custom analysis on any selected feature, click <strong className="text-indigo-600 font-semibold">Analyze Video Feature</strong> below. The backend extractors will slice keyframe buffers and evaluate deep spatial attributes.
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded-xl border ${
            theme === "light" ? "text-zinc-650 bg-zinc-100 border-zinc-200" : "text-zinc-500 bg-zinc-900/60 border-zinc-800"
          }`}>
            <Zap className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            Instant Visual Overlays
          </div>
        </div>

        {/* Top/Primary Workspace Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Player and Results (Take up 8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Embedded player and prompt line */}
            <div className={`border rounded-2xl p-4 md:p-5 space-y-4 shadow-sm transition-colors duration-200 ${
              theme === "light" ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-900 shadow-zinc-950/50"
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className={`text-[10px] uppercase font-mono tracking-wider font-semibold block ${
                    theme === "light" ? "text-zinc-550" : "text-zinc-550"
                  }`}>
                    Active stream
                  </span>
                  <h2 className={`font-display font-bold text-base md:text-lg flex items-center gap-2 ${
                    theme === "light" ? "text-zinc-900" : "text-zinc-100"
                  }`}>
                    <Video className="h-4.5 w-4.5 text-indigo-500" />
                    {selectedVideo.title}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold block">
                    Feature view
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    {selectedFeature.replace("_", " ")}
                  </span>
                </div>
              </div>

              <VideoOverlayPlayer
                videoUrl={selectedVideo.url}
                videoTitle={selectedVideo.title}
                duration={selectedVideo.duration}
                selectedFeature={selectedFeature}
                analysisResult={activeAnalysis}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
                theme={theme}
              />
            </div>

            {/* Analysis details displays */}
            {activeAnalysis?.summary && (
              <VideoExecutiveSummary summary={activeAnalysis.summary} theme={theme} />
            )}
            <AnalysisResultsDisplay
              selectedFeature={selectedFeature}
              result={activeAnalysis}
              theme={theme}
              onSaveToHistory={
                activeAnalysis
                  ? () => {
                      const exists = history.some(
                        (h) => h.videoUrl === selectedVideo.url && h.feature === selectedFeature
                      );
                      if (exists) {
                        alert("This analysis is already saved in your history.");
                        return;
                      }
                      const newItem: AnalysisHistoryItem = {
                        id: "hist-" + Date.now(),
                        videoUrl: selectedVideo.url,
                        videoTitle: selectedVideo.title,
                        duration: selectedVideo.duration,
                        feature: selectedFeature,
                        customPrompt: customPrompt || undefined,
                        timestamp: Date.now(),
                        result: activeAnalysis,
                      };
                      setHistory((prev) => {
                        const updated = [newItem, ...prev];
                        localStorage.setItem("analysis-history", JSON.stringify(updated));
                        return updated;
                      });
                      alert("Analysis saved successfully to your history!");
                    }
                  : undefined
              }
            />
          </div>

          {/* Right Column: Source and Feature select parameters (Take up 4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Select Stock / Drag-Drop custom clips */}
            <CuratedVideos onVideoSelect={handleVideoSelect} selectedUrl={selectedVideo.url} theme={theme} />

            {/* Google Drive Video Browser */}
            <GoogleDriveBrowser onVideoSelect={handleVideoSelect} activeUrl={selectedVideo.url} theme={theme} />

            {/* Google Meet Panel */}
            <GoogleMeetPanel theme={theme} activeVideoTitle={selectedVideo.title} />

            {/* Google Chat Panel */}
            <GoogleChatPanel
              theme={theme}
              activeVideoTitle={selectedVideo.title}
              selectedFeature={selectedFeature}
              activeAnalysis={activeAnalysis}
            />

            {/* Google Docs Exporter */}
            <GoogleDocsExporter
              theme={theme}
              activeVideoTitle={selectedVideo.title}
              activeAnalysis={activeAnalysis}
            />

            {/* Google Sheets Exporter */}
            <GoogleSheetsExporter
              theme={theme}
              activeVideoTitle={selectedVideo.title}
              activeAnalysis={activeAnalysis}
            />

            {/* Google Tasks Integrator */}
            <GoogleTasksIntegrator
              theme={theme}
              activeVideoTitle={selectedVideo.title}
              activeAnalysis={activeAnalysis}
            />
          </div>
        </div>

        {/* Bottom Feature Panel: Unified Single View Grid to choose features */}
        <FeatureSelector selectedFeature={selectedFeature} onFeatureSelect={setSelectedFeature} theme={theme} />
      </main>

      {/* Humble Footer */}
      <footer className={`border-t transition-colors duration-200 mt-12 py-8 ${
        theme === "light" ? "border-zinc-200 bg-white text-zinc-600" : "border-zinc-900 bg-black text-zinc-500"
      }`}>
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1.5">
          <p className="text-xs font-mono">
            © 2026 Google Cloud Video Intelligence API AI Explorer. Built with full TypeScript support.
          </p>
          <div className={`flex justify-center space-x-4 text-[10px] font-mono ${
            theme === "light" ? "text-zinc-550" : "text-zinc-600"
          }`}>
            <span>Enterprise Grade Sandbox</span>
            <span>•</span>
            <span>Gemini LLM Extraction</span>
            <span>•</span>
            <span>Real-time Bounding Interpolation</span>
          </div>
        </div>
      </footer>

      {/* Analysis History Side panel */}
      <AnalysisHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
        theme={theme}
      />
    </div>
  );
}
