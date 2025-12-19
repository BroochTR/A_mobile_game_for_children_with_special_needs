import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gamepad2, BookOpen, Target, Puzzle } from "lucide-react";
import heroImage from "@/assets/hero-emotions.jpg";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link to="/" className="text-2xl md:text-3xl font-bold text-foreground">
            Emotion Friends
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Trẻ Em Là Những
            <br />
            <span className="text-accent">Nhà Khám Phá Cảm Xúc</span> Tuyệt Vời Nhất
          </h1>
          <Link to="/learn">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 rounded-full shadow-lg">
              Bắt Đầu Học
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 -mt-20 relative z-20">
        <Link to="/game3" className="block">
          <Card className="h-full bg-primary text-primary-foreground border-0 rounded-none p-8 text-center hover:opacity-90 transition-opacity">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background mb-6">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Emotion Memory</h3>
            <p className="text-primary-foreground/90 leading-relaxed">
              Trò chơi lật thẻ! Tìm các cặp khuôn mặt có cùng cảm xúc. Thử thách trí nhớ và nhận biết cảm xúc của bạn!
            </p>
          </Card>
        </Link>

        <Link to="/game1" className="block">
          <Card className="h-full bg-secondary text-secondary-foreground border-0 rounded-none p-8 text-center hover:opacity-90 transition-opacity">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background mb-6">
              <Gamepad2 className="w-10 h-10 text-secondary" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Mimic the Emotion</h3>
            <p className="text-secondary-foreground/90 leading-relaxed">
              Trò chơi tương tác vui nhộn nơi bạn bắt chước cảm xúc hiển thị trên màn hình và học cách nhận biết cảm xúc.
            </p>
          </Card>
        </Link>

        <Link to="/game2" className="block">
          <Card className="h-full bg-accent text-accent-foreground border-0 rounded-none p-8 text-center hover:opacity-90 transition-opacity">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background mb-6">
              <BookOpen className="w-10 h-10 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Story Time Emotions</h3>
            <p className="text-accent-foreground/90 leading-relaxed">
              Chọn cảm xúc phù hợp cho các tình huống hàng ngày thông qua những câu chuyện và tình huống hấp dẫn.
            </p>
          </Card>
        </Link>

        <Link to="/game4" className="block">
          <Card className="h-full bg-[#7a59a4] text-white border-0 rounded-none p-8 text-center hover:opacity-90 transition-opacity">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background mb-6">
              <Puzzle className="w-10 h-10 text-[#7a59a4]" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Emotion Puzzle</h3>
            <p className="text-white/90 leading-relaxed">
              Ghép các mảnh hình để tạo thành khuôn mặt hoàn chỉnh, sau đó đoán xem đó là cảm xúc gì!
            </p>
          </Card>
        </Link>
      </div>

      {/* About Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Chào mừng đến với Emotion Friends</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Ứng dụng trị liệu và giáo dục được thiết kế để giúp trẻ em có nhu cầu đặc biệt học cách nhận biết 
            và thể hiện cảm xúc. Thông qua các trò chơi sử dụng AI và hoạt động tương tác, trẻ em có thể luyện tập 
            biểu cảm khuôn mặt trong một môi trường an toàn, vui nhộn và khuyến khích.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
