import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera, CameraOff, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { detectEmotionForChallenge, getEmotionChallenge, type EmotionChallenge } from "@/lib/api";

type Challenge = EmotionChallenge & { description: string };

const EMOTION_INSTRUCTIONS: Record<string, string> = {
  Happy: "Show me a big smile!",
  Sad: "Make a sad face",
  Angry: "Show me an angry face",
  Surprise: "Look surprised!",
  Suprise: "Look surprised!",
  Fear: "Make a scared face",
  Neutral: "Stay calm and relaxed"
};

const FALLBACK_CHALLENGES: Challenge[] = [
  { emotion: "Happy", emoji: "😊", vietnamese: "Vui", description: EMOTION_INSTRUCTIONS.Happy },
  { emotion: "Sad", emoji: "😢", vietnamese: "Buồn", description: EMOTION_INSTRUCTIONS.Sad },
  { emotion: "Angry", emoji: "😠", vietnamese: "Giận", description: EMOTION_INSTRUCTIONS.Angry },
  { emotion: "Surprise", emoji: "😮", vietnamese: "Ngạc nhiên", description: EMOTION_INSTRUCTIONS.Surprise },
  { emotion: "Fear", emoji: "😨", vietnamese: "Sợ hãi", description: EMOTION_INSTRUCTIONS.Fear },
  { emotion: "Neutral", emoji: "😐", vietnamese: "Trung tính", description: EMOTION_INSTRUCTIONS.Neutral }
];

const enrichChallenge = (challenge: EmotionChallenge): Challenge => {
  const normalized = challenge.emotion || "";
  const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  const description = EMOTION_INSTRUCTIONS[normalized] 
    ?? EMOTION_INSTRUCTIONS[capitalized] 
    ?? `Try to feel ${capitalized || "this emotion"}!`;

  return {
    ...challenge,
    description
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
  const { toast } = useToast();

  const fetchChallenge = useCallback(async () => {
    setIsFetchingChallenge(true);
    try {
      const data = await getEmotionChallenge();
      setCurrentChallenge(enrichChallenge(data));
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
        title: "Let's play! 🎮",
        description: "Try to make the emotion shown above!"
      });
    } catch (error) {
      toast({
        title: "Oops!",
        description: "We couldn't start the camera.",
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
        setScore(prev => prev + 1);
        toast({
          title: "🎉 Perfect!",
          description: result.message ?? "You got it right! Great job!",
        });

        setTimeout(() => {
          setIsCorrect(null);
          setDetectedEmotion(null);
          fetchChallenge();
        }, 3000);
      } else {
        toast({
          title: "Chưa đúng rồi!",
          description: result.message ?? "Hãy thử lại cảm xúc này nhé!",
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
  }, [currentChallenge, fetchChallenge, toast]);

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
    fetchChallenge();
  }, [fetchChallenge]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="lg">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Mimic the Emotion! 🎮
            </h1>
          </div>
          
          <Card className="px-6 py-3 bg-success/10 border-success">
            <p className="text-2xl font-bold text-success">
              Score: {score} 🌟
            </p>
          </Card>
        </div>

        {!isCorrect && (
          <Card className="p-8 bg-primary/10 border-primary/30 text-center">
            <div className="space-y-4">
              <div className="text-9xl animate-pulse-soft">
                {currentChallenge.emoji}
              </div>
              <h2 className="text-3xl font-bold text-primary">
                {currentChallenge.description}
              </h2>
              <p className="text-xl text-muted-foreground">
                Try to feel {currentChallenge.vietnamese} ({currentChallenge.emotion}) with your face!
              </p>
              {isFetchingChallenge && (
                <p className="text-sm text-muted-foreground">
                  Loading a fresh challenge...
                </p>
              )}
            </div>
          </Card>
        )}

        {isCorrect && (
          <Card className="p-8 bg-success/10 border-success text-center animate-celebration">
            <div className="space-y-4">
              <Sparkles className="w-24 h-24 mx-auto text-success animate-spin" />
              <h2 className="text-4xl font-bold text-success">
                🎉 Amazing! You did it! 🎉
              </h2>
              <p className="text-2xl text-foreground">
                That was a perfect {currentChallenge.vietnamese} face!
              </p>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-card">
          <div className="space-y-6">
            <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {!isStreaming ? (
                <div className="text-center space-y-4">
                  <Camera className="w-24 h-24 mx-auto text-muted-foreground" />
                  <p className="text-2xl text-muted-foreground">
                    Ready to play? Click Start!
                  </p>
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

            <div className="flex gap-4 justify-center">
              {!isStreaming ? (
                <Button 
                  size="lg" 
                  onClick={startCamera}
                  className="text-xl px-8 py-6 bg-secondary"
                  disabled={isFetchingChallenge}
                >
                  <Camera className="w-6 h-6 mr-2" />
                  {isFetchingChallenge ? "Loading..." : "Start Game"}
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  onClick={stopCamera}
                  variant="destructive"
                  className="text-xl px-8 py-6"
                  disabled={isAnalyzing}
                >
                  <CameraOff className="w-6 h-6 mr-2" />
                  Stop Game
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Game1;
