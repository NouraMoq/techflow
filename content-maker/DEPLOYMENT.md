# دليل النشر — صانع المحتوى (Content Maker)

نشر إنتاجي بـ **Docker + PostgreSQL + CI**. التطوير المحلي يبقى على **SQLite** (مُتحقَّق منه)،
ويُبدَّل مزوّد Prisma إلى **PostgreSQL** تلقائيًا عند بناء صورة Docker / في CI عبر
`scripts/use-postgres.sh` — دون تعديل شجرة العمل المحلية. (المخطط محمول، وقد تم التحقق من
صلاحيته لـ PostgreSQL عبر `prisma validate`.)

## 1) تشغيل سريع بـ Docker Compose (تكافؤ dev/prod)

```bash
cd content-maker
export AUTH_SECRET="$(openssl rand -base64 48)"   # سرّ قوي 32+ محرفًا
docker compose up --build
```

- التطبيق: <http://localhost:3000>
- عند `SEED_ON_START=true` (الافتراضي في compose): تُبذر بيانات تجريبية —
  دخول `creator@example.sa` / `password123` و`admin@novametrics.sa` / `password123`.
- قاعدة PostgreSQL تعمل كخدمة `db` مع تخزين دائم (`pgdata`) وفحص صحّة.

> للإنتاج الحقيقي: اضبط `SEED_ON_START=false`، وزوّد `AUTH_SECRET` و`DATABASE_URL` كأسرار،
> ولا تستخدم كلمات مرور compose الافتراضية.

## 2) بناء الصورة وتشغيلها يدويًا

```bash
cd content-maker
docker build -t content-maker:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/content_maker" \
  -e AUTH_SECRET="<سرّ 32+ محرفًا>" \
  -e SEED_ON_START="false" \
  content-maker:latest
```

**ما يفعله دخول الحاوية (`docker-entrypoint.sh`):**
1. تطبيق المخطط على PostgreSQL — `prisma migrate deploy` إن وُجدت Migrations، وإلا
   `prisma db push` لأول إقلاع.
2. بذر اختياري عند `SEED_ON_START=true`.
3. تشغيل `next start` على المنفذ `3000`.

## 3) قاعدة البيانات (Migrations)

**Migration الأولية موجودة ومُلتزمة** في `prisma/migrations/0_init/` (DDL خاص بـ PostgreSQL —
٤٣ جدولًا + الفهارس والمفاتيح الأجنبية)، و`migration_lock.toml` بمزوّد `postgresql`. يطبّقها
الدخول تلقائيًا بـ `prisma migrate deploy` عند الإقلاع، ويختبرها الـ CI فعليًا على PostgreSQL.

- **محليًا (SQLite):** التطوير يبقى schema-first عبر `npm run db:reset` (`db push`) — وهو يتجاهل
  مجلد الـ Migrations، فلا تعارض.
- **لإضافة تغيير مخطط لاحقًا (Migration جديدة):** بعد الاتصال بـ PostgreSQL:

  ```bash
  sh scripts/use-postgres.sh                 # نسخة عمل مؤقتة/CI فقط
  DATABASE_URL=postgresql://… npx prisma migrate dev --name <اسم_التغيير>
  # التزم مجلد prisma/migrations الجديد؛ يطبّقه migrate deploy تلقائيًا في الإنتاج.
  ```

## 4) التكامل المستمر (CI)

`.github/workflows/content-maker-ci.yml` — يعمل على تغييرات `content-maker/**`:

| المهمة | ماذا تفعل |
|---|---|
| **test** | تثبيت، `prisma generate` (SQLite)، **اختبارات الوحدة (Vitest)**، **بناء الإنتاج** — فحص سريع |
| **e2e** | خدمة **PostgreSQL 16**، تبديل المزوّد، `prisma db push`، تثبيت Chromium، **اختبارات E2E (Playwright)** بتكافؤ الإنتاج؛ يرفع تقرير Playwright عند الفشل |

محليًا: `npm test` (وحدة) و`npm run e2e` (يقود Google Chrome النظامي بلا تنزيل متصفح).

## 5) متغيّرات البيئة الإنتاجية

انظر `.env.production.example`. الأساسية:

| المتغيّر | الوصف |
|---|---|
| `DATABASE_URL` | سلسلة اتصال PostgreSQL |
| `AUTH_SECRET` | سرّ توقيع الجلسة (32+ محرفًا؛ `openssl rand -base64 48`) |
| `SEED_ON_START` | `true` لبذر بيانات تجريبية عند الإقلاع (اجعله `false` في الإنتاج) |
| اختياري | مفاتيح TikTok/S3 — غيابها يُفعّل المزوّد التجريبي (Mock) |

## 6) قائمة تحقق قبل الإطلاق
- [ ] `AUTH_SECRET` قوي ومُدار كسرّ (ليس في الكود/الصورة).
- [ ] `DATABASE_URL` يشير إلى PostgreSQL مُدارة مع نسخ احتياطي.
- [ ] `SEED_ON_START=false` وحذف الحسابات التجريبية.
- [ ] HTTPS أمام التطبيق (عكسي/موازن أحمال) — الكوكي `secure` يُفعَّل تلقائيًا في الإنتاج.
- [ ] تفعيل تكامل TikTok المباشر عند توفر مفاتيح رسمية (البنية جاهزة عبر Adapter).
- [ ] تخزين S3 فعلي وSigned URLs للأصول قبل الرفع الحقيقي للملفات.
- [ ] مراجعة قانونية/امتثال من مختص مرخّص قبل الاستخدام التجاري.
