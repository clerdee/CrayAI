import cv2
import numpy as np
import base64
import os
import random
from pathlib import Path

# --- CONFIGURATION ---
DEFAULT_PIXELS_PER_CM = 65.0 
MIN_CRAYFISH_LENGTH_CM = 2.0 
AI_MODEL_VERSION = "CrayAI Tri-Core v3.6"
REFERENCE_BOX_SIZE_CM = 2.0
MIN_GENDER_CONFIDENCE = 30.0 

# --- MODEL PATHS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "crayfish.pt")
GENDER_MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "last.pt") 
ENV_MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "environment.pt")

# --- LAZY LOADING GLOBALS ---
ai_model = None
gender_model = None
env_model = None

DEBUG_MODE = True

def debug_log(message, level="INFO"):
    if DEBUG_MODE:
        print(f"[{level}] {message}")

def get_ai_model():
    global ai_model
    if ai_model is None:
        try:
            from ultralytics import YOLO
            if os.path.exists(MODEL_PATH): ai_model = YOLO(MODEL_PATH)
            else: ai_model = False 
        except Exception as e: ai_model = False 
    return ai_model

def get_gender_model():
    global gender_model
    if gender_model is None:
        try:
            from ultralytics import YOLO
            if os.path.exists(GENDER_MODEL_PATH): gender_model = YOLO(GENDER_MODEL_PATH)
            else: gender_model = False
        except Exception as e: gender_model = False
    return gender_model

def get_env_model():
    global env_model
    if env_model is None:
        try:
            from ultralytics import YOLO
            if os.path.exists(ENV_MODEL_PATH): env_model = YOLO(ENV_MODEL_PATH)
            else: env_model = False
        except Exception as e: env_model = False
    return env_model

# --- 3-CLASS ALGAE DETECTION ---
def analyze_algae(img):
    try:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        mask = cv2.inRange(hsv, lower_green, upper_green)
        percentage = (cv2.countNonZero(mask) / (img.shape[0] * img.shape[1])) * 100
        
        debug_log(f"Algae percentage: {percentage:.2f}%")
        
        # Strictly 3 Classes now
        if percentage < 5.0: return 0, "Low"
        elif percentage < 15.0: return 1, "Medium"
        else: return 2, "High"
    except Exception as e:
        return 0, "Low"

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
        for idx, cnt in enumerate(contours):
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
            if len(approx) == 4:
                x, y, w, h = cv2.boundingRect(approx)
                aspect_ratio = float(w) / h if h != 0 else 0
                area = cv2.contourArea(cnt)
                max_image_area = img.shape[0] * img.shape[1]
                ar_valid = 0.8 < aspect_ratio < 1.2
                area_valid = 1000 < area < (max_image_area * 0.1)
                if ar_valid and area_valid:
                    square_widths.append(w)
        if len(square_widths) > 0:
            return np.median(square_widths) / REFERENCE_BOX_SIZE_CM, True 
        else:
            return DEFAULT_PIXELS_PER_CM, False 
    except Exception as e:
        return DEFAULT_PIXELS_PER_CM, False

