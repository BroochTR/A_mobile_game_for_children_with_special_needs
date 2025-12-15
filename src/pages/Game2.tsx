import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera, CameraOff, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { detectEmotionForScenario, getScenario, type Scenario } from "@/lib/api";

const FALLBACK_SCENARIOS: Scenario[] = [
  {
    id: 1,
    story: "Bạn nhận được quà từ bạn bè! 🎁",
    correct_emotion: "Happy",
    emoji: "😊",
    illustration: "🎁"
  },
  {
    id: 2,
    story: "Đồ chơi yêu thích của bạn bị vỡ 💔",
    correct_emotion: "Sad",
    emoji: "😢",
    illustration: "🧸"
  },
  {
    id: 3,
    story: "Ai đó lấy đồ chơi của bạn mà không hỏi 😤",
    correct_emotion: "Angry",
    emoji: "😠",
    illustration: "🎮"
  },
  {
    id: 4,
    story: "Bạn tìm thấy một hộp quà bất ngờ kỳ diệu! ✨",
    correct_emotion: "Surprise",
    emoji: "😮",
    illustration: "📦"
  },
  {
    id: 5,
    story: "Bạn nghe thấy tiếng động lớn trong bóng tối 🌙",
    correct_emotion: "Fear",
    emoji: "😨",
    illustration: "🌙"
  }
];

