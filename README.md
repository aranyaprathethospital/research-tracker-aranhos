# Research Tracker

เว็บแอปติดตามความก้าวหน้างานวิจัย ใช้ Next.js App Router, React, TypeScript, Tailwind CSS, Better Auth และ Prisma 7.10.1 กับ PostgreSQL บน Supabase

## สิ่งที่ทำได้

- PM ดู Dashboard, ค้นหา/กรองงาน, สร้างงาน, จัดการรายชื่อและบทบาท และมอบหมาย Advisor ได้หลายคน
- Advisor เห็นเฉพาะโครงการที่ได้รับมอบหมาย เปลี่ยนสถานะการตรวจแยกจากสถานะวิจัย และเพิ่มความเห็น
- Advisee เห็นเฉพาะโครงการของตน อัปเดตขั้นตอน เปอร์เซ็นต์ในขั้น ปัญหา งานถัดไป และกำหนดส่ง
- ทุกการแก้ไขจากแอปจริงตรวจ session และ role ฝั่ง server ก่อนเรียก Prisma; เก็บประวัติและแยกสถานะตรวจของ Advisor ต่อโครงการ
- Email/Password และการสมัครสมาชิกเองปิดไว้; ใช้ ProviderID เป็นทางเข้าหลัก
- `/demo` เป็นโหมดสาธิตแยกต่างหาก ใช้ localStorage และสลับบทบาทเพื่อดูหน้าจอได้

เปอร์เซ็นต์ 0–100 เป็นความคืบหน้าภายในขั้นตอนปัจจุบัน แยกจากรหัสขั้นตอน 0–7 ไม่ได้นำเลขขั้นตอนมาคำนวณเปอร์เซ็นต์

## ข้อมูลรายชื่อและต้นแบบ

ไม่พบ `Project manager.xlsx` และ `outputs/research-progress-mvp.html` ใน workspace ตอนตรวจเริ่มงาน จึงไม่ได้ import รายชื่อจริง หน้าจอใน `/demo` ใช้ข้อมูลสมมติเท่านั้น

มีรายการให้ตรวจสอบใน Dashboard: รายละเอียด Excel ระบุ 18 รายชื่อ แต่ชีตสรุประบุ 19 คน ให้นำเข้าเฉพาะรายชื่อที่ยืนยันได้หลังตรวจไฟล์จริง และอย่าสร้างรายชื่อที่ขาดขึ้นเอง

## เริ่มรันโหมดสาธิต

ต้องใช้ Node.js ที่รองรับ Next.js 16

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000/demo](http://localhost:3000/demo) เพื่อดูข้อมูลสาธิต หรือ [http://localhost:3000/login](http://localhost:3000/login) เพื่อดูหน้าล็อกอิน

ตรวจ build และ lint:

```bash
npm run build
npm run lint
```

## ตั้งค่า Supabase PostgreSQL และ Prisma

1. สร้าง Supabase project แล้วคัดลอก `.env.example` เป็น `.env.local` หรือ `.env`
2. กำหนด `DATABASE_URL` เป็น Supavisor transaction pooler พอร์ต `6543` สำหรับแอป และ `DIRECT_URL` เป็น session pooler พอร์ต `5432` สำหรับ Prisma migrate
3. กำหนด `BETTER_AUTH_SECRET` เป็นค่า random อย่างน้อย 32 ตัวอักษร และ `BETTER_AUTH_URL` เป็น URL ของแอป
4. สร้างตารางจาก Prisma schema:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

   คำสั่ง migrate ใช้ `DIRECT_URL`
5. สำหรับอัปโหลดรูปโปรไฟล์และลายเซ็น ให้กำหนด `SUPABASE_URL` และ `SUPABASE_SECRET_KEY` (หรือ legacy `SUPABASE_SERVICE_ROLE_KEY`) ใน `.env` ฝั่ง server เท่านั้น migration สร้าง bucket แบบ private ไว้ให้แล้ว ห้ามตั้ง key นี้เป็น `NEXT_PUBLIC_*`
6. กำหนดค่า MOPH ตามหัวข้อถัดไป จากนั้นสร้าง Superadmin คนแรกโดยกรอก CID แบบไม่บันทึกลงไฟล์ env แล้วเรียกสคริปต์:

   ```powershell
   $env:BOOTSTRAP_SUPERADMIN_CID = Read-Host "CID 13 หลัก"
   $env:BOOTSTRAP_SUPERADMIN_NAME = Read-Host "ชื่อที่แสดง"
   npm run db:bootstrap-superadmin
   Remove-Item Env:BOOTSTRAP_SUPERADMIN_CID, Env:BOOTSTRAP_SUPERADMIN_NAME
   ```

7. เปิดเว็บด้วย `npm run dev`; Superadmin เพิ่มผู้ใช้จากเมนู “จัดการผู้ใช้” โดยใส่ CID ชื่อ และสิทธิ์ PM จัดการสิทธิ์ Advisor/Advisee ส่วน Superadmin เท่านั้นที่กำหนด PM/Superadmin ได้ ผู้ใช้จะล็อกอินได้หลัง CID ถูกลงทะเบียนและบัญชีเปิดใช้งาน
8. หลัง ProviderID login ครั้งแรก ผู้ใช้ตั้ง email/password สำรองได้จากหน้า setup; PM ออก temporary password ให้บัญชีที่เชื่อมแล้วได้ และผู้ใช้ต้องเปลี่ยนรหัสผ่านเมื่อเข้าใช้ครั้งถัดไป
9. สร้างโครงการโดยกำหนด Advisor หลักหนึ่งคน และ Advisor รองได้หลายคน ผลตรวจเก็บแยกตาม Advisor โดยสถานะภาพรวมยึดผลของ Advisor หลัก
10. นำเข้าข้อมูล Excel หลังตรวจสอบ 18/19 รายชื่อและการจับคู่ Advisor แล้ว

สคริปต์ `dev` และ `start` เปิดใช้ trusted CA จากระบบปฏิบัติการให้ Node.js สำหรับ TLS ของ Prisma 7 กับ Supabase หากโฮสต์แอปโดยไม่เรียกสคริปต์เหล่านี้ ให้ตั้ง `NODE_OPTIONS=--use-system-ca` ใน environment ฝั่ง server

Better Auth session และ role อยู่ในฐานข้อมูลของแอปผ่าน Prisma; ไม่ใช้ Supabase Auth ซ้ำ RLS เปิดบนตารางและถอนสิทธิ์ `anon` / `authenticated` ของ Data API เนื่องจาก session ของ Better Auth ไม่ได้สร้าง `auth.uid()` ของ Supabase การอ่านเขียนทั้งหมดจึงผ่าน server route ที่ตรวจ role แล้วเท่านั้น ห้ามเปิด connection string หรือ Better Auth secret ไปฝั่ง browser

## ขอเปิดใช้งาน MOPH ProviderID

ติดต่อ MOPH/ผู้ดูแล Health ID และ Provider ID เพื่อขอข้อมูลและลงทะเบียน:

- Health ID OAuth: Client ID และ Client Secret
- Provider ID API: Client ID และ Secret Key
- ลงทะเบียน Redirect URI ให้ตรงทุกอักขระ: `https://<โดเมนของแอป>/api/auth/callback/provider-id` (สำหรับ local ใช้ `http://localhost:3000/api/auth/callback/provider-id`)
- ขอเปิดสิทธิ์ environment UAT ก่อน แล้วจึงขอ production เมื่อผ่านการทดสอบ
- ใส่ค่าใน `MOPH_HEALTH_ID_CLIENT_ID`, `MOPH_HEALTH_ID_CLIENT_SECRET`, `MOPH_PROVIDER_ID_CLIENT_ID`, `MOPH_PROVIDER_ID_SECRET_KEY` และตั้ง `MOPH_ENV=UAT` หรือ `PRD`

ในเอกสาร MOPH flow เริ่มที่ Health ID authorization code, แลก Health ID access token ฝั่ง server, แลก token ของ Provider ID แล้วอ่าน profile ของ Provider ID ต่อ ฝั่งแอปทำทั้ง token exchange และ profile lookup ใน Better Auth Generic OAuth callback ไม่ส่ง token หรือ secret ไป browser ระบบใช้ `hash_cid` จาก ProviderID จับคู่กับ CID ที่ลงทะเบียนไว้ก่อน โดยเก็บเป็น HMAC fingerprint ที่ผูกกับ `BETTER_AUTH_SECRET` ไม่เก็บเลข CID จริง; เก็บ Provider ID, ชื่อแสดง และ role ในฐานข้อมูล และล้าง OAuth access/refresh/id token หลังอ่าน profile แล้ว

ถ้า MOPH เปลี่ยน endpoint, header หรือรูปแบบ response ให้ตรวจคู่มือล่าสุดก่อนเปิด production ค่า Redirect URI ต้องตรงกับค่าที่ลงทะเบียน หาก CID ยังไม่อยู่ในรายชื่อหรือบัญชีถูกปิด ระบบจะไม่สร้างบัญชีให้เอง `BETTER_AUTH_SECRET` ต้องคงเดิมตราบใดที่มี CID allowlist เพราะใช้สร้างค่า lookup fingerprint

## หมายเหตุ

- ไม่เชื่อม MOPH Notify ใน MVP
- ProviderID เป็นข้อมูลยืนยันตัวตน ส่วนบทบาท/สิทธิ์กำหนดจาก `ResearchProfile`; Superadmin จัดการผู้ใช้และ PM จัดการงานวิจัย
- รูปและลายเซ็นเก็บใน Supabase Storage แบบ private; สมาชิกที่ล็อกอินแล้วดูโปรไฟล์ทีมได้ ลายเซ็นใช้แสดงในโปรไฟล์เท่านั้น ไม่ใช่การลงนามอนุมัติเอกสาร
- `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `SUPABASE_SECRET_KEY` และ MOPH secrets เป็น server-only ห้าม commit
- ตารางจริงและ login ใช้ไม่ได้จนกว่าจะตั้งค่า Supabase, MOPH และ bootstrap Superadmin; โหมด `/demo` ใช้ทดสอบ UI ได้โดยไม่ต้องมี credentials
