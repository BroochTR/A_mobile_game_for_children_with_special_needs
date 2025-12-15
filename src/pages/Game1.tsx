import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera, CameraOff, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { detectEmotionForChallenge, getEmotionChallenge, type EmotionChallenge } from "@/lib/api";

type Challenge = EmotionChallenge & { description: string; imageUrl: string };

const EMOTION_ASSETS: Record<string, { names: string[]; emoji: string; vietnamese: string }> = {
  angry: { names: ["angry1", "angry2"], emoji: "😠", vietnamese: "Giận dữ" },
  fear: { names: ["fear1", "fear2"], emoji: "😨", vietnamese: "Sợ hãi" },
  happy: { names: ["happy1", "happy2"], emoji: "😊", vietnamese: "Vui vẻ" },
  sad: { names: ["sad1", "sad2"], emoji: "😢", vietnamese: "Buồn" },
  surprise: { names: ["surprise1", "surprise2"], emoji: "😮", vietnamese: "Ngạc nhiên" }
};

const getEmotionImage = (emotion: string) => {
  const key = emotion.toLowerCase();
  const asset = EMOTION_ASSETS[key];
  if (!asset) return null;
  const pick = asset.names[Math.floor(Math.random() * asset.names.length)];
  try {
    return new URL(`../assets/emotions/${pick}.png`, import.meta.url).href;
  } catch (error) {
    console.warn("Missing local emotion image", pick, error);
    return null;
  }
};

const EMOTION_INSTRUCTIONS: Record<string, string> = {
  Happy: "Hãy cười thật tươi!",
  Sad: "Hãy làm mặt buồn",
  Angry: "Hãy làm mặt giận dữ",
  Surprise: "Hãy tỏ ra ngạc nhiên!",
  Suprise: "Hãy tỏ ra ngạc nhiên!",
  Fear: "Hãy làm mặt sợ hãi"
};

const FALLBACK_CHALLENGES: Challenge[] = Object.entries(EMOTION_ASSETS)
  .map(([key, meta]) => {
    const emotionTitle = key.charAt(0).toUpperCase() + key.slice(1);
    return {
      emotion: emotionTitle,
      emoji: meta.emoji,
      vietnamese: meta.vietnamese,
      description: "Bắt chước khuôn mặt giống ảnh mẫu.",
      imageUrl: getEmotionImage(key) ?? ""
    };
  })
  .filter(ch => ch.imageUrl);

const enrichChallenge = (challenge: EmotionChallenge): Challenge => {
  const normalized = (challenge.emotion || "").toLowerCase();
  const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  const imageUrl = getEmotionImage(normalized);

  if (!imageUrl) {
    const fallback = FALLBACK_CHALLENGES[Math.floor(Math.random() * FALLBACK_CHALLENGES.length)];
    return fallback;
  }

  return {
    emotion: capitalized,
    emoji: challenge.emoji ?? EMOTION_ASSETS[normalized]?.emoji ?? "😊",
    vietnamese: challenge.vietnamese ?? EMOTION_ASSETS[normalized]?.vietnamese ?? capitalized,
    description: "Bắt chước khuôn mặt giống ảnh mẫu.",
    imageUrl
  };
};

