# 🏸 BadCourt — ระบบจัดการก๊วนตีแบดมินตัน

ระบบจัดการก๊วนตีแบดมินตันครบวงจรบน LINE Mini App

## ฟีเจอร์หลัก

- ✅ **ลงชื่อเข้าก๊วน** — Realtime ทุกคนเห็น
- ✅ **บอร์ดดิจิทัล** — ดูคู่ที่กำลังเล่น + คิวรอ
- ✅ **จัดคู่ 4 โหมด** — สุ่ม / หมุนเวียน / ชนะอยู่ / เลือกเอง
- ✅ **บันทึกผลแพ้ชนะ** + นับเกมที่เล่น
- ✅ **คิดเงินอัตโนมัติ** — หารเท่า หรือ ตามเกม
- ✅ **ส่งบิลส่วนตัวผ่าน LINE** — ไม่ต้องทวงในกลุ่ม
- ✅ **คำสั่งขุนทอง** — Copy & Paste ในกลุ่ม
- ✅ **สถิติ win/loss และอันดับผู้เล่น**

## Tech Stack

- **Frontend:** React + Vite + LIFF SDK + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Database:** Supabase (PostgreSQL + Storage + Realtime)
- **Payment:** PromptPay QR + โอนธนาคาร + หน้างาน
- **Notify:** LINE Service Messages (ฟรีสำหรับ Verified Mini App)

## เริ่มต้นโปรเจกต์

### 1. ติดตั้ง Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. ตั้งค่า Environment

```bash
# Frontend
cp .env.example .env
# แก้ไข VITE_LIFF_ID, VITE_API_BASE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# Backend
cp .env.example .env
# แก้ไข SUPABASE_URL, SUPABASE_SERVICE_KEY, LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN
```

### 3. สร้าง Database Schema

1. เปิด Supabase Dashboard → SQL Editor
2. วางเนื้อหาจาก `backend/src/db/schema.sql`
3. Run

### 4. รันโปรเจกต์

```bash
# Frontend (port 3000)
cd frontend && npm run dev

# Backend (port 3001)
cd backend && npm run dev
```

## การตั้งค่า LINE Developer

1. สร้าง LINE Developer Account
2. สร้าง Messaging API Channel
3. สร้าง LIFF App
4. ขอสิทธิ์ Verified Mini App (ส่งอีเมลไปที่ dl_api_th@linecorp.com)

## Deployment

### Frontend
- Vercel (auto deploy from GitHub)

### Backend
- Railway / Render / Fly.io

## โครงสร้างไฟล์

```
badcourt/
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ ├── session/
│ │ │ ├── board/
│ │ │ ├── billing/
│ │ │ └── stats/
│ │ ├── pages/
│ │ ├── hooks/
│ │ ├── lib/
│ │ ├── contexts/
│ │ └── types/
│ └── .env.example
├── backend/
│ ├── src/
│ │ ├── routes/
│ │ ├── middleware/
│ │ ├── services/
│ │ └── db/
│ └── .env.example
└── README.md
```

## License

MIT
