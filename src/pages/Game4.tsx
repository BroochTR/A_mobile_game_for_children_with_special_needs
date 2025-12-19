import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Trophy, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { playCorrectSound, playWrongSound, playWinSound, playBackgroundMusic, stopBackgroundMusic } from "@/lib/sounds";
import { SoundToggle } from "@/components/SoundToggle";

type DifficultyLevel = {
  name: string;
  gridSize: number;
  pieces: number;
  label: string;
};

const DIFFICULTIES: DifficultyLevel[] = [
  { name: "easy", gridSize: 2, pieces: 4, label: "Dễ" },
  { name: "medium", gridSize: 3, pieces: 9, label: "Bình thường" },
  { name: "hard", gridSize: 4, pieces: 16, label: "Khó" }
];

type EmotionData = {
  emotion: string;
  vietnamese: string;
  images: string[];
};

const EMOTIONS: EmotionData[] = [
  { emotion: "Happy", vietnamese: "Vui vẻ", images: ["happy1", "happy2"] },
  { emotion: "Sad", vietnamese: "Buồn", images: ["sad1", "sad2"] },
  { emotion: "Angry", vietnamese: "Giận dữ", images: ["angry1", "angry2"] },
  { emotion: "Surprise", vietnamese: "Ngạc nhiên", images: ["surprise1", "surprise2"] },
  { emotion: "Fear", vietnamese: "Sợ hãi", images: ["fear1", "fear2"] },
  { emotion: "Excited", vietnamese: "Phấn khích", images: ["excited1", "excited2"] },
  { emotion: "Shy", vietnamese: "Ngại ngùng", images: ["shy1", "shy2"] },
];

type PuzzlePiece = {
  id: number;
  correctPosition: number;
  currentPosition: number;
};

