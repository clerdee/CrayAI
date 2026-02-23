import cv2
import numpy as np
import base64
import os
from ultralytics import YOLO

PIXELS_PER_CM = 65.0 
MIN_CRAYFISH_LENGTH_CM = 2.0 
AI_MODEL_VERSION = "CrayAI YOLO-Core v1.5"

# --- MODEL PATHS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "crayfish.pt")
GENDER_MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "gender.pt")

# --- LOAD BOTH AI MODELS ---
try:
    ai_model = YOLO(MODEL_PATH)
    print(f"✅ Detection Model successfully loaded from: {MODEL_PATH}")
except Exception as e:
    print(f"❌ Failed to load Detection model: {e}")
    ai_model = None

try:
    gender_model = YOLO(GENDER_MODEL_PATH)
    print(f"✅ Gender Model successfully loaded from: {GENDER_MODEL_PATH}")
except Exception as e:
    print(f"❌ Failed to load Gender model: {e}")
    gender_model = None


def analyze_algae(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_green = np.array([35, 40, 40])
    upper_green = np.array([85, 255, 255])
    
    mask = cv2.inRange(hsv, lower_green, upper_green)
    algae_pixels = cv2.countNonZero(mask)
    total_pixels = img.shape[0] * img.shape[1]
    percentage = (algae_pixels / total_pixels) * 100
    
    if percentage < 5: return 0, "Low (Minimal Algae)"
    elif percentage < 15: return 1, "Moderate (Noticeable)"
    elif percentage < 30: return 2, "High (Dense Bloom)"
    else: return 3, "Critical (Immediate Action)"

def analyze_turbidity(img, crayfish_boxes):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)

    mask = np.ones(img.shape[:2], dtype=np.uint8) * 255

    for box in crayfish_boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cv2.rectangle(mask, (x1, y1), (x2, y2), 0, -1)
        
    mean_v = cv2.mean(v, mask=mask)[0]  
    mean_s = cv2.mean(s, mask=mask)[0]  

    darkness = 255 - mean_v 
    murkiness_score = (darkness * 0.4) + (mean_s * 0.6)
    level = int((murkiness_score / 120.0) * 10) + 1
    level = max(1, min(10, level))
    
    return level

def estimate_age(size_cm):
    if not size_cm or size_cm <= 0: return "Unknown"
    if size_cm < 3: return "Crayling (< 1 month)"
    elif 3 <= size_cm < 7: return "Juvenile (1-3 months)"
    elif 7 <= size_cm < 11: return "Sub-Adult (3-6 months)"
    else: return "Adult/Breeder (> 6 months)"

def process_measurement(image_file):
    file_bytes = np.frombuffer(image_file.read(), np.uint8)
    original_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    algae_level, algae_desc = analyze_algae(original_img)
    
    results_data = []
    raw_boxes = []

    # 1. FIRST MODEL: Detect Crayfish & Measure Size
    if ai_model:
        results = ai_model.predict(source=original_img, conf=0.7)
        
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
                
                # 2. SECOND MODEL: Smart Gender Filtering
                detected_gender = "Not Defined"
                gender_confidence = 0.0

                if gender_model:
                    try:
                        # Crop image exactly to the crayfish bounding box
                        crayfish_crop = original_img[max(0, y1):max(0, y2), max(0, x1):max(0, x2)]
                        
                        if crayfish_crop.size > 0:
                            # Run prediction on the crop
                            gender_results = gender_model.predict(source=crayfish_crop, conf=0.4) 
                            
                            found_valid_gender = False
                            
                            for g_res in gender_results:
                                # Check BOTH standard boxes and OBB boxes
                                all_detections = []
                                if getattr(g_res, 'boxes', None) is not None:
                                    all_detections.extend(g_res.boxes)
                                if getattr(g_res, 'obb', None) is not None:
                                    all_detections.extend(g_res.obb)

                                for det in all_detections:
                                    class_id = int(det.cls[0])
                                    label = gender_model.names[class_id]
                                    conf = float(det.conf[0]) * 100
                                    
                                    # --- UPDATED FILTER LIST ---
                                    # Added 'female_crayfish' and 'male_crayfish' to match your model!
                                    valid_labels = [
                                        "Male", "Female", "Berried", 
                                        "male", "female", "berried",
                                        "male_crayfish", "female_crayfish"
                                    ]
                                    
                                    if label in valid_labels:
                                        if conf > gender_confidence:
                                            # Clean up the label for display (remove '_crayfish')
                                            clean_label = label.replace('_crayfish', '').capitalize()
                                            
                                            detected_gender = clean_label
                                            gender_confidence = round(conf, 1)
                                            found_valid_gender = True
                                
                                if found_valid_gender:
                                    break

                    except Exception as err:
                        print(f"⚠️ Gender analysis failed but scan continues: {err}")

                # Draw Results onto the image
                cv2.rectangle(original_img, (x1, y1), (x2, y2), (0, 255, 0), 4)
                
                # Dynamic Label Color (Pink for Female, Blue for Male/Default)
                label_color = (255, 105, 180) if "Female" in detected_gender or "Berried" in detected_gender else (255, 0, 0)
                
                cv2.putText(original_img, f"{detected_gender} ({gender_confidence}%)", (x1, max(30, y1 - 40)), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1.0, label_color, 3)
                
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
                    "estimated_age": age_category,
                    "gender": detected_gender,
                    "gender_confidence": gender_confidence
                })

    turbidity_level = analyze_turbidity(original_img, raw_boxes)

    _, buffer = cv2.imencode('.jpg', original_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    return {
        "image": img_base64, 
        "measurements": results_data,
        "success": len(results_data) > 0,
        "algae_level": algae_level,     
        "algae_desc": algae_desc,       
        "turbidity_level": turbidity_level, 
        "model_version": AI_MODEL_VERSION,
        "gender": results_data[0]["gender"] if results_data else "Not Defined",
        "genderConfidence": results_data[0]["gender_confidence"] if results_data else 0
    }