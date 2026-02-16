import cv2
import numpy as np
import base64
import os
from ultralytics import YOLO

PIXELS_PER_CM = 65.0 
MIN_CRAYFISH_LENGTH_CM = 2.0 

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "crayfish.pt")

try:
    ai_model = YOLO(MODEL_PATH)
    print(f"✅ AI Model successfully loaded from: {MODEL_PATH}")
except Exception as e:
    print(f"❌ Failed to load AI model: {e}")
    ai_model = None

def analyze_algae(img):
    """Detects algae density using HSV color masking."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    lower_green = np.array([35, 40, 40])
    upper_green = np.array([85, 255, 255])

    mask = cv2.inRange(hsv, lower_green, upper_green)

    algae_pixels = cv2.countNonZero(mask)
    total_pixels = img.shape[0] * img.shape[1]
    percentage = (algae_pixels / total_pixels) * 100
    
    if percentage < 5:
        return 0, "Low (Minimal Algae)"
    elif percentage < 15:
        return 1, "Moderate (Noticeable)"
    elif percentage < 30:
        return 2, "High (Dense Bloom)"
    else:
        return 3, "Critical (Immediate Action)"

def estimate_age(size_cm):
    if not size_cm or size_cm <= 0: return "Unknown"
    if size_cm < 2: return "Crayling (< 1 month)"
    elif 2 <= size_cm < 5.5: return "Juvenile (1-3 months)"
    elif 5.5 <= size_cm < 9: return "Sub-Adult (3-6 months)"
    else: return "Adult/Breeder (> 6 months)"

def process_measurement(image_file):
    file_bytes = np.frombuffer(image_file.read(), np.uint8)
    original_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    
    algae_level, algae_desc = analyze_algae(original_img)
    
    results_data = []

    if ai_model:
        results = ai_model.predict(source=original_img, conf=0.7)
        
        raw_boxes = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                h_cm = (y2 - y1) / PIXELS_PER_CM
                
                if h_cm >= MIN_CRAYFISH_LENGTH_CM:
                    raw_boxes.append(box)

        if len(raw_boxes) == 0:
            h, w = original_img.shape[:2]
            cv2.rectangle(original_img, (0, 0), (w, h), (0, 0, 255), 15)
            cv2.putText(original_img, "NO CRAYFISH DETECTED", (int(w * 0.1), int(h / 2)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)
        else:
            for box in raw_boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                width_px, height_px = x2 - x1, y2 - y1
                
                w_cm = width_px / PIXELS_PER_CM
                h_cm = height_px / PIXELS_PER_CM
                age_category = estimate_age(h_cm)
                
                cv2.rectangle(original_img, (x1, y1), (x2, y2), (0, 255, 0), 4)
                cv2.putText(original_img, "CRAYFISH", (x1, max(30, y1 - 40)), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 3)
                cv2.putText(original_img, f"W: {w_cm:.2f}cm", (x1, max(30, y1 - 10)), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                
                cv2.putText(original_img, f"H: {h_cm:.2f}cm", (x1, y2 + 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                cv2.putText(original_img, f"Age: {age_category}", (x1, y2 + 65), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
                results_data.append({
                    "type": "target",
                    "width_cm": round(w_cm, 2),
                    "height_cm": round(h_cm, 2),
                    "estimated_age": age_category
                })

    _, buffer = cv2.imencode('.jpg', original_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    return {
        "image": img_base64, 
        "measurements": results_data,
        "success": len(results_data) > 0,
        "algae_level": algae_level,    
        "algae_desc": algae_desc        
    }