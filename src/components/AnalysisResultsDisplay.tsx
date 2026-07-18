import React from "react";
import { VideoFeature, VideoAnalysisResult } from "../types";
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
  TrendingUp,
  Cpu,
  Bookmark,
  Download,
  FileJson,
  History,
} from "lucide-react";

interface AnalysisResultsDisplayProps {
  selectedFeature: VideoFeature;
  result: VideoAnalysisResult | null;
  theme?: "light" | "dark-hc";
  onSaveToHistory?: () => void;
}

export const AnalysisResultsDisplay: React.FC<AnalysisResultsDisplayProps> = ({
  selectedFeature,
  result,
  theme = "dark-hc",
  onSaveToHistory,
}) => {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-zinc-900 bg-zinc-950/40 rounded-2xl">
        <Cpu className="h-8 w-8 text-zinc-600 mb-2" />
        <h4 className="font-display font-semibold text-sm text-zinc-300">No Analysis Cached Yet</h4>
        <p className="text-xs text-zinc-500 max-w-[280px] mt-1 leading-relaxed">
          Select a feature above and click <strong>Analyze Video Feature</strong> to process live frames.
        </p>
      </div>
    );
  }

  const convertToCSV = (feature: VideoFeature, data: VideoAnalysisResult): string => {
    let rows: string[][] = [];

    switch (feature) {
      case "label_detection":
        rows.push(["Entity", "Categories", "Confidence", "Start Time (s)", "End Time (s)", "Segment Confidence"]);
        if (data.labels) {
          data.labels.forEach((item) => {
            const categories = item.categories.join("; ");
            item.segments.forEach((seg) => {
              rows.push([
                item.entity,
                categories,
                item.confidence.toString(),
                seg.startTime.toFixed(2),
                seg.endTime.toFixed(2),
                seg.confidence.toString(),
              ]);
            });
          });
        }
        break;

      case "face_detection":
        rows.push(["Face ID", "Timestamp (s)", "xMin (%)", "yMin (%)", "xMax (%)", "yMax (%)", "Joy (%)", "Sorrow (%)", "Surprise (%)", "Anger (%)"]);
        if (data.faces) {
          data.faces.forEach((face) => {
            face.boundingBoxes.forEach((b) => {
              const emo = b.emotions || { joy: 0, sorrow: 0, surprise: 0, anger: 0 };
              rows.push([
                face.faceId.toString(),
                b.timestamp.toFixed(2),
                b.box.xMin.toFixed(1),
                b.box.yMin.toFixed(1),
                b.box.xMax.toFixed(1),
                b.box.yMax.toFixed(1),
                (emo.joy * 100).toFixed(0),
                (emo.sorrow * 100).toFixed(0),
                (emo.surprise * 100).toFixed(0),
                (emo.anger * 100).toFixed(0),
              ]);
            });
          });
        }
        break;

      case "explicit_content":
        rows.push(["Category", "Likelihood Rating"]);
        if (data.explicitContent) {
          const ec = data.explicitContent;
          rows.push(["Adult / Pornographic", ec.adult]);
          rows.push(["Medical / Surgery", ec.medical]);
          rows.push(["Violence & Gore", ec.violence]);
          rows.push(["Racy & Suggestive", ec.racy]);
          rows.push(["Spoof / Meme Satire", ec.spoof]);
        }
        break;

      case "logo_recognition":
        rows.push(["Description", "Confidence", "Timestamp (s)", "xMin (%)", "yMin (%)", "xMax (%)", "yMax (%)"]);
        if (data.logos) {
          data.logos.forEach((logo) => {
            logo.boxes.forEach((b) => {
              rows.push([
                logo.description,
                logo.confidence.toString(),
                b.timestamp.toFixed(2),
                b.box.xMin.toFixed(1),
                b.box.yMin.toFixed(1),
                b.box.xMax.toFixed(1),
                b.box.yMax.toFixed(1),
              ]);
            });
          });
        }
        break;

      case "object_tracking":
        rows.push(["Entity", "Confidence", "Track ID", "Timestamp (s)", "xMin (%)", "yMin (%)", "xMax (%)", "yMax (%)"]);
        if (data.objects) {
          data.objects.forEach((obj) => {
            obj.boxes.forEach((b) => {
              rows.push([
                obj.entity,
                obj.confidence.toString(),
                obj.trackId.toString(),
                b.timestamp.toFixed(2),
                b.box.xMin.toFixed(1),
                b.box.yMin.toFixed(1),
                b.box.xMax.toFixed(1),
                b.box.yMax.toFixed(1),
              ]);
            });
          });
        }
        break;

      case "person_detection":
        rows.push(["Person ID", "Attire/Clothing", "Timestamp (s)", "xMin (%)", "yMin (%)", "xMax (%)", "yMax (%)"]);
        if (data.people) {
          data.people.forEach((p) => {
            const clothing = p.clothing ? p.clothing.join("; ") : "";
            p.boxes.forEach((b) => {
              rows.push([
                p.personId.toString(),
                clothing,
                b.timestamp.toFixed(2),
                b.box.xMin.toFixed(1),
                b.box.yMin.toFixed(1),
                b.box.xMax.toFixed(1),
                b.box.yMax.toFixed(1),
              ]);
            });
          });
        }
        break;

      case "shot_change":
        rows.push(["Shot Number", "Start Time (s)", "End Time (s)", "Confidence"]);
        if (data.shots) {
          data.shots.forEach((shot, idx) => {
            rows.push([
              (idx + 1).toString(),
              shot.startTime.toFixed(2),
              shot.endTime.toFixed(2),
              shot.confidence.toString(),
            ]);
          });
        }
        break;

      case "speech_transcription":
        rows.push(["Start Time (s)", "End Time (s)", "Text", "Confidence"]);
        if (data.speech) {
          data.speech.forEach((line) => {
            rows.push([
              line.startTime.toFixed(2),
              line.endTime.toFixed(2),
              line.text,
              line.confidence.toString(),
            ]);
          });
        }
        break;

      case "text_detection":
        rows.push(["Text", "Confidence", "Timestamp (s)", "xMin (%)", "yMin (%)", "xMax (%)", "yMax (%)"]);
        if (data.textDetections) {
          data.textDetections.forEach((txt) => {
            txt.boxes.forEach((b) => {
              rows.push([
                txt.text,
                txt.confidence.toString(),
                b.timestamp.toFixed(2),
                b.box.xMin.toFixed(1),
                b.box.yMin.toFixed(1),
                b.box.xMax.toFixed(1),
                b.box.yMax.toFixed(1),
              ]);
            });
          });
        }
        break;

      default:
        rows.push(["Summary"]);
        rows.push([data.summary]);
    }

    return rows.map((r) => r.map(cell => {
      // Escape cells if they contain commas, quotes, or newlines
      const escaped = cell.replace(/"/g, '""');
      if (cell.includes(",") || cell.includes("\"") || cell.includes("\n")) {
        return `"${escaped}"`;
      }
      return escaped;
    }).join(",")).join("\n");
  };

  const downloadJSON = () => {
    const filename = `video_intelligence_${selectedFeature}_${new Date().toISOString().split('T')[0]}.json`;
    const jsonStr = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const filename = `video_intelligence_${selectedFeature}_${new Date().toISOString().split('T')[0]}.csv`;
    const csvContent = convertToCSV(selectedFeature, result);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Render Explicit Content moderation meters
  const renderExplicitMeters = () => {
    const data = result.explicitContent;
    if (!data) return <p className="text-xs text-slate-500">No content moderation data.</p>;

    const likelihoodColors = {
      VERY_UNLIKELY: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/20", width: "15%" },
      UNLIKELY: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/10", width: "35%" },
      POSSIBLE: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/20", width: "60%" },
      LIKELY: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/20", width: "85%" },
      VERY_LIKELY: { bg: "bg-rose-600/20", text: "text-rose-500", border: "border-rose-600/30", width: "100%" },
    };

    const categories = [
      { name: "Adult / Pornographic", val: data.adult },
      { name: "Medical / Surgery", val: data.medical },
      { name: "Violence & Gore", val: data.violence },
      { name: "Racy & Suggestive", val: data.racy },
      { name: "Spoof / Meme Satire", val: data.spoof },
    ];

    return (
      <div className="space-y-4">
        <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl">
          <h5 className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider mb-1">Moderation Summary</h5>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">{data.summary || "All content levels clear."}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {categories.map((cat, idx) => {
            const config = likelihoodColors[cat.val || "VERY_UNLIKELY"];
            return (
              <div key={idx} className="p-3.5 bg-zinc-900/10 border border-zinc-800/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">{cat.name}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
                    {cat.val}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cat.val === "VERY_UNLIKELY" || cat.val === "UNLIKELY" ? "bg-emerald-500" : cat.val === "POSSIBLE" ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: config.width }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Label Detection card rows
  const renderLabels = () => {
    const list = result.labels;
    if (!list || list.length === 0) return <p className="text-xs text-zinc-500">No label annotations found.</p>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map((item, idx) => (
          <div key={idx} className="p-4 bg-zinc-900/20 border border-zinc-850 rounded-xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-display font-semibold text-sm text-zinc-200 capitalize">{item.entity}</h5>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.categories.map((cat, cIdx) => (
                    <span key={cIdx} className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-zinc-800">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
                {Math.round(item.confidence * 100)}%
              </span>
            </div>

            {/* Segment tracking details */}
            <div className="border-t border-slate-800/50 pt-2.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold block mb-1">
                Segment Occurrence:
              </span>
              <div className="space-y-1">
                {item.segments.map((seg, sIdx) => (
                  <div key={sIdx} className="flex justify-between items-center text-xs font-mono text-slate-400">
                    <span>{seg.startTime.toFixed(1)}s — {seg.endTime.toFixed(1)}s</span>
                    <span className="text-slate-500">Conf: {Math.round(seg.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Face Detection profiles
  const renderFaces = () => {
    const list = result.faces;
    if (!list || list.length === 0) return <p className="text-xs text-slate-500">No face profiles matched.</p>;

    return (
      <div className="space-y-3">
        {list.map((face, idx) => {
          const boxesWithEmotions = face.boundingBoxes.filter(b => b.emotions);
          // Aggregate maximum emotions
          const latestEmotions = boxesWithEmotions[0]?.emotions || { joy: 0, sorrow: 0, surprise: 0, anger: 0 };

          return (
            <div key={idx} className="p-4 bg-slate-900/30 border border-slate-800/80 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    <Smile className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h5 className="font-display font-semibold text-sm text-slate-200">Face Profile #{face.faceId}</h5>
                    <p className="text-xs text-slate-500">Tracked over {face.boundingBoxes.length} timestamp coordinates</p>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Timeline: {face.boundingBoxes[0]?.timestamp.toFixed(1)}s — {face.boundingBoxes[face.boundingBoxes.length - 1]?.timestamp.toFixed(1)}s
                </div>
              </div>

              {/* Emotions list progress */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(latestEmotions).map(([key, val]) => (
                  <div key={key} className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="capitalize text-slate-400 font-medium">{key}</span>
                      <span className="font-mono text-emerald-400 font-semibold">{Math.round((val as number) * 100)}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(val as number) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Brand Logos list
  const renderLogos = () => {
    const list = result.logos;
    if (!list || list.length === 0) return <p className="text-xs text-slate-500">No brand logos discovered.</p>;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.map((logo, idx) => (
          <div key={idx} className="p-4 bg-slate-900/30 border border-slate-800/80 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-sky-400" />
                <h5 className="font-display font-semibold text-sm text-slate-200">{logo.description}</h5>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Found at: {logo.boxes.map(b => `${b.timestamp.toFixed(1)}s`).join(", ")}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded">
              {Math.round(logo.confidence * 100)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Render Object Tracking list
  const renderObjects = () => {
    const list = result.objects;
    if (!list || list.length === 0) return <p className="text-xs text-slate-500">No objects tracked.</p>;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.map((obj, idx) => (
          <div key={idx} className="p-4 bg-slate-900/30 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5">
                <Box className="h-4 w-4 text-amber-400" />
                <h5 className="font-display font-semibold text-sm text-slate-200 capitalize">{obj.entity}</h5>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                Track ID: {obj.trackId}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Keyframes: {obj.boxes.map(b => `${b.timestamp.toFixed(1)}s`).join(", ")}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // Render Person Detection attire & details
  const renderPeople = () => {
    const list = result.people;
    if (!list || list.length === 0) return <p className="text-xs text-slate-500">No people tracked.</p>;

    return (
      <div className="space-y-3">
        {list.map((p, idx) => (
          <div key={idx} className="p-4 bg-slate-900/30 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                <UserCheck className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-1">
                <h5 className="font-display font-semibold text-sm text-slate-200">Person #{p.personId}</h5>
                <div className="flex flex-wrap gap-1">
                  {p.clothing ? p.clothing.map((cl, clIdx) => (
                    <span key={clIdx} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      {cl}
                    </span>
                  )) : (
                    <span className="text-[10px] text-slate-500 italic">No attire detected</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-mono text-right">
              Tracked Coordinates: {p.boxes.length} frames
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Shot segments
  const renderShots = () => {
    const list = result.shots;
    if (!list || list.length === 0) return <p className="text-xs text-slate-500">No scene shifts detected.</p>;

    return (
      <div className="space-y-3">
        <div className="flex h-4 bg-slate-800/60 border border-slate-800 rounded-full overflow-hidden w-full">
          {list.map((shot, idx) => {
            const colors = ["bg-indigo-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500"];
            const bgClass = colors[idx % colors.length];
            const duration = shot.endTime - shot.startTime;
            return (
              <div
                key={idx}
                className={`${bgClass} h-full border-r border-slate-950/20`}
                style={{ flexGrow: duration }}
                title={`Shot ${idx + 1}: ${shot.startTime.toFixed(1)}s - ${shot.endTime.toFixed(1)}s`}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {list.map((shot, idx) => (
            <div key={idx} className="p-3 bg-slate-900/30 border border-slate-800/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">Shot #{idx + 1}</span>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{shot.startTime.toFixed(1)}s — {shot.endTime.toFixed(1)}s</p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Confidence: {Math.round(shot.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Speech Transcription logs
  const renderSpeech = () => {
    const list = result.speech;
    if (!list || list.length === 0) return <p className="text-xs text-slate-500">No dialogue transcripts.</p>;

    return (
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {list.map((line, idx) => (
          <div key={idx} className="p-3.5 bg-slate-900/30 border border-slate-800/80 rounded-xl space-y-1.5 hover:bg-slate-900/50 transition-colors">
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-1.5">
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                Time: {line.startTime.toFixed(1)}s — {line.endTime.toFixed(1)}s
              </span>
              <span className="text-xs font-mono text-slate-500">
                Confidence: {Math.round(line.confidence * 100)}%
              </span>
            </div>
            <p className="text-sm text-slate-200 italic font-serif leading-relaxed">
              "{line.text}"
            </p>
          </div>
        ))}
      </div>
    );
  };

  // Render OCR visual text detections
  const renderTextDetections = () => {
    const list = result.textDetections;
    if (!list || list.length === 0) return <p className="text-xs text-slate-500">No on-screen text discovered.</p>;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.map((txt, idx) => (
          <div key={idx} className="p-4 bg-slate-900/30 border border-slate-800/80 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Type className="h-4 w-4 text-rose-400" />
                <h5 className="font-mono text-sm text-slate-200">"{txt.text}"</h5>
              </div>
              <p className="text-xs text-slate-500">
                Found in {txt.boxes.length} timeline frame segments
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded">
              {Math.round(txt.confidence * 100)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Switch to the correct layout block
  const renderFeatureDetails = () => {
    switch (selectedFeature) {
      case "label_detection":
        return renderLabels();
      case "face_detection":
        return renderFaces();
      case "explicit_content":
        return renderExplicitMeters();
      case "logo_recognition":
        return renderLogos();
      case "object_tracking":
        return renderObjects();
      case "person_detection":
        return renderPeople();
      case "shot_change":
        return renderShots();
      case "speech_transcription":
        return renderSpeech();
      case "text_detection":
        return renderTextDetections();
      default:
        return null;
    }
  };

  const isLight = theme === "light";

  return (
    <div className="space-y-4">
      {/* Header summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* API Response Summary */}
        <div className={`p-4 border rounded-2xl space-y-2 transition-colors duration-200 lg:col-span-2 ${
          isLight ? "bg-white border-zinc-200 text-zinc-900" : "bg-zinc-950 border-zinc-900 text-zinc-100"
        }`}>
          <h4 className={`font-display font-semibold text-sm flex items-center gap-1.5 ${
            isLight ? "text-zinc-800" : "text-zinc-300"
          }`}>
            <Bookmark className="h-4 w-4 text-indigo-500" />
            AI Video Understanding Summary
          </h4>
          <p className={`text-xs md:text-sm leading-relaxed font-sans ${
            isLight ? "text-zinc-600" : "text-zinc-400"
          }`}>
            {result.summary}
          </p>
        </div>
 
        {/* AI Key Insights */}
        <div className={`p-4 border rounded-2xl space-y-2 flex flex-col justify-between transition-colors duration-200 ${
          isLight ? "bg-white border-zinc-200 text-zinc-900" : "bg-zinc-950 border-zinc-900 text-zinc-100"
        }`}>
          <div>
            <h4 className={`font-display font-semibold text-sm flex items-center gap-1.5 ${
              isLight ? "text-zinc-800" : "text-zinc-300"
            }`}>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Temporal Insights
            </h4>
            <ul className="text-xs list-disc list-inside space-y-1.5 mt-2 leading-relaxed">
              {result.insights && result.insights.length > 0 ? (
                result.insights.map((ins, index) => (
                  <li key={index} className="pl-1">
                    <span className={isLight ? "text-zinc-650" : "text-zinc-400"}>{ins}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className={isLight ? "text-zinc-650" : "text-zinc-400"}>Analyzed {selectedFeature.replace("_", " ")} tracks over timeline indices.</li>
                  <li className={isLight ? "text-zinc-650" : "text-zinc-400"}>No explicit content violations found within clips.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
 
      {/* Feature Specific Detail List Card */}
      <div className={`p-5 border rounded-2xl space-y-4 shadow-sm transition-colors duration-200 ${
        isLight ? "bg-white border-zinc-200" : "bg-zinc-950/50 border-zinc-900"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/40 pb-3">
          <h4 className={`font-display font-bold text-base flex items-center gap-2 ${
            isLight ? "text-zinc-900" : "text-zinc-100"
          }`}>
            {selectedFeature === "label_detection" && <Tag className="h-5 w-5 text-indigo-500" />}
            {selectedFeature === "face_detection" && <Smile className="h-5 w-5 text-emerald-500" />}
            {selectedFeature === "explicit_content" && <ShieldAlert className="h-5 w-5 text-rose-500" />}
            {selectedFeature === "logo_recognition" && <Award className="h-5 w-5 text-sky-500" />}
            {selectedFeature === "object_tracking" && <Box className="h-5 w-5 text-amber-500" />}
            {selectedFeature === "person_detection" && <UserCheck className="h-5 w-5 text-indigo-500" />}
            {selectedFeature === "shot_change" && <Film className="h-5 w-5 text-emerald-500" />}
            {selectedFeature === "speech_transcription" && <Languages className="h-5 w-5 text-indigo-500" />}
            {selectedFeature === "text_detection" && <Type className="h-5 w-5 text-rose-500" />}
            API Response Payload: {selectedFeature.replace("_", " ").toUpperCase()}
          </h4>

          <div className="flex items-center gap-2 flex-wrap">
            {onSaveToHistory && (
              <button
                onClick={onSaveToHistory}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all shadow-sm focus:ring-2 min-h-[36px] cursor-pointer ${
                  isLight
                    ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 focus:ring-indigo-550"
                    : "bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-300 border border-indigo-900 focus:ring-indigo-500"
                }`}
                title="Pin this analysis to your history log"
                aria-label="Save analysis to history"
              >
                <History className="h-4 w-4 text-indigo-500" />
                <span>Save to History</span>
              </button>
            )}
            <button
              onClick={downloadJSON}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all shadow-sm focus:ring-2 min-h-[36px] cursor-pointer ${
                isLight
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 focus:ring-zinc-600"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 focus:ring-white"
              }`}
              title="Download results as JSON file"
              aria-label="Download results as JSON"
            >
              <FileJson className="h-4 w-4 text-indigo-500" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={downloadCSV}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all shadow-sm focus:ring-2 min-h-[36px] cursor-pointer ${
                isLight
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 focus:ring-zinc-600"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 focus:ring-white"
              }`}
              title="Download results as CSV file"
              aria-label="Download results as CSV"
            >
              <Download className="h-4 w-4 text-emerald-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
 
        {renderFeatureDetails()}
      </div>
    </div>
  );
};
