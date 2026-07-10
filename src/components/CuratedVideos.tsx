import React, { useRef, useState } from "react";
import { CuratedVideo, VideoFeature } from "../types";
import { Upload, Video, Clock, Check, Sparkles } from "lucide-react";

interface CuratedVideosProps {
  onVideoSelect: (url: string, title: string, duration: number) => void;
  selectedUrl: string;
}

export const CURATED_VIDEOS: CuratedVideo[] = [
  {
    id: "street-traffic",
    title: "City Traffic & Pedestrian Crossing",
    category: "Street Scene",
    url: "https://assets.mixkit.co/videos/preview/mixkit-traffic-in-a-large-city-street-from-above-41712-large.mp4",
    duration: 10,
    recommendedFeatures: ["label_detection", "object_tracking", "person_detection"],
    description: "Aerial view of cars navigating a busy metropolitan junction, tracking vehicles and pedestrians."
  },
  {
    id: "talking-presenter",
    title: "Technology Presenter Vlog",
    category: "Interview / Vlog",
    url: "https://assets.mixkit.co/videos/preview/mixkit-woman-talking-to-camera-at-office-42318-large.mp4",
    duration: 14,
    recommendedFeatures: ["face_detection", "speech_transcription", "text_detection"],
    description: "A woman talking directly to the camera in a modern office setup with on-screen titles and expressive speech."
  },
  {
    id: "business-setup",
    title: "Brand Signage & Office Work",
    category: "Corporate",
    url: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-his-laptop-42171-large.mp4",
    duration: 12,
    recommendedFeatures: ["logo_recognition", "text_detection", "label_detection"],
    description: "Close-up of a designer typing on a modern laptop with coffee cups, brand symbols, and workspace labels."
  },
  {
    id: "security-corridor",
    title: "Security Corridor Camera",
    category: "Surveillance",
    url: "https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-corridor-40348-large.mp4",
    duration: 10,
    recommendedFeatures: ["explicit_content", "person_detection", "shot_change"],
    description: "CCTV perspective tracking an empty office hallway with sudden lighting shifts and movement surveillance."
  }
];

export const CuratedVideos: React.FC<CuratedVideosProps> = ({
  onVideoSelect,
  selectedUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [customVideoName, setCustomVideoName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadVideoFile(file);
    }
  };

  const loadVideoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setCustomVideoName(file.name);

    // Create temporary video element to read duration
    const tempVideo = document.createElement("video");
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      onVideoSelect(url, file.name, tempVideo.duration || 10);
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      loadVideoFile(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Video className="h-5 w-5 text-indigo-400" />
          Select Video Source
        </h3>
        {customVideoName && (
          <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono max-w-[150px] truncate">
            Custom: {customVideoName}
          </span>
        )}
      </div>

      {/* Drag & Drop File Upload */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all ${
          isDragging
            ? "border-indigo-400 bg-indigo-950/20"
            : "border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-slate-800/80 rounded-lg text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-950/40 transition-colors">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              Drag & drop your own MP4 video or <span className="text-indigo-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports any common web-supported video format (.mp4, .webm)
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-800/80"></div>
        <span className="flex-shrink mx-4 text-xs font-mono text-slate-600 uppercase tracking-wider">Or Use Curated Stock Clips</span>
        <div className="flex-grow border-t border-slate-800/80"></div>
      </div>

      {/* Curated Library Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CURATED_VIDEOS.map((video) => {
          const isSelected = selectedUrl === video.url;
          return (
            <div
              key={video.id}
              onClick={() => {
                setCustomVideoName(null);
                onVideoSelect(video.url, video.title, video.duration);
              }}
              className={`group flex flex-col justify-between p-4 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? "border-indigo-500 bg-indigo-950/10 shadow-lg shadow-indigo-950/20"
                  : "border-slate-800/80 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500">
                    {video.category}
                  </span>
                  <div className="flex items-center text-xs font-mono text-slate-400 gap-1 bg-slate-800/50 px-1.5 py-0.5 rounded">
                    <Clock className="h-3 w-3" />
                    {video.duration}s
                  </div>
                </div>
                <h4 className="font-display font-medium text-sm text-slate-200 mt-1 group-hover:text-indigo-300 transition-colors">
                  {video.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                  {video.description}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/50 flex flex-wrap gap-1 items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {video.recommendedFeatures.slice(0, 2).map((feat) => (
                    <span
                      key={feat}
                      className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded"
                    >
                      {feat.replace("_", " ")}
                    </span>
                  ))}
                </div>
                {isSelected && (
                  <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 stroke-[3]" /> Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
