# Importing required packages
from keras.models import load_model
import numpy as np
import argparse
import cv2

ap = argparse.ArgumentParser()
ap.add_argument("-vw", "--isVideoWriter", type=bool, default=False)
args = vars(ap.parse_args())

emotion_offsets = (20, 40)
emotions = {
    0: {
        "emotion": "Angry",
        "color": (193, 69, 42)
    },
    1: {
        "emotion": "Disgust",
        "color": (164, 175, 49)
    },
    2: {
        "emotion": "Fear",
        "color": (40, 52, 155)
    },
    3: {
        "emotion": "Happy",
        "color": (23, 164, 28)
    },
    4: {
        "emotion": "Sad",
        "color": (164, 93, 23)
    },
    5: {
        "emotion": "Suprise",
        "color": (218, 229, 97)
    },
    6: {
        "emotion": "Neutral",
        "color": (108, 72, 200)
    }
}

# DNN Face Detection Model (Replaces dlib)
modelFile = "faceDetection/models/dnn/res10_300x300_ssd_iter_140000.caffemodel"
configFile = "faceDetection/models/dnn/deploy.prototxt"
net = cv2.dnn.readNetFromCaffe(configFile, modelFile)

emotionModelPath = r'models\emotionModel.hdf5'  # fer2013_mini_XCEPTION.110-0.65
emotionClassifier = load_model(emotionModelPath, compile=False)
emotionTargetSize = emotionClassifier.input_shape[1:3]

cap = cv2.VideoCapture(0)

if args["isVideoWriter"] == True:
    fourrcc = cv2.VideoWriter_fourcc("M", "J", "P", "G")
    capWidth = int(cap.get(3))
    capHeight = int(cap.get(4))
    videoWrite = cv2.VideoWriter("output.avi", fourrcc, 22,
                                 (capWidth, capHeight))

while True:
    ret, frame = cap.read()
    frame = cv2.resize(frame, (720, 480))

    if not ret:
        break

    # DNN Face Detection
    height, width = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 1.0, (300, 300), (104.0, 117.0, 123.0))
    net.setInput(blob)
    dnnFaces = net.forward()
    
    grayFrame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    for i in range(dnnFaces.shape[2]):
        confidence = dnnFaces[0, 0, i, 2]
        if confidence > 0.5:
            box = dnnFaces[0, 0, i, 3:7] * np.array([width, height, width, height])
            (x, y, x1, y1) = box.astype("int")
            
            # Extract face region for emotion recognition
            grayFace = grayFrame[y:y1, x:x1]
            try:
                grayFace = cv2.resize(grayFace, (emotionTargetSize))
            except:
                continue

            grayFace = grayFace.astype('float32')
            grayFace = grayFace / 255.0
            grayFace = (grayFace - 0.5) * 2.0
            grayFace = np.expand_dims(grayFace, 0)
            grayFace = np.expand_dims(grayFace, -1)
            emotion_prediction = emotionClassifier.predict(grayFace)
            emotion_probability = np.max(emotion_prediction)
            
            if (emotion_probability > 0.36):
                emotion_label_arg = np.argmax(emotion_prediction)
                color = emotions[emotion_label_arg]['color']
                cv2.rectangle(frame, (x, y), (x1, y1), color, 2)
                cv2.line(frame, (x, y1), (x + 20, y1 + 20), color, thickness=2)
                cv2.rectangle(frame, (x + 20, y1 + 20), (x + 110, y1 + 40), color, -1)
                cv2.putText(frame, emotions[emotion_label_arg]['emotion'],
                            (x + 25, y1 + 36), cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                            (255, 255, 255), 1, cv2.LINE_AA)
            else:
                color = (255, 255, 255)
                cv2.rectangle(frame, (x, y), (x1, y1), color, 2)

    if args["isVideoWriter"] == True:
        videoWrite.write(frame)

    cv2.imshow("Emotion Recognition", frame)
    k = cv2.waitKey(1) & 0xFF
    if k == 27:
        break

cap.release()
if args["isVideoWriter"] == True:
    videoWrite.release()
cv2.destroyAllWindows()
