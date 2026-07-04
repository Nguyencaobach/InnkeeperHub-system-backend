# 🤖 AI Server — Xác thực ảnh CCCD

> Server Python độc lập chạy trong Docker, nhận ảnh từ Node.js backend và trả về kết quả xác thực CCCD bằng AI (OpenCV + MediaPipe + EasyOCR).

---

## 📐 Mô hình hoạt động (Mental Model)

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGƯỜI DÙNG (App)                         │
│         Chụp ảnh CCCD (mặt trước / mặt sau) → Upload           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS (qua Ngrok)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│               Node.js Backend  (Port 3000)                      │
│                                                                 │
│  1. Nhận ảnh từ app                                             │
│  2. Lấy full_name từ JWT token của user đang đăng nhập          │
│  3. Multer lưu tạm vào:                                         │
│     - uploads/cccd/               (màn hình Profile)            │
│     - uploads/cccd_for_reserved/  (màn hình Đặt phòng)          │
│  4. Gọi Python AI Server qua HTTP nội bộ:                       │
│     POST http://localhost:8000/verify-cccd                      │
│     Body: { file, side="front|back", user_name="Nguyen..." }    │
│  5. Nhận kết quả:                                               │
│     ✅ is_valid=true  → Lưu URL ảnh vào PostgreSQL             │
│     ❌ is_valid=false → Xóa file tạm, trả lỗi về cho app       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP nội bộ (localhost only)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│           Python AI Server (Docker, Port 8000)                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BƯỚC 1 — Auto-crop thẻ CCCD (OpenCV)                   │   │
│  │  Phát hiện viền thẻ bằng Canny edge + contour detection │   │
│  │  → Perspective transform crop đúng khung thẻ            │   │
│  │  → Nếu không tìm được viền: dùng ảnh gốc               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BƯỚC 2 — Kiểm tra chất lượng ảnh                       │   │
│  │                                                         │   │
│  │  🔍 Độ sáng (OpenCV mean brightness)                   │   │
│  │     → Mean < 40: ảnh tối quá → ❌ Yêu cầu chụp lại    │   │
│  │                                                         │   │
│  │  🔍 Độ nét (Laplacian variance)                        │   │
│  │     → Variance < 60: ảnh mờ → ❌ Yêu cầu chụp lại     │   │
│  │                                                         │   │
│  │  🔍 Che khuất (tỷ lệ vùng tối bất thường)             │   │
│  │     → > 25% pixel rất tối: bị che → ❌ Yêu cầu chụp lại│   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BƯỚC 3 — Xử lý theo mặt thẻ                           │   │
│  │                                                         │   │
│  │  [MẶT TRƯỚC - side="front"]                            │   │
│  │  ├─ Face Detection (MediaPipe)                         │   │
│  │  │    → Không có khuôn mặt → ❌ Không phải mặt trước   │   │
│  │  └─ Đối chiếu tên (EasyOCR + normalize bỏ dấu)        │   │
│  │       OCR đọc tên trên CCCD                            │   │
│  │       Bỏ dấu tiếng Việt (NGUYỄN → NGUYEN)             │   │
│  │       So sánh với full_name từ DB                      │   │
│  │       → Không khớp → ❌ "Tên không khớp thông tin đăng ký"│  │
│  │       → Khớp       → ✅ Mặt trước hợp lệ              │   │
│  │                                                         │   │
│  │  [MẶT SAU - side="back"]                               │   │
│  │  └─ OCR tìm text "IDVNM" ở 50% dưới ảnh               │   │
│  │       → Không tìm thấy → ❌ Không phải mặt sau CCCD    │   │
│  │       → Tìm thấy    → ✅ Mặt sau hợp lệ               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục

```
D:\Hotel-management-system\
│
├── Hotel-system-backend\          ← Node.js (npm start)
│   ├── src\shared\services\
│   │   └── aiverify.service.js    ← Gọi Python AI server
│   └── .env
│       └── AI_SERVER_URL=http://localhost:8000
│
└── ai-server\                     ← Python Docker (chạy độc lập)
    ├── ai_server.py               ← FastAPI server
    ├── requirements.txt           ← Python dependencies
    ├── Dockerfile                 ← Cấu hình build image
    └── docker-compose.yml         ← Cấu hình chạy container
```

---

## 🛠️ Cài đặt lần đầu

### Yêu cầu
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã cài và đang chạy
- Node.js backend đã cấu hình `.env` có `AI_SERVER_URL=http://localhost:8000`

### ⚡ Kiểm tra nhanh (sau khi đã setup lần đầu)

Mở terminal, trỏ vào thư mục `ai-server` rồi chạy:

```powershell
cd D:\Hotel-management-system\ai-server
.\start.ps1
```

Output mong muốn:
```
[OK] Docker Desktop: Dang chay
[OK] Docker Image:   Da san sang
[OK] Container:      Dang chay (port 8000)
[ONLINE] AI Server dang chay tai: http://localhost:8000/health
```

> Script tự động: kiểm tra Docker → kiểm tra image → kiểm tra container → ping health endpoint.
> Nếu container bị stop, script tự khởi động lại. Nếu image chưa build, script tự build.

---

### Bước 1 — Build Docker image (chỉ làm 1 lần)

```bash
cd D:\Hotel-management-system\ai-server
docker build -t cccd-ai-server:latest .
```

> ⏳ Lần đầu build mất **10–15 phút** vì cần tải:
> - `mediapipe` (~200MB)
> - `easyocr` + model tiếng Anh (~300MB)
> - `opencv-python-headless`

### Bước 2 — Chạy container với auto-restart

```bash
docker run -d \
  --name cccd-ai-server \
  --restart always \
  -p 8000:8000 \
  cccd-ai-server:latest
```

> ✅ Flag `--restart always` giống Redis hiện tại — **tự động khởi động lại** mỗi khi bật Docker Desktop / reboot máy, không cần làm gì thêm.

---

## 🚀 Khởi động hệ thống hằng ngày

Chỉ cần mở **Docker Desktop** → mọi container (`Redis`, `Nginx`, `cccd-ai-server`) tự chạy.

Sau đó mở terminal và chạy Node.js backend:

```bash
cd D:\Hotel-management-system\Hotel-system-backend
npm start
```

---

## 🔍 Kiểm tra hệ thống

### Xem log AI server realtime (theo dõi từng request)
```powershell
cd D:\Hotel-management-system\ai-server
docker logs cccd-ai-server -f
```
> Bấm `Ctrl+C` để thoát. Log sẽ hiển thị kết quả từng lần xác thực ảnh CCCD.

### Xem container đang chạy
```bash
docker ps
```

Kết quả mong muốn:
```
NAMES              IMAGE                  STATUS
cccd-ai-server     cccd-ai-server:latest  Up X hours
innkeeper_redis    redis:7-alpine         Up X hours
innkeeper_nginx    nginx:alpine           Up X hours
```

### Kiểm tra AI server còn sống
```bash
curl http://localhost:8000/health
```

Kết quả:
```json
{"status": "ok", "message": "AI Server đang hoạt động"}
```

### Xem log AI server
```bash
docker logs cccd-ai-server -f
```

---

## 🔄 Cập nhật code AI server

Khi sửa `ai_server.py`, cần rebuild image:

```bash
cd D:\Hotel-management-system\ai-server

# Dừng container cũ
docker stop cccd-ai-server
docker rm cccd-ai-server

# Build lại (lần này nhanh hơn nhờ Docker cache)
docker build -t cccd-ai-server:latest .

# Chạy lại
docker run -d --name cccd-ai-server --restart always -p 8000:8000 cccd-ai-server:latest
```

---

## ⚙️ API Endpoints

### `GET /health`
Kiểm tra server còn hoạt động không.

```bash
curl http://localhost:8000/health
```

### `POST /verify-cccd?side=front|back|auto`
Xác thực ảnh CCCD.

| Query param | Giá trị | Mô tả |
|-------------|---------|-------|
| `side` | `front` | Chỉ kiểm tra mặt trước (có khuôn mặt) |
| `side` | `back` | Chỉ kiểm tra mặt sau (có text IDVNM) |
| `side` | `auto` | Tự phán đoán |

**Response thành công:**
```json
{
  "is_valid": true,
  "side": "FRONT",
  "message": "Mặt trước hợp lệ"
}
```

**Response lỗi (HTTP 400):**
```json
{
  "detail": "Ảnh quá mờ. Vui lòng chụp lại thật nét và đủ sáng."
}
```

---

## ❗ Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|-----|-------------|-----------|
| `connection refused localhost:8000` | Container chưa chạy | Mở Docker Desktop, chờ container start |
| `Build failed: libgl1-mesa-glx` | Package cũ trên Debian Trixie | Dockerfile đã sửa sang `libgl1` ✅ |
| Ảnh hợp lệ vẫn bị từ chối | Ảnh tối/mờ quá | Chụp lại nơi đủ sáng |
| Server trả 500 | Lỗi nội bộ AI | Xem log: `docker logs cccd-ai-server` |

---

## 💡 Lưu ý quan trọng

- AI server chỉ lắng nghe trên `localhost:8000` — **không expose ra internet**, chỉ Node.js mới gọi được.
- Nếu AI server down, Node.js sẽ **fallback cho pass** (không chặn user) và ghi log cảnh báo.
- Model EasyOCR được **pre-download trong Docker image** — không cần internet sau khi build.
