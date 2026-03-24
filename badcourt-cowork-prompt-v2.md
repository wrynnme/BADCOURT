# 🏸 BadCourt — Claude Cowork Master Prompt v2
> อัปเดตจาก v1 — รวมระบบบอร์ดเกม, จัดคู่, บันทึกผล, สถิติ และการเชื่อมขุนทอง

---

## ════ SYSTEM CONTEXT ════
> วางเป็นข้อความ **แรกสุด** ทุกครั้งที่เริ่ม Session ใหม่

```
คุณคือ Senior Full-Stack Developer ที่เชี่ยวชาญระบบ LINE Mini App
ชื่อโปรเจกต์: BadCourt — ระบบจัดการก๊วนตีแบดมินตันครบวงจรบน LINE

══ สิ่งที่คุณรู้เกี่ยวกับโปรเจกต์นี้ ══

[Stack]
- Frontend  : React + Vite + LIFF SDK + TypeScript
- Backend   : Node.js + Express + TypeScript
- Database  : Supabase (PostgreSQL + Storage + Realtime)
- Notify    : LINE Messaging API — Service Messages (ฟรี, Verified Mini App)
- Payment   : PromptPay QR (library: promptpay-qr) + โอนธนาคาร + จ่ายหน้างาน
- Realtime  : Supabase Realtime subscriptions (board/score updates)

[ระบบงานเดิมที่ต้องการแทนที่]
1. ลงชื่อ   → พิมพ์ในกลุ่ม LINE (ข้อความหายในแชท)
2. บอร์ดเกม → เขียนกระดานหน้าคอร์ท (คนที่นั่งรออยู่ไกลๆ ไม่รู้คิว)
3. คิดเงิน  → คำนวณเอง แล้วพิมพ์คำสั่งขุนทองในกลุ่ม (คีย์ซ้ำทุกครั้ง)

[สิ่งที่ Mini App ต้องทำแทน]
1. ลงชื่อเข้าก๊วนในแอป → realtime ทุกคนเห็น
2. บอร์ดดิจิทัล → ทุกคนเห็นในมือถือว่าตัวเองเล่นเกมไหน คอร์ทไหน
3. จัดคู่ 4 โหมด → สุ่ม / หมุนเวียน / ชนะอยู่ / เลือกเอง
4. บันทึกผลแพ้ชนะ + นับเกมที่เล่นแล้วต่อคน
5. คิดเงินอัตโนมัติจากข้อมูลจริงในระบบ
6. ส่งบิลส่วนตัวผ่าน Service Message (ไม่ต้องทวงในกลุ่ม)
7. สร้างคำสั่งขุนทองให้พร้อม แอดมินก็อปวางในกลุ่มได้เลย
8. สถิติ win/loss และอันดับผู้เล่น

[Feature: การจัดคู่ 4 โหมด]
- สุ่มคู่        : random shuffle ผู้เล่นที่รอในคิว
- หมุนเวียน      : เลือกคนที่เล่นน้อยที่สุด (เกมน้อยกว่า) ขึ้นก่อน
- ชนะอยู่       : ทีมชนะรอบก่อนได้เล่นต่อ ทีมแพ้ลงไปคิว
- เลือกเอง      : แอดมิน drag-and-drop หรือเลือกชื่อด้วยตัวเอง

[Feature: คิดเงิน]
- รู้ว่าใครอยู่กี่ชั่วโมงจากข้อมูลลงชื่อ
- รู้ว่าใครเล่นกี่เกมจากระบบบอร์ด
- คำนวณได้ 2 แบบ: หารเท่ากัน หรือ ตามจำนวนเกมที่เล่น
- คอร์ทแต่ละวันอาจไม่เท่ากัน (1–4+ คอร์ท) ต้องรองรับ dynamic

[Feature: ขุนทอง Integration]
- ระบบไม่เชื่อมต่อ API ขุนทอง โดยตรง (ขุนทองไม่มี Public API)
- แต่ระบบสร้าง "คำสั่งขุนทองสำเร็จรูป" ให้แอดมินก็อปวางในกลุ่มเอง
  เช่น: "ขุนทอง เก็บเงิน 200 บาท @กมล @ประยุทธ์"
- รองรับทั้งสองทาง: ส่งบิล Service Message เอง หรือ สั่งขุนทองในกลุ่ม

[กฎการตอบ]
- ตอบเป็นภาษาไทย ยกเว้น code และ technical terms
- เขียนโค้ดให้ production-ready: error handling, loading state, TypeScript types สมบูรณ์
- ทุก API endpoint ต้องมี LIFF token verification
- ใช้ Supabase Realtime สำหรับ board และ score updates
- ห้าม hardcode ค่าใดๆ ให้ใช้ environment variables
- โครงสร้างไฟล์ต้องตรงกับ Project Structure ด้านล่าง
```

