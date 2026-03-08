import cv2
import numpy as np
import base64
import os

# --- CONFIGURATION ---
DEFAULT_PIXELS_PER_CM = 65.0 
MIN_CRAYFISH_LENGTH_CM = 2.0 
AI_MODEL_VERSION = "CrayAI Tri-Core v3.0" # Updated version name!
REFERENCE_BOX_SIZE_CM = 2.0
MIN_GENDER_CONFIDENCE = 30.0 

# --- MODEL PATHS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "crayfish.pt")
# Updated paths for the new models
GENDER_MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "new_model.pt") 
ENV_MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "environment.pt")

# --- LAZY LOADING GLOBALS ---
ai_model = None
gender_model = None
env_model = None

def get_ai_model():
    global ai_model
    if ai_model is None:
        try:
            from ultralytics import YOLO
            print(f"⚡ Loading Detection Model from: {MODEL_PATH}")
            ai_model = YOLO(MODEL_PATH)
        except Exception as e:
            print(f"❌ Failed to load Detection model: {e}")
            ai_model = False 
    return ai_model

def get_gender_model():
    global gender_model
    if gender_model is None:
        try:
            from ultralytics import YOLO
            print(f"⚡ Loading Gender Model from: {GENDER_MODEL_PATH}")
            gender_model = YOLO(GENDER_MODEL_PATH)
        except Exception as e:
            print(f"❌ Failed to load Gender model: {e}")
            gender_model = False
    return gender_model

def get_env_model():
    """Loads the new Environment (Turbidity/Algae) Model"""
    global env_model
    if env_model is None:
        try:
            from ultralytics import YOLO
            print(f"⚡ Loading Environment Model from: {ENV_MODEL_PATH}")
            env_model = YOLO(ENV_MODEL_PATH)
        except Exception as e:
            print(f"❌ Failed to load Environment model: {e}")
            env_model = False
    return env_model

# --- OPENCV FALLBACK FUNCTIONS ---
# Keeping these just in case the AI environment model misses something
def analyze_algae(img):
    try:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        mask = cv2.inRange(hsv, lower_green, upper_green)
        percentage = (cv2.countNonZero(mask) / (img.shape[0] * img.shape[1])) * 100
        
        if percentage < 5: return 0, "Low (Minimal Algae)"
        elif percentage < 15: return 1, "Moderate (Noticeable)"
        elif percentage < 30: return 2, "High (Dense Bloom)"
        else: return 3, "Critical (Immediate Action)"
    except:
        return 0, "Error Calculating Algae"

def analyze_turbidity(img, crayfish_boxes):
    try:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        mask = np.ones(img.shape[:2], dtype=np.uint8) * 255

        for box in crayfish_boxes:
            if box is not None and hasattr(box, 'xyxy'):
                x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                cv2.rectangle(mask, (x1, y1), (x2, y2), 0, -1)
            
        mean_v = cv2.mean(v, mask=mask)[0]  
        mean_s = cv2.mean(s, mask=mask)[0]  

        darkness = 255 - mean_v 
        murkiness_score = (darkness * 0.4) + (mean_s * 0.6)
        level = int((murkiness_score / 120.0) * 10) + 1
        return max(1, min(10, level))
    except Exception as e:
        return 1

def estimate_age(size_cm):
    if not size_cm or size_cm <= 0: return "Unknown"
    if size_cm < 2: return "Crayling (< 1 month)"
    elif 2 <= size_cm < 6: return "Juvenile (1-3 months)"
    elif 6 <= size_cm < 11: return "Sub-Adult (3-6 months)"
    else: return "Adult/Breeder (> 6 months)"

def calculate_dynamic_scale(img):
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
        cnts_result = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours = cnts_result[0] if len(cnts_result) == 2 else cnts_result[1]
        
        square_widths = []
        for cnt in contours:
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
            if len(approx) == 4:
                x, y, w, h = cv2.boundingRect(approx)
                aspect_ratio = float(w) / h
                area = cv2.contourArea(cnt)
                if 0.8 < aspect_ratio < 1.2 and 1000 < area < (img.shape[0] * img.shape[1] * 0.1):
                    square_widths.append(w)

        if square_widths:
            pixels_per_cm = np.median(square_widths) / REFERENCE_BOX_SIZE_CM
            return pixels_per_cm
        return DEFAULT_PIXELS_PER_CM
    except:
        return DEFAULT_PIXELS_PER_CM