const Game4 = () => {
  const [gameState, setGameState] = useState<"select" | "playing" | "quiz" | "complete">("select");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DIFFICULTIES[0]);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [quizOptions, setQuizOptions] = useState<EmotionData[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completionTime, setCompletionTime] = useState(0);
  const { toast } = useToast();

  const getImageUrl = (imageName: string) => {
    try {
      return new URL(`../assets/emotions/${imageName}.png`, import.meta.url).href;
    } catch (error) {
      console.error(`Image not found: ${imageName}`);
      return "";
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const startGame = useCallback((selectedDifficulty: DifficultyLevel) => {
    setDifficulty(selectedDifficulty);
    
    // Select random emotion and image
    const randomEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
    const randomImage = randomEmotion.images[Math.floor(Math.random() * randomEmotion.images.length)];
    
    setCurrentEmotion(randomEmotion);
    setCurrentImage(getImageUrl(randomImage));
    
    // Create puzzle pieces
    const totalPieces = selectedDifficulty.pieces;
    const initialPieces: PuzzlePiece[] = Array.from({ length: totalPieces }, (_, i) => ({
      id: i,
      correctPosition: i,
      currentPosition: i,
    }));
    
    // Shuffle pieces
    const shuffledPieces = shuffleArray(initialPieces);
    shuffledPieces.forEach((piece, index) => {
      piece.currentPosition = index;
    });
    
    setPieces(shuffledPieces);
    setMoves(0);
    setGameState("playing");
    setSelectedAnswer(null);
    setShowResult(false);
    setHintRevealed(false);
    setTimeElapsed(0);
    setTimerRunning(true);
    
    // Start background music
    if (!musicStarted) {
      playBackgroundMusic();
      setMusicStarted(true);
    }
    
    toast({
      title: "Bắt đầu ghép hình! 🧩",
      description: `Kéo và thả các mảnh để hoàn thành bức tranh cảm xúc!`
    });
  }, [toast, musicStarted]);

  const handleDragStart = (pieceId: number) => {
    setDraggedPiece(pieceId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetPosition: number) => {
    if (draggedPiece === null) return;

    const draggedPieceData = pieces.find(p => p.id === draggedPiece);
    const targetPieceData = pieces.find(p => p.currentPosition === targetPosition);

    if (!draggedPieceData || !targetPieceData) return;

    // Swap positions
    const newPieces = pieces.map(piece => {
      if (piece.id === draggedPiece) {
        return { ...piece, currentPosition: targetPosition };
      }
      if (piece.currentPosition === targetPosition) {
        return { ...piece, currentPosition: draggedPieceData.currentPosition };
      }
      return piece;
    });

    setPieces(newPieces);
    setMoves(prev => prev + 1);
    setDraggedPiece(null);

    // Check if puzzle is complete
    const isComplete = newPieces.every(piece => piece.correctPosition === piece.currentPosition);
    
    if (isComplete) {
      playWinSound();
      toast({
        title: "Hoàn thành! 🎉",
        description: "Bạn đã ghép xong! Giờ hãy đoán xem đây là cảm xúc gì nhé!",
        className: "bg-green-50 border-green-500 text-green-900"
      });
      
      setTimeout(() => {
        prepareQuiz();
      }, 2000);
    }
  };

  const prepareQuiz = () => {
    if (!currentEmotion) return;

    // Create quiz options (correct answer + 3 random wrong answers)
    const wrongOptions = EMOTIONS.filter(e => e.emotion !== currentEmotion.emotion);
    const shuffledWrong = shuffleArray(wrongOptions);
    const options = shuffleArray([currentEmotion, ...shuffledWrong.slice(0, 3)]);
    
    setQuizOptions(options);
    setGameState("quiz");
  };

  const handleQuizAnswer = (selectedEmotion: string) => {
    setSelectedAnswer(selectedEmotion);
    setShowResult(true);

    if (selectedEmotion === currentEmotion?.emotion) {
      // Stop timer and save completion time
      setTimerRunning(false);
      setCompletionTime(timeElapsed);
      
      playCorrectSound();
      const baseScore = difficulty.name === "easy" ? 10 : difficulty.name === "medium" ? 20 : 30;
      const moveBonus = Math.max(0, 10 - Math.floor(moves / difficulty.pieces));
      const totalScore = baseScore + moveBonus;
      
      setScore(prev => prev + totalScore);
      
      toast({
        title: "Chính xác! 🎉",
        description: `Đúng rồi! Đó là cảm xúc ${currentEmotion?.vietnamese}. +${totalScore} điểm!`,
        className: "bg-green-50 border-green-500 text-green-900"
      });
      
      setTimeout(() => {
        setGameState("complete");
      }, 2000);
    } else {
      playWrongSound();
      toast({
        title: "Chưa đúng! 🤔",
        description: `Hãy thử lại! Đó không phải là cảm xúc ${EMOTIONS.find(e => e.emotion === selectedEmotion)?.vietnamese}.`,
        className: "bg-orange-50 border-orange-500 text-orange-900"
      });
      
      // Allow retry
      setTimeout(() => {
        setSelectedAnswer(null);
        setShowResult(false);
      }, 2000);
    }
  };

  const resetGame = () => {
    setGameState("select");
    setCurrentEmotion(null);
    setCurrentImage("");
    setPieces([]);
    setMoves(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setMusicStarted(false);
    setHintRevealed(false);
    setTimeElapsed(0);
    setTimerRunning(false);
    setCompletionTime(0);
    setScore(0);
  };

  const continuePlay = () => {
    // Chơi tiếp - giữ nguyên điểm
    startGame(difficulty);
  };

  const playAgainSameDifficulty = () => {
    // Chơi lại - reset điểm về 0
    setScore(0);
    startGame(difficulty);
  };

  const toggleHint = () => {
    setHintRevealed(prev => !prev);
    if (!hintRevealed) {
      toast({
        title: "Gợi ý đã được mở! 👀",
        description: "Nhìn kỹ hình mẫu để ghép đúng nhé!"
      });
    }
  };

  // Timer effect
  useEffect(() => {
    if (!timerRunning) return;
    const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [timerRunning]);

  // Cleanup background music on unmount
  useEffect(() => {
    return () => {
      stopBackgroundMusic();
    };
  }, []);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Sort pieces by current position for rendering
  const sortedPieces = [...pieces].sort((a, b) => a.currentPosition - b.currentPosition);

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
            <p className="text-sm uppercase tracking-[0.2em] text-[#b07b16]">Puzzle Game</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#4a3562]">Ghép Hình Cảm Xúc</h1>
          </div>
          <div className="flex gap-2 items-center">
            <SoundToggle />
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
                    Chọn độ khó, kéo và thả các mảnh ghép để hoàn thành bức tranh khuôn mặt. 
                    Sau khi ghép xong, đoán xem đó là cảm xúc gì!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Difficulty Selection */}
        {gameState === "select" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 md:p-12 bg-[#f7edce] border-[#d7c38e] shadow-[0_12px_30px_rgba(74,53,98,0.12)] rounded-3xl">
              <div className="text-center space-y-8">
                <div>

                  <h2 className="text-3xl font-bold text-[#4a3562] mb-3">Chọn Độ Khó</h2>
                  <p className="text-lg text-[#4a3562]/80">
                    Chọn số mảnh ghép bạn muốn thử thách!
                  </p>
                </div>

                <div className="space-y-4">
                  {DIFFICULTIES.map((diff) => (
                    <Button
                      key={diff.name}
                      onClick={() => startGame(diff)}
                      className="w-full bg-[#4a3562] text-[#f7edce] hover:bg-[#3c2c50] text-xl py-8 rounded-2xl shadow-lg"
                      size="lg"
                    >
                      <span className="flex items-center justify-between w-full">
                        <span>{diff.label}</span>
                        <span className="text-sm opacity-80">{diff.gridSize}×{diff.gridSize}</span>
                      </span>
                    </Button>
                  ))}
                </div>

                {score > 0 && (
                  <div className="mt-6 p-4 bg-[#fcbf25] rounded-2xl">
                    <p className="text-lg font-semibold">
                      Tổng điểm: <span className="text-2xl">{score}</span>
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Playing State */}
        {gameState === "playing" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            {/* Puzzle Board */}
            <Card className="p-6 md:p-8 bg-[#f7edce] border-[#d7c38e] shadow-[0_12px_30px_rgba(74,53,98,0.12)] rounded-3xl">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-[#4a3562] mb-2">
                    Ghép các mảnh lại với nhau!
                  </h2>
                  <p className="text-[#4a3562]/70">
                    Kéo và thả để hoán đổi vị trí các mảnh
                  </p>
                </div>

                <div 
                  className="mx-auto bg-white rounded-2xl p-4 shadow-inner"
                  style={{ 
                    maxWidth: difficulty.gridSize === 2 ? '400px' : difficulty.gridSize === 3 ? '450px' : '500px' 
                  }}
                >
                  <div 
                    className="grid gap-1"
                    style={{ 
                      gridTemplateColumns: `repeat(${difficulty.gridSize}, 1fr)`,
                      gridTemplateRows: `repeat(${difficulty.gridSize}, 1fr)`
                    }}
                  >
                    {sortedPieces.map((piece) => (
                      <div
                        key={piece.currentPosition}
                        className="aspect-square cursor-move hover:opacity-80 transition-opacity"
                        draggable
                        onDragStart={() => handleDragStart(piece.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(piece.currentPosition)}
                      >
                        <div
                          className="w-full h-full bg-cover bg-no-repeat border-2 border-[#4a3562]/20 rounded"
                          style={{
                            backgroundImage: `url(${currentImage})`,
                            backgroundSize: `${difficulty.gridSize * 100}%`,
                            backgroundPosition: `${(piece.correctPosition % difficulty.gridSize) * (100 / (difficulty.gridSize - 1))}% ${Math.floor(piece.correctPosition / difficulty.gridSize) * (100 / (difficulty.gridSize - 1))}%`
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Sidebar */}
            <div className="lg:w-64 space-y-4">
              <div className="bg-[#fcbf25] text-[#4a3562] rounded-3xl shadow-[0_14px_28px_rgba(74,53,98,0.25)] p-6 relative overflow-hidden">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-16 h-16 bg-[#f7edce] rounded-full opacity-30" />
                <div className="space-y-4 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Độ khó</span>
                    <span className="text-sm font-bold">{difficulty.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Thời gian</span>
                    <span className="text-xl font-bold">{formatTime(timeElapsed)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Số nước</span>
                    <span className="text-xl font-bold">{moves}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Điểm</span>
                    <span className="text-xl font-bold">{score}</span>
                  </div>
                  <Button
                    onClick={resetGame}
                    className="w-full bg-[#4a3562] text-[#f7edce] hover:bg-[#3c2c50]"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Chọn lại
                  </Button>
                </div>
              </div>

              {/* Preview hint (blurred) */}
              <Card className="p-4 bg-[#f7edce] border-[#d7c38e] rounded-2xl">
                <p className="text-sm font-semibold text-center mb-2">Gợi ý</p>
                <button
                  onClick={toggleHint}
                  className="relative w-full transition-all hover:opacity-90 cursor-pointer group"
                >
                  <img 
                    src={currentImage} 
                    alt="Preview" 
                    className={`w-full rounded-lg transition-all duration-500 ${
                      hintRevealed ? "blur-none opacity-100" : "blur-xl opacity-40"
                    }`}
                  />
                  {!hintRevealed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-lg group-hover:bg-black/30 transition-colors">
                      <span className="text-4xl mb-2">👁️</span>
                      <span className="text-xs font-semibold text-[#4a3562] bg-[#fcbf25] px-3 py-1 rounded-full shadow">
                        Nhấn để xem gợi ý
                      </span>
                    </div>
                  )}
                  {hintRevealed}
                </button>
              </Card>
            </div>
          </div>
        )}

        {/* Quiz State */}
        {gameState === "quiz" && currentEmotion && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 md:p-12 bg-[#f7edce] border-[#d7c38e] shadow-[0_12px_30px_rgba(74,53,98,0.12)] rounded-3xl">
              <div className="text-center space-y-8">
                <div>
                  <Sparkles className="w-16 h-16 mx-auto text-[#fcbf25] mb-4" />
                  <h2 className="text-3xl font-bold text-[#4a3562] mb-4">
                    Bức tranh đã hoàn thành!
                  </h2>
                  <p className="text-xl text-[#4a3562]/80 mb-6">
                    Giờ hãy cho tôi biết, đây là cảm xúc gì nhé?
                  </p>
                </div>

                {/* Completed puzzle */}
                <div className="mx-auto w-64 h-64 rounded-2xl overflow-hidden shadow-xl border-4 border-[#7a59a4]">
                  <img 
                    src={currentImage} 
                    alt="Completed puzzle" 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Quiz options */}
                <div className="grid grid-cols-2 gap-4">
                  {quizOptions.map((option) => (
                    <Button
                      key={option.emotion}
                      onClick={() => !showResult && handleQuizAnswer(option.emotion)}
                      disabled={showResult}
                      className={`py-8 text-lg rounded-2xl transition-all ${
                        showResult && selectedAnswer === option.emotion
                          ? option.emotion === currentEmotion.emotion
                            ? "bg-green-500 hover:bg-green-500 text-white"
                            : "bg-red-500 hover:bg-red-500 text-white"
                          : showResult && option.emotion === currentEmotion.emotion
                          ? "bg-green-500 hover:bg-green-500 text-white"
                          : "bg-[#4a3562] text-[#f7edce] hover:bg-[#3c2c50]"
                      }`}
                    >
                      {option.vietnamese}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Complete State */}
        {gameState === "complete" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 md:p-12 bg-[#f7edce] border-[#d7c38e] shadow-[0_12px_30px_rgba(74,53,98,0.12)] rounded-3xl animate-celebration relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="text-9xl animate-bounce">⭐</div>
                <div className="text-7xl animate-pulse absolute top-10 left-10">✨</div>
                <div className="text-7xl animate-pulse absolute top-10 right-10">✨</div>
                <div className="text-7xl animate-pulse absolute bottom-10 left-20">⭐</div>
                <div className="text-7xl animate-pulse absolute bottom-10 right-20">⭐</div>
              </div>

              <div className="text-center space-y-6 relative">
                <Trophy className="w-24 h-24 mx-auto text-[#fcbf25]" />
                <h2 className="text-4xl font-bold text-[#4a3562]">
                  Xuất sắc! 🎉
                </h2>
                <p className="text-2xl text-[#7a59a4] font-semibold">
                  Bạn đã hoàn thành puzzle và đoán đúng cảm xúc!
                </p>
                
                <div className="bg-[#fcbf25] rounded-2xl p-6 inline-block">
                  <p className="text-lg font-semibold mb-2">Thành tích</p>
                  <div className="space-y-2 text-left">
                    <p>🧩 Độ khó: <span className="font-bold">{difficulty.label}</span></p>
                    <p>⏱️ Thời gian: <span className="font-bold">{formatTime(completionTime)}</span></p>
                    <p>👣 Số nước: <span className="font-bold">{moves}</span></p>
                    <p>⭐ Tổng điểm: <span className="font-bold text-2xl">{score}</span></p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 max-w-md mx-auto">
                  <Button
                    onClick={continuePlay}
                    className="w-full bg-[#fcbf25] text-[#4a3562] hover:bg-[#f0b020] text-lg py-6 rounded-full font-bold"
                    size="lg"
                  >
                    Chơi tiếp
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={playAgainSameDifficulty}
                      className="flex-1 bg-[#4a3562] text-[#f7edce] hover:bg-[#3c2c50] text-lg py-6 rounded-full"
                      size="lg"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Chơi lại
                    </Button>
                    <Button
                      onClick={resetGame}
                      variant="outline"
                      className="flex-1 border-[#4a3562] text-[#4a3562] hover:bg-[#4a3562]/10 text-lg py-6 rounded-full"
                      size="lg"
                    >
                      Chọn độ khó khác
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game4;