---

## ════ PROJECT STRUCTURE ════
> วางต่อจาก System Context ในครั้งแรก

```
สร้างโครงสร้างโปรเจกต์ BadCourt ดังนี้:

badcourt/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── session/
│   │   │   │   ├── SessionCard.tsx        # Card รายการก๊วน (สถานะ, cap bar)
│   │   │   │   └── SessionForm.tsx        # ฟอร์มสร้างก๊วน
│   │   │   ├── board/
│   │   │   │   ├── CourtBoard.tsx         # บอร์ดแสดงทุกคอร์ท
│   │   │   │   ├── MatchCard.tsx          # การ์ดคู่แต่ละเกม + กรอกคะแนน
│   │   │   │   ├── QueueList.tsx          # รายชื่อรอเล่น
│   │   │   │   └── MatchModeSelector.tsx  # เลือกโหมดจัดคู่
│   │   │   ├── billing/
│   │   │   │   ├── BillSummary.tsx        # สรุปยอดรวม
│   │   │   │   ├── PlayerBillRow.tsx      # ยอดรายคน + สถานะ
│   │   │   │   └── KhunThongCopy.tsx      # สร้าง + ก็อปคำสั่งขุนทอง
│   │   │   └── stats/
│   │   │       ├── RankingTable.tsx       # ตารางอันดับ
│   │   │       └── SessionSummary.tsx     # สรุปก๊วน
│   │   ├── pages/
│   │   │   ├── Home.tsx                   # รายการก๊วน + อันดับ
│   │   │   ├── Register.tsx               # ลงชื่อเข้าก๊วน
│   │   │   ├── Board.tsx                  # บอร์ดเกม realtime
│   │   │   ├── CreateMatch.tsx            # จัดคู่ + เลือกโหมด
│   │   │   ├── Billing.tsx                # คิดเงิน + ส่งบิล
│   │   │   ├── Stats.tsx                  # สถิติ & อันดับ
│   │   │   └── AdminDashboard.tsx         # แอดมิน
│   │   ├── hooks/
│   │   │   ├── useLiff.ts                 # LIFF init + profile
│   │   │   ├── useSessions.ts             # fetch / create sessions
│   │   │   ├── useBoard.ts                # realtime board subscription
│   │   │   ├── useMatchmaking.ts          # logic จัดคู่ทุกโหมด
│   │   │   ├── useBilling.ts              # คำนวณยอด + ส่งบิล
│   │   │   └── useStats.ts               # สถิติผู้เล่น
│   │   ├── lib/
│   │   │   ├── liff.ts                    # LIFF singleton
│   │   │   ├── api.ts                     # axios instance + interceptors
│   │   │   ├── supabase.ts               # Supabase client
│   │   │   ├── promptpay.ts              # generate QR
│   │   │   ├── matchmaking.ts            # อัลกอริทึมจัดคู่ทุกโหมด
│   │   │   └── khunthong.ts              # สร้างคำสั่งขุนทอง
│   │   └── types/
│   │       └── index.ts                  # TypeScript interfaces ทั้งหมด
│   └── .env.example
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── sessions.ts               # CRUD ก๊วน + จำนวนคอร์ท
│   │   │   ├── registrations.ts          # ลงทะเบียน / ยกเลิก
│   │   │   ├── matches.ts                # สร้างเกม, บันทึกผล
│   │   │   ├── payments.ts               # สถานะชำระ, แนบสลิป
│   │   │   ├── stats.ts                  # win/loss, leaderboard
│   │   │   └── admin.ts                  # admin routes
│   │   ├── middleware/
│   │   │   ├── verifyLiff.ts             # verify LIFF ID Token
│   │   │   └── isAdmin.ts                # ตรวจสิทธิ์แอดมิน
│   │   ├── services/
│   │   │   ├── matchmaking.ts            # อัลกอริทึม 4 โหมด (server-side)
│   │   │   ├── billing.ts                # คำนวณยอดแต่ละคน
│   │   │   ├── lineNotify.ts             # ส่ง Service Message
│   │   │   └── cronJobs.ts               # แจ้งเตือนล่วงหน้า + ค้างชำระ
│   │   └── db/
│   │       └── schema.sql                # Supabase schema + RLS
│   └── .env.example
│
└── README.md
```

