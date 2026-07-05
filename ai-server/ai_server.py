# ai_server.py — CCCD Verification Server (FastAPI + OpenCV + MediaPipe + PaddleOCR)
import unicodedata
import re
import cv2
import numpy as np
import mediapipe as mp
import logging
from paddleocr import PaddleOCR  # type: ignore — installed inside Docker only
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import Optional

# Tắt bớt log rác của PaddleOCR cho server clean hơn
logging.getLogger("ppocr").setLevel(logging.WARNING)

app = FastAPI()

# ─── KHỞI TẠO MODELS (Load 1 lần khi bật server) ──────────────────────────
print("Dang khoi tao AI Models...")
mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.5)

# Khởi tạo PaddleOCR: lang='vi' (đọc tốt tiếng Việt có dấu), use_angle_cls=True (tự xoay ảnh nghiêng)
ocr_reader = PaddleOCR(use_angle_cls=True, lang='vi', show_log=False)
print("San sang nhan Request!")


# ═══════════════════════════════════════════════════════════════════════════
# PHẦN 1: XỬ LÝ ẢNH ĐẦU VÀO
# ═══════════════════════════════════════════════════════════════════════════

def load_image(contents: bytes) -> np.ndarray:
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="File không phải định dạng ảnh hợp lệ. Vui lòng chỉ tải lên ảnh JPG hoặc PNG.")
    return image


def check_brightness(image: np.ndarray, min_brightness: int = 40) -> bool:
    """True nếu ảnh tối quá."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return float(np.mean(gray)) < min_brightness


def check_blur(image: np.ndarray, threshold: int = 60) -> bool:
    """True nếu ảnh mờ quá (Laplacian variance < ngưỡng)."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var() < threshold


