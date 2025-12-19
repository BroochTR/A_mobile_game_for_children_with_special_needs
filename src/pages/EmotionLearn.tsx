import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera, CameraOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type EmotionPredictions = {
  [key: string]: number;
};

type AnalysisResult = {
  success: boolean;
  predictions?: EmotionPredictions;
  dominant_emotion?: string;
  dominant_confidence?: number;
  vietnamese?: string;
  message?: string;
};

const EMOTION_CONFIG = [
  { key: "Happy", label: "Vui vẻ", emoji: "😊", color: "bg-yellow-500" },
  { key: "Sad", label: "Buồn", emoji: "😢", color: "bg-blue-500" },
  { key: "Angry", label: "Giận dữ", emoji: "😠", color: "bg-red-500" },
  { key: "Fear", label: "Sợ hãi", emoji: "😨", color: "bg-purple-500" },
  { key: "Suprise", label: "Ngạc nhiên", emoji: "😮", color: "bg-pink-500" },
  { key: "Neutral", label: "Trung tính", emoji: "😐", color: "bg-gray-500" },
  { key: "Disgust", label: "Ghê tởm", emoji: "🤢", color: "bg-green-500" }
];

const EmotionLearn = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [predictions, setPredictions] = useState<EmotionPredictions>({});
  const [dominantEmotion, setDominantEmotion] = useState<string | null>(null);
  const [dominantEmotionVietnamese, setDominantEmotionVietnamese] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  const { toast } = useToast();

  const analyzeEmotion = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState !== 4) {
      // Video chưa sẵn sàng
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    try {
      const image = canvas.toDataURL("image/jpeg", 0.8);
      
      const response = await fetch("http://localhost:5000/analyze-emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image })
      });

      const result: AnalysisResult = await response.json();

      if (result.success && result.predictions) {
        setPredictions(result.predictions);
        setDominantEmotion(result.dominant_emotion || null);
        setDominantEmotionVietnamese(result.vietnamese || null);
      }
    } catch (error) {
      // Only show error toast once, not every time
      if (!document.querySelector('[data-sonner-toast]')) {
        toast({
          title: "Lỗi kết nối",
          description: "Không thể kết nối với server. Đảm bảo backend đang chạy.",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      
      streamRef.current = stream;
      setIsStreaming(true);
      
      toast({
        title: "Camera đã bật! 📸",
        description: "Hệ thống sẽ tự động phân tích cảm xúc của bạn!"
      });

      // Wait for video to be ready before starting analysis
      setTimeout(() => {
        // Start continuous analysis every 500ms
        analysisIntervalRef.current = setInterval(() => {
          analyzeEmotion();
        }, 500);
      }, 1000); // Wait 1 second for video to load
    } catch (error) {
      toast({
        title: "Lỗi camera",
        description: "Không thể khởi động camera. Vui lòng kiểm tra quyền truy cập.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    // Stop analysis interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    // Stop camera stream
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setPredictions({});
    setDominantEmotion(null);
    setDominantEmotionVietnamese(null);
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (isStreaming && videoEl && streamRef.current) {
      videoEl.srcObject = streamRef.current;
      videoEl.muted = true;
      videoEl.playsInline = true;
      
      // Video will be ready when loadeddata fires
      
      videoEl.play().catch(() => {});
      
      return () => {
        videoEl.pause();
        videoEl.srcObject = null;
      };
    }
  }, [isStreaming]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f2e1bb] text-[#4a3562] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(74,53,98,0.05),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,184,28,0.08),transparent_30%),radial-gradient(circle_at_10%_80%,rgba(255,184,28,0.05),transparent_30%)]" />

      <div className="relative max-w-7xl mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" className="rounded-full border-[#4a3562] text-[#4a3562] hover:bg-[#4a3562]/10">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div className="flex-1 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-[#b07b16]">Learning Mode</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#4a3562]">Luyện tập</h1>
          </div>
          <div className="relative">
            <button
              className="w-10 h-10 rounded-full bg-[#4a3562] text-white flex items-center justify-center shadow-lg hover:bg-[#3c2c50] transition"
              onClick={() => setShowGuide((prev) => !prev)}
            >
              <span className="text-lg font-semibold">?</span>
            </button>
            {showGuide && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-[#4a3562] rounded-2xl shadow-xl border border-[#d7c38e] p-4 z-10">
                <p className="text-sm font-semibold mb-1">Cách sử dụng</p>
                <p className="text-sm leading-relaxed">
                  Bật camera và thử thể hiện các cảm xúc khác nhau. Hệ thống sẽ tự động phân tích 
                  và cho bạn biết mức độ của từng cảm xúc trên khuôn mặt!
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera Section */}
          <div className="space-y-4">
            <Card className="p-6 bg-[#f7edce] border-[#d7c38e] shadow-[0_12px_30px_rgba(74,53,98,0.12)] rounded-3xl">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-[#4a3562]">
                    Camera
                  </h2>
                </div>

                <div className="relative bg-[#e9ddba] rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  {!isStreaming ? (
                    <div className="text-center space-y-3 p-6 text-[#4a3562]/80">
                      <Camera className="w-16 h-16 mx-auto" />
                      <p className="text-lg">
                        Nhấn "Bắt đầu phân tích" để khởi động camera và xem cảm xúc của bạn!
                      </p>
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
                      <canvas ref={canvasRef} className="hidden" />
                      
                      {/* Live indicator */}
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        TRỰC TIẾP
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  {!isStreaming ? (
                    <Button
                      onClick={startCamera}
                      className="w-full bg-[#4a3562] text-[#f7edce] hover:bg-[#3c2c50] text-lg py-6"
                      size="lg"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Bắt đầu phân tích
                    </Button>
                  ) : (
                    <Button
                      onClick={stopCamera}
                      variant="destructive"
                      className="w-full text-lg py-6"
                      size="lg"
                    >
                      <CameraOff className="w-5 h-5 mr-2" />
                      Dừng lại
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card className="p-6 bg-[#fcbf25] border-[#d7c38e] rounded-2xl">
              <h3 className="font-bold text-[#4a3562] mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span>
                Gợi ý
              </h3>
              <ul className="space-y-2 text-sm text-[#4a3562]">
                <li>• Đảm bảo khuôn mặt nằm trong khung hình</li>
                <li>• Ánh sáng tốt sẽ cho kết quả chính xác hơn</li>
                <li>• Thử thể hiện các cảm xúc khác nhau!</li>
                <li>• Quan sát thanh đo để học cách nhận biết</li>
              </ul>
            </Card>
          </div>

          {/* Emotion Meters */}
          <Card className="p-6 bg-[#f7edce] border-[#d7c38e] shadow-[0_12px_30px_rgba(74,53,98,0.12)] rounded-3xl">
            <h2 className="text-xl font-bold text-[#4a3562] mb-6">
              Phân tích cảm xúc thời gian thực
            </h2>

            {!isStreaming ? (
              <div className="flex items-center justify-center h-full min-h-[400px] text-center text-[#4a3562]/60">
                <div>
                  <p className="text-lg">Bật camera để bắt đầu phân tích cảm xúc</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {EMOTION_CONFIG.map((emotion) => {
                  const value = predictions[emotion.key] || 0;
                  const percentage = Math.round(value * 100);
                  const isHighest = dominantEmotion === emotion.key;

                  return (
                    <div 
                      key={emotion.key} 
                      className={`transition-all duration-300 ${
                        isHighest ? "scale-105" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{emotion.emoji}</span>
                          <span className={`font-semibold ${
                            isHighest ? "text-[#4a3562] text-lg" : "text-[#4a3562]/70"
                          }`}>
                            {emotion.label}
                          </span>
                          {isHighest && (
                            <span className="text-xs bg-[#fcbf25] px-2 py-1 rounded-full font-bold">
                              CHỦ ĐẠO
                            </span>
                          )}
                        </div>
                        <span className={`font-bold ${
                          isHighest ? "text-lg text-[#4a3562]" : "text-[#4a3562]/70"
                        }`}>
                          {percentage}%
                        </span>
                      </div>
                      
                      <div className="relative h-4 bg-white rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full ${emotion.color} transition-all duration-500 ease-out rounded-full ${
                            isHighest ? "animate-pulse" : ""
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isStreaming && Object.keys(predictions).length > 0 && (
              <div className="mt-6 p-4 bg-[#fcbf25]/30 rounded-xl text-center">
                <p className="text-sm text-[#4a3562]">
                  Thử thể hiện các cảm xúc khác nhau!
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmotionLearn;

