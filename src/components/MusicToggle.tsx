import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { toggleBackgroundMusic, isBackgroundMusicEnabled } from "@/lib/sounds";

export const MusicToggle = () => {
  const [isMusicOn, setIsMusicOn] = useState(isBackgroundMusicEnabled());

  useEffect(() => {
    setIsMusicOn(isBackgroundMusicEnabled());
  }, []);

  const handleToggle = () => {
    const newState = toggleBackgroundMusic();
    setIsMusicOn(newState);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg bg-white hover:bg-gray-100 border-2 border-[#4a3562]"
      title={isMusicOn ? "Tắt nhạc nền" : "Bật nhạc nền"}
    >
      {isMusicOn ? (
        <Volume2 className="h-6 w-6 text-[#4a3562]" />
      ) : (
        <VolumeX className="h-6 w-6 text-[#4a3562]" />
      )}
    </Button>
  );
};