---

## ════ TypeScript Types ════
> ใช้เป็น Reference ทุกครั้งที่เขียนโค้ด

```typescript
// frontend/src/types/index.ts

// ── Session ──
interface Session {
  id: string
  name: string
  date: string                          // ISO date "2025-03-28"
  startTime: string                     // "18:00"
  endTime: string                       // "20:00"
  courtCount: number                    // 1–N (แล้วแต่วัน)
  maxPlayers: number
  feePerHour: number                    // ค่าคอร์ทรวม/ชั่วโมง
  billingMode: 'equal' | 'by_games'    // หารเท่า หรือ ตามเกม
  defaultMatchMode: MatchMode
  status: 'open' | 'playing' | 'ended'
  createdBy: string                     // LINE userId
}

// ── Registration ──
interface Registration {
  id: string
  sessionId: string
  userId: string
  displayName: string
  pictureUrl: string
  joinedAt: string                      // ISO datetime
  paidStatus: 'pending' | 'approved' | 'rejected' | 'onsite'
  paymentMethod: 'qr' | 'transfer' | 'onsite'
  slipUrl?: string
  gamesPlayed: number                   // นับจาก matches
  amountDue: number                     // คำนวณจาก billing service
}

// ── Match ──
type MatchMode = 'random' | 'rotation' | 'winner_stays' | 'manual'

interface Match {
  id: string
  sessionId: string
  courtNumber: number                   // 1, 2, 3, ...
  roundNumber: number
  team1: string[]                       // [userId, userId]
  team2: string[]                       // [userId, userId]
  score1?: number
  score2?: number
  winnerId?: 'team1' | 'team2'
  status: 'playing' | 'done'
  startedAt: string
  endedAt?: string
}

// ── Billing ──
interface PlayerBill {
  userId: string
  displayName: string
  pictureUrl: string
  gamesPlayed: number
  hoursPlayed: number
  amountDue: number
  paidStatus: Registration['paidStatus']
}

interface SessionBill {
  sessionId: string
  totalCost: number
  courtCount: number
  players: PlayerBill[]
  collected: number
  outstanding: number
}

// ── Stats ──
interface PlayerStats {
  userId: string
  displayName: string
  pictureUrl: string
  wins: number
  losses: number
  gamesPlayed: number
  winRate: number                       // 0.0–1.0
}
```

---

## ════ PROMPT ① ════  LIFF Authentication
```
สร้าง LIFF authentication system สำหรับ BadCourt:

ไฟล์: frontend/src/lib/liff.ts และ frontend/src/hooks/useLiff.ts

Requirements:
- ใช้ @line/liff package version ล่าสุด
- liff.init() เมื่อเปิดแอป → ถ้า !liff.isLoggedIn() ให้ redirect liff.login()
- ดึง profile: userId, displayName, pictureUrl
- รองรับ external browser → แสดงหน้า "กรุณาเปิดใน LINE"
- เก็บ profile ใน React Context ชื่อ LiffContext
- LiffProvider wrap รอบ <App />
- hook useLiff() return: { profile, isLoading, isLoggedIn, liff }
- มี loading skeleton ระหว่าง init
- error boundary สำหรับ LIFF init failure
```

---