def check_obstruction(image: np.ndarray, dark_ratio_threshold: float = 0.25) -> bool:
    """True nếu ảnh bị che khuất đáng kể."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    total = gray.size
    very_dark = np.sum(gray < 20)
    return (very_dark / total) > dark_ratio_threshold


def auto_crop_card(image: np.ndarray) -> np.ndarray:
    """Tự động phát hiện viền thẻ CCCD và crop + perspective transform."""
    orig = image.copy()
    h, w = image.shape[:2]
    img_area = h * w

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 11, 17, 17)
    edges = cv2.Canny(gray, 30, 200)
    kernel = np.ones((3, 3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    card_contour = None
    for cnt in contours[:10]:
        area = cv2.contourArea(cnt)
        if area < 0.20 * img_area:
            break
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            card_contour = approx
            break

    if card_contour is None:
        return orig

    pts = card_contour.reshape(4, 2).astype(np.float32)
    rect = _order_points(pts)
    tl, tr, br, bl = rect

    width = int(max(np.linalg.norm(br - bl), np.linalg.norm(tr - tl)))
    height = int(max(np.linalg.norm(tr - br), np.linalg.norm(tl - bl)))

    if width < 100 or height < 60:
        return orig

    dst = np.array([
        [0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]
    ], dtype=np.float32)
    M = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(orig, M, (width, height))


def _order_points(pts: np.ndarray) -> np.ndarray:
    """Sắp xếp 4 điểm: TL, TR, BR, BL."""
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def run_quality_checks(image: np.ndarray):
    """Chạy toàn bộ kiểm tra chất lượng. Raise HTTPException nếu không đạt."""
    if check_brightness(image):
        raise HTTPException(status_code=400, detail="Ảnh quá tối. Vui lòng chụp lại ở nơi có đủ ánh sáng.")
    if check_blur(image):
        raise HTTPException(status_code=400, detail="Ảnh quá mờ. Vui lòng chụp lại thật nét, giữ tay ổn định.")
    if check_obstruction(image):
        raise HTTPException(status_code=400, detail="Ảnh bị che khuất. Vui lòng đảm bảo cả hai mặt thẻ hiển thị đầy đủ, không có vật gì đè lên.")


# ═══════════════════════════════════════════════════════════════════════════
# PHẦN 2: XỬ LÝ MẶT TRƯỚC — FACE + TÊN
# ═══════════════════════════════════════════════════════════════════════════

def detect_face(image: np.ndarray) -> bool:
    """Phát hiện khuôn mặt trong ảnh (mặt trước CCCD)."""
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_detector.process(rgb)
    return bool(results.detections)


def normalize_name(name: str) -> str:
    """
    Chuẩn hóa tên để so sánh:
    - Xử lý riêng Đ/đ (không decompose được bằng NFD)
    - Bỏ dấu tiếng Việt (NFD decompose + remove Mn category)
    - Uppercase + xóa ký tự đặc biệt + chuẩn khoảng trắng
    """
    name = name.replace('Đ', 'D').replace('đ', 'd')
    nfd = unicodedata.normalize('NFD', name.strip())
    no_accent = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
    cleaned = re.sub(r'[^A-Za-z\s]', '', no_accent)
    return ' '.join(cleaned.upper().split())


def extract_name_from_front(image: np.ndarray) -> Optional[str]:
    """
    Dùng PaddleOCR đọc text từ mặt trước CCCD, tìm dòng tên người sở hữu.
    CCCD mới: 'Họ và tên' + 'Full name:' ở 2 dòng liên tiếp, tên ở dòng dưới in HOA.
    """
    ocr_result = ocr_reader.ocr(image, cls=True)

    if not ocr_result or not ocr_result[0]:
        print("[AI OCR] Không tìm thấy text trong ảnh.")
        return None

    lines = []
    # PaddleOCR trả về: [[[[x,y],[x,y],[x,y],[x,y]], ('text', conf)], ...]
    for line in ocr_result[0]:
        box, (text, conf) = line
        if conf > 0.3 and text.strip():
            y_center = int((box[0][1] + box[3][1]) / 2)
            lines.append((y_center, text.strip()))

    lines.sort(key=lambda x: x[0])
    texts = [t for _, t in lines]

    print(f"[AI OCR] Đọc được {len(texts)} dòng text:")
    for t in texts:
        print(f"  | {t}")

    # Tìm dòng label tên — CCCD mới có 2 nhãn liên tiếp: "Họ và tên" + "Full name:"
    label_keywords = ['ho va ten', 'full name', 'ho ten', 'they va ten']

    def is_label(t: str) -> bool:
        """Kiểm tra dòng có phải nhãn không."""
        n = normalize_name(t).lower()
        return any(kw in n for kw in label_keywords) or t.strip().endswith(':')

    for i, text in enumerate(texts):
        norm = normalize_name(text).lower()
        if any(kw in norm for kw in label_keywords):
            # Bỏ qua tất cả dòng nhãn liên tiếp, lấy dòng thật sự là tên
            j = i + 1
            while j < len(texts) and is_label(texts[j]):
                j += 1
            if j < len(texts):
                candidate = texts[j]
                print(f"[AI OCR] Tìm thấy nhãn tên tại [{i}], tên tại [{j}]: '{candidate}'")
                return candidate

    # Fallback: tìm dòng toàn chữ HOA dài nhất (thường là tên)
    exclude_kw = ['cccd', 'cmnd', 'viet', 'nam', 'hanoi', 'quoc', 'tich', 'can', 'cuoc',
                  'republic', 'socialist', 'cong', 'dan', 'sinh', 'ngay', 'thang', 'nam',
                  'gioi', 'tinh', 'quan', 'huyen', 'xa', 'phuong']
    upper_lines = [
        t for t in texts
        if len(t.split()) >= 2 and len(t) > 4
        and not any(kw in normalize_name(t).lower() for kw in exclude_kw)
        and re.match(r'^[A-ZÀ-ỹ\s]+$', t.strip())
    ]
    if upper_lines:
        candidate = max(upper_lines, key=lambda x: len(x.split()))
        print(f"[AI OCR] Fallback: chọn tên: '{candidate}'")
        return candidate

    print("[AI OCR] Không tìm thấy tên trong ảnh.")
    return None


def verify_name_match(cccd_name: Optional[str], user_name: str) -> tuple[bool, str]:
    """So sánh tên trên CCCD với tên user. Trả về (matched, message)."""
    if cccd_name is None:
        print("[AI] Không đọc được tên trên CCCD, bỏ qua kiểm tra tên.")
        return True, "Mặt trước hợp lệ"

    norm_cccd = normalize_name(cccd_name)
    norm_user = normalize_name(user_name)

    if norm_cccd == norm_user:
        return True, f"Mặt trước hợp lệ — tên khớp: {cccd_name}"

    print(f"[AI] Tên không khớp | CCCD: '{norm_cccd}' | User: '{norm_user}'")
    return False, (
        f"Tên trên CCCD ({cccd_name}) không khớp với tên tài khoản ({user_name}). "
        f"Vui lòng tải ảnh CCCD của chính bạn."
    )


# ═══════════════════════════════════════════════════════════════════════════
# PHẦN 3: XỬ LÝ MẶT SAU
# ═══════════════════════════════════════════════════════════════════════════

def detect_back_side(image: np.ndarray) -> bool:
    """Mặt sau CCCD có mã MRZ chứa text 'IDVNM' ở vùng đáy."""
    h, w = image.shape[:2]
    region = image[int(h * 0.5):h, 0:w]

    ocr_result = ocr_reader.ocr(region, cls=True)
    if not ocr_result or not ocr_result[0]:
        return False

    full_text = ""
    for line in ocr_result[0]:
        text = line[1][0]
        full_text += text.upper().replace(' ', '')

    return 'IDVNM' in full_text


# ═══════════════════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "AI Server dang hoat dong voi PaddleOCR"}


@app.post("/verify-cccd")
async def verify_cccd(
    file: UploadFile = File(...),
    side: str = Form("auto"),
    user_name: Optional[str] = Form(None),
):
    """
    Xác thực ảnh CCCD.
    - side="front": mặt trước (face + đối chiếu tên)
    - side="back":  mặt sau (tìm IDVNM)
    - side="auto":  tự phán đoán
    """
    try:
        contents = await file.read()
        image = load_image(contents)
        image = auto_crop_card(image)
        run_quality_checks(image)

        if side == "front":
            return await _verify_front(image, user_name)
        elif side == "back":
            return await _verify_back(image)
        else:  # auto
            if detect_face(image):
                return await _verify_front(image, user_name)
            if detect_back_side(image):
                return {"is_valid": True, "side": "BACK", "message": "Mặt sau hợp lệ"}
            raise HTTPException(
                status_code=400,
                detail="Hệ thống không nhận diện được đây là CCCD trong ảnh. Vui lòng chụp rõ toàn bộ thẻ căn cước."
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi máy chủ AI: {str(e)}")


async def _verify_front(image: np.ndarray, user_name: Optional[str]):
    """Xử lý mặt trước: face detection + name matching."""
    if not detect_face(image):
        raise HTTPException(
            status_code=400,
            detail="Không nhận diện được khuôn mặt trên mặt trước CCCD. Vui lòng chụp thật rõ khuôn mặt và đảm bảo ảnh đầy đủ."
        )

    if user_name and user_name.strip():
        cccd_name = extract_name_from_front(image)
        matched, msg = verify_name_match(cccd_name, user_name)
        if not matched:
            raise HTTPException(status_code=400, detail=msg)
        return {"is_valid": True, "side": "FRONT", "message": msg}

    return {"is_valid": True, "side": "FRONT", "message": "Mặt trước hợp lệ"}


async def _verify_back(image: np.ndarray):
    """Xử lý mặt sau: detect text IDVNM."""
    if detect_back_side(image):
        return {"is_valid": True, "side": "BACK", "message": "Mặt sau hợp lệ"}
    raise HTTPException(
        status_code=400,
        detail="Không nhận diện được mặt sau CCCD. Vui lòng chụp đúng mặt sau của thẻ căn cước công dân."
    )
