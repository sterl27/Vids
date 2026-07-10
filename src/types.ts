export type VideoFeature =
  | "label_detection"
  | "face_detection"
  | "explicit_content"
  | "logo_recognition"
  | "object_tracking"
  | "person_detection"
  | "shot_change"
  | "speech_transcription"
  | "text_detection";

export interface FeatureMeta {
  id: VideoFeature;
  name: string;
  shortDesc: string;
  longDesc: string;
  icon: string;
  docsUrl: string;
}

export interface CuratedVideo {
  id: string;
  title: string;
  category: string;
  url: string;
  duration: number;
  recommendedFeatures: VideoFeature[];
  description: string;
}

export interface KeyframeData {
  base64: string;
  timestamp: number;
}

export interface BoundingBox {
  xMin: number; // 0 to 100 percentage
  yMin: number;
  xMax: number;
  yMax: number;
}

// Bounding box with absolute time context
export interface TimedBox {
  timestamp: number;
  box: BoundingBox;
  emotions?: {
    joy: number;
    sorrow: number;
    surprise: number;
    anger: number;
  };
}

// Structured feature models matching the API response
export interface LabelAnnotation {
  entity: string;
  categories: string[];
  confidence: number;
  segments: {
    startTime: number;
    endTime: number;
    confidence: number;
  }[];
}

export interface FaceAnnotation {
  faceId: number;
  boundingBoxes: TimedBox[];
}

export interface LogoAnnotation {
  description: string;
  confidence: number;
  boxes: TimedBox[];
}

export interface ObjectTrackingAnnotation {
  entity: string;
  confidence: number;
  trackId: number;
  boxes: TimedBox[];
}

export interface PersonAnnotation {
  personId: number;
  clothing: string[];
  boxes: TimedBox[];
}

export interface ShotSegment {
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface SpeechTranscript {
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
}

export interface TextDetectionAnnotation {
  text: string;
  confidence: number;
  boxes: TimedBox[];
}

export interface ExplicitContentAnnotation {
  adult: "VERY_UNLIKELY" | "UNLIKELY" | "POSSIBLE" | "LIKELY" | "VERY_LIKELY";
  medical: "VERY_UNLIKELY" | "UNLIKELY" | "POSSIBLE" | "LIKELY" | "VERY_LIKELY";
  violence: "VERY_UNLIKELY" | "UNLIKELY" | "POSSIBLE" | "LIKELY" | "VERY_LIKELY";
  racy: "VERY_UNLIKELY" | "UNLIKELY" | "POSSIBLE" | "LIKELY" | "VERY_LIKELY";
  spoof: "VERY_UNLIKELY" | "UNLIKELY" | "POSSIBLE" | "LIKELY" | "VERY_LIKELY";
  summary: string;
}

// Main response model received from server
export interface VideoAnalysisResult {
  summary: string;
  insights: string[];
  labels?: LabelAnnotation[];
  faces?: FaceAnnotation[];
  logos?: LogoAnnotation[];
  objects?: ObjectTrackingAnnotation[];
  people?: PersonAnnotation[];
  shots?: ShotSegment[];
  speech?: SpeechTranscript[];
  textDetections?: TextDetectionAnnotation[];
  explicitContent?: ExplicitContentAnnotation;
}