const Game2 = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<Scenario>(FALLBACK_SCENARIOS[0]);
  const [showHint, setShowHint] = useState(false);
  const [, setDetectedEmotion] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFetchingScenario, setIsFetchingScenario] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyzingRef = useRef(false);
  const [showGuide, setShowGuide] = useState(false);
  const { toast } = useToast();

  const fetchScenario = useCallback(async () => {
    setIsFetchingScenario(true);
    try {
      const scenario = await getScenario();
      setCurrentScenario(scenario);
      setShowHint(false);
    } catch (error) {
      const fallback = FALLBACK_SCENARIOS[Math.floor(Math.random() * FALLBACK_SCENARIOS.length)];
      setCurrentScenario(fallback);
      setShowHint(false);
      toast({
        title: "Không thể tải câu chuyện mới",
        description: error instanceof Error ? error.message : "Đang dùng dữ liệu tạm thời.",
        variant: "destructive"
      });
    } finally {
      setIsFetchingScenario(false);
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
        title: "Giờ kể chuyện! 📖",
        description: "Hãy thể hiện cảm xúc phù hợp cho mỗi câu chuyện!"
      });
    } catch (error) {
      toast({
        title: "Ối!",
        description: "Không thể khởi động camera.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setDetectedEmotion(null);
    setIsCorrect(null);
    analyzingRef.current = false;
    setIsAnalyzing(false);
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (isStreaming && videoEl && streamRef.current) {
      videoEl.srcObject = streamRef.current;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.play().catch(() => {});
      return () => {
        videoEl.pause();
        videoEl.srcObject = null;
      };
    }
  }, [isStreaming]);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCorrect || analyzingRef.current) return;

    analyzingRef.current = true;
    setIsAnalyzing(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      analyzingRef.current = false;
      setIsAnalyzing(false);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    try {
      const image = canvas.toDataURL("image/jpeg", 0.9);
      const result = await detectEmotionForScenario(image, currentScenario.correct_emotion);
      const predicted = result.detected_emotion ?? result.emotion ?? null;

      if (predicted) {
        setDetectedEmotion(predicted);
      }

      const correct = !!result.is_correct;
      if (correct) {
        setIsCorrect(true);
        setScore(prev => prev + 1);
        toast({
          title: "🎉 Xuất sắc!",
          description: result.message ?? "Bạn đã hiểu câu chuyện một cách hoàn hảo!",
        });

        setTimeout(() => {
          setIsCorrect(null);
          setDetectedEmotion(null);
          fetchScenario();
        }, 3000);
      } else {
        toast({
          title: "Chưa đúng! 🤔",
          description: result.message ?? "Hãy thử lại! Nghĩ xem bạn sẽ cảm thấy như thế nào.",
          variant: "destructive"
        });
        setIsCorrect(null);
        setDetectedEmotion(null);
      }
    } catch (error) {
      toast({
        title: "Có lỗi khi gửi ảnh",
        description: error instanceof Error ? error.message : "Vui lòng đảm bảo backend đang chạy.",
        variant: "destructive"
      });
    } finally {
      analyzingRef.current = false;
      setIsAnalyzing(false);
    }
  }, [currentScenario, fetchScenario, isCorrect, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStreaming && !isCorrect) {
      interval = setInterval(captureAndAnalyze, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, isCorrect, captureAndAnalyze]);

  useEffect(() => {
    fetchScenario();
  }, [fetchScenario]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="min-h-screen bg-[#f2e1bb] text-[#4a3562] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(74,53,98,0.05),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,184,28,0.08),transparent_30%),radial-gradient(circle_at_10%_80%,rgba(255,184,28,0.05),transparent_30%)]" />

      <div className="relative max-w-6xl mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" className="rounded-full border-[#4a3562] text-[#4a3562] hover:bg-[#4a3562]/10">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div className="flex-1 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-[#b07b16]">Story Time</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#4a3562]">Cảm Xúc Theo Câu Chuyện</h1>
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
                <p className="text-sm font-semibold mb-1">Cách chơi</p>
                <p className="text-sm leading-relaxed">
                  Đọc câu chuyện, đoán cảm xúc phù hợp và thể hiện bằng khuôn mặt. Bấm Bắt đầu để bật camera, có thể mở gợi ý nếu cần.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
          {/* Story Card */}
          <Card className="p-6 md:p-8 bg-[#f7edce] border-[#d7c38e] shadow-[0_12px_30px_rgba(74,53,98,0.12)] rounded-3xl h-full flex flex-col">
            {!isCorrect ? (
              <div className="text-center space-y-6 flex-1 flex flex-col justify-center">
                <div className="text-8xl mb-2">{currentScenario.illustration}</div>
                <h2 className="text-3xl font-bold text-[#4a3562]">
                  {currentScenario.story}
                </h2>
                <p className="text-xl text-[#4a3562]/80">
                  Bạn sẽ cảm thấy như thế nào? Hãy thể hiện bằng khuôn mặt!
                </p>
                {isFetchingScenario && (
                  <p className="text-sm text-[#4a3562]/70">
                    Đang tải câu chuyện mới...
                  </p>
                )}

                {!showHint && (
                  <Button 
                    onClick={() => setShowHint(true)}
                    variant="outline"
                    size="lg"
                    className="text-lg rounded-full border-[#4a3562] text-[#4a3562] hover:bg-[#4a3562]/10"
                  >
                    💡 Cần gợi ý?
                  </Button>
                )}

                {showHint && (
                  <Card className="p-6 bg-white border-[#7a59a4]/40 inline-block rounded-2xl">
                    <div className="text-6xl mb-2">{currentScenario.emoji}</div>
                    <p className="text-xl text-[#4a3562] font-semibold">
                      Hãy thể hiện cảm xúc {currentScenario.correct_emotion}!
                    </p>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-center flex-1 flex flex-col justify-center animate-celebration">
                <Sparkles className="w-24 h-24 mx-auto text-[#5c3f7f] animate-spin" />
                <h2 className="text-4xl font-bold text-[#4a3562]">
                  🌟 Hoàn hảo! Bạn thật thông minh! 🌟
                </h2>
                <p className="text-2xl text-[#4a3562]/80">
                  Đó chính xác là cách tôi cũng sẽ cảm thấy!
                </p>
              </div>
            )}
          </Card>

          {/* Sidebar / Camera */}
          <div className="space-y-4 w-full">
            <div className="bg-[#fcbf25] text-[#4a3562] rounded-3xl shadow-[0_14px_28px_rgba(74,53,98,0.25)] p-6 relative overflow-hidden">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-16 h-16 bg-[#f7edce] rounded-full opacity-30" />
              <div className="space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Điểm</span>
                  <span className="text-xl font-bold">{score}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Trạng thái</span>
                  <span className="text-sm font-semibold">{isStreaming ? "Đang quay" : "Chưa quay"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Button
                    onClick={startCamera}
                    disabled={isStreaming || isFetchingScenario}
                    className="bg-[#4a3562] text-[#f7edce] hover:bg-[#3c2c50]"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Bắt đầu
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="destructive"
                    disabled={!isStreaming || isAnalyzing}
                  >
                    <CameraOff className="w-5 h-5 mr-2" />
                    Dừng lại
                  </Button>
                </div>
              </div>
            </div>

            <Card className="p-4 bg-[#f7edce] border-[#d7c38e] rounded-2xl text-center">
              <div className="relative bg-[#e9ddba] rounded-xl overflow-hidden aspect-video flex items-center justify-center flex-1">
                {!isStreaming ? (
                  <div className="text-center space-y-3 p-6 text-[#4a3562]/80">
                    <Camera className="w-16 h-16 mx-auto" />
                    <p className="text-lg">Nhấn Bắt đầu để bật camera và thể hiện cảm xúc cho câu chuyện.</p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game2;
