import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, Trophy, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type EmotionCard = {
  id: number;
  emotion: string;
  emoji: string;
  vietnamese: string;
  seed: string;
  imageName: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const EMOTIONS = [
  { emotion: "Happy", emoji: "😊", vietnamese: "Vui vẻ", seed: "happy", images: ["happy1", "happy2"] },
  { emotion: "Sad", emoji: "😢", vietnamese: "Buồn", seed: "sad", images: ["sad1", "sad2"] },
  { emotion: "Angry", emoji: "😠", vietnamese: "Giận dữ", seed: "angry", images: ["angry1", "angry2"] },
  { emotion: "Surprise", emoji: "😮", vietnamese: "Ngạc nhiên", seed: "surprise", images: ["surprise1", "surprise2"] },
  { emotion: "Fear", emoji: "😨", vietnamese: "Sợ hãi", seed: "fear", images: ["fear1", "fear2"] },
  { emotion: "Excited", emoji: "🤩", vietnamese: "Phấn khích", seed: "excited", images: ["excited1", "excited2"] },
  { emotion: "Shy", emoji: "😳", vietnamese: "Ngại ngùng", seed: "shy", images: ["shy1", "shy2"] },
  { emotion: "Disgusted", emoji: "🤢", vietnamese: "Chán ghét", seed: "disgusted", images: ["Disgusted1", "Disgusted2"] },
];

// Generate avatar URL - using local images
const getAvatarUrl = (imageName: string) => {
  try {
    // Use local images from assets/emotions folder
    return new URL(`../assets/emotions/${imageName}.png`, import.meta.url).href;
  } catch (error) {
    // Fallback to API if image not found
    console.warn(`Image not found for ${imageName}, using API fallback`);
    return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${imageName}&size=200&backgroundColor=transparent`;
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

const createCards = (): EmotionCard[] => {
  const cards: EmotionCard[] = [];
  let id = 0;
  
  EMOTIONS.forEach((emotion) => {
    // Create pairs using the 2 different images
    cards.push({
      id: id++,
      emotion: emotion.emotion,
      emoji: emotion.emoji,
      vietnamese: emotion.vietnamese,
      seed: emotion.seed,
      imageName: emotion.images[0], // First image
      isFlipped: false,
      isMatched: false,
    });
    cards.push({
      id: id++,
      emotion: emotion.emotion,
      emoji: emotion.emoji,
      vietnamese: emotion.vietnamese,
      seed: emotion.seed,
      imageName: emotion.images[1], // Second image
      isFlipped: false,
      isMatched: false,
    });
  });
  
  return shuffleArray(cards);
};

const Game3 = () => {
  const [cards, setCards] = useState<EmotionCard[]>(createCards);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { toast } = useToast();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const resetGame = useCallback(() => {
    setCards(createCards());
    setFlippedCards([]);
    setMoves(0);
    setIsChecking(false);
    setGameWon(false);
    setMatchedPairs(0);
    setTimeElapsed(0);
    setTimerRunning(false);
    toast({
      title: "🎮 Trò chơi mới!",
      description: "Hãy tìm các cặp cảm xúc giống nhau!",
    });
  }, [toast]);

  const handleCardClick = (cardId: number) => {
    if (isChecking) return;
    if (flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    if (!timerRunning) setTimerRunning(true);

    const newCards = cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);
    setFlippedCards([...flippedCards, cardId]);
  };

  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      setMoves(prev => prev + 1);

      const [firstId, secondId] = flippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.emotion === secondCard.emotion) {
        // Match found!
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c
            )
          );
          setFlippedCards([]);
          setIsChecking(false);
          setMatchedPairs(prev => prev + 1);
          
          toast({
            title: `🎉 Tuyệt vời!`,
            description: `Bạn đã tìm thấy cặp ${firstCard.vietnamese}!`,
          });
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === firstId || c.id === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [flippedCards, cards, toast]);

  useEffect(() => {
    if (matchedPairs === EMOTIONS.length && matchedPairs > 0) {
      setGameWon(true);
      toast({
        title: "🏆 Chúc mừng!",
        description: `Bạn đã hoàn thành với ${moves} lượt!`,
      });
      setTimerRunning(false);
    }
  }, [matchedPairs, moves, toast]);

  useEffect(() => {
    if (!timerRunning || gameWon) return;
    const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [timerRunning, gameWon]);

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
            <p className="text-sm uppercase tracking-[0.2em] text-[#b07b16]">Memory Game</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#4a3562]">Tìm Cặp Cảm Xúc</h1>
          </div>
          <div className="relative">
            <button
              className="w-10 h-10 rounded-full bg-[#4a3562] text-white flex items-center justify-center shadow-lg hover:bg-[#3c2c50] transition"
              onClick={() => setShowGuide((prev) => !prev)}
            >
              <span className="text-lg font-semibold">?</span>
            </button>
            {showGuide && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-[#4a3562] rounded-2xl shadow-xl border border-[#d7c38e] p-4 z-10">
                <p className="text-sm font-semibold mb-1">Cách chơi</p>
                <p className="text-sm leading-relaxed">
                  Lật 2 thẻ để tìm cặp cảm xúc giống nhau. Khi ghép đúng, thẻ sẽ biến mất.
                  Nhớ vị trí các thẻ để hoàn thành nhanh nhất!
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
          {/* Game Board */}
          {!gameWon ? (
            <Card className="p-4 md:p-6 bg-[#f7edce] border-[#d7c38e] shadow-[0_12px_30px_rgba(74,53,98,0.12)] rounded-3xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className={`aspect-square cursor-pointer transition-all duration-300 ${
                      card.isMatched ? "opacity-0 pointer-events-none scale-90" : "hover:-translate-y-1"
                    }`}
                    onClick={() => handleCardClick(card.id)}
                  >
                    <div
                      className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
                        card.isFlipped ? "rotate-y-180" : ""
                      }`}
                      style={{
                        transformStyle: "preserve-3d",
                        transform: card.isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                    >
                      {/* Card Back */}
                      <div
                        className="absolute inset-0 rounded-xl bg-[#5c3f7f] flex items-center justify-center shadow-[0_10px_20px_rgba(74,53,98,0.35)] border-4 border-[#7a59a4] backface-hidden"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <span className="text-4xl text-[#f7edce] drop-shadow">?</span>
                      </div>

                      {/* Card Front */}
                      <div
                        className="absolute inset-0 rounded-xl bg-white flex flex-col items-center justify-center shadow-[0_10px_20px_rgba(74,53,98,0.25)] border-4 border-[#7a59a4] p-2"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <img 
                          src={getAvatarUrl(card.imageName)} 
                          alt={card.emotion}
                          className="w-full h-full rounded-lg p-1"
                          style={{ 
                            objectFit: 'contain',
                            maxWidth: '100%',
                            maxHeight: '100%'
                          }}
                        />
                        <span className="mt-1 text-xs md:text-sm font-semibold text-[#4a3562] bg-[#f7edce] px-2 py-1 rounded-full">
                          {card.vietnamese}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-12 bg-gradient-to-br from-success/10 to-accent/10 border-success/50 text-center animate-celebration rounded-3xl shadow-card">
              <div className="space-y-6">
                <Sparkles className="w-24 h-24 mx-auto text-success animate-spin" />
                <Trophy className="w-20 h-20 mx-auto text-accent" />
                <h2 className="text-4xl font-bold text-foreground">
                  🎉 Xuất sắc! 🎉
                </h2>
                <p className="text-2xl text-success">
                  Bạn đã ghép đúng tất cả {EMOTIONS.length} cặp cảm xúc!
                </p>
                <p className="text-xl text-muted-foreground">
                  Hoàn thành với {moves} lượt chơi
                </p>
                <Button 
                  size="lg"
                  onClick={resetGame}
                  className="text-xl px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-full"
                >
                  <RotateCcw className="w-6 h-6 mr-2" />
                  Chơi lại
                </Button>
              </div>
            </Card>
          )}

          {/* Sidebar */}
          <div className="w-full">
            <div className="bg-[#fcbf25] text-[#4a3562] rounded-3xl shadow-[0_14px_28px_rgba(74,53,98,0.25)] p-6 relative overflow-hidden">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-16 h-16 bg-[#f7edce] rounded-full opacity-30" />
              <div className="space-y-4 relative">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Thời gian</span>
                  <span className="text-xl font-bold">{formatTime(timeElapsed)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Lượt thử</span>
                  <span className="text-xl font-bold">{moves}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Điểm</span>
                  <span className="text-xl font-bold">{matchedPairs} / {EMOTIONS.length}</span>
                </div>
                <Button
                  onClick={resetGame}
                  className="w-full mt-2 bg-[#4a3562] text-[#f7edce] hover:bg-[#3c2c50]"
                >
                  Chơi lại
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game3;
