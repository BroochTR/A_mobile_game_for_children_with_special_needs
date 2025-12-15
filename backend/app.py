from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

import cv2
import numpy as np
import base64
from keras.models import load_model
import os
import random


# Load face detection and emotion recognition models

# Đường dẫn tuyệt đối tới các file model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
face_modelFile = os.path.join(BASE_DIR, 'face-classification-main', 'faceDetection', 'models', 'dnn', 'res10_300x300_ssd_iter_140000.caffemodel')
face_configFile = os.path.join(BASE_DIR, 'face-classification-main', 'faceDetection', 'models', 'dnn', 'deploy.prototxt')
face_net = cv2.dnn.readNetFromCaffe(face_configFile, face_modelFile)
emotionModelPath = os.path.join(BASE_DIR, 'face-classification-main', 'models', 'emotionModel.hdf5')
emotionClassifier = load_model(emotionModelPath, compile=False)
emotionTargetSize = emotionClassifier.input_shape[1:3]
emotions = {
    0: "Angry",
    1: "Disgust",
    2: "Fear",
    3: "Happy",
    4: "Sad",
    5: "Suprise",
    6: "Neutral"
}

# Database tình huống cho Game 2
scenarios = [
    {
        "id": 1,
        "story": "Hôm nay là sinh nhật của bạn. Mọi người tặng quà cho bạn.",
        "correct_emotion": "Happy",
        "emoji": "🎂",
        "illustration": "🎁"
    },
    {
        "id": 2,
        "story": "Bạn làm rơi cây kem yêu thích.",
        "correct_emotion": "Sad",
        "emoji": "🍦",
        "illustration": "😢"
    },
    {
        "id": 3,
        "story": "Bạn bất ngờ nghe tiếng sấm lớn.",
        "correct_emotion": "Fear",
        "emoji": "⛈️",
        "illustration": "😨"
    },
    {
        "id": 4,
        "story": "Bạn thấy một món đồ chơi rất lạ.",
        "correct_emotion": "Suprise",
        "emoji": "🎁",
        "illustration": "😲"
    },
    {
        "id": 5,
        "story": "Bạn nhận được điểm 10 môn Toán.",
        "correct_emotion": "Happy",
        "emoji": "📚",
        "illustration": "😊"
    },
    {
        "id": 6,
        "story": "Bạn bị bạn bè trêu chọc.",
        "correct_emotion": "Angry",
        "emoji": "😤",
        "illustration": "😠"
    },
    {
        "id": 7,
        "story": "Bạn thấy một con sâu bò trên tay.",
        "correct_emotion": "Fear",
        "emoji": "🐛",
        "illustration": "😨"
    },
    {
        "id": 8,
        "story": "Bạn đang ngồi yên đọc sách.",
        "correct_emotion": "Neutral",
        "emoji": "📖",
        "illustration": "😐"
    }
]

DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "dist"))

app = Flask(
    __name__,
    static_folder=DIST_DIR,
    template_folder=DIST_DIR
)
CORS(app, resources={r"/predict*": {"origins": "*"},
                     r"/get-*": {"origins": "*"},
                     r"/assets/*": {"origins": "*"},
                     r"/*": {"origins": "*"}})

@app.route('/')
def index():
    return send_from_directory(DIST_DIR, 'index.html')

@app.route('/game2')
def game2():
    return send_from_directory(DIST_DIR, 'index.html')

