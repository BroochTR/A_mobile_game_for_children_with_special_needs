import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { detectEmotion } from "@/lib/api";

const EMOTION_EMOJIS: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  fear: "😨",
  surprise: "😮",
  suprise: "😮",
  neutral: "😐",
  disgust: "😨"
};

const EMOTION_COLORS: Record<string, string> = {
  happy: "text-success",
  sad: "text-primary",
  angry: "text-destructive",
  fear: "text-accent",
  surprise: "text-accent",
  suprise: "text-accent",
  neutral: "text-muted-foreground",
  disgust: "text-accent"
};

const EmotionDetect = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [detectedVietnamese, setDetectedVietnamese] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyzingRef = useRef(false);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      
      streamRef.current = stream;
      setIsStreaming(true);
      toast({
        title: "Camera đã khởi động! 📸",
        description: "Bây giờ hãy thể hiện cảm xúc của bạn!"
      });
    } catch (error) {
      toast({
        title: "Ối!",
        description: "Không thể khởi động camera. Vui lòng kiểm tra quyền truy cập.",
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
    setDetectedVietnamese(null);
    setConfidence(0);
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
      setIsAnalyzing(false);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    try {
      const image = canvas.toDataURL("image/jpeg", 0.9);
      const result = await detectEmotion(image);

      if (!result.success || !result.emotion) {
        toast({
          title: "Không thể nhận diện",
          description: result.message ?? "Vui lòng thử lại nhé!",
          variant: "destructive"
        });
        setDetectedEmotion(null);
        setDetectedVietnamese(null);
        setConfidence(0);
        return;
      }

      setDetectedEmotion(result.emotion);
      setDetectedVietnamese(result.vietnamese ?? null);
      setConfidence(result.confidence ?? 0);
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
  }, [toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStreaming) {
      interval = setInterval(captureAndAnalyze, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, captureAndAnalyze]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const normalizedEmotionKey = detectedEmotion?.toLowerCase();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Về trang chủ
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground">
            Luyện Tập Cảm Xúc! 📸
          </h1>
        </div>

        <Card className="p-6 bg-card">
          <div className="space-y-6">
            <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {!isStreaming ? (
                <div className="text-center space-y-4">
                  <Camera className="w-24 h-24 mx-auto text-muted-foreground" />
                  <p className="text-2xl text-muted-foreground">
                    Nhấn Bắt đầu để bắt đầu!
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
                  className="text-xl px-8 py-6 bg-primary"
                >
                  <Camera className="w-6 h-6 mr-2" />
                  Bắt đầu Camera
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
                  Dừng Camera
                </Button>
              )}
            </div>

            {detectedEmotion && (
              <Card className="p-8 bg-primary/10 border-primary animate-scale-in">
                <div className="text-center space-y-4">
                  <div className="text-8xl animate-bounce-gentle">
                    {normalizedEmotionKey ? EMOTION_EMOJIS[normalizedEmotionKey] : "🤔"}
                  </div>
                  <h3 className={`text-4xl font-bold ${normalizedEmotionKey ? EMOTION_COLORS[normalizedEmotionKey] : "text-foreground"}`}>
                    {detectedEmotion}!
                  </h3>
                  {detectedVietnamese && (
                    <p className="text-2xl text-primary font-semibold">
                      ({detectedVietnamese})
                    </p>
                  )}
                  <p className="text-xl text-muted-foreground">
                    Tôi chắc chắn {Math.round((confidence || 0) * 100)}%! 🎯
                  </p>
                </div>
              </Card>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-accent/10 border-accent/30">
          <p className="text-xl text-center text-foreground">
            💡 <strong>Mẹo:</strong> Hãy thử làm các khuôn mặt khác nhau! Vui, buồn, ngạc nhiên, hoặc giận dữ. 
            Camera sẽ cho bạn biết cảm xúc mà nó nhìn thấy!
          </p>
        </Card>
      </div>
    </div>
  );
};

export default EmotionDetect;

