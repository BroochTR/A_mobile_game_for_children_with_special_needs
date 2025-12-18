import { useState, useEffect } from "react";
import { Volume2, VolumeX, Music, Music2 } from "lucide-react";
import { 
  toggleBackgroundMusic, 
  isBackgroundMusicEnabled,
  toggleSoundEffects,
  isSoundEffectsEnabled 
} from "@/lib/sounds";

export const SoundToggle = () => {
  const [isMusicOn, setIsMusicOn] = useState(isBackgroundMusicEnabled());
  const [isSoundOn, setIsSoundOn] = useState(isSoundEffectsEnabled());

  useEffect(() => {
    setIsMusicOn(isBackgroundMusicEnabled());
    setIsSoundOn(isSoundEffectsEnabled());
  }, []);

  const handleMusicToggle = () => {
    const newState = toggleBackgroundMusic();
    setIsMusicOn(newState);
  };

  const handleSoundToggle = () => {
    const newState = toggleSoundEffects();
    setIsSoundOn(newState);
  };

  return (
    <div className="flex gap-2">
      {/* Nhạc nền */}
      <button
        onClick={handleMusicToggle}
        className="w-10 h-10 rounded-full bg-[#4a3562] text-white flex items-center justify-center shadow-lg hover:bg-[#3c2c50] transition"
        title={isMusicOn ? "Tắt nhạc nền" : "Bật nhạc nền"}
      >
        {isMusicOn ? (
          <Music className="w-5 h-5" />
        ) : (
          <Music2 className="w-5 h-5 opacity-50" />
        )}
      </button>

      {/* Âm thanh hiệu ứng */}
      <button
        onClick={handleSoundToggle}
        className="w-10 h-10 rounded-full bg-[#4a3562] text-white flex items-center justify-center shadow-lg hover:bg-[#3c2c50] transition"
        title={isSoundOn ? "Tắt âm thanh hiệu ứng" : "Bật âm thanh hiệu ứng"}
      >
        {isSoundOn ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5 opacity-50" />
        )}
      </button>
    </div>
  );
};