## ════ PROMPT ② ════  Session Management
```
สร้าง session management สำหรับ BadCourt:

ไฟล์: frontend/src/pages/Home.tsx, Register.tsx, components/session/*

Home.tsx:
- Tab: วันนี้ / สัปดาห์นี้ / ทั้งหมด
- fetch GET /api/sessions?filter=today
- SessionCard แสดง: ชื่อ, วัน-เวลา, จำนวนคอร์ท, สถานะ badge, cap bar
- Badge: "เปิดรับ"(green) / "กำลังเล่น"(lime) / "เต็ม"(gray) / "จบแล้ว"(dim)
- อันดับวันนี้ 3 อันดับแรก (win count)
- FAB "+" สำหรับ admin เท่านั้น

Register.tsx (หน้าลงชื่อ):
- แสดงรายชื่อที่ลงแล้ว + จำนวนเกมสะสมของแต่ละคน
- ถ้าตัวเองลงแล้ว → แสดงสถานะ + ปุ่มยกเลิก
- ถ้ายังไม่ลง → แสดงฟอร์มลงชื่อ
- เลือกวิธีชำระ: QR / โอน / หน้างาน
- POST /api/registrations → ส่ง Service Message ยืนยันให้ทันที

SessionForm.tsx (สร้างก๊วน):
- ชื่อ, วัน, เวลา, จำนวนคอร์ท (1–8), จำนวนสูงสุด, ค่าคอร์ท/ชม.
- billingMode: หารเท่า หรือ ตามเกม
- defaultMatchMode: สุ่ม / หมุนเวียน / ชนะอยู่ / เลือกเอง
- POST /api/sessions
```

---

## ════ PROMPT ③ ════  Board + Realtime
```
สร้าง Board system ที่ใช้ Supabase Realtime:

ไฟล์: frontend/src/pages/Board.tsx, hooks/useBoard.ts, components/board/*

useBoard.ts:
- subscribe Supabase channel "session:{sessionId}"
- listen event: match_created, score_updated, match_ended
- return: { matches, queue, currentRound, isLoading }
- unsubscribe เมื่อ unmount

Board.tsx:
- แสดงจำนวนคอร์ทตาม session.courtCount (dynamic ไม่ fixed)
- แต่ละ CourtCard แสดง: ชื่อคอร์ท, สถานะ (กำลังเล่น/รอ), ทีม 1 vs ทีม 2
- MatchCard: ชื่อผู้เล่น + กรอกคะแนน realtime (input type=number)
- ปุ่ม "จบเกม บันทึกผล" → PATCH /api/matches/:id { score1, score2 }
- QueueList: รายชื่อรอเล่น + จำนวนเกมที่เล่นไปแล้วของแต่ละคน
- ปุ่ม "จัดคู่รอบต่อไป" → navigate CreateMatch.tsx

CreateMatch.tsx (จัดคู่):
- เลือกโหมด: สุ่ม / หมุนเวียน / ชนะอยู่ / เลือกเอง
- เลือกจำนวนคอร์ทที่จะใช้รอบนี้ (≤ session.courtCount)
- เลือกประเภทเกม: ชายคู่ / หญิงคู่ / คู่ผสม / เดี่ยว
- POST /api/sessions/:id/matches { mode, courtCount, matchType }
  → backend จัดคู่ตามโหมดและ return matches ที่สร้าง
```

---

## ════ PROMPT ④ ════  Matchmaking Algorithm
```
สร้าง matchmaking service สำหรับ BadCourt:

ไฟล์: backend/src/services/matchmaking.ts

implement ฟังก์ชัน makeMatches(players, mode, courtCount, prevMatches):

type MakeMatchesParams = {
  players: Registration[]       // ผู้เล่นทั้งหมดที่ลงชื่อ
  mode: MatchMode
  courtCount: number            // จำนวนคอร์ทรอบนี้
  prevMatches: Match[]          // เกมที่เล่นไปแล้ว
}

โหมด 1 — random:
- shuffle players array ด้วย Fisher-Yates
- จับคู่ทีละ 4 คน (doubles) หรือ 2 คน (singles)
- ผู้เล่นที่เหลือ (ถ้า % 4 != 0) ลงคิวรอ

โหมด 2 — rotation (หมุนเวียน):
- เรียงผู้เล่นจาก gamesPlayed น้อย → มาก
- คนที่เล่นน้อยที่สุดได้ขึ้นก่อน
- ถ้า gamesPlayed เท่ากัน ให้ดู joinedAt (มาก่อนได้ก่อน)

โหมด 3 — winner_stays:
- ทีมชนะรอบก่อนอยู่บนคอร์ทต่อ
- ดึงทีมชนะจาก prevMatches.filter(m => m.status === 'done')
- จับทีมแพ้จากคิวขึ้นมาเป็นฝั่งตรงข้าม
- ถ้าทีมชนะชนะติดต่อกัน ≥ 3 รอบ ให้ลงคิว (ป้องกัน monopoly)

โหมด 4 — manual:
- return empty matches (frontend จัดการ drag-and-drop เอง)
- validate ว่าแต่ละทีมมีผู้เล่นครบก่อน submit

ทุกโหมดต้องคืน { matches: Match[], queue: Registration[] }
และ log ว่าทำไมถึงจัดแบบนี้ใน metadata field
```

