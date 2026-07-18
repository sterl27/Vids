import React from "react";
import { FeatureMeta, VideoFeature } from "../types";
import {
  Tag,
  Smile,
  ShieldAlert,
  Award,
  Box,
  UserCheck,
  Film,
  Languages,
  Type,
  BookOpen,
  ExternalLink,
} from "lucide-react";

const FEATURES_META: FeatureMeta[] = [
  {
    id: "label_detection",
    name: "Label Detection",
    shortDesc: "Identify broad categories & entities",
    longDesc: "Detect entities such as dogs, flowers, cars, or activities inside the video, complete with segment timings and hierarchical labels.",
    icon: "Tag",
    docsUrl: "https://docs.cloud.google.com/video-intelligence/docs/feature-label-detection",
  },
  {
    id: "face_detection",
    name: "Face Detection",
    shortDesc: "Detect faces & emotional states",
    longDesc: "Identify human faces, track coordinates over time, and evaluate detailed facial expressions (joy, sorrow, surprise, anger).",
    icon: "Smile",
    docsUrl: "https://docs.cloud.google.com/video-intelligence/docs/feature-face-detection",
  },
  {
    id: "explicit_content",
    name: "Explicit Content Detection",
    shortDesc: "Moderate adult & medical content",
    longDesc: "Evaluate the likelihood of adult, medical, violent, or racy content within frames to automate content moderation workflows.",
    icon: "ShieldAlert",
    docsUrl: "https://docs.cloud.google.com/video-intelligence/docs/feature-explicit-content",
  },
  {
    id: "logo_recognition",
    name: "Logo Recognition",
    shortDesc: "Recognize corporate & brand logos",
    longDesc: "Scan video frames to discover corporate logos, branding insignias, and organization crests with precise bounding box tracks.",
    icon: "Award",
    docsUrl: "https://docs.cloud.google.com/video-intelligence/docs/feature-logo-recognition",
  },
  {
    id: "object_tracking",
    name: "Object Tracking",
    shortDesc: "Track moving items over time",
    longDesc: "Detect and track specific physical objects (skateboards, luggage, vehicles) with temporal confidence coordinates.",
    icon: "Box",
    docsUrl: "https://docs.cloud.google.com/video-intelligence/docs/feature-object-tracking",
  },
  {
    id: "person_detection",
    name: "Person Detection",
    shortDesc: "Recognize people & clothing",
    longDesc: "Locate and track human beings, extract clothing details, and map bounding box movements throughout the timeline.",
    icon: "UserCheck",
    docsUrl: "https://docs.cloud.google.com/video-intelligence/docs/feature-person-detection",
  },
  {
    id: "shot_change",
    name: "Shot Change Detection",
    shortDesc: "Detect camera cuts & transitions",
    longDesc: "Automatically discover scene transitions, camera cuts, and hard segment edits to simplify automatic index creation.",
    icon: "Film",
    docsUrl: "https://docs.cloud.google.com/video-intelligence/docs/feature-shot-change",
  },
  {
    id: "speech_transcription",
    name: "Speech Transcription",
    shortDesc: "Transcribe spoken dialogue",
    longDesc: "Apply automatic speech recognition (ASR) to generate high-accuracy transcripts aligned to word-level timestamps.",
    icon: "Languages",
    docsUrl: "https://docs.cloud.google.com/video-intelligence/docs/feature-speech-transcription",
  },
  {
    id: "text_detection",
    name: "Text Detection (OCR)",
    shortDesc: "Extract visual text & overlays",
    longDesc: "Detect, read, and track physical signages, on-screen subtitles, lower thirds, or text embedded within the video frame.",
    icon: "Type",
    docsUrl: "https://docs.cloud.google.com/video-intelligence/docs/feature-text-detection",
  },
];

interface FeatureSelectorProps {
  selectedFeature: VideoFeature;
  onFeatureSelect: (feature: VideoFeature) => void;
  theme?: "light" | "dark-hc";
}

export const FeatureSelector: React.FC<FeatureSelectorProps> = ({
  selectedFeature,
  onFeatureSelect,
  theme = "dark-hc",
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Tag":
        return <Tag className="h-5 w-5" />;
      case "Smile":
        return <Smile className="h-5 w-5" />;
      case "ShieldAlert":
        return <ShieldAlert className="h-5 w-5" />;
      case "Award":
        return <Award className="h-5 w-5" />;
      case "Box":
        return <Box className="h-5 w-5" />;
      case "UserCheck":
        return <UserCheck className="h-5 w-5" />;
      case "Film":
        return <Film className="h-5 w-5" />;
      case "Languages":
        return <Languages className="h-5 w-5" />;
      case "Type":
        return <Type className="h-5 w-5" />;
      default:
        return <Box className="h-5 w-5" />;
    }
  };

  const activeFeatureObj = FEATURES_META.find((f) => f.id === selectedFeature);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold text-zinc-100 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-indigo-400" />
        Select API Feature
      </h3>

      {/* Grid of Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FEATURES_META.map((feat) => {
          const isSelected = selectedFeature === feat.id;
          return (
            <button
              key={feat.id}
              onClick={() => onFeatureSelect(feat.id)}
              className={`group relative flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-indigo-500 bg-indigo-950/20 shadow-md shadow-indigo-950/20"
                  : "border-zinc-850 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40"
              }`}
            >
              <div
                className={`p-2.5 rounded-lg mb-3 transition-colors ${
                  isSelected
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-900 text-zinc-400 group-hover:text-indigo-400 group-hover:bg-zinc-800"
                }`}
              >
                {getIcon(feat.icon)}
              </div>
              <h4 className="font-display font-semibold text-sm text-zinc-200 group-hover:text-indigo-300 transition-colors">
                {feat.name}
              </h4>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                {feat.shortDesc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Deep-dive Details Panel */}
      {activeFeatureObj && (
        <div className="bg-zinc-900/20 border border-zinc-850 rounded-xl p-4 mt-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded">
                Selected feature
              </span>
              <h4 className="font-display font-bold text-base text-zinc-200 mt-1">
                {activeFeatureObj.name}
              </h4>
            </div>
            <a
              href={activeFeatureObj.docsUrl}
              target="_blank"
              referrerPolicy="no-referrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              API Documentation
            </a>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {activeFeatureObj.longDesc}
          </p>
        </div>
      )}
    </div>
  );
};
