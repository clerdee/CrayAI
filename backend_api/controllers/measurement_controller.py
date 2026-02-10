import cv2
import numpy as np
import base64

# --- CONFIGURATION ---
# CALIBRATION: 137 pixels = 1 cm
PIXELS_PER_CM = 137.0 
MIN_AREA_THRESHOLD = 1500 

# FOCAL BOX SETTINGS (The "Yellow Zone")
FOCUS_W_PCT = 0.80
FOCUS_H_PCT = 0.60

def process_measurement(image_file):
    # 1. READ IMAGE
    file_bytes = np.frombuffer(image_file.read(), np.uint8)
    original_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    
    # 2. RESIZE FOR SPEED (Process small, scale up later)
    orig_h, orig_w = original_img.shape[:2]
    process_width = 800
    scale_factor = orig_w / process_width
    process_height = int(orig_h / scale_factor)
    
    img = cv2.resize(original_img, (process_width, process_height))
    
    # 3. DEFINE FOCAL ZONE (ROI)
    # We only look inside this box.
    center_x, center_y = int(process_width / 2), int(process_height / 2)
    box_w, box_h = int(process_width * FOCUS_W_PCT), int(process_height * FOCUS_H_PCT)
    x1 = max(0, center_x - int(box_w / 2))
    y1 = max(0, center_y - int(box_h / 2))
    x2 = min(process_width, center_x + int(box_w / 2))
    y2 = min(process_height, center_y + int(box_h / 2))
    
    rect = (x1, y1, x2-x1, y2-y1)

    # 4. PRE-PROCESSING (The "Smart" Part)
    # Bilateral Filter: Smoothes noise but keeps EDGES sharp (Better than Gaussian)
    blur = cv2.bilateralFilter(img, 9, 75, 75)
    gray = cv2.cvtColor(blur, cv2.COLOR_BGR2GRAY)

    # 5. INITIAL MASK GENERATION (Otsu's Binarization)
    # This automatically finds the "dark" object vs "light" background
    # We use this to giving GrabCut a "Hint" instead of a blind guess.
    _, binary_mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Clean the mask (Remove small white spots)
    kernel = np.ones((5, 5), np.uint8)
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel, iterations=2)
    
    # Only keep the mask INSIDE the focal rectangle
    final_binary_mask = np.zeros_like(binary_mask)
    final_binary_mask[y1:y2, x1:x2] = binary_mask[y1:y2, x1:x2]

    # 6. GRABCUT WITH MASK INITIALIZATION
    # GC_BGD = 0 (Background), GC_FGD = 1 (Foreground), GC_PR_BGD = 2, GC_PR_FGD = 3
    gc_mask = np.zeros(img.shape[:2], np.uint8)
    
    # Everything is Probable Background (2) by default
    gc_mask[:] = cv2.GC_PR_BGD 
    # Where our Otsu mask is BLACK (Background), set to Definite Background (0)
    gc_mask[final_binary_mask == 0] = cv2.GC_BGD
    # Where our Otsu mask is WHITE (Object), set to Probable Foreground (3)
    gc_mask[final_binary_mask == 255] = cv2.GC_PR_FGD

    # Run GrabCut (Iterative Refinement)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    
    try:
        cv2.grabCut(img, gc_mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_MASK)
    except:
        # Fallback if GrabCut fails
        pass

    # Extract the final clean mask (Pixels labeled 1 or 3)
    mask2 = np.where((gc_mask == 2) | (gc_mask == 0), 0, 1).astype('uint8')

    # 7. FIND CONTOURS (On the clean mask)
    contours, _ = cv2.findContours(mask2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # 8. FIND LARGEST OBJECT
    largest_object = None
    max_area = 0
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > MIN_AREA_THRESHOLD:
            if area > max_area:
                max_area = area
                
                # Scale contours back to original HD size
                rect_box = cv2.minAreaRect(cnt) 
                (x_small, y_small), (w_small, h_small), angle = rect_box
                
                real_w = w_small * scale_factor
                real_h = h_small * scale_factor
                real_x = x_small * scale_factor
                real_y = y_small * scale_factor
                
                # Fix orientation
                if angle > 45: 
                    real_w, real_h = real_h, real_w
                
                cnt_scaled = (cnt * scale_factor).astype(np.int32)
                
                largest_object = {
                    'cnt': cnt_scaled,
                    'rect_box': ((real_x, real_y), (real_w, real_h), angle),
                    'x': real_x,
                    'y': real_y,
                    'w': real_w,
                    'h': real_h
                }

    # 9. DRAW RESULTS
    overlay = original_img.copy()
    
    # Draw Focal Zone
    orig_cx, orig_cy = int(orig_w / 2), int(orig_h / 2)
    orig_bx_w, orig_bx_h = int(orig_w * FOCUS_W_PCT), int(orig_h * FOCUS_H_PCT)
    ox1 = max(0, orig_cx - int(orig_bx_w / 2))
    oy1 = max(0, orig_cy - int(orig_bx_h / 2))
    ox2 = min(orig_w, orig_cx + int(orig_bx_w / 2))
    oy2 = min(orig_h, orig_cy + int(orig_bx_h / 2))
    
    cv2.rectangle(original_img, (ox1, oy1), (ox2, oy2), (0, 255, 255), 3)
    cv2.putText(original_img, f"SCAN ZONE", (ox1 + 20, oy1 + 50), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 3)

    results = []

    if largest_object:
        # Measure
        w_cm = largest_object['w'] / PIXELS_PER_CM
        h_cm = largest_object['h'] / PIXELS_PER_CM
        
        # Draw TIGHT Green Mask (The Blob)
        cv2.drawContours(overlay, [largest_object['cnt']], -1, (0, 255, 0), -1) 
        
        # Draw White Outline
        box = np.int32(cv2.boxPoints(largest_object['rect_box']))
        cv2.drawContours(original_img, [box], 0, (255, 255, 255), 4)
        
        # Draw Labels
        lx, ly = int(largest_object['x']), int(largest_object['y'])
        cv2.putText(original_img, f"CRAYFISH", (lx, ly - 60), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 4)
        cv2.putText(original_img, f"W: {w_cm:.2f}cm", (lx, ly - 20), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 3)
        cv2.putText(original_img, f"H: {h_cm:.2f}cm", (lx, ly + 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 3)
        
        results.append({
            "type": "target",
            "width_cm": round(w_cm, 2),
            "height_cm": round(h_cm, 2)
        })

    # Blend overlay (Opacity)
    cv2.addWeighted(overlay, 0.35, original_img, 0.65, 0, original_img)

    # 10. RETURN
    _, buffer = cv2.imencode('.jpg', original_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    return {"image": img_base64, "measurements": results}