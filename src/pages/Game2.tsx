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
    story: "You received a gift from your friend! 🎁",
    correct_emotion: "Happy",
    emoji: "😊",
    illustration: "🎁"
  },
  {
    id: 2,
    story: "Your favorite toy broke 💔",
    correct_emotion: "Sad",
    emoji: "😢",
    illustration: "🧸"
  },
  {
    id: 3,
    story: "Someone took your toy without asking 😤",
    correct_emotion: "Angry",
    emoji: "😠",
    illustration: "🎮"
  },
  {
    id: 4,
    story: "You found a magic surprise box! ✨",
    correct_emotion: "Surprise",
    emoji: "😮",
    illustration: "📦"
  },
  {
    id: 5,
    story: "You hear a loud noise in the dark 🌙",
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
        title: "Story time! 📖",
        description: "Show the right emotion for each story!"
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
          title: "🎉 Excellent!",
          description: result.message ?? "You understood the story perfectly!",
        });

        setTimeout(() => {
          setIsCorrect(null);
          setDetectedEmotion(null);
          fetchScenario();
        }, 3000);
      } else {
        toast({
          title: "Not quite! 🤔",
          description: result.message ?? "Try again! Think about how you would feel.",
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
              Story Time Emotions! 📖
            </h1>
          </div>
          
          <Card className="px-6 py-3 bg-success/10 border-success">
            <p className="text-2xl font-bold text-success">
              Score: {score} ⭐
            </p>
          </Card>
        </div>

        {!isCorrect && (
          <Card className="p-8 bg-accent/10 border-accent/30">
            <div className="text-center space-y-6">
              <div className="text-8xl mb-4">
                {currentScenario.illustration}
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                {currentScenario.story}
              </h2>
              <p className="text-2xl text-muted-foreground">
                How would you feel? Show me with your face!
              </p>
              {isFetchingScenario && (
                <p className="text-sm text-muted-foreground">
                  Loading a new story...
                </p>
              )}
              
              {!showHint && (
                <Button 
                  onClick={() => setShowHint(true)}
                  variant="outline"
                  size="lg"
                  className="text-lg"
                >
                  💡 Need a hint?
                </Button>
              )}

              {showHint && (
                <Card className="p-6 bg-primary/10 border-primary inline-block">
                  <div className="text-6xl mb-2">{currentScenario.emoji}</div>
                  <p className="text-xl text-primary font-semibold">
                    Try to feel {currentScenario.correct_emotion}!
                  </p>
                </Card>
              )}
            </div>
          </Card>
        )}

        {isCorrect && (
          <Card className="p-8 bg-success/10 border-success text-center animate-celebration">
            <div className="space-y-4">
              <Sparkles className="w-24 h-24 mx-auto text-success animate-spin" />
              <h2 className="text-4xl font-bold text-success">
                🌟 Perfect! You're so smart! 🌟
              </h2>
              <p className="text-2xl text-foreground">
                That's exactly how I would feel too!
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
                    Ready for stories? Click Start!
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
                  className="text-xl px-8 py-6 bg-accent"
                  disabled={isFetchingScenario}
                >
                  <Camera className="w-6 h-6 mr-2" />
                  {isFetchingScenario ? "Loading..." : "Start Stories"}
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
                  Stop Stories
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Game2;
