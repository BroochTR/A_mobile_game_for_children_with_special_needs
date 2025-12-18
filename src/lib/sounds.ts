const audioCache: { [key: string]: HTMLAudioElement } = {};

const loadAudio = (filename: string): HTMLAudioElement => {
  if (!audioCache[filename]) {
    audioCache[filename] = new Audio(`/sounds/${filename}`);
    audioCache[filename].load();
  }
  return audioCache[filename];
};

const playAudio = (filename: string, volume: number = 0.5) => {
  try {
    const audio = loadAudio(filename);
    const audioClone = audio.cloneNode() as HTMLAudioElement;
    audioClone.volume = volume;
    audioClone.play().catch(error => {
      console.warn(`Could not play ${filename}:`, error);
    });
  } catch (error) {
    console.warn(`Error loading sound ${filename}:`, error);
  }
};

let backgroundMusic: HTMLAudioElement | null = null;
const BG_MUSIC_VOLUME = 0.15;

const getBGMusicEnabled = (): boolean => {
  const saved = localStorage.getItem('bgMusicEnabled');
  return saved === null ? true : saved === 'true';
};

const setBGMusicEnabled = (enabled: boolean) => {
  localStorage.setItem('bgMusicEnabled', enabled.toString());
};

const getSoundEffectsEnabled = (): boolean => {
  const saved = localStorage.getItem('soundEffectsEnabled');
  return saved === null ? true : saved === 'true';
};

const setSoundEffectsEnabled = (enabled: boolean) => {
  localStorage.setItem('soundEffectsEnabled', enabled.toString());
};

export const playBackgroundMusic = () => {
  try {
    if (!getBGMusicEnabled()) return;

    if (!backgroundMusic) {
      backgroundMusic = loadAudio('background.mp3');
      backgroundMusic.loop = true;
      backgroundMusic.volume = BG_MUSIC_VOLUME;
    }

    if (backgroundMusic.paused) {
      backgroundMusic.play().catch(error => {
        console.warn('Could not play background music:', error);
      });
    }
  } catch (error) {
    console.warn('Error loading background music:', error);
  }
};

export const stopBackgroundMusic = () => {
  if (backgroundMusic && !backgroundMusic.paused) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }
};

export const pauseBackgroundMusic = () => {
  if (backgroundMusic && !backgroundMusic.paused) {
    backgroundMusic.pause();
  }
};

export const resumeBackgroundMusic = () => {
  if (backgroundMusic && backgroundMusic.paused && getBGMusicEnabled()) {
    backgroundMusic.play().catch(error => {
      console.warn('Could not resume background music:', error);
    });
  }
};

export const toggleBackgroundMusic = (): boolean => {
  const currentState = getBGMusicEnabled();
  const newState = !currentState;
  setBGMusicEnabled(newState);

  if (newState) {
    playBackgroundMusic();
  } else {
    pauseBackgroundMusic();
  }

  return newState;
};

export const isBackgroundMusicEnabled = (): boolean => {
  return getBGMusicEnabled();
};

export const setBackgroundMusicVolume = (volume: number) => {
  if (backgroundMusic) {
    backgroundMusic.volume = Math.max(0, Math.min(1, volume));
  }
};

export const toggleSoundEffects = (): boolean => {
  const currentState = getSoundEffectsEnabled();
  const newState = !currentState;
  setSoundEffectsEnabled(newState);
  return newState;
};

export const isSoundEffectsEnabled = (): boolean => {
  return getSoundEffectsEnabled();
};

export const playFlipSound = () => {
  if (!getSoundEffectsEnabled()) return;
  playAudio('flip.mp3', 0.4);
};

export const playMatchSound = () => {
  if (!getSoundEffectsEnabled()) return;
  playAudio('correct.mp3', 0.5);
};

export const playCorrectSound = () => {
  if (!getSoundEffectsEnabled()) return;
  playAudio('correct.mp3', 0.5);
};

export const playWrongSound = () => {
  if (!getSoundEffectsEnabled()) return;
};

export const playWinSound = () => {
  if (!getSoundEffectsEnabled()) return;
  playAudio('win.mp3', 0.6);
};

export const preloadSounds = () => {
  loadAudio('flip.mp3');
  loadAudio('correct.mp3');
  loadAudio('win.mp3');
  loadAudio('background.mp3');
};

