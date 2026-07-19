# نشر المنصة على Google Cloud Run + Cloud SQL

هدف: **الموقع التعريفي يبقى على Firebase** عند النطاق الرئيسي، و**المنصة تعمل على Cloud Run**
عند نطاق فرعي `app.novametrics.sa` — منفصلان تمامًا، مرتبطان بزر فقط.

```
 novametrics.sa  (Firebase — index.html)  ──[زر «صانع المحتوى»]──►  app.novametrics.sa  (Cloud Run)
```

> الزر مضاف في الموقع ويشير إلى `https://app.novametrics.sa` — يعمل تلقائيًا بمجرد ربط النطاق أدناه.

## 0) متطلبات
- مشروع Google Cloud + تفعيل الفوترة، و`gcloud` مثبّت ومُسجّل الدخول.
```bash
gcloud config set project <PROJECT_ID>
gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  secretmanager.googleapis.com cloudbuild.googleapis.com
export REGION=me-central1     # أو الأقرب المتاح
```

## 1) قاعدة PostgreSQL مُدارة (Cloud SQL)
```bash
gcloud sql instances create content-maker-db \
  --database-version=POSTGRES_16 --tier=db-g1-small --region=$REGION
gcloud sql databases create content_maker --instance=content-maker-db
gcloud sql users create cm_app --instance=content-maker-db --password='<كلمة-مرور-قوية>'

# اسم الاتصال (تحتاجه لاحقًا):
gcloud sql instances describe content-maker-db --format='value(connectionName)'
# مثال الناتج:  <PROJECT_ID>:me-central1:content-maker-db
```

## 2) الأسرار (Secret Manager)
```bash
# سرّ الجلسة (32+ محرفًا)
printf '%s' "$(openssl rand -base64 48)" | gcloud secrets create AUTH_SECRET --data-file=-

# سلسلة الاتصال — عبر مقبس Cloud SQL (host يشير للمقبس، لا IP):
CONN="<PROJECT_ID>:me-central1:content-maker-db"
printf '%s' "postgresql://cm_app:<كلمة-المرور>@localhost/content_maker?host=/cloudsql/${CONN}" \
  | gcloud secrets create DATABASE_URL --data-file=-
```

## 3) بناء ونشر الصورة على Cloud Run
`Dockerfile` الجاهز يبدّل مزوّد Prisma إلى PostgreSQL، ويُطبّق الـ Migration المُلتزمة عند الإقلاع.
Cloud Run يحقن `PORT` تلقائيًا و`next start` يحترمه.
```bash
gcloud run deploy content-maker \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances "<PROJECT_ID>:me-central1:content-maker-db" \
  --set-secrets "AUTH_SECRET=AUTH_SECRET:latest,DATABASE_URL=DATABASE_URL:latest" \
  --set-env-vars "NODE_ENV=production,SEED_ON_START=false" \
  --cpu 1 --memory 512Mi --min-instances 0 --max-instances 4
```
- عند أول نشر يقوم دخول الحاوية بـ `prisma migrate deploy` (يُنشئ الجداول من `prisma/migrations/0_init`).
- **إنتاج بدون بيانات تجريبية:** أبقِ `SEED_ON_START=false`.

> **الـ Migrations والتزامن:** تطبيقها عند الإقلاع كافٍ لأول نشر. للتشغيل الأمتن مع عدة نسخ، انقل
> الترحيل إلى خطوة منفصلة (Cloud Run **Job** يشغّل `npx prisma migrate deploy` مرة واحدة قبل النشر)
> واجعل دخول الحاوية يشغّل التطبيق فقط.

## 4) ربط النطاق الفرعي `app.novametrics.sa`
```bash
gcloud beta run domain-mappings create \
  --service content-maker --domain app.novametrics.sa --region $REGION
```
ثم أضِف في DNS (حيث يُدار `novametrics.sa`) سجلّ الـ **CNAME/A** الذي يعرضه الأمر أعلاه لـ `app`.
بمجرّد انتشار DNS يعمل زر «صانع المحتوى» في الموقع مباشرة.

## 5) بعد النشر — قائمة تحقّق
- [ ] فتح `https://app.novametrics.sa` يعرض صفحة الدخول.
- [ ] `SEED_ON_START=false` وحذف الحسابات التجريبية (أو عدم بذرها).
- [ ] HTTPS مفعّل (Cloud Run تلقائيًا) → كوكي الجلسة `secure`.
- [ ] نسخ احتياطي لـ Cloud SQL مفعّل.
- [ ] عند توفر مفاتيح TikTok/S3: أضِفها كأسرار (`--set-secrets`) لتفعيل النشر المباشر والتخزين الحقيقي.
- [ ] الموقع التعريفي: `firebase deploy` (يتجاهل `content-maker/` الآن) — لا يتأثر بالمنصة.

## ملاحظات
- **التكلفة:** Cloud Run يحاسب عند الاستخدام (`min-instances 0`)؛ Cloud SQL `db-g1-small` مناسب للبدء.
- **التحديثات مستقلة:** نشر المنصة (`gcloud run deploy`) لا يمسّ الموقع، ونشر الموقع (`firebase deploy`) لا يمسّ المنصة.
- CI الحالي يختبر على PostgreSQL؛ يمكن لاحقًا إضافة خطوة `gcloud run deploy` للنشر التلقائي.
