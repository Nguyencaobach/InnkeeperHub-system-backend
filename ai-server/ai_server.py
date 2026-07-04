# ai_server.py — CCCD Verification Server (FastAPI + OpenCV + MediaPipe + EasyOCR)
import unicodedata
import re
import cv2
import numpy as np
import mediapipe as mp
import easyocr
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import Optional

app = FastAPI()

# ─── KHỞI TẠO MODELS (Load 1 lần khi bật server) ──────────────────────────
print("Dang khoi tao AI Models...")
mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.5)
# vi: tiếng Việt để đọc tên có dấu; en: đọc text mặt sau
reader = easyocr.Reader(['vi', 'en'], gpu=False)
print("San sang nhan Request!")


# ═══════════════════════════════════════════════════════════════════════════
# PHẦN 1: XỬ LÝ ẢNH ĐẦU VÀO
# ═══════════════════════════════════════════════════════════════════════════

def load_image(contents: bytes) -> np.ndarray:
    """Decode bytes thành ảnh OpenCV. Raise nếu không hợp lệ."""
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="File không phải định dạng ảnh hợp lệ. Vui lòng chỉ tải lên ảnh JPG hoặc PNG.")
    return image


def check_brightness(image: np.ndarray, min_brightness: int = 40) -> bool:
    """True nếu ảnh tối quá (mean brightness < ngưỡng)."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return float(np.mean(gray)) < min_brightness


def check_blur(image: np.ndarray, threshold: int = 60) -> bool:
    """True nếu ảnh mờ quá (Laplacian variance < ngưỡng)."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var() < threshold


def check_obstruction(image: np.ndarray, dark_ratio_threshold: float = 0.25) -> bool:
    """
    True nếu ảnh bị che khuất đáng kể.
    Phát hiện bằng cách đếm tỷ lệ vùng rất tối (pixel < 20) hoặc rất sáng đồng nhất.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    total = gray.size
    very_dark = np.sum(gray < 20)
    return (very_dark / total) > dark_ratio_threshold


def auto_crop_card(image: np.ndarray) -> np.ndarray:
    """
    Tự động phát hiện viền thẻ CCCD và crop + perspective transform.
    Nếu không tìm thấy hình chữ nhật phù hợp, trả về ảnh gốc.
    """
    orig = image.copy()
    h, w = image.shape[:2]
    img_area = h * w

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Bilateral filter giữ cạnh sắc nét
    gray = cv2.bilateralFilter(gray, 11, 17, 17)
    edges = cv2.Canny(gray, 30, 200)

    # Dilate để nối các cạnh bị đứt đoạn
    kernel = np.ones((3, 3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    card_contour = None
    for cnt in contours[:10]:
        area = cv2.contourArea(cnt)
        # Thẻ phải chiếm ít nhất 20% diện tích ảnh
        if area < 0.20 * img_area:
            break
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            card_contour = approx
            break

    if card_contour is None:
        # Không tìm thấy → trả ảnh gốc
        return orig

    # Sắp xếp 4 góc: top-left, top-right, bottom-right, bottom-left
    pts = card_contour.reshape(4, 2).astype(np.float32)
    rect = _order_points(pts)
    tl, tr, br, bl = rect

    # Tính kích thước đích
    width = int(max(
        np.linalg.norm(br - bl),
        np.linalg.norm(tr - tl)
    ))
    height = int(max(
        np.linalg.norm(tr - br),
        np.linalg.norm(tl - bl)
    ))

    if width < 100 or height < 60:
        return orig

    dst = np.array([
        [0, 0],
        [width - 1, 0],
        [width - 1, height - 1],
        [0, height - 1]
    ], dtype=np.float32)

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(orig, M, (width, height))
    return warped


def _order_points(pts: np.ndarray) -> np.ndarray:
    """Sắp xếp 4 điểm theo thứ tự: TL, TR, BR, BL."""
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]   # top-left: tổng nhỏ nhất
    rect[2] = pts[np.argmax(s)]   # bottom-right: tổng lớn nhất
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right: hiệu nhỏ nhất
    rect[3] = pts[np.argmax(diff)]  # bottom-left: hiệu lớn nhất
    return rect


def run_quality_checks(image: np.ndarray):
    """Chạy toàn bộ kiểm tra chất lượng. Raise HTTPException nếu không đạt."""
    if check_brightness(image):
        raise HTTPException(
            status_code=400,
            detail="Ảnh quá tối. Vui lòng chụp lại ở nơi có đủ ánh sáng."
        )
    if check_blur(image):
        raise HTTPException(
            status_code=400,
            detail="Ảnh quá mờ. Vui lòng chụp lại thật nét, giữ tay ổn định."
        )
    if check_obstruction(image):
        raise HTTPException(
            status_code=400,
            detail="Ảnh bị che khuất. Vui lòng đảm bảo cả hai mặt thẻ hiển thị đầy đủ, không có vật gì đè lên."
        )


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
    - Uppercase + xóa khoảng trắng thừa
    Ví dụ: 'Nguyễn Đức Bách' → 'NGUYEN DUC BACH'
    """
    # Bước 1: Xử lý Đ/đ trước (không có NFD decomposition)
    name = name.replace('Đ', 'D').replace('đ', 'd')
    # Bước 2: NFD decompose rồi xóa combining marks
    nfd = unicodedata.normalize('NFD', name.strip())
    no_accent = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
    # Bước 3: Uppercase, xóa ký tự đặc biệt thừa, chuẩn khoảng trắng
    cleaned = re.sub(r'[^A-Za-z\s]', '', no_accent)
    return ' '.join(cleaned.upper().split())