def process_measurement(image_file):
    try:
        file_bytes = np.frombuffer(image_file.read(), np.uint8)
        original_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if original_img is None:
            return {"success": False, "error": "Invalid Image"}

        pixels_per_cm = calculate_dynamic_scale(original_img)
        algae_level, algae_desc = analyze_algae(original_img)
        
        results_data = []
        raw_boxes = []

        # 1. LOAD MODELS NOW
        model = get_ai_model()
        e_model = get_env_model()
        
        # --- NEW: RUN ENVIRONMENT MODEL ---
        ai_environment_status = "Unknown"
        if e_model:
            try:
                env_results = e_model.predict(source=original_img, conf=0.4)
                # Check if it's a classification model (probs) or detection model (boxes)
                if hasattr(env_results[0], 'probs') and env_results[0].probs is not None:
                    class_id = env_results[0].probs.top1
                    ai_environment_status = e_model.names[class_id]
                elif hasattr(env_results[0], 'boxes') and len(env_results[0].boxes) > 0:
                    class_id = int(env_results[0].boxes[0].cls[0])
                    ai_environment_status = e_model.names[class_id]
            except Exception as e:
                print(f"⚠️ Environment AI failed: {e}")

        # --- RUN CRAYFISH DETECTION ---
        if model:
            results = model.predict(source=original_img, conf=0.6)
            
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    h_cm = (y2 - y1) / pixels_per_cm
                    if h_cm >= MIN_CRAYFISH_LENGTH_CM:
                        raw_boxes.append(box)

            if len(raw_boxes) == 0:
                h, w = original_img.shape[:2]
                cv2.rectangle(original_img, (0, 0), (w, h), (0, 0, 255), 15)
                cv2.putText(original_img, "NO CRAYFISH DETECTED", (int(w * 0.1), int(h / 2)), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)
            else:
                g_model = get_gender_model()

                for box in raw_boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    w_cm = (x2 - x1) / pixels_per_cm
                    h_cm = (y2 - y1) / pixels_per_cm
                    age_category = estimate_age(h_cm)
                    
                    # --- NEW GENDER CLASSIFICATION ---
                    detected_gender = "Not Defined"
                    gender_confidence = 0.0

                    if g_model:
                        try:
                            crayfish_crop = original_img[max(0, y1):max(0, y2), max(0, x1):max(0, x2)]
                            if crayfish_crop.size > 0:
                                gender_results = g_model.predict(source=crayfish_crop, conf=0.4) 
                                
                                for g_res in gender_results:
                                    all_detections = []
                                    if getattr(g_res, 'boxes', None) is not None:
                                        all_detections.extend(g_res.boxes)
                                    if getattr(g_res, 'probs', None) is not None:
                                        # Handles if classmate trained gender as a classifier instead of detector
                                        class_id = g_res.probs.top1
                                        label = g_model.names[class_id]
                                        conf = float(g_res.probs.top1conf) * 100
                                        detected_gender = label.replace('_crayfish', '').capitalize()
                                        gender_confidence = round(conf, 1)
                                        break
                                        
                                    for det in all_detections:
                                        class_id = int(det.cls[0])
                                        label = g_model.names[class_id]
                                        conf = float(det.conf[0]) * 100
                                        
                                        valid_labels = ["Male", "Female", "Berried", "male", "female", "berried", "male_crayfish", "female_crayfish"]
                                        if label in valid_labels and conf > gender_confidence:
                                            detected_gender = label.replace('_crayfish', '').capitalize()
                                            gender_confidence = round(conf, 1)
                        except Exception as err:
                            print(f"⚠️ Gender analysis failed: {err}")

                    if detected_gender != "Not Defined" and gender_confidence < MIN_GENDER_CONFIDENCE:
                        detected_gender = "Not Defined"
                        gender_confidence = 0.0

                    # Draw Results
                    cv2.rectangle(original_img, (x1, y1), (x2, y2), (0, 255, 0), 4)
                    label_color = (255, 105, 180) if "Female" in detected_gender or "Berried" in detected_gender else (255, 0, 0)
                    cv2.putText(original_img, f"{detected_gender} ({gender_confidence}%)", (x1, max(30, y1 - 40)), cv2.FONT_HERSHEY_SIMPLEX, 1.0, label_color, 3)
                    cv2.putText(original_img, f"W: {w_cm:.2f}cm", (x1, max(30, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    cv2.putText(original_img, f"H: {h_cm:.2f}cm", (x1, y2 + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    cv2.putText(original_img, f"Age: {age_category}", (x1, y2 + 65), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                    
                    results_data.append({
                        "type": "target",
                        "width_cm": round(w_cm, 2),
                        "height_cm": round(h_cm, 2),
                        "estimated_age": age_category,
                        "gender": detected_gender,
                        "gender_confidence": gender_confidence
                    })

        # Draw AI Environment Label
        h_img, w_img = original_img.shape[:2]
        cv2.putText(original_img, f"Water: {ai_environment_status}", (30, h_img - 30), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 200, 0), 3)

        turbidity_level = analyze_turbidity(original_img, raw_boxes)
        _, buffer = cv2.imencode('.jpg', original_img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        primary_result = results_data[0] if results_data else {}

        return {
            "image": img_base64, 
            "measurements": results_data,
            "success": len(results_data) > 0,
            "ai_environment_status": ai_environment_status, # NEW AI WATER DATA
            "algae_level": algae_level,     
            "algae_desc": algae_desc,       
            "turbidity_level": turbidity_level, 
            "model_version": AI_MODEL_VERSION,
            "gender": primary_result.get("gender", "Not Defined"),
            "genderConfidence": primary_result.get("gender_confidence", 0)
        }
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")
        return {"success": False, "error": str(e), "measurements": [], "gender": "Error", "genderConfidence": 0}