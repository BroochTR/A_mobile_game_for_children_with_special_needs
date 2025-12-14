const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

type PredictResponse = {
  success: boolean;
  emotion?: string;
  vietnamese?: string;
  confidence?: number;
  message?: string;
};

export type EmotionChallenge = {
  emotion: string;
  emoji: string;
  vietnamese: string;
};

export type Scenario = {
  id: number;
  story: string;
  correct_emotion: string;
  emoji: string;
  illustration: string;
};

type GamePredictionResponse = {
  success: boolean;
  emotion?: string;
  detected_emotion?: string;
  required_emotion?: string;
  vietnamese?: string;
  is_correct?: boolean;
  confidence?: number;
  message?: string;
};

const withBase = (path: string) => `${API_BASE_URL}${path}`;

const handleResponse = async <T>(response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Backend request failed");
  }
  return data as T;
};

const postJson = (path: string, body: unknown) =>
  fetch(withBase(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

export const detectEmotion = async (image: string) => {
  const response = await postJson("/predict", { image });
  return handleResponse<PredictResponse>(response);
};

export const detectEmotionForChallenge = async (image: string, requiredEmotion: string) => {
  const response = await postJson("/predict", { image, required_emotion: requiredEmotion });
  return handleResponse<GamePredictionResponse>(response);
};

export const detectEmotionForScenario = async (image: string, requiredEmotion: string) => {
  const response = await postJson("/predict-game2", { image, required_emotion: requiredEmotion });
  return handleResponse<GamePredictionResponse>(response);
};

export const getEmotionChallenge = async () => {
  const response = await fetch(withBase("/get-emotion-challenge"));
  return handleResponse<EmotionChallenge>(response);
};

export const getScenario = async () => {
  const response = await fetch(withBase("/get-scenario"));
  return handleResponse<Scenario>(response);
};