---

## ════ PROMPT ⑤ ════  Billing System
```
สร้าง billing system สำหรับ BadCourt:

ไฟล์: backend/src/services/billing.ts และ frontend/src/pages/Billing.tsx

billing.ts (server):
function calculateBill(session: Session, registrations: Registration[], matches: Match[]): SessionBill

Logic:
- นับ gamesPlayed แต่ละ userId จาก matches ที่ status === 'done'
- ถ้า billingMode === 'equal': amountDue = totalCost / playerCount
- ถ้า billingMode === 'by_games':
    totalGames = sum ของ gamesPlayed ทุกคน
    amountDue = (gamesPlayed / totalGames) * totalCost
    round ขึ้นเป็นจำนวนเต็ม แล้วปรับคนสุดท้ายให้ยอดรวมพอดี
- totalCost = session.feePerHour * session.courtCount * duration (ชม.)
- return SessionBill ที่มี players[] แต่ละคน + collected + outstanding

Billing.tsx (frontend):
- แสดง total bar: ค่าคอร์ทรวม + รายละเอียด (กี่คอร์ท × กี่ชม.)
- PlayerBillRow แต่ละคน: avatar, ชื่อ, เกมที่เล่น, ยอด, สถานะ badge
- ปุ่ม "ส่งบิลส่วนตัวทุกคน":
    POST /api/billing/:sessionId/notify-all
    → ส่ง Service Message ให้ทุกคนที่ยังไม่ได้จ่าย
    → แต่ละคนได้รับ: ยอดที่ต้องจ่าย + QR PromptPay + ลิงก์แนบสลิป
- ปุ่ม "สั่งขุนทอง":
    เรียก khunthong.ts เพื่อสร้างคำสั่ง
    แสดง modal + copy to clipboard
    ข้อความ: "ขุนทอง เก็บเงิน {amount} บาท @{displayName} @{displayName}..."
```

---

## ════ PROMPT ⑥ ════  Stats & Leaderboard
```
สร้าง stats system สำหรับ BadCourt:

ไฟล์: backend/src/routes/stats.ts และ frontend/src/pages/Stats.tsx

API:
GET /api/stats/session/:id          — สรุปก๊วนเดียว
GET /api/stats/leaderboard          — query: period=today|month|all
GET /api/stats/player/:userId       — ประวัติผู้เล่น

PlayerStats calculation:
- wins   = count matches ที่ userId อยู่ใน winning team
- losses = count matches ที่ userId อยู่ใน losing team  
- winRate = wins / (wins + losses) → format เป็น %
- streak = จำนวนชนะหรือแพ้ติดต่อกันจาก match ล่าสุด

Stats.tsx:
- Tab: วันนี้ / เดือนนี้ / ตลอดกาล
- RankingTable: อันดับ, avatar, ชื่อ, W/L, win rate
  - อันดับ 1–3 ใช้สี gold/silver/bronze
- SessionSummary: จำนวนเกม, จำนวนคอร์ท, จำนวนผู้เล่น, รวมเงิน, จ่ายแล้ว, ค้าง
- กดที่ชื่อผู้เล่น → ดูประวัติเกมของคนนั้น
```

---

