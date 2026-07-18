import React, { useRef, useState, useEffect } from "react";
import { VideoFeature, VideoAnalysisResult, BoundingBox } from "../types";
import {
  Play,
  Pause,
  Maximize2,
  Minimize2,
  RefreshCw,
  Cpu,
  Tv,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Flame,
} from "lucide-react";

interface VideoOverlayPlayerProps {
  videoUrl: string;
  videoTitle: string;
  duration: number;
  selectedFeature: VideoFeature;
  analysisResult: VideoAnalysisResult | null;
  onAnalyze: (keyframes: { base64: string; timestamp: number }[]) => Promise<void>;
  isAnalyzing: boolean;
  customPrompt: string;
  setCustomPrompt: (val: string) => void;
  theme?: "light" | "dark-hc";
}

export const VideoOverlayPlayer: React.FC<VideoOverlayPlayerProps> = ({
  videoUrl,
  videoTitle,
  duration,
  selectedFeature,
  analysisResult,
  onAnalyze,
  isAnalyzing,
  customPrompt,
  setCustomPrompt,
  theme = "dark-hc",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localDuration, setLocalDuration] = useState(duration);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<"cumulative" | "live">("cumulative");
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing the movement density / activity heatmap on canvas
  useEffect(() => {
    if (!showHeatmap || selectedFeature !== "object_tracking" || !analysisResult?.objects) return;

    const canvas = heatmapCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Adjust canvas size dynamically to match displayed size
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    }

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Set composition operation for blending overlapping hot spots
    ctx.globalCompositeOperation = "lighter";

    // Build lists of points to draw
    const points: { x: number; y: number; intensity: number; radius: number }[] = [];

    analysisResult.objects.forEach((obj) => {
      const boxes = [...obj.boxes].sort((a, b) => a.timestamp - b.timestamp);

      for (let i = 0; i < boxes.length; i++) {
        const curr = boxes[i];
        const cx = (curr.box.xMin + curr.box.xMax) / 2;
        const cy = (curr.box.yMin + curr.box.yMax) / 2;

        let intensity = 0.15;
        let radius = Math.max(15, ((curr.box.xMax - curr.box.xMin) + (curr.box.yMax - curr.box.yMin)) * 0.4);

        if (heatmapMode === "live") {
          // Live mode: only show recent trails (within 3 seconds behind current playhead)
          const timeDiff = currentTime - curr.timestamp;
          if (timeDiff < 0 || timeDiff > 3) continue;

          // Recency-based fade (newest is brightest)
          const recency = 1 - timeDiff / 3;
          intensity = 0.4 * recency;
          radius = radius * (0.5 + 0.5 * recency);
        } else {
          // Cumulative mode: aggregate everything across the whole timeline
          intensity = 0.08;
        }

        // Calculate velocity/activity between successive frames to highlight movement density
        if (i > 0) {
          const prev = boxes[i - 1];
          const px = (prev.box.xMin + prev.box.xMax) / 2;
          const py = (prev.box.yMin + prev.box.yMax) / 2;

          const dx = cx - px;
          const dy = cy - py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Interpolated trail points to represent continuity of motion
          if (dist > 2) {
            const steps = Math.min(8, Math.floor(dist / 2));
            for (let s = 1; s < steps; s++) {
              const ratio = s / steps;
              const ix = px + dx * ratio;
              const iy = py + dy * ratio;

              let iIntensity = intensity;
              if (heatmapMode === "live") {
                const iTime = prev.timestamp + (curr.timestamp - prev.timestamp) * ratio;
                const iTimeDiff = currentTime - iTime;
                if (iTimeDiff >= 0 && iTimeDiff <= 3) {
                  iIntensity = 0.35 * (1 - iTimeDiff / 3);
                } else {
                  continue;
                }
              } else {
                iIntensity = intensity * (1.0 + Math.min(2.0, dist / 10));
              }

              points.push({
                x: ix,
                y: iy,
                intensity: iIntensity,
                radius: radius * 0.8,
              });
            }
          }
        }

        points.push({ x: cx, y: cy, intensity, radius });
      }
    });

    // Draw the hot spots using gorgeous gradients
    points.forEach((pt) => {
      const px = (pt.x / 100) * width;
      const py = (pt.y / 100) * height;
      const rad = (pt.radius / 100) * Math.min(width, height);

      if (rad <= 0) return;

      const grad = ctx.createRadialGradient(px, py, rad * 0.05, px, py, rad);
      const isLightMode = theme === "light";
      if (isLightMode) {
        grad.addColorStop(0, `rgba(220, 38, 38, ${pt.intensity * 1.5})`);
        grad.addColorStop(0.3, `rgba(249, 115, 22, ${pt.intensity * 1.1})`);
        grad.addColorStop(0.6, `rgba(234, 179, 8, ${pt.intensity * 0.6})`);
        grad.addColorStop(1, "rgba(234, 179, 8, 0)");
      } else {
        grad.addColorStop(0, `rgba(239, 68, 68, ${pt.intensity * 1.3})`);
        grad.addColorStop(0.25, `rgba(249, 115, 22, ${pt.intensity * 0.9})`);
        grad.addColorStop(0.55, `rgba(253, 224, 71, ${pt.intensity * 0.5})`);
        grad.addColorStop(1, "rgba(253, 224, 71, 0)");
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [showHeatmap, currentTime, analysisResult, selectedFeature, heatmapMode, theme]);

  useEffect(() => {
    setLocalDuration(duration);
  }, [duration, videoUrl]);

  // Synchronize playing state with HTMLVideoElement events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
        setLocalDuration(video.duration);
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    if (video.readyState >= 1 && video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
      setLocalDuration(video.duration);
    }

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [videoUrl]);

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => {
          console.error("Play error:", err);
        });
      }
    }
  };

  // Skip to specific time
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickPercent = clickX / width;
    const targetTime = clickPercent * localDuration;

    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  // Toggle Fullscreen on player container
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error("Fullscreen error", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  // Capture Keyframes & Trigger Analysis
  const captureAndAnalyze = async () => {
    setError(null);
    const video = videoRef.current;
    if (!video) {
      setError("Video player not loaded.");
      return;
    }

    try {
      // Temporarily pause the video for capture
      video.pause();

      const capturedKeyframes: { base64: string; timestamp: number }[] = [];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Unable to create canvas context.");
      }

      // Determine number of frames to capture (usually 6-8 frames are enough for full description and quick speed)
      const numberOfFrames = 6;
      const step = localDuration / (numberOfFrames + 1);

      // Create a function to capture each frame sequentially
      for (let i = 1; i <= numberOfFrames; i++) {
        const timestamp = step * i;
        video.currentTime = timestamp;

        // Wait for video frame to seek and update
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);
            resolve();
          };
          video.addEventListener("seeked", onSeeked);
        });

        // Match canvas dimensions to video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        // Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to JPG Base64
        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        capturedKeyframes.push({ base64, timestamp });
      }

      // Restore video to start
      video.currentTime = 0;
      setCurrentTime(0);

      // Call analysis callback
      await onAnalyze(capturedKeyframes);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to extract keyframes from video source.");
    }
  };

  // Helper function to find active bounding boxes for the current video timestamp
  const getActiveBoxes = () => {
    if (!analysisResult) return [];

    const activeBoxes: {
      type: "face" | "object" | "person" | "logo" | "text";
      label: string;
      box: BoundingBox;
      extraInfo?: string;
    }[] = [];

    const tolerance = 1.8; // Match within +/- 1.8s for smooth frame interpolation display

    // Face detection matching
    if (selectedFeature === "face_detection" && analysisResult.faces) {
      analysisResult.faces.forEach((face) => {
        // Find box closest to current time
        const matchingBox = face.boundingBoxes.find(
          (b) => Math.abs(b.timestamp - currentTime) <= tolerance
        );
        if (matchingBox) {
          let emotionLabel = "Neutral";
          if (matchingBox.emotions) {
            const emos = matchingBox.emotions;
            const maxVal = Math.max(emos.joy, emos.sorrow, emos.surprise, emos.anger);
            if (maxVal > 0.3) {
              if (maxVal === emos.joy) emotionLabel = `Joy: ${Math.round(emos.joy * 100)}%`;
              else if (maxVal === emos.sorrow) emotionLabel = `Sorrow: ${Math.round(emos.sorrow * 100)}%`;
              else if (maxVal === emos.surprise) emotionLabel = `Surprise: ${Math.round(emos.surprise * 100)}%`;
              else if (maxVal === emos.anger) emotionLabel = `Anger: ${Math.round(emos.anger * 100)}%`;
            }
          }
          activeBoxes.push({
            type: "face",
            label: `Face #${face.faceId} (${emotionLabel})`,
            box: matchingBox.box,
          });
        }
      });
    }

    // Logo detection matching
    if (selectedFeature === "logo_recognition" && analysisResult.logos) {
      analysisResult.logos.forEach((logo) => {
        const matchingBox = logo.boxes.find(
          (b) => Math.abs(b.timestamp - currentTime) <= tolerance
        );
        if (matchingBox) {
          activeBoxes.push({
            type: "logo",
            label: `${logo.description} (${Math.round(logo.confidence * 100)}%)`,
            box: matchingBox.box,
          });
        }
      });
    }

    // Object tracking matching
    if (selectedFeature === "object_tracking" && analysisResult.objects) {
      analysisResult.objects.forEach((obj) => {
        const matchingBox = obj.boxes.find(
          (b) => Math.abs(b.timestamp - currentTime) <= tolerance
        );
        if (matchingBox) {
          activeBoxes.push({
            type: "object",
            label: `${obj.entity} #${obj.trackId}`,
            box: matchingBox.box,
          });
        }
      });
    }

    // Person detection matching
    if (selectedFeature === "person_detection" && analysisResult.people) {
      analysisResult.people.forEach((p) => {
        const matchingBox = p.boxes.find(
          (b) => Math.abs(b.timestamp - currentTime) <= tolerance
        );
        if (matchingBox) {
          activeBoxes.push({
            type: "person",
            label: `Person #${p.personId} (${p.clothing ? p.clothing.join(", ") : "Attire"})`,
            box: matchingBox.box,
          });
        }
      });
    }

    // Text detection (OCR) matching
    if (selectedFeature === "text_detection" && analysisResult.textDetections) {
      analysisResult.textDetections.forEach((txt) => {
        const matchingBox = txt.boxes.find(
          (b) => Math.abs(b.timestamp - currentTime) <= tolerance
        );
        if (matchingBox) {
          activeBoxes.push({
            type: "text",
            label: `OCR: "${txt.text}"`,
            box: matchingBox.box,
          });
        }
      });
    }

    return activeBoxes;
  };

  const activeBoxes = getActiveBoxes();

  // Find matching active speech script to display as on-screen caption
  const activeSpeech = analysisResult?.speech?.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  return (
    <div className="space-y-4">
      {/* Container holding video player and dynamic layers */}
      <div
        ref={containerRef}
        className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-2xl group flex flex-col justify-center select-none"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          crossOrigin="anonymous"
          className="w-full h-full object-contain"
          playsInline
        />

        {/* Heat-map Canvas Overlay */}
        {showHeatmap && selectedFeature === "object_tracking" && analysisResult && (
          <canvas
            ref={heatmapCanvasRef}
            className="absolute inset-0 pointer-events-none w-full h-full mix-blend-screen opacity-85"
          />
        )}

        {/* Bounding Box Visual Overlay Layer */}
        {analysisResult && (
          <div className="absolute inset-0 pointer-events-none">
            {activeBoxes.map((item, idx) => {
              const borderColors = {
                face: "border-emerald-400 text-emerald-300 bg-emerald-950/70",
                logo: "border-sky-400 text-sky-300 bg-sky-950/70",
                object: "border-amber-400 text-amber-300 bg-amber-950/70",
                person: "border-indigo-400 text-indigo-300 bg-indigo-950/70",
                text: "border-rose-400 text-rose-300 bg-rose-950/70",
              };

              const style = {
                left: `${item.box.xMin}%`,
                top: `${item.box.yMin}%`,
                width: `${item.box.xMax - item.box.xMin}%`,
                height: `${item.box.yMax - item.box.yMin}%`,
              };

              return (
                <div
                  key={idx}
                  style={style}
                  className={`absolute glowing-box border-2 rounded-md ${
                    borderColors[item.type]
                  } flex flex-col justify-start`}
                >
                  <span className="absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-mono rounded font-semibold whitespace-nowrap shadow-sm">
                    {item.label}
                  </span>
                </div>
              );
            })}

            {/* Subtitle / Speech Caption Overlay */}
            {selectedFeature === "speech_transcription" && activeSpeech && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-800 text-white font-sans text-sm md:text-base px-4 py-2 rounded-xl text-center max-w-[80%] shadow-xl backdrop-blur-sm animate-fade-in">
                <span className="text-[10px] block text-indigo-400 font-mono tracking-wider mb-0.5 uppercase">
                  Speech (Confidence: {Math.round(activeSpeech.confidence * 100)}%)
                </span>
                "{activeSpeech.text}"
              </div>
            )}
          </div>
        )}

        {/* Loading overlay for keyframe analysis */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full animate-pulse">
              <Cpu className="h-10 w-10 text-indigo-400 animate-spin" />
            </div>
            <div className="text-center">
              <h4 className="font-display font-semibold text-lg text-slate-100">
                Analyzing Keyframes...
              </h4>
              <p className="text-xs text-slate-400 max-w-[280px] mx-auto mt-1 leading-relaxed">
                Gemini 3.5 is examining 6 captured temporal indices to extract real-time tracking points.
              </p>
            </div>
          </div>
        )}

        {/* Player Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col space-y-2">
          {/* Timeline Slider */}
          <div
            onClick={handleTimelineClick}
            className="w-full h-1.5 bg-slate-800 hover:h-2.5 rounded-full cursor-pointer transition-all relative overflow-hidden"
          >
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${(currentTime / localDuration) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="hover:text-indigo-400 transition-colors p-1"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
              </button>
              <div className="text-xs font-mono text-slate-300">
                {currentTime.toFixed(1)}s / {localDuration.toFixed(1)}s
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Tv className="h-3 w-3" /> Live Frame
              </span>
              <button
                onClick={toggleFullscreen}
                className="hover:text-indigo-400 transition-colors p-1"
                aria-label="Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Object Tracking Heat-Map Overlay Controls */}
      {selectedFeature === "object_tracking" && analysisResult && (
        <div className={`p-3.5 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors duration-200 ${
          theme === "light"
            ? "bg-zinc-100/80 border-zinc-200 text-zinc-900"
            : "bg-slate-900/40 border-slate-800/80 text-zinc-200"
        }`}>
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
              theme === "light" ? "bg-white border border-zinc-200 text-amber-600" : "bg-slate-950/60 border border-slate-800/60 text-amber-400"
            }`}>
              <Flame className={`h-5 w-5 ${showHeatmap ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <span className={`font-semibold block ${theme === "light" ? "text-zinc-900" : "text-slate-100"}`}>
                Movement Density Heat-Map Overlay
              </span>
              <span className={`text-[10px] block mt-0.5 ${theme === "light" ? "text-zinc-550" : "text-slate-400"}`}>
                Visualize spatial tracking intensity & velocity hotspots on screen
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {showHeatmap && (
              <div className={`flex p-1 rounded-lg border text-[10px] font-mono transition-colors duration-200 ${
                theme === "light" ? "bg-zinc-200 border-zinc-300" : "bg-slate-950/60 border-slate-800/60"
              }`}>
                <button
                  onClick={() => setHeatmapMode("cumulative")}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all font-mono cursor-pointer ${
                    heatmapMode === "cumulative"
                      ? theme === "light"
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-indigo-500 text-white shadow"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                  title="Show cumulative movement density of all tracks across the whole timeline"
                >
                  Cumulative
                </button>
                <button
                  onClick={() => setHeatmapMode("live")}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all font-mono cursor-pointer ${
                    heatmapMode === "live"
                      ? theme === "light"
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-indigo-500 text-white shadow"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                  title="Show dynamic, decaying movement trails (within last 3s of playhead)"
                >
                  Live Trails
                </button>
              </div>
            )}

            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`font-display font-semibold text-xs py-1.5 px-3 rounded-lg transition-all shadow-sm focus:ring-2 min-h-[36px] cursor-pointer ${
                showHeatmap
                  ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white focus:ring-amber-400"
                  : theme === "light"
                    ? "bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border border-zinc-300 focus:ring-zinc-650"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-white"
              }`}
            >
              {showHeatmap ? "Disable Heat-Map" : "Enable Heat-Map"}
            </button>
          </div>
        </div>
      )}

      {/* Error Message Box */}
      {error && (
        <div className="flex gap-2 items-start p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold block">Capture Error</span>
            {error}
          </div>
        </div>
      )}

      {/* Prompt customization and Analyze launcher bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="flex-grow relative">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Add custom context / instructions (e.g. 'Look for coffee mugs' or 'Listen for professional tones')"
            className={`w-full border text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none transition-all font-sans ${
              theme === "light"
                ? "bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                : "bg-slate-900/60 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            }`}
          />
          <Sparkles className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>

        <button
          onClick={captureAndAnalyze}
          disabled={isAnalyzing}
          className={`flex items-center justify-center gap-2 text-white font-display font-semibold text-sm px-5 py-3 rounded-xl disabled:opacity-50 transition-all active:scale-[0.98] min-h-[44px] cursor-pointer ${
            theme === "light"
              ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
              : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700"
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
          Analyze Video Feature
        </button>
      </div>
    </div>
  );
};