@app.route('/game3')
def game3():
    return send_from_directory(DIST_DIR, 'index.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(DIST_DIR, 'favicon.ico')


@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    img_data = data['image']
    required_emotion = data.get('required_emotion', None)  # Thêm tham số cho Game 1
    
    # Decode base64 image
    img_str = img_data.split(',')[1]
    nparr = np.frombuffer(base64.b64decode(img_str), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Face detection
    height, width = img.shape[:2]
    blob = cv2.dnn.blobFromImage(cv2.resize(img, (300, 300)), 1.0, (300, 300), (104.0, 117.0, 123.0))
    face_net.setInput(blob)
    dnnFaces = face_net.forward()
    grayFrame = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    detected_emotion = None
    confidence_score = 0
    
    for i in range(dnnFaces.shape[2]):
        confidence = dnnFaces[0, 0, i, 2]
        if confidence > 0.5:
            box = dnnFaces[0, 0, i, 3:7] * np.array([width, height, width, height])
            (x, y, x1, y1) = box.astype("int")
            # Đảm bảo tọa độ nằm trong ảnh và hợp lệ
            x, y = max(0, x), max(0, y)
            x1, y1 = min(width, x1), min(height, y1)
            if x1 <= x or y1 <= y:
                continue
            grayFace = grayFrame[y:y1, x:x1]
            if grayFace.size == 0:
                continue
            try:
                grayFace = cv2.resize(grayFace, emotionTargetSize)
            except:
                continue
            grayFace = grayFace.astype('float32')
            grayFace = grayFace / 255.0
            grayFace = (grayFace - 0.5) * 2.0
            grayFace = np.expand_dims(grayFace, 0)
            grayFace = np.expand_dims(grayFace, -1)
            emotion_prediction = emotionClassifier.predict(grayFace)
            emotion_probability = np.max(emotion_prediction)
            if emotion_probability > 0.36:
                emotion_label_arg = np.argmax(emotion_prediction)
                detected_emotion = emotions[emotion_label_arg]
                confidence_score = float(emotion_probability)
                break
    
    if detected_emotion is None:
        return jsonify({
            'emotion': 'Không nhận diện được',
            'success': False,
            'message': 'Không thể nhận diện khuôn mặt. Hãy điều chỉnh vị trí hoặc ánh sáng để camera nhìn thấy khuôn mặt rõ hơn.'
        })
    
    # Gộp Disgust và Fear thành Fear
    normalized_detected = detected_emotion
    if detected_emotion.lower() == 'disgust':
        normalized_detected = 'Fear'
    
    # Nếu có yêu cầu cảm xúc (Game 1), so sánh
    if required_emotion:
        normalized_required = required_emotion
        if required_emotion.lower() == 'disgust':
            normalized_required = 'Fear'
        
        is_correct = (normalized_detected.lower() == normalized_required.lower())
        
        emotion_vietnamese = {
            'Happy': 'Vui',
            'Sad': 'Buồn',
            'Angry': 'Giận',
            'Fear': 'Sợ hãi',
            'Suprise': 'Ngạc nhiên',
            'Neutral': 'Trung tính',
            'Disgust': 'Sợ hãi'
        }
        
        detected_vn = emotion_vietnamese.get(normalized_detected, normalized_detected)
        required_vn = emotion_vietnamese.get(normalized_required, normalized_required)
        
        if is_correct:
            message = f"Chính xác! Bạn đã thể hiện đúng cảm xúc!"
        else:
            message = f"Chưa đúng. Hãy thử lại nhé!"
        
        return jsonify({
            'emotion': normalized_detected,
            'required_emotion': normalized_required,
            'is_correct': is_correct,
            'success': True,
            'confidence': confidence_score,
            'vietnamese': detected_vn,
            'message': message
        })
    
    # Trả về kết quả đơn giản (không có yêu cầu)
    emotion_vietnamese = {
        'Happy': 'Vui',
        'Sad': 'Buồn',
        'Angry': 'Giận',
        'Fear': 'Sợ hãi',
        'Suprise': 'Ngạc nhiên',
        'Neutral': 'Trung tính'
    }
    
    return jsonify({
        'emotion': normalized_detected,
        'vietnamese': emotion_vietnamese.get(normalized_detected, normalized_detected),
        'success': True
    })

@app.route('/get-emotion-challenge', methods=['GET'])
def get_emotion_challenge():
    """API trả về cảm xúc ngẫu nhiên cho Game 1"""
    # Danh sách 5 cảm xúc cơ bản cho Game 1 (không có Neutral, đã gộp Disgust với Fear)
    emotions_list = ['Happy', 'Sad', 'Angry', 'Fear', 'Suprise']
    emotion = random.choice(emotions_list)
    
    emotion_info = {
        'Happy': {'emoji': '😊', 'vietnamese': 'Vui'},
        'Sad': {'emoji': '😢', 'vietnamese': 'Buồn'},
        'Angry': {'emoji': '😠', 'vietnamese': 'Giận'},
        'Fear': {'emoji': '😨', 'vietnamese': 'Sợ hãi'},
        'Suprise': {'emoji': '😲', 'vietnamese': 'Ngạc nhiên'}
    }
    
    info = emotion_info.get(emotion, {'emoji': '😊', 'vietnamese': emotion})
    
    return jsonify({
        'emotion': emotion,
        'emoji': info['emoji'],
        'vietnamese': info['vietnamese']
    })

@app.route('/get-scenario', methods=['GET'])
def get_scenario():
    """API trả về tình huống ngẫu nhiên cho Game 2"""
    scenario = random.choice(scenarios)
    return jsonify({
        'id': scenario['id'],
        'story': scenario['story'],
        'correct_emotion': scenario['correct_emotion'],
        'emoji': scenario['emoji'],
        'illustration': scenario['illustration']
    })

@app.route('/predict-game2', methods=['POST'])
def predict_game2():
    """API nhận diện cảm xúc và so sánh với cảm xúc yêu cầu cho Game 2"""
    data = request.json
    img_data = data['image']
    required_emotion = data.get('required_emotion', '')
    
    # Decode base64 image
    img_str = img_data.split(',')[1]
    nparr = np.frombuffer(base64.b64decode(img_str), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Face detection
    height, width = img.shape[:2]
    blob = cv2.dnn.blobFromImage(cv2.resize(img, (300, 300)), 1.0, (300, 300), (104.0, 117.0, 123.0))
    face_net.setInput(blob)
    dnnFaces = face_net.forward()
    grayFrame = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    detected_emotion = None
    confidence_score = 0
    
    for i in range(dnnFaces.shape[2]):
        confidence = dnnFaces[0, 0, i, 2]
        if confidence > 0.5:
            box = dnnFaces[0, 0, i, 3:7] * np.array([width, height, width, height])
            (x, y, x1, y1) = box.astype("int")
            x, y = max(0, x), max(0, y)
            x1, y1 = min(width, x1), min(height, y1)
            if x1 <= x or y1 <= y:
                continue
            grayFace = grayFrame[y:y1, x:x1]
            if grayFace.size == 0:
                continue
            try:
                grayFace = cv2.resize(grayFace, emotionTargetSize)
            except:
                continue
            grayFace = grayFace.astype('float32')
            grayFace = grayFace / 255.0
            grayFace = (grayFace - 0.5) * 2.0
            grayFace = np.expand_dims(grayFace, 0)
            grayFace = np.expand_dims(grayFace, -1)
            emotion_prediction = emotionClassifier.predict(grayFace)
            emotion_probability = np.max(emotion_prediction)
            if emotion_probability > 0.36:
                emotion_label_arg = np.argmax(emotion_prediction)
                detected_emotion = emotions[emotion_label_arg]
                confidence_score = float(emotion_probability)
                break
    
    if detected_emotion is None:
        return jsonify({
            'success': False,
            'detected_emotion': 'Không nhận diện được',
            'required_emotion': required_emotion,
            'is_correct': False,
            'message': 'Không thể nhận diện khuôn mặt. Vui lòng thử lại!'
        })
    
    # Gộp Disgust và Fear thành Fear (Sợ hãi)
    normalized_detected = detected_emotion
    normalized_required = required_emotion
    if detected_emotion.lower() == 'disgust':
        normalized_detected = 'Fear'
    if required_emotion.lower() == 'disgust':
        normalized_required = 'Fear'
    
    # So sánh cảm xúc nhận diện với cảm xúc yêu cầu
    is_correct = (normalized_detected.lower() == normalized_required.lower())
    
    # Tạo thông điệp phản hồi
    emotion_vietnamese = {
        'Happy': 'Vui',
        'Sad': 'Buồn',
        'Angry': 'Giận',
        'Fear': 'Sợ hãi',
        'Suprise': 'Ngạc nhiên',
        'Disgust': 'Sợ hãi',  # Gộp với Fear
        'Neutral': 'Trung tính'
    }
    
    if is_correct:
        detected_vn = emotion_vietnamese.get(normalized_detected, normalized_detected)
        message = f"Tuyệt vời! Bạn đã thể hiện cảm xúc {detected_vn} đúng với tình huống!"
    else:
        required_vn = emotion_vietnamese.get(normalized_required, normalized_required)
        detected_vn = emotion_vietnamese.get(normalized_detected, normalized_detected)
        message = f"Bạn đã thể hiện cảm xúc {detected_vn}, nhưng tình huống này cần cảm xúc {required_vn}. Hãy thử lại nhé!"
    
    return jsonify({
        'success': True,
        'detected_emotion': detected_emotion,
        'required_emotion': required_emotion,
        'is_correct': is_correct,
        'confidence': confidence_score,
        'message': message
    })

@app.route('/<path:path>')
def serve_spa(path):
    full_path = os.path.join(DIST_DIR, path)
    if os.path.isfile(full_path):
        directory, filename = os.path.split(full_path)
        return send_from_directory(directory, filename)
    return send_from_directory(DIST_DIR, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)