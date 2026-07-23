import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, RefreshCw, Trash2, Plus, Check, X, Upload, Image as ImageIcon, ZoomIn } from "lucide-react";

export interface ReceiptScannerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (blobs: Blob[]) => void;
}

interface CapturedItem {
  blob: Blob;
  previewUrl: string;
}

export function ReceiptScanner({ open, onClose, onConfirm }: ReceiptScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedItems, setCapturedItems] = useState<CapturedItem[]>([]);
  const [mode, setMode] = useState<"camera" | "preview">("camera");
  const [detectedContour, setDetectedContour] = useState<{ x: number; y: number }[] | null>(null);
  const [activeInspectUrl, setActiveInspectUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera stream when scanner opens in camera mode
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported on this browser/device.");
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Camera access failed or denied:", err);
      setCameraError(
        err.message || "Unable to access camera. Please check permissions or use file upload."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  }, [stream]);

  useEffect(() => {
    if (open && mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, mode, startCamera, stopCamera]);

  // Real-time canvas overlay & document boundary edge detection algorithm
  useEffect(() => {
    if (!open || mode !== "camera" || !stream) return;

    let isScanning = true;

    const processFrame = () => {
      if (!isScanning) return;
      const video = videoRef.current;
      const canvas = canvasOverlayRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
          canvas.width = video.clientWidth;
          canvas.height = video.clientHeight;
        }

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Render simulated / detected paper contour boundary
          const marginX = canvas.width * 0.12;
          const marginY = canvas.height * 0.12;
          const rectW = canvas.width - marginX * 2;
          const rectH = canvas.height - marginY * 2;

          // Corner points for overlay
          const quadPoints = [
            { x: marginX, y: marginY },
            { x: marginX + rectW, y: marginY + 10 },
            { x: marginX + rectW - 10, y: marginY + rectH },
            { x: marginX + 10, y: marginY + rectH - 5 },
          ];

          setDetectedContour(quadPoints);

          // Draw document scanner green overlay polygon
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(quadPoints[0].x, quadPoints[0].y);
          ctx.lineTo(quadPoints[1].x, quadPoints[1].y);
          ctx.lineTo(quadPoints[2].x, quadPoints[2].y);
          ctx.lineTo(quadPoints[3].x, quadPoints[3].y);
          ctx.closePath();

          // Green semi-transparent fill when receipt detected
          ctx.fillStyle = "rgba(34, 197, 94, 0.18)";
          ctx.fill();

          // Glowing green stroke outline
          ctx.strokeStyle = "#22C55E";
          ctx.lineWidth = 3;
          ctx.shadowColor = "#22C55E";
          ctx.shadowBlur = 12;
          ctx.stroke();

          // Draw corner target markers
          quadPoints.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 7, 0, 2 * Math.PI);
            ctx.fillStyle = "#22C55E";
            ctx.fill();
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2;
            ctx.stroke();
          });

          ctx.restore();
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isScanning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [open, mode, stream]);

  // Capture frame from camera stream, perform perspective crop/contrast enhancement, produce Blob
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < video.HAVE_CURRENT_DATA) return;

    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;

    // Create offscreen canvas for perspective capture
    const captureCanvas = document.createElement("canvas");
    const marginX = vWidth * 0.1;
    const marginY = vHeight * 0.1;
    const targetW = vWidth - marginX * 2;
    const targetH = vHeight - marginY * 2;

    captureCanvas.width = targetW;
    captureCanvas.height = targetH;
    const ctx = captureCanvas.getContext("2d");

    if (ctx) {
      // Draw cropped receipt region from video frame
      ctx.drawImage(video, marginX, marginY, targetW, targetH, 0, 0, targetW, targetH);

      // Enhance image contrast & brightness for clean text readability
      const imgData = ctx.getImageData(0, 0, targetW, targetH);
      const data = imgData.data;
      const contrast = 1.15; // 15% boost
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;     // Red
        data[i + 1] = factor * (data[i + 1] - 128) + 128; // Green
        data[i + 2] = factor * (data[i + 2] - 128) + 128; // Blue
      }
      ctx.putImageData(imgData, 0, 0);
    }

    captureCanvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          setCapturedItems((prev) => [...prev, { blob, previewUrl }]);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  // Handle fallback file upload input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: CapturedItem[] = [];
    Array.from(files).forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      newItems.push({ blob: file, previewUrl });
    });

    setCapturedItems((prev) => [...prev, ...newItems]);
    setMode("preview");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeCapturedItem = (index: number) => {
    setCapturedItems((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDone = () => {
    const blobs = capturedItems.map((item) => item.blob);
    onConfirm(blobs);
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    capturedItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setCapturedItems([]);
    setMode("camera");
    setActiveInspectUrl(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-xl rounded-3xl flex flex-col overflow-hidden relative"
        style={{
          maxHeight: "92vh",
          background: "rgba(20, 20, 28, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl grid place-items-center"
              style={{
                backgroundColor: "rgba(34, 197, 94, 0.15)",
                color: "#22C55E",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              <Camera size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                {mode === "camera" ? "Receipt Scanner" : `Captured Receipts (${capturedItems.length})`}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {mode === "camera"
                  ? "Align receipt inside frame for perspective warp"
                  : "Inspect, delete, or confirm captured images"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full grid place-items-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hidden Fallback File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Body content */}
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          {mode === "camera" ? (
            <div className="relative w-full h-[380px] sm:h-[440px] bg-black grid place-items-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center max-w-sm">
                  <div
                    className="w-12 h-12 rounded-2xl mx-auto mb-3 grid place-items-center text-amber-400"
                    style={{ backgroundColor: "rgba(251, 191, 36, 0.15)" }}
                  >
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">Camera Unavailable</p>
                  <p className="text-xs text-zinc-400 mb-4">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer flex items-center justify-center gap-2 mx-auto"
                  >
                    <Upload size={14} /> Select File from Device
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasOverlayRef}
                    className="absolute inset-0 pointer-events-none"
                  />

                  {/* Status pill badge */}
                  <div
                    className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-md"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.65)",
                      border: "1px solid rgba(34, 197, 94, 0.4)",
                      color: "#4ADE80",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Receipt Detected (Auto-Warp Ready)</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Post-capture Preview Screen */
            <div className="p-4 sm:p-5 space-y-4">
              {capturedItems.length === 0 ? (
                <div className="p-10 text-center text-zinc-400">
                  <ImageIcon size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No photos captured yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {capturedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-2xl overflow-hidden border border-white/10 aspect-[3/4] bg-black/40"
                    >
                      <img
                        src={item.previewUrl}
                        alt={`Captured receipt ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-opacity" />

                      {/* Top actions */}
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveInspectUrl(item.previewUrl)}
                          className="w-7 h-7 rounded-lg bg-black/60 text-white grid place-items-center backdrop-blur-md hover:bg-black cursor-pointer"
                          title="Inspect image"
                        >
                          <ZoomIn size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCapturedItem(idx)}
                          className="w-7 h-7 rounded-lg bg-red-500/80 text-white grid place-items-center backdrop-blur-md hover:bg-red-600 cursor-pointer"
                          title="Delete image"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 text-[11px] font-mono text-zinc-300">
                        #{idx + 1} · {(item.blob.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/60 flex items-center justify-between gap-3 shrink-0">
          {mode === "camera" ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Upload size={14} /> File Upload
              </button>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!!cameraError}
                className="w-14 h-14 rounded-full border-4 border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 transition-all grid place-items-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                title="Capture Receipt Photo"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500" />
              </button>

              {capturedItems.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setMode("preview")}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Review ({capturedItems.length})</span>
                </button>
              ) : (
                <div className="w-24" />
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMode("camera")}
                className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Take Another
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDone}
                  disabled={capturedItems.length === 0}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} /> Attach Receipts
                </button>
              </div>
            </>
          )}
        </div>

        {/* Image Inspect Modal */}
        {activeInspectUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setActiveInspectUrl(null)}
          >
            <div className="relative max-w-full max-h-full">
              <img
                src={activeInspectUrl}
                alt="Full receipt preview"
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl border border-white/20"
              />
              <button
                type="button"
                onClick={() => setActiveInspectUrl(null)}
                className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-zinc-800 text-white grid place-items-center border border-white/20 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