const Game1 = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>(FALLBACK_CHALLENGES[0]);
  const [, setDetectedEmotion] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFetchingChallenge, setIsFetchingChallenge] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyzingRef = useRef(false);
  const [showGuide, setShowGuide] = useState(false);
  const { toast } = useToast();

  const fetchChallenge = useCallback(async () => {
    setIsFetchingChallenge(true);
    try {
      const data = await getEmotionChallenge();
      const normalized = (data.emotion || "").toLowerCase();
      if (!EMOTION_ASSETS[normalized]) {
        const fallback = FALLBACK_CHALLENGES[Math.floor(Math.random() * FALLBACK_CHALLENGES.length)];
        setCurrentChallenge(fallback);
      } else {
        setCurrentChallenge(enrichChallenge(data));
      }
    } catch (error) {
      const fallback = FALLBACK_CHALLENGES[Math.floor(Math.random() * FALLBACK_CHALLENGES.length)];
      setCurrentChallenge(fallback);
      toast({
        title: "Không thể tải thử thách mới",
        description: error instanceof Error ? error.message : "Sử dụng thử thách mặc định.",
        variant: "destructive"
      });
    } finally {
      setIsFetchingChallenge(false);
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
        title: "Đã bật camera! 📸",
        description: "Hãy quan sát hình mẫu, thể hiện cảm xúc tương ứng, rồi nhấn 'Chụp và kiểm tra'!"
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
    if (!videoRef.current || !canvasRef.current || analyzingRef.current) return;

    analyzingRef.current = true;
    setIsAnalyzing(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      analyzingRef.current = false;
      setIsAnalyzing(false);
      toast({
        title: "Không nhìn thấy khuôn mặt",
        description: "Hãy điều chỉnh vị trí hoặc ánh sáng để camera nhìn thấy khuôn mặt rõ hơn.",
        variant: "destructive"
      });
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    try {
      const image = canvas.toDataURL("image/jpeg", 0.9);
      const result = await detectEmotionForChallenge(image, currentChallenge.emotion);

      const predicted = result.emotion ?? result.detected_emotion ?? null;
      if (predicted) {
        setDetectedEmotion(predicted);
      }

      const normalizedDetected = predicted?.toLowerCase() ?? "";
      const normalizedTarget = currentChallenge.emotion.toLowerCase();
      const correct = result.is_correct ?? (normalizedDetected === normalizedTarget);
      setIsCorrect(correct);

      if (correct) {
        setScore(prev => prev + 10);
        toast({
          title: "Chính xác! Bạn đã thể hiện đúng cảm xúc!",
          description: "🎉 Tuyệt vời lắm! +10 điểm",
          className: "bg-green-50 border-green-500 text-green-900"
        });

        setTimeout(() => {
          setIsCorrect(null);
          setDetectedEmotion(null);
          fetchChallenge();
        }, 3000);
      } else {
        toast({
          title: "Chưa đúng. Hãy thử lại nhé!",
          description: predicted ? `Bạn đang thể hiện cảm xúc ${predicted}. Hãy cố gắng thêm nào!` : "Hãy quan sát kỹ hình mẫu và thử lại!",
          className: "bg-orange-50 border-orange-500 text-orange-900"
        });
        setIsCorrect(null);
        setDetectedEmotion(null);
      }
    } catch (error) {
      toast({
        title: "Không thể nhận diện khuôn mặt",
        description: "Hãy điều chỉnh vị trí hoặc ánh sáng để camera nhìn thấy khuôn mặt rõ hơn.",
        variant: "destructive"
      });
      analyzingRef.current = false;
      setIsAnalyzing(false);
    } finally {
      analyzingRef.current = false;
      setIsAnalyzing(false);
    }
  }, [currentChallenge, fetchChallenge, toast]);

  // Remove auto-capture interval - manual capture only

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

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
            <p className="text-sm uppercase tracking-[0.2em] text-[#b07b16]">Emotion Mimic</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#4a3562]">Bắt Chước Cảm Xúc</h1>
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
                  Nhìn vào ảnh mẫu và thể hiện lại cảm xúc tương ứng bằng khuôn mặt. Nhấn Bắt đầu để bật camera, hệ thống sẽ chấm điểm tự động.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
          {/* Challenge Card */}
          <Card className="p-6 md:p-8 bg-[#f7edce] border-[#d7c38e] shadow-[0_12px_30px_rgba(74,53,98,0.12)] rounded-3xl h-full flex flex-col">
            {!isCorrect ? (
              <div className="space-y-5 text-center flex-1 flex flex-col justify-center">
                <div className="mx-auto w-56 h-56 md:w-64 md:h-64 bg-white rounded-2xl border-4 border-[#7a59a4] overflow-hidden shadow-lg flex items-center justify-center">
                  <img
                    src={currentChallenge.imageUrl}
                    alt={currentChallenge.emotion}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h2 className="text-3xl font-bold text-[#4a3562]">
                  Hãy thể hiện cảm xúc tương ứng
                </h2>
                {isFetchingChallenge && (
                  <p className="text-sm text-[#4a3562]/70">
                    Đang tải thử thách mới...
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-5 text-center flex-1 flex flex-col justify-center animate-celebration relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-8xl animate-bounce">⭐</div>
                  <div className="text-6xl animate-pulse absolute top-10 left-10">✨</div>
                  <div className="text-6xl animate-pulse absolute top-10 right-10">✨</div>
                  <div className="text-6xl animate-pulse absolute bottom-10 left-20">⭐</div>
                  <div className="text-6xl animate-pulse absolute bottom-10 right-20">⭐</div>
                </div>
                <Sparkles className="w-24 h-24 mx-auto text-yellow-500 animate-spin" />
                <h2 className="text-4xl font-bold text-green-700">
                  🎉 Chính xác! Bạn đã thể hiện đúng cảm xúc! 🎉
                </h2>
                <p className="text-2xl text-[#4a3562]/80">
                  Đó là một khuôn mặt {currentChallenge.vietnamese} hoàn hảo!
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
                <div className="space-y-3 pt-1">
                  {!isStreaming ? (
                    <Button
                      onClick={startCamera}
                      disabled={isFetchingChallenge}
                      className="w-full bg-[#4a3562] text-[#f7edce] hover:bg-[#3c2c50] text-lg py-6"
                      size="lg"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Bắt đầu thử thách
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={captureAndAnalyze}
                        disabled={isAnalyzing || isFetchingChallenge}
                        className="w-full bg-green-600 text-white hover:bg-green-700 text-lg py-6"
                        size="lg"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        {isAnalyzing ? "Đang kiểm tra..." : "Chụp và kiểm tra"}
                      </Button>
                      <Button
                        onClick={stopCamera}
                        variant="destructive"
                        disabled={isAnalyzing}
                        className="w-full"
                      >
                        <CameraOff className="w-5 h-5 mr-2" />
                        Dừng lại
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Card className="p-4 bg-[#f7edce] border-[#d7c38e] rounded-2xl text-center">
              <div className="relative bg-[#e9ddba] rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                {!isStreaming ? (
                  <div className="text-center space-y-3 p-6 text-[#4a3562]/80">
                    <Camera className="w-16 h-16 mx-auto" />
                    <p className="text-lg">Nhấn "Bắt đầu thử thách" để khởi động camera. Sau đó quan sát hình mẫu và bắt chước lại cảm xúc đó!</p>
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

export default Game1;
