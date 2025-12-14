import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Mail, Phone, Camera, Gamepad2, BookOpen } from "lucide-react";
import heroImage from "@/assets/hero-emotions.jpg";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Top Info Bar */}
      <div className="bg-primary text-primary-foreground py-3">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-sm md:text-base">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span>Supporting Children's Emotional Development</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <span>contact@emotionfriends.com</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            <span>+1 (555) 123-4567</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl md:text-3xl font-bold text-foreground">
            Emotion Friends
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
              Home
            </Link>
            <Link to="/detect" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Practice
            </Link>
            <Link to="/game1" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Games
            </Link>
            <a href="#about" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              About
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Contact
            </a>
          </div>
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
            Children Are The Best
            <br />
            <span className="text-accent">Emotion Explorers</span> In The World
          </h1>
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 rounded-full shadow-lg">
            Start Learning
          </Button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 -mt-20 relative z-20">
        <Link to="/detect" className="block">
          <Card className="h-full bg-primary text-primary-foreground border-0 rounded-none p-8 text-center hover:opacity-90 transition-opacity">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background mb-6">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Practice Emotions</h3>
            <p className="text-primary-foreground/90 leading-relaxed">
              Use your camera to practice making different facial expressions and get instant feedback on your emotions.
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
              Fun interactive games where you copy emotions shown on screen and learn to recognize feelings.
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
              Choose the right emotion for everyday situations through engaging stories and scenarios.
            </p>
          </Card>
        </Link>
      </div>

      {/* About Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Welcome to Emotion Friends</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            A therapeutic and educational application designed to help children with special needs learn to recognize 
            and express emotions. Through AI-powered games and interactive activities, children can practice facial 
            expressions in a safe, playful, and encouraging environment.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