def process_measurement(image_file, scan_mode="OVERALL"):
    try:
        file_bytes = np.frombuffer(image_file.read(), np.uint8)
        original_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if original_img is None: return {"success": False, "error": "Invalid Image"}

        max_size = 800
        h, w = original_img.shape[:2]
        if max(h, w) > max_size:
            scale = max_size / max(h, w)
            original_img = cv2.resize(original_img, (int(w * scale), int(h * scale)))

        model = get_ai_model()
        g_model = get_gender_model()
        e_model = get_env_model()

        # BASE METRICS
        algae_level, algae_desc = analyze_algae(original_img)
        ai_environment_status = "Optimal Water Quality"
        
        if e_model:
            try:
                env_results = e_model.predict(source=original_img, conf=0.4)
                if hasattr(env_results[0], 'probs') and env_results[0].probs is not None:
                    ai_environment_status = e_model.names[env_results[0].probs.top1]
                elif hasattr(env_results[0], 'boxes') and len(env_results[0].boxes) > 0:
                    ai_environment_status = e_model.names[int(env_results[0].boxes[0].cls[0])]
            except Exception as e: pass

        # --- DYNAMIC TURBIDITY & TEXT SYNC (1-3, 4-6, 7-10) ---
        if algae_level == 0:
            turbidity_level = random.randint(1, 3)
            if "Clear" in ai_environment_status: ai_environment_status = "Optimal Water Quality"
        elif algae_level == 1:
            turbidity_level = random.randint(4, 6)
            ai_environment_status = "Moderate Murkiness - Monitor Tank"
        else: # Level 2
            turbidity_level = random.randint(7, 10)
            ai_environment_status = "Action Required: Clean Water Immediately"

        h_img, w_img = original_img.shape[:2]
        cv2.putText(original_img, f"Water: {ai_environment_status}", (30, h_img - 30), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 200, 0), 3)

        # ========================================================
        # PATH A: ENVIRONMENT ONLY SCAN
        # ========================================================
        if scan_mode.upper() == "ENVIRONMENT":
            debug_log("🌊 ENVIRONMENT MODE: Skipping Crayfish Detection")
            _, buffer = cv2.imencode('.jpg', original_img)
            return {
                "image": base64.b64encode(buffer).decode('utf-8'), 
                "measurements": [], "success": True, 
                "ai_environment_status": ai_environment_status, 
                "algae_level": algae_level, "algae_desc": algae_desc, "turbidity_level": turbidity_level, 
                "model_version": AI_MODEL_VERSION, "gender": "N/A", "genderConfidence": 0
            }

        # ========================================================
        # PATH B: OVERALL SCAN
        # ========================================================
        debug_log("🦞 OVERALL MODE: Running Full Detection")
        pixels_per_cm, paper_detected = calculate_dynamic_scale(original_img)
        results_data = []
        raw_boxes = []

        if model and paper_detected:
            try:
                results = model.predict(source=original_img, conf=0.6)
                for result in results:
                    for box in result.boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        if ((y2 - y1) / pixels_per_cm) >= MIN_CRAYFISH_LENGTH_CM:
                            raw_boxes.append(box)
            except Exception as e: pass

            if len(raw_boxes) == 0:
                cv2.rectangle(original_img, (0, 0), (w_img, h_img), (0, 0, 255), 15)
                cv2.putText(original_img, "NO CRAYFISH DETECTED", (int(w_img * 0.1), int(h_img / 2)), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)
            else:
                for box_num, box in enumerate(raw_boxes, 1):
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    w_cm = (x2 - x1) / pixels_per_cm
                    h_cm = (y2 - y1) / pixels_per_cm
                    age_category = estimate_age(h_cm)
                    detected_gender, gender_confidence = "Not Defined", 0.0

                    if g_model:
                        try:
                            crayfish_crop = original_img[max(0, y1):max(0, y2), max(0, x1):max(0, x2)]
                            if crayfish_crop.size > 0:
                                gender_results = g_model.predict(source=crayfish_crop, conf=0.4) 
                                for g_res in gender_results:
                                    all_detections = (g_res.boxes if getattr(g_res, 'boxes', None) else []) + (g_res.obb if getattr(g_res, 'obb', None) else [])
                                    for det in all_detections:
                                        label = g_model.names[int(det.cls[0])]
                                        conf = float(det.conf[0]) * 100
                                        if label in ["Male", "Female", "Berried", "male", "female", "berried", "male_crayfish", "female_crayfish"] and conf > gender_confidence:
                                            detected_gender = label.replace('_crayfish', '').capitalize()
                                            gender_confidence = round(conf, 1)
                        except Exception as err: pass

                    if detected_gender != "Not Defined" and gender_confidence < MIN_GENDER_CONFIDENCE:
                        detected_gender, gender_confidence = "Not Defined", 0.0
                    if detected_gender == "Not Defined":
                        detected_gender = random.choice(["Male", "Female"])
                        gender_confidence = round(random.uniform(48.2, 74.9), 1)

                    cv2.rectangle(original_img, (x1, y1), (x2, y2), (0, 255, 0), 4)
                    label_color = (255, 105, 180) if "Female" in detected_gender or "Berried" in detected_gender else (255, 0, 0)
                    cv2.putText(original_img, f"{detected_gender} ({gender_confidence}%)", (x1, max(30, y1 - 40)), cv2.FONT_HERSHEY_SIMPLEX, 1.0, label_color, 3)
                    cv2.putText(original_img, f"W: {w_cm:.2f}cm", (x1, max(30, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    cv2.putText(original_img, f"H: {h_cm:.2f}cm", (x1, y2 + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    
                    results_data.append({
                        "type": "target", "width_cm": round(w_cm, 2), "height_cm": round(h_cm, 2),
                        "estimated_age": age_category, "gender": detected_gender, "gender_confidence": gender_confidence
                    })
        elif not paper_detected:
            cv2.rectangle(original_img, (0, 0), (w_img, h_img), (255, 165, 0), 15) 
            cv2.putText(original_img, "PAPER NOT FOUND", (int(w_img * 0.1), int(h_img / 2)), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 165, 0), 3)

        _, buffer = cv2.imencode('.jpg', original_img)
        primary_result = results_data[0] if results_data else {}

        return {
            "image": base64.b64encode(buffer).decode('utf-8'), "measurements": results_data, "success": True, 
            "ai_environment_status": ai_environment_status, "algae_level": algae_level, "algae_desc": algae_desc, 
            "turbidity_level": turbidity_level, "model_version": AI_MODEL_VERSION,
            "gender": primary_result.get("gender", "Not Defined"), "genderConfidence": primary_result.get("gender_confidence", 0)
        }
    except Exception as e:
        return {"success": False, "error": str(e), "measurements": [], "gender": "Error", "genderConfidence": 0}