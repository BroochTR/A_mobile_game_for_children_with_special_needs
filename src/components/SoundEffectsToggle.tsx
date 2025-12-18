import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { 
  toggleSoundEffects,
  isSoundEffectsEnabled 
} from "@/lib/sounds";

export const SoundEffectsToggle = () => {
  const [isSoundOn, setIsSoundOn] = useState(isSoundEffectsEnabled());

  useEffect(() => {
    setIsSoundOn(isSoundEffectsEnabled());
  }, []);

  const handleSoundToggle = () => {
    const newState = toggleSoundEffects();
    setIsSoundOn(newState);
  };

  return (
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
  );
};