## ════ PROMPT ⑦ ════  LINE Service Messages
```
สร้าง notification system สำหรับ BadCourt:

ไฟล์: backend/src/services/lineNotify.ts

ส่ง Service Message ใน 5 กรณี:

1. ลงทะเบียนสำเร็จ
   - ยืนยันชื่อ, ก๊วน, วัน-เวลา, สถานที่, ลำดับที่ X
   - CTA: "ดูบอร์ดเกม" link กลับ Mini App

2. แอดมินอนุมัติชำระ → ส่งใบเสร็จ
   - ยอดที่จ่าย, วันที่, ก๊วน
   - CTA: "ดูสถิติของฉัน"

3. แจ้งเตือนก่อนตี 1 ชั่วโมง (Cron Job)
   - ชื่อก๊วน, เวลา, สถานที่, สถานะชำระ
   - ถ้ายังไม่ได้จ่าย: เตือนให้จ่ายด้วย

4. ส่งบิลรายคน (triggered จากหน้า Billing)
   - ยอดที่ต้องจ่าย, รายละเอียดคำนวณ
   - QR PromptPay (base64 image หรือ URL)
   - CTA: "แนบสลิป" link กลับ Mini App

5. เตือนค้างชำระ (Cron ทุกวัน 20:00)
   - ยอดค้าง, ก๊วนที่ค้าง
   - CTA: "จ่ายเลย"

Flex Message template:
- header: สีเขียว (#00e5a0) สำหรับ success / สีเหลือง (#f2a100) สำหรับ reminder
- body: ข้อมูลครบ + icon ที่เหมาะสม
- footer: CTA button กลับ Mini App ด้วย liff.openWindow()

cronJobs.ts:
- ทุก 5 นาที: ตรวจก๊วนที่จะเริ่มใน 65 นาที → ส่งแจ้งเตือน
- ทุกวัน 20:00 Asia/Bangkok: ตรวจค้างชำระทุกก๊วนในวันนั้น
```

---

## ════ PROMPT ⑧ ════  Database Schema
```
สร้าง Supabase schema สำหรับ BadCourt:

ไฟล์: backend/src/db/schema.sql

Tables:

1. users
   - line_user_id TEXT PRIMARY KEY
   - display_name TEXT NOT NULL
   - picture_url TEXT
   - is_admin BOOLEAN DEFAULT false
   - total_games INT DEFAULT 0
   - total_wins INT DEFAULT 0
   - created_at TIMESTAMPTZ DEFAULT NOW()

2. sessions
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - name TEXT NOT NULL
   - date DATE NOT NULL
   - start_time TIME NOT NULL
   - end_time TIME NOT NULL
   - court_count INT NOT NULL DEFAULT 1        -- dynamic ตามวัน
   - max_players INT NOT NULL
   - fee_per_hour NUMERIC NOT NULL             -- ค่าคอร์ทรวม/ชม.
   - billing_mode TEXT DEFAULT 'equal'         -- 'equal' | 'by_games'
   - default_match_mode TEXT DEFAULT 'random'
   - status TEXT DEFAULT 'open'               -- 'open'|'playing'|'ended'
   - created_by TEXT REFERENCES users(line_user_id)
   - created_at TIMESTAMPTZ DEFAULT NOW()

3. registrations
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - session_id UUID REFERENCES sessions(id) ON DELETE CASCADE
   - user_id TEXT REFERENCES users(line_user_id)
   - payment_method TEXT NOT NULL              -- 'qr'|'transfer'|'onsite'
   - paid_status TEXT DEFAULT 'pending'        -- 'pending'|'approved'|'rejected'|'onsite'
   - slip_url TEXT
   - amount_due NUMERIC
   - joined_at TIMESTAMPTZ DEFAULT NOW()
   - UNIQUE(session_id, user_id)

4. matches
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - session_id UUID REFERENCES sessions(id) ON DELETE CASCADE
   - court_number INT NOT NULL
   - round_number INT NOT NULL
   - match_mode TEXT NOT NULL
   - team1_players TEXT[] NOT NULL             -- [userId, userId]
   - team2_players TEXT[] NOT NULL
   - score1 INT
   - score2 INT
   - winner TEXT                               -- 'team1'|'team2'|null
   - status TEXT DEFAULT 'playing'             -- 'playing'|'done'
   - started_at TIMESTAMPTZ DEFAULT NOW()
   - ended_at TIMESTAMPTZ

5. payments
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - registration_id UUID REFERENCES registrations(id)
   - amount NUMERIC NOT NULL
   - slip_url TEXT
   - status TEXT DEFAULT 'pending'
   - approved_by TEXT REFERENCES users(line_user_id)
   - approved_at TIMESTAMPTZ
   - created_at TIMESTAMPTZ DEFAULT NOW()

6. notifications_log
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - user_id TEXT REFERENCES users(line_user_id)
   - type TEXT NOT NULL
   - session_id UUID REFERENCES sessions(id)
   - sent_at TIMESTAMPTZ DEFAULT NOW()
   - success BOOLEAN DEFAULT true

Indexes:
- sessions(date, status)
- registrations(session_id, paid_status)
- matches(session_id, status, round_number)
- matches USING gin(team1_players), gin(team2_players)   -- fast player lookup

RLS Policies:
- users: SELECT ของตัวเอง, admin SELECT ทั้งหมด
- sessions: SELECT ทุกคน, INSERT/UPDATE/DELETE เฉพาะ admin
- registrations: SELECT/INSERT ของตัวเอง + admin ทั้งหมด, DELETE ของตัวเอง
- matches: SELECT ทุกคน, INSERT/UPDATE เฉพาะ admin
- payments: SELECT ของตัวเอง + admin ทั้งหมด

Realtime:
- enable Realtime on: matches, registrations (สำหรับ board updates)
```

---

## ════ PROMPT ⑨ ════  Environment + Deploy
```
สร้าง environment configuration และ deploy guide:

frontend/.env.example:
VITE_LIFF_ID=                    # จาก LINE Developers Console
VITE_API_BASE_URL=               # URL ของ backend
VITE_PROMPTPAY_NUMBER=           # เบอร์ PromptPay ของแอดมิน
VITE_SUPABASE_URL=               # Supabase project URL
VITE_SUPABASE_ANON_KEY=         # Supabase anon key

backend/.env.example:
PORT=3000
NODE_ENV=development
SUPABASE_URL=                    # Supabase project URL
SUPABASE_SERVICE_KEY=            # service_role key (ไม่ใช่ anon key)
LINE_CHANNEL_SECRET=             # จาก LINE Developers Console
LINE_CHANNEL_ACCESS_TOKEN=       # จาก LINE Developers Console
ADMIN_LINE_USER_IDS=             # userId ของ admin คั่นด้วย comma
SLIP_STORAGE_BUCKET=badcourt-slips
TZ=Asia/Bangkok                  # สำหรับ cron job ให้ถูกต้อง

สร้าง README.md ที่มี:
1. ขั้นตอน setup LINE Developer Console + ขอ LIFF ID
2. ขั้นตอนขอสิทธิ์สร้าง LINE MINI App Channel (ส่งอีเมล dl_api_th@linecorp.com)
3. Setup Supabase: สร้าง project, run schema.sql, enable Realtime
4. Deploy frontend บน Vercel (auto from GitHub)
5. Deploy backend บน Railway (+ set env vars)
6. ขอ Verified Mini App จาก LINE Thailand → ได้สิทธิ์ Service Messages ฟรี
```

---

## ════ วิธีใช้งานกับ Claude Cowork ════

### ลำดับการทำงานที่แนะนำ

```
Session 1: Setup
├── วาง SYSTEM CONTEXT
├── วาง PROJECT STRUCTURE
├── วาง TypeScript Types
└── PROMPT ① — LIFF Authentication

Session 2: Core Features
├── PROMPT ② — Session Management (Home + Register)
└── PROMPT ⑧ — Database Schema (ทำก่อนเพื่อ reference)

Session 3: Board System
├── PROMPT ③ — Board + Realtime
└── PROMPT ④ — Matchmaking Algorithm

Session 4: Money & Stats
├── PROMPT ⑤ — Billing System
└── PROMPT ⑥ — Stats & Leaderboard

Session 5: Notifications
└── PROMPT ⑦ — LINE Service Messages + Cron

Session 6: Final
└── PROMPT ⑨ — Env + Deploy
```

### Prompt เสริมที่ใช้บ่อย

```
# แก้ bug
"แก้ bug ใน [ไฟล์] ที่เกิดจาก [error message]"

# เพิ่ม feature
"เพิ่ม feature: [อธิบาย] ใน [ไฟล์] โดยใช้ pattern เดียวกับ [ไฟล์อื่น]"

# ทดสอบ
"เขียน unit test สำหรับ matchmaking.ts ทุกโหมด"

# Optimize
"optimize Supabase query ใน stats.ts ให้ใช้ single query แทน N+1"

# รีวิวโค้ด
"รีวิวโค้ด [ไฟล์] ว่ามีจุดไหนที่ควรปรับปรุงด้านความปลอดภัยและ performance"
```

### สิ่งที่ต้องเตรียมก่อน

- [ ] LINE Developer Account
- [ ] Supabase Account (Free tier เพียงพอสำหรับเริ่มต้น)
- [ ] Vercel Account (deploy frontend)
- [ ] Railway Account (deploy backend)
- [ ] เบอร์ PromptPay ของแอดมิน
- [ ] Node.js 18+ ในเครื่อง