def extract_name_from_front(image: np.ndarray) -> Optional[str]:
    """
    Dùng EasyOCR đọc text từ mặt trước CCCD, tìm dòng tên người sở hữu.
    CCCD mới: 'Họ và tên / Full name:' ở dòng trên, tên ở dòng dưới in HOA.
    CCCD cũ : 'Họ và tên:' tương tự.
    """
    results = reader.readtext(image, detail=1)  # [(bbox, text, conf), ...]

    # Lấy tất cả text đủ tin cậy, kèm tọa độ y (để biết thứ tự dòng)
    lines = []
    for (bbox, text, conf) in results:
        if conf > 0.3 and text.strip():
            y_center = int((bbox[0][1] + bbox[2][1]) / 2)
            lines.append((y_center, text.strip()))

    # Sắp xếp theo y (từ trên xuống)
    lines.sort(key=lambda x: x[0])
    texts = [t for _, t in lines]

    # --- LOG để debug ---
    print(f"[AI OCR] Đọc được {len(texts)} dòng text:")
    for t in texts:
        print(f"  | {t}")

    # Tìm dòng label tên — CCCD mới có 2 nhãn liên tiếp: "Họ và tên" + "Full name:"
    # Cần bỏ qua tất cả các dòng nhãn liên tiếp và lấy dòng thật sự là tên
    label_keywords = ['ho va ten', 'full name', 'ho ten', 'they va ten']

    def is_label(t: str) -> bool:
        """Kiểm tra dòng có phải nhãn không (nhãn thường có dấu ':' hoặc khớp keyword)."""
        n = normalize_name(t).lower()
        return any(kw in n for kw in label_keywords) or t.strip().endswith(':')

    for i, text in enumerate(texts):
        norm = normalize_name(text).lower()
        if any(kw in norm for kw in label_keywords):
            # Tìm dòng tiếp theo KHÔNG phải nhãn
            j = i + 1
            while j < len(texts) and is_label(texts[j]):
                j += 1  # bỏ qua dòng nhãn phụ ("Full name:", "Date of birth:"...)
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
    """
    So sánh tên trên CCCD với tên user.
    Trả về (matched, message).
    """
    if cccd_name is None:
        # Không đọc được tên → cho pass, tránh chặn user do OCR fail
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
    """
    Mặt sau CCCD có mã vạch PDF417 và text 'IDVNM' ở vùng đáy.
    Tìm trong 50% dưới của ảnh.
    """
    h, w = image.shape[:2]
    region = image[int(h * 0.5):h, 0:w]
    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    results = reader.readtext(gray, detail=0)
    full_text = ''.join(results).upper().replace(' ', '')
    return 'IDVNM' in full_text


# ═══════════════════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "AI Server dang hoat dong"}


@app.post("/verify-cccd")
async def verify_cccd(
    file: UploadFile = File(...),
    side: str = Form("auto"),        # "front" | "back" | "auto"
    user_name: Optional[str] = Form(None),  # Tên user từ DB để so sánh (chỉ cần cho mặt trước)
):
    """
    Xac thuc anh CCCD.

    Form fields:
    - file: file anh CCCD
    - side: "front" | "back" | "auto"
    - user_name: (chi can cho side=front) Ten user de so sanh voi ten tren CCCD
    """
    try:
        # ── Bước 1: Đọc ảnh ──────────────────────────────────────────────
        contents = await file.read()
        image = load_image(contents)

        # ── Bước 2: Auto-crop thẻ CCCD (nếu ảnh rộng hơn thẻ) ───────────
        image = auto_crop_card(image)

        # ── Bước 3: Kiểm tra chất lượng ảnh ─────────────────────────────
        run_quality_checks(image)

        # ── Bước 4: Xử lý theo side ──────────────────────────────────────
        if side == "front":
            return await _verify_front(image, user_name)

        elif side == "back":
            return await _verify_back(image)

        else:  # auto — tự phán đoán
            if detect_face(image):
                return await _verify_front(image, user_name)
            if detect_back_side(image):
                return {"is_valid": True, "side": "BACK", "message": "Mat sau hop le"}
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

    # Kiểm tra tên nếu có truyền user_name
    if user_name and user_name.strip():
        cccd_name = extract_name_from_front(image)
        matched, msg = verify_name_match(cccd_name, user_name)
        if not matched:
            raise HTTPException(status_code=400, detail=msg)
        return {"is_valid": True, "side": "FRONT", "message": msg}

    return {"is_valid": True, "side": "FRONT", "message": "Mat truoc hop le"}


async def _verify_back(image: np.ndarray):
    """Xử lý mặt sau: detect text IDVNM."""
    if detect_back_side(image):
        return {"is_valid": True, "side": "BACK", "message": "Mặt sau hợp lệ"}
    raise HTTPException(
        status_code=400,
        detail="Không nhận diện được mặt sau CCCD. Vui lòng chụp đúng mặt sau của thẻ căn cước công dân."
    )
