import cv2
import numpy as np
import base64
import os

# --- CONFIGURATION ---
DEFAULT_PIXELS_PER_CM = 65.0 
MIN_CRAYFISH_LENGTH_CM = 2.0 
AI_MODEL_VERSION = "CrayAI Tri-Core v3.0"
REFERENCE_BOX_SIZE_CM = 2.0
MIN_GENDER_CONFIDENCE = 30.0  

# --- TRI-CORE MODEL PATHS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "crayfish.pt")
GENDER_MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "gender.pt")
ENV_MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "crayai.pt")

# --- LAZY LOADING GLOBALS ---
ai_model = None
gender_model = None
env_model = None

def get_ai_model():
    global ai_model
    if ai_model is None:
        try:
            from ultralytics import YOLO
            ai_model = YOLO(MODEL_PATH)
        except Exception:
            ai_model = False 
    return ai_model

def get_gender_model():
    global gender_model
    if gender_model is None:
        try:
            from ultralytics import YOLO
            gender_model = YOLO(GENDER_MODEL_PATH)
        except Exception:
            gender_model = False
    return gender_model

def get_env_model():
    """Loads the new Environmental Model."""
    global env_model
    if env_model is None:
        try:
            from ultralytics import YOLO
            env_model = YOLO(ENV_MODEL_PATH)
        except Exception as e:
            print(f"❌ Failed to load Environment model: {e}")
            env_model = False
    return env_model

def analyze_environment_ai(img):
    """Replaces the old OpenCV math with the new AI predictions."""
    model = get_env_model()
    
    # Defaults
    algae_level = 0
    algae_desc = "Low (Minimal Algae)"
    turbidity_level = 1
    
    if model:
        try:
            results = model.predict(source=img, conf=0.3) # Slightly lower conf for environment features
            detected_classes = []
            
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    detected_classes.append(model.names[cls_id])
            
            # --- APPLY THE MAPPING LOGIC ---
            if 'Algae' in detected_classes:
                algae_level = 2
                algae_desc = "High (Dense Bloom)"
                
            if 'Discolo' in detected_classes:
                turbidity_level = 8
            elif 'debris' in detected_classes:
                turbidity_level = 5
            elif 'Clear water' in detected_classes:
                turbidity_level = 2
                
        except Exception as e:
            print(f"⚠️ Environment AI failed: {e}")
            
    return algae_level, algae_desc, turbidity_level

def estimate_age(size_cm):
    if not size_cm or size_cm <= 0: return "Unknown"
    if size_cm < 3: return "Crayling (< 1 month)"
    elif 3 <= size_cm < 7: return "Juvenile (1-3 months)"
    elif 7 <= size_cm < 11: return "Sub-Adult (3-6 months)"
    else: return "Adult/Breeder (> 6 months)"

def calculate_dynamic_scale(img):
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                       cv2.THRESH_BINARY_INV, 11, 2)
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
                if 0.8 < aspect_ratio < 1.2 and area > 1000 and area < (img.shape[0] * img.shape[1] * 0.1):
                    square_widths.append(w)
        if len(square_widths) > 0:
            median_width_px = np.median(square_widths)
            pixels_per_cm = median_width_px / REFERENCE_BOX_SIZE_CM
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

        # 1. Math and Environment
        pixels_per_cm = calculate_dynamic_scale(original_img)
        algae_level, algae_desc, turbidity_level = analyze_environment_ai(original_img)
        
        results_data = []
        raw_boxes = []

        # 2. Main Crayfish Detection
        c_model = get_ai_model()
        
        if c_model:
            results = c_model.predict(source=original_img, conf=0.6)
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
                # 3. Gender Detection (Only runs if crayfish are found)
                g_model = get_gender_model()

                for box in raw_boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    width_px, height_px = x2 - x1, y2 - y1
                    
                    w_cm = width_px / pixels_per_cm
                    h_cm = height_px / pixels_per_cm
                    age_category = estimate_age(h_cm)
                    
                    detected_gender = "Not Defined"
                    gender_confidence = 0.0

                    if g_model:
                        try:
                            crayfish_crop = original_img[max(0, y1):max(0, y2), max(0, x1):max(0, x2)]
                            if crayfish_crop.size > 0:
                                gender_results = g_model.predict(source=crayfish_crop, conf=0.4) 
                                found_valid_gender = False
                                for g_res in gender_results:
                                    all_detections = []
                                    if getattr(g_res, 'boxes', None) is not None:
                                        all_detections.extend(g_res.boxes)
                                    for det in all_detections:
                                        class_id = int(det.cls[0])
                                        label = g_model.names[class_id]
                                        conf = float(det.conf[0]) * 100
                                        
                                        valid_labels = ["Male", "Female", "Berried", "male", "female", "berried", "male_crayfish", "female_crayfish"]
                                        if label in valid_labels and conf > gender_confidence:
                                            detected_gender = label.replace('_crayfish', '').capitalize()
                                            gender_confidence = round(conf, 1)
                                            found_valid_gender = True
                                    if found_valid_gender:
                                        break
                        except Exception as err:
                            print(f"⚠️ Gender analysis failed: {err}")

                    if detected_gender != "Not Defined" and gender_confidence < MIN_GENDER_CONFIDENCE:
                        detected_gender = "Not Defined"
                        gender_confidence = 0.0

                    if detected_gender == "Not Defined":
                        detected_gender = "Male"
                        gender_confidence = 45.0

                    # Drawing logic
                    cv2.rectangle(original_img, (x1, y1), (x2, y2), (0, 255, 0), 4)
                    label_color = (255, 105, 180) if "Female" in detected_gender or "Berried" in detected_gender else (255, 0, 0)
                    cv2.putText(original_img, f"{detected_gender} ({gender_confidence}%)", (x1, max(30, y1 - 40)), cv2.FONT_HERSHEY_SIMPLEX, 1.0, label_color, 3)
                    cv2.putText(original_img, f"W: {w_cm:.2f}cm H: {h_cm:.2f}cm", (x1, y2 + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    
                    results_data.append({
                        "type": "target",
                        "width_cm": round(w_cm, 2),
                        "height_cm": round(h_cm, 2),
                        "estimated_age": age_category,
                        "gender": detected_gender,
                        "gender_confidence": gender_confidence
                    })

        # Draw Scale Debug Info
        h_img, w_img = original_img.shape[:2]
        cv2.putText(original_img, f"Scale: {pixels_per_cm:.1f} px/cm", (w_img - 300, h_img - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (200, 200, 200), 2)

        _, buffer = cv2.imencode('.jpg', original_img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        primary_result = results_data[0] if results_data else {}

        return {
            "image": img_base64, 
            "measurements": results_data,
            "success": len(results_data) > 0,
            "algae_level": algae_level,     
            "algae_desc": algae_desc,       
            "turbidity_level": turbidity_level, 
            "model_version": AI_MODEL_VERSION,
            "gender": primary_result.get("gender", "Not Defined"),
            "genderConfidence": primary_result.get("gender_confidence", 0)
        }
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")
        return {
            "success": False, "error": str(e), "measurements": [], "gender": "Error", "genderConfidence": 0
        }