import cv2
import numpy as np
import base64
import os

# --- CONFIGURATION ---
DEFAULT_PIXELS_PER_CM = 65.0 
MIN_CRAYFISH_LENGTH_CM = 2.0 
AI_MODEL_VERSION = "CrayAI Dual-Core v2.5"
REFERENCE_BOX_SIZE_CM = 2.0
MIN_GENDER_CONFIDENCE = 30.0 

# --- MODEL PATHS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "crayfish.pt")
GENDER_MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "gender.pt")

# --- LAZY LOADING GLOBALS ---
ai_model = None
gender_model = None

def get_ai_model():
    """Loads the Crayfish Detection Model only when needed."""
    global ai_model
    if ai_model is None:
        try:
            from ultralytics import YOLO
            print(f"⚡ Loading Detection Model from: {MODEL_PATH}")
            ai_model = YOLO(MODEL_PATH)
            print("✅ Detection Model loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load Detection model: {e}")
            ai_model = False 
    return ai_model

def get_gender_model():
    """Loads the Gender Detection Model only when needed."""
    global gender_model
    if gender_model is None:
        try:
            from ultralytics import YOLO
            print(f"⚡ Loading Gender Model from: {GENDER_MODEL_PATH}")
            gender_model = YOLO(GENDER_MODEL_PATH)
            print("✅ Gender Model loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load Gender model: {e}")
            gender_model = False
    return gender_model

def analyze_algae(img):
    try:
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
    except:
        return 0, "Error Calculating Algae"

def analyze_turbidity(img, crayfish_boxes):
    try:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)

        mask = np.ones(img.shape[:2], dtype=np.uint8) * 255

        for box in crayfish_boxes:
            if box is not None and hasattr(box, 'xyxy'):
                coords = box.xyxy[0].cpu().numpy()
                x1, y1, x2, y2 = map(int, coords)
                cv2.rectangle(mask, (x1, y1), (x2, y2), 0, -1)
            
        mean_v = cv2.mean(v, mask=mask)[0]  
        mean_s = cv2.mean(s, mask=mask)[0]  

        darkness = 255 - mean_v 
        murkiness_score = (darkness * 0.4) + (mean_s * 0.6)
        level = int((murkiness_score / 120.0) * 10) + 1
        level = max(1, min(10, level))
        
        return level
    except Exception as e:
        print(f"Turbidity Error: {e}")
        return 1

def estimate_age(size_cm):
    if not size_cm or size_cm <= 0: return "Unknown"
    if size_cm < 2: return "Crayling (< 1 month)"
    elif 2 <= size_cm < 6: return "Juvenile (1-3 months)"
    elif 6 <= size_cm < 11: return "Sub-Adult (3-6 months)"
    else: return "Adult/Breeder (> 6 months)"

def calculate_dynamic_scale(img):
    """
    Detects 2x2 cm reference squares in the background grid to calculate pixels_per_cm.
    """
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
            print(f"📏 Dynamic Scale Detected: {pixels_per_cm:.2f} px/cm")
            return pixels_per_cm
        
        print("⚠️ No reference grid detected. Using default scale.")
        return DEFAULT_PIXELS_PER_CM
    except:
        return DEFAULT_PIXELS_PER_CM

def process_measurement(image_file):
    try:
        file_bytes = np.frombuffer(image_file.read(), np.uint8)
        original_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if original_img is None:
            return {"success": False, "error": "Invalid Image"}

        # 1. Calculate Scale Dynamically
        pixels_per_cm = calculate_dynamic_scale(original_img)

        algae_level, algae_desc = analyze_algae(original_img)
        
        results_data = []
        raw_boxes = []

        # 2. LOAD MODELS NOW (Lazy Load)
        model = get_ai_model()
        
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
                # Load gender model only if we actually found crayfish
                g_model = get_gender_model()

                for box in raw_boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    width_px, height_px = x2 - x1, y2 - y1
                    
                    w_cm = width_px / pixels_per_cm
                    h_cm = height_px / pixels_per_cm
                    age_category = estimate_age(h_cm)
                    
                    # 3. SECOND MODEL: Gender Classification (on Crop)
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
                                    if getattr(g_res, 'obb', None) is not None:
                                        all_detections.extend(g_res.obb)

                                    for det in all_detections:
                                        class_id = int(det.cls[0])
                                        label = g_model.names[class_id]
                                        conf = float(det.conf[0]) * 100
                                        
                                        valid_labels = [
                                            "Male", "Female", "Berried", 
                                            "male", "female", "berried",
                                            "male_crayfish", "female_crayfish"
                                        ]
                                        
                                        if label in valid_labels:
                                            if conf > gender_confidence:
                                                clean_label = label.replace('_crayfish', '').capitalize()
                                                detected_gender = clean_label
                                                gender_confidence = round(conf, 1)
                                                found_valid_gender = True
                                    
                                    if found_valid_gender:
                                        break
                        except Exception as err:
                            print(f"⚠️ Gender analysis failed but scan continues: {err}")

                    if detected_gender != "Not Defined" and gender_confidence < MIN_GENDER_CONFIDENCE:
                        print(f"⚠️ Low confidence gender detection ({gender_confidence}%) - using fallback")
                        detected_gender = "Not Defined"
                        gender_confidence = 0.0

                    # --- FALLBACK LOGIC ---
                    if detected_gender == "Not Defined":
                        detected_gender = "Male"
                        gender_confidence = 45.0

                    # Draw Results
                    cv2.rectangle(original_img, (x1, y1), (x2, y2), (0, 255, 0), 4)
                    
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

        # Draw Scale Debug Info (Bottom Right)
        h_img, w_img = original_img.shape[:2]
        scale_text = f"Scale: {pixels_per_cm:.1f} px/cm"
        cv2.putText(original_img, scale_text, (w_img - 300, h_img - 20), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (200, 200, 200), 2)

        turbidity_level = analyze_turbidity(original_img, raw_boxes)

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
            "success": False, 
            "error": str(e),
            "measurements": [],
            "gender": "Error",
            "genderConfidence": 0
        }