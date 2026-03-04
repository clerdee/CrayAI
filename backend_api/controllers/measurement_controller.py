import cv2
import numpy as np
import base64
import os

# --- CONFIGURATION ---
DEFAULT_PIXELS_PER_CM = 65.0 
MIN_CRAYFISH_LENGTH_CM = 2.0 
AI_MODEL_VERSION = "CrayAI Unified Core v3.0"
REFERENCE_BOX_SIZE_CM = 2.0
MIN_GENDER_CONFIDENCE = 30.0  

# --- UNIFIED MODEL PATH ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
UNIFIED_MODEL_PATH = os.path.join(BASE_DIR, "ai_models", "crayai.pt")

# --- LAZY LOADING GLOBAL ---
crayai_model = None

def get_crayai_model():
    """Loads the Unified Detection Model only when needed."""
    global crayai_model
    if crayai_model is None:
        try:
            from ultralytics import YOLO
            print(f"⚡ Loading Unified Model from: {UNIFIED_MODEL_PATH}")
            crayai_model = YOLO(UNIFIED_MODEL_PATH)
            print("✅ Unified Model loaded successfully")
            
            # --- DISCOVERY PRINT ---
            print("--- MODEL CLASSES DICTIONARY ---")
            print(crayai_model.names) 
            
        except Exception as e:
            print(f"❌ Failed to load Unified model: {e}")
            crayai_model = False 
    return crayai_model

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

        pixels_per_cm = calculate_dynamic_scale(original_img)
        algae_level, algae_desc = analyze_algae(original_img)
        
        results_data = []
        raw_boxes = []

        # 2. LOAD UNIFIED MODEL NOW
        model = get_crayai_model()
        
        # --- TEMPORARY FALLBACKS UNTIL WE DECODE THE MODEL ---
        detected_gender = "Not Defined"
        gender_confidence = 0.0
        
        if model:
            results = model.predict(source=original_img, conf=0.6)
            
            # --- DISCOVERY PRINT ---
            print("--- RAW MODEL PREDICTIONS ---")
            for result in results:
                print("Detected Classes:", result.boxes.cls.tolist())
                print("Confidences:", result.boxes.conf.tolist())
            
            # We are keeping this loop very simple for now, just finding the boxes 
            # so the size math doesn't break. We will rewrite this entirely 
            # once we see the logs!
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    h_cm = (y2 - y1) / pixels_per_cm
                    if h_cm >= MIN_CRAYFISH_LENGTH_CM:
                        raw_boxes.append(box)
                        
                        # Calculate basic stats so the frontend gets something back
                        w_cm = (x2 - x1) / pixels_per_cm
                        age_category = estimate_age(h_cm)
                        
                        results_data.append({
                            "type": "target",
                            "width_cm": round(w_cm, 2),
                            "height_cm": round(h_cm, 2),
                            "estimated_age": age_category,
                            "gender": "Pending Model Update", # Placeholder
                            "gender_confidence": 0
                        })

        if len(raw_boxes) == 0:
            h, w = original_img.shape[:2]
            cv2.rectangle(original_img, (0, 0), (w, h), (0, 0, 255), 15)
            cv2.putText(original_img, "NO CRAYFISH DETECTED", (int(w * 0.1), int(h / 2)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)

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