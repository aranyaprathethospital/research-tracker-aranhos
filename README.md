# Research Tracker

ระบบติดตามความก้าวหน้างานวิจัยสำหรับผู้จัดการโครงการ (PM), อาจารย์ที่ปรึกษา (Advisor) และผู้ทำวิจัย (Advisee) สร้างด้วย Next.js App Router, TypeScript, Tailwind CSS v4, Better Auth, Prisma 7 และ PostgreSQL บน Supabase

ชื่อเรื่องงานวิจัยมีสามรอบ ได้แก่ ครั้งที่ 1 ครั้งที่ 2 และ Final โดย PM และเจ้าของงานในโหมด Advisee บันทึกชื่อรอบถัดไปได้ หลังจากยืนยัน Final แล้ว เฉพาะ PM แก้ชื่อได้ ประวัติชื่อเก็บแยกจากความคืบหน้าของโครงการ

## ความสามารถหลัก

- เข้าระบบด้วย ProviderID ผ่าน MOPH โดยระบบอนุญาตเฉพาะ CID ที่ PM หรือ Superadmin ลงทะเบียนไว้และบัญชียังเปิดใช้งานอยู่
- ตั้งค่าอีเมลและรหัสผ่านสำรองหลังเข้าสู่ระบบด้วย ProviderID ได้ รหัสผ่านยาว 6–128 ตัวอักษร
- เก็บข้อมูลผู้ใช้ ได้แก่ ชื่อเต็ม, CID สำหรับจับคู่บัญชี, ตำแหน่ง, ระดับตำแหน่ง, ภารกิจ, กลุ่มงาน, อีเมล, รูปโปรไฟล์ และรูปลายเซ็น
- กำหนดบทบาทระบบและความสามารถในการทำงานแยกกัน ผู้ใช้ที่ได้รับทั้ง Advisor และ Advisee เลือกโหมดทำงานได้
- ติดตามโครงการวิจัย ขั้นตอน ความคืบหน้า ปัญหา งานถัดไป และวันกำหนดส่ง
- กำหนด Advisor หลักหนึ่งคนต่อโครงการ และ Advisor รองได้หลายคน
- แยกผลการตรวจและความคิดเห็นตาม Advisor พร้อมบันทึกประวัติการอัปเดตโครงการ
- เก็บรูปโปรไฟล์และลายเซ็นใน Supabase Storage แบบ private พร้อมใช้ signed URL อายุจำกัด

ระบบไม่สร้างบัญชีให้เองเมื่อพบ ProviderID ที่ไม่รู้จัก และไม่มีข้อมูลตัวอย่างหรือ route สำหรับ demo ให้เพิ่มผู้ใช้และกำหนดสิทธิ์ผ่าน Superadmin/PM ก่อนเริ่มใช้งานจริง

## เทคโนโลยี

- Next.js 16 App Router, React 19, TypeScript/TSX
- Tailwind CSS v4 และ shadcn/ui ที่ใช้ Base UI
- Better Auth สำหรับ session และการยืนยันตัวตน
- Prisma 7 และ PostgreSQL บน Supabase
- TanStack Table, React Hook Form, Zod, lucide-react, date-fns, Sonner, Framer Motion, GSAP, Three.js และ Recharts ตามความเหมาะสมของฟีเจอร์
- ใช้ pnpm และเก็บ dependency lockfile ใน `pnpm-lock.yaml`

## โครงสร้างโปรเจกต์

```text
app/
  (auth)/                 หน้า login, ตั้งค่าบัญชี, เปลี่ยนรหัสผ่าน และเลือกโหมด
  (workspace)/            layout และหน้า workspace ที่ต้องเข้าสู่ระบบ
  api/                    route handlers สำหรับ auth, profile, users และ projects
  globals.css             จุดนำเข้า Tailwind และ theme tokens ของแอป
components/ui/            shared UI primitives จาก shadcn/Base UI
features/
  auth/components/        UI สำหรับเข้าสู่ระบบและจัดการ credential
  profile/components/     UI ข้อมูลส่วนตัว
  research/components/    dashboard และงานวิจัย
  team/components/        directory ทีม
  users/components/       จัดการผู้ใช้
lib/                      auth, Prisma, access checks, storage และ domain services
prisma/
  schema.prisma           data model
  migrations/             migration history
scripts/                  งานดูแลระบบ เช่น bootstrap Superadmin
```

ให้เก็บหน้าและ layout สำหรับ routing ไว้ใน `app/` ส่วน UI/workflow ของแต่ละความสามารถอยู่ใน `features/<feature>/components/` และ primitive ที่นำกลับมาใช้ซ้ำอยู่ใน `components/ui/` ดูกฎการพัฒนาเพิ่มเติมใน [AGENTS.md](AGENTS.md)

## บทบาทและสิทธิ์

| บทบาทระบบ | สิทธิ์หลัก |
| --- | --- |
| `SUPERADMIN` | จัดการผู้ใช้และโครงการ รวมถึงกำหนดบทบาทระบบ เช่น PM หรือ Superadmin |
| `PM` | จัดการผู้ใช้ทั่วไปและความสามารถ Advisor/Advisee รวมถึงสร้าง/จัดการโครงการและมอบหมาย Advisor |
| `USER` | บัญชีผู้ใช้ทั่วไป สิทธิ์ทำงานขึ้นกับความสามารถที่ได้รับ |

ความสามารถในการทำงานแยกจากบทบาทระบบ:

- `ADVISEE`: ดูและอัปเดตโครงการของตนเอง เช่น ขั้นตอน ความคืบหน้า ปัญหา งานถัดไป และกำหนดส่ง
- `ADVISOR`: ดูโครงการที่ได้รับมอบหมาย อัปเดตผลตรวจและแสดงความคิดเห็นของตนเอง
- ผู้ใช้ที่มีทั้งสองความสามารถเลือกโหมด Advisor หรือ Advisee ได้ ส่วนผู้ใช้ที่มีเพียงหนึ่งความสามารถจะเข้าโหมดนั้นโดยอัตโนมัติ
- API ตรวจ session, สถานะบัญชี, บทบาท และโหมดทำงานบน server ทุกครั้ง การซ่อนปุ่มในหน้าเว็บไม่ใช่การควบคุมสิทธิ์

## เตรียมเครื่องและเริ่มใช้งาน

ต้องติดตั้ง Node.js 22.18 ขึ้นไปและ pnpm เพื่อให้รันสคริปต์และคอนฟิก TypeScript ได้โดยตรง

1. ติดตั้ง dependencies:

   ```bash
   pnpm install
   ```

2. สร้างไฟล์ `.env` จากตัวอย่าง:

   ```powershell
   Copy-Item .env.example .env
   ```

   กรอกค่าจริงของ Supabase และ MOPH ในเครื่องหรือ secret manager ของ deployment เท่านั้น ห้าม commit `.env`

   Prisma CLI ใช้การตั้งค่าใน `prisma7.config.ts` ซึ่งอ่าน `.env.local` ก่อน แล้วอ่าน `.env`; สำหรับ migration จะเลือก `DIRECT_URL` ก่อน `DATABASE_URL` หากมีทั้งสองค่า

3. สร้าง `BETTER_AUTH_SECRET` ในเครื่องด้วยคำสั่งนี้ แล้วนำผลลัพธ์ไปใส่ใน `.env` โดยใช้ค่าเดิมต่อเนื่องระหว่าง deployment:

   ```bash
   node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('base64url'))"
   ```

4. สร้าง Prisma client และติดตั้ง migration:

   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. ตั้งค่า MOPH ProviderID ตามหัวข้อด้านล่าง แล้วเริ่มเซิร์ฟเวอร์:

   ```bash
   pnpm dev
   ```

เปิด [http://localhost:3000/login](http://localhost:3000/login)

## ตัวแปรสภาพแวดล้อม

ชื่อและ placeholder ใน `.env.example` เป็นแหล่งอ้างอิงหลัก ค่าต่อไปนี้เป็น server-only เว้นแต่ระบุไว้เป็นอย่างอื่น:

แอปอ่านค่าผ่าน `lib/env.ts` ซึ่งจำกัดให้ใช้ฝั่งเซิร์ฟเวอร์ ส่วน Prisma CLI และสคริปต์ตั้งค่า Superadmin ใช้ตัวอ่านเฉพาะงานจาก `config/env.ts` หลังโหลดไฟล์ env ทั้งหมดตรวจค่าด้วย `@t3-oss/env-nextjs` และ Zod หากค่าที่ตั้งไว้ผิดรูปแบบ ข้อผิดพลาดจะแสดงชื่อคีย์โดยไม่แสดงค่าจริง

เมื่อเพิ่มตัวแปร ให้เพิ่มชนิดข้อมูลและการจับคู่ `runtimeEnv` ใน `config/env.ts` พร้อมตัวอย่างที่ปลอดภัยใน `.env.example` โปรแกรมตรวจโค้ดจะรายงานการอ่าน `process.env` นอกไฟล์กลาง

| ตัวแปร | ใช้ทำอะไร |
| --- | --- |
| `DATABASE_URL` | การเชื่อมต่อ PostgreSQL ขณะ runtime; ตัวอย่างใช้ Supabase Transaction Pooler port `6543` |
| `DIRECT_URL` | Prisma migrations และสคริปต์ bootstrap; ตัวอย่างใช้ Supabase Session Pooler port `5432` |
| `BETTER_AUTH_SECRET` | secret ของ Better Auth และ HMAC สำหรับจับคู่ CID ต้องมีอย่างน้อย 32 ตัวอักษรและต้องคงเดิม |
| `BETTER_AUTH_URL` | base URL ของแอป เช่น `http://localhost:3000` |
| `SUPABASE_URL` | URL ของ Supabase project ใช้กับ Storage |
| `SUPABASE_SECRET_KEY` | server-side key สำหรับ Storage; โค้ดยังรองรับชื่อเก่า `SUPABASE_SERVICE_ROLE_KEY` |
| `MOPH_ENV` | `UAT` สำหรับทดสอบ หรือ `PRD` สำหรับระบบจริง |
| `MOPH_HEALTH_ID_CLIENT_ID` | Client ID ของ MOPH Health ID |
| `MOPH_HEALTH_ID_CLIENT_SECRET` | Client secret ของ MOPH Health ID |
| `MOPH_PROVIDER_ID_CLIENT_ID` | Client ID ของ ProviderID |
| `MOPH_PROVIDER_ID_SECRET_KEY` | Secret key ของ ProviderID |
| `MOPH_REDIRECT_URI` | Callback URL ที่ลงทะเบียนกับ MOPH ต้องตรงทุกตัวอักษร |

Callback สำหรับ local โดยปกติคือ `http://localhost:3000/api/auth/callback/provider-id` และสำหรับ deployment คือ `https://<โดเมนแอป>/api/auth/callback/provider-id` ค่า `BETTER_AUTH_URL`, `MOPH_REDIRECT_URI` และ URL ที่ลงทะเบียนกับ MOPH ต้องสอดคล้องกัน

การเชื่อมต่อฐานข้อมูลตามตัวอย่าง:

- `DATABASE_URL`: Transaction Pooler, port `6543`, เหมาะกับ runtime ที่เปิด connection สั้น ๆ
- `DIRECT_URL`: Session Pooler, port `5432`, ใช้กับ Prisma migrate และ bootstrap script
- ใส่ `sslmode=require` และ URL-encode อักขระพิเศษในรหัสผ่านฐานข้อมูลก่อนใส่ใน connection string

`SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, MOPH secrets, database URLs และ `BETTER_AUTH_SECRET` ต้องไม่ขึ้นต้นด้วย `NEXT_PUBLIC_` และห้ามส่งไปยัง browser

### ตัวแปร bootstrap Superadmin

สคริปต์เริ่มต้นอ่าน `BOOTSTRAP_SUPERADMIN_CID` และ `BOOTSTRAP_SUPERADMIN_NAME` จาก environment ชั่วคราว ไม่ต้องเก็บสองค่านี้ใน `.env` และไม่ต้องตั้ง `INITIAL_PM_PROVIDER_ID`/`INITIAL_PM_DISPLAY_NAME` สคริปต์สร้างรายการ CID ของ Superadmin คนแรกเท่านั้น เมื่อมี active Superadmin แล้ว ให้ใช้หน้า user directory เพื่อกำหนดบทบาทและจัดการผู้ใช้

ตัวอย่าง PowerShell:

```powershell
$env:BOOTSTRAP_SUPERADMIN_CID = Read-Host "CID 13 หลัก"
$env:BOOTSTRAP_SUPERADMIN_NAME = Read-Host "ชื่อที่แสดง"
pnpm db:bootstrap-superadmin
Remove-Item Env:BOOTSTRAP_SUPERADMIN_CID, Env:BOOTSTRAP_SUPERADMIN_NAME
```

สคริปต์ตรวจเลข CID 13 หลักและ checksum, ต้องมี `DIRECT_URL` กับ `BETTER_AUTH_SECRET`, ปฏิเสธการสร้าง Superadmin ซ้ำเมื่อมี active Superadmin แล้ว และบันทึกเฉพาะ HMAC lookup key ไม่บันทึก CID จริง หลัง bootstrap ให้เข้าสู่ระบบด้วย ProviderID ของ CID ที่ลงทะเบียน จากนั้นสร้างผู้ใช้/กำหนด PM และความสามารถผ่านหน้า user directory ตามสิทธิ์

## ขั้นตอน login และจัดการผู้ใช้

1. Superadmin หรือ PM เพิ่มผู้ใช้จากหน้า user directory พร้อมชื่อและ CID ที่ถูกต้อง จากนั้นกำหนด `USER` และความสามารถ `ADVISOR`, `ADVISEE` หรือทั้งคู่
2. ผู้ใช้เข้าสู่ระบบผ่าน ProviderID; CID ที่ MOPH ส่งกลับต้องจับคู่กับ profile ที่ลงทะเบียนและยัง active อยู่ ระบบไม่สร้างบัญชีให้อัตโนมัติ
3. หลัง ProviderID เชื่อมบัญชีสำเร็จ ผู้ใช้ตั้งอีเมลและรหัสผ่านสำรองได้ที่ `/account/setup` รหัสผ่านขั้นต่ำ 6 ตัวอักษรและสูงสุด 128 ตัวอักษร
4. ครั้งถัดไปใช้ ProviderID หรืออีเมล/รหัสผ่านสำรองได้ หากลืมรหัสผ่านให้ PM/Superadmin ออก temporary password ตาม workflow ใน user directory และผู้ใช้ต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบ
5. ผู้ใช้ที่มีทั้ง Advisor และ Advisee เลือกโหมดได้ที่ `/choose-role`; การเลือกนี้เปลี่ยนบริบทงานของ session แต่ไม่เพิ่มสิทธิ์ใหม่

## Supabase Storage

Migration สร้าง bucket ชื่อ `research-profile-files` เป็น private จำกัดไฟล์ภาพ JPEG, PNG และ WebP ขนาดไม่เกิน 5 MB โค้ดอัปโหลดและสร้าง signed URL จาก server โดย signed URL มีอายุเริ่มต้นหนึ่งชั่วโมง ต้องตั้ง `SUPABASE_URL` และ `SUPABASE_SECRET_KEY` (หรือ `SUPABASE_SERVICE_ROLE_KEY` เดิม) เพื่อใช้รูปและลายเซ็น เก็บรูปไว้สำหรับข้อมูลโปรไฟล์เท่านั้น ลายเซ็นไม่ใช่การอนุมัติเอกสารอิเล็กทรอนิกส์

## Data model โดยสรุป

- `User`, `Session`, `Account`, `Verification`: Better Auth users, sessions, ProviderID และ credential email/password
- `ResearchProfile`: CID lookup key, ProviderID, ชื่อ ข้อมูลตำแหน่ง/ภารกิจ บทบาทระบบ สถานะบัญชี ข้อมูลติดต่อและ path ของไฟล์โปรไฟล์
- `ProfileCapabilityGrant`: ความสามารถ `ADVISOR` และ `ADVISEE`
- `ResearchProject`: รหัส/ชื่อโครงการ ผู้ทำวิจัย ขั้นตอน ความคืบหน้า ปัญหา งานถัดไปและกำหนดส่ง
- `ResearchProjectAdvisor`: การมอบหมาย Advisor หลัก/รอง โดยมี unique constraint ให้มี Advisor หลักได้หนึ่งคนต่อโครงการ
- `AdvisorReview`, `AdvisorComment`, `ResearchUpdate`: ผลตรวจ ความเห็น และประวัติการเปลี่ยนแปลง

CID จริงไม่ถูกเก็บใน `ResearchProfile`; ระบบ normalize CID แล้วสร้าง HMAC lookup key จากค่า hash ที่ MOPH ส่งมาและ `BETTER_AUTH_SECRET` เพื่อจับคู่บัญชี

## Routes สำคัญ

| URL | หน้าที่ |
| --- | --- |
| `/login` | เข้าสู่ระบบด้วย ProviderID หรืออีเมล/รหัสผ่าน |
| `/account/setup` | ตั้งอีเมลและรหัสผ่านสำรองหลัง ProviderID login |
| `/account/password` | ตั้งหรือเปลี่ยนรหัสผ่าน |
| `/choose-role` | เลือก Advisor/Advisee เมื่อได้รับทั้งสองความสามารถ |
| `/` | dashboard/workspace หลังเข้าสู่ระบบ |
| `/profile` | ดูและแก้ไขข้อมูลส่วนตัว |

API handlers อยู่ใต้ `app/api/` สำหรับ auth, account, profile, media, users, team และ projects โดยแต่ละ handler ต้องตรวจ session และสิทธิ์บน server

## คำสั่งที่มีในโปรเจกต์

| คำสั่ง | หน้าที่ |
| --- | --- |
| `pnpm dev` | เปิด Next.js development server |
| `pnpm build` | สร้าง production build |
| `pnpm start` | เปิด production server หลัง build |
| `pnpm lint` | รัน ESLint |
| `pnpm db:generate` | สร้าง Prisma client |
| `pnpm db:migrate` | นำ migration ที่ commit แล้วไปใช้กับฐานข้อมูล (`prisma migrate deploy`) |
| `pnpm db:migrate:dev --name <ชื่อ>` | สร้าง/นำ migration ไปใช้ใน development หลังแก้ Prisma schema |
| `pnpm db:deploy` | alias สำหรับ deploy migrations |
| `pnpm db:bootstrap-superadmin` | สร้าง CID allowlist สำหรับ Superadmin คนแรก |

อย่าแก้ migration เดิมที่นำไปใช้แล้ว ให้สร้าง migration ใหม่เสมอ ตรวจทานผลกระทบต่อข้อมูลก่อน deploy

## แก้ปัญหาเบื้องต้น

- **เชื่อม PostgreSQL ไม่ได้:** ตรวจ hostname, ชื่อผู้ใช้, password ที่ URL-encode แล้ว, `sslmode=require`, port `6543` ของ `DATABASE_URL` และ port `5432` ของ `DIRECT_URL`; สคริปต์ bootstrap ต้องมี `DIRECT_URL`
- **Prisma แจ้ง Invalid URL:** ตรวจรูปแบบ connection string ใน `.env` ว่าไม่มี backslash ต่อท้าย, quote เกิน หรือช่องว่างใน URL; ตรวจว่าค่าที่รันจริงถูกโหลดจากไฟล์ environment ที่ตั้งใจใช้
- **ProviderID callback error:** ตรวจ client IDs/secrets, environment `UAT`/`PRD`, `BETTER_AUTH_URL`, และ callback URI ที่ลงทะเบียนกับ MOPH ให้ตรงกัน
- **เข้าสู่ระบบแล้วไม่พบผู้ใช้หรือถูกปฏิเสธ:** ต้องมี profile ที่ CID ตรง, `active = true` และ capability ถูกกำหนดไว้ก่อน login; ProviderID ที่ไม่รู้จักจะไม่สร้างบัญชีเอง
- **อีเมล/รหัสผ่านใช้ไม่ได้:** ให้ผู้ใช้ทำ ProviderID login ครั้งแรกและตั้งค่าที่ `/account/setup`; ตรวจว่าอีเมลสำรองตรงกับ profile และรหัสผ่านยาวอย่างน้อย 6 ตัวอักษร
- **รูป/ลายเซ็นไม่ขึ้น:** ตรวจ `SUPABASE_URL`, server-side Storage key และ migration ที่สร้าง private bucket `research-profile-files`; ตรวจชนิดไฟล์และขนาดไม่เกิน 5 MB
- **CID ที่ลงทะเบียนไว้จับคู่ไม่ได้หลังเปลี่ยน secret:** ตรวจ `BETTER_AUTH_SECRET` ว่ายังเป็นค่าเดิม เพราะค่า HMAC lookup key ผูกกับ secret นี้

## ข้อควรระวังด้านข้อมูล

- ไม่ commit `.env`, credentials, CID จริง หรือไฟล์ผู้ใช้
- ไม่ส่ง database/storage/MOPH secrets ไป client และไม่ log CID หรือ token
- ไม่ย้ายการตรวจสิทธิ์ไป client; ตรวจ session, active profile, system role และ capability ใน server/API
- อย่าเปิด bucket เป็น public หรืออนุญาต browser ให้เข้าถึง database โดยตรง
- ถ้าจะเพิ่ม Supabase Data API access ต้องออกแบบ RLS และ policy แบบจำกัดแถวก่อนให้สิทธิ์ `anon`/`authenticated`
- สำรองฐานข้อมูลและทดสอบ migration ใน environment ที่ไม่ใช่ production ก่อน deploy
