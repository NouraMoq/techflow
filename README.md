# صانع المحتوى | Content Maker

منتج من **نوفاميتريكس | NovaMetrics** — *من الفكرة إلى التأثير*.

**صانع المحتوى** ليس أداة جدولة منشورات، بل **نظام تشغيل متكامل** لإدارة محتوى المشاهير
وصناع المحتوى وفرقهم ووكالاتهم: من الاستراتيجية، إلى الأفكار والسيناريوهات والإنتاج
والموافقات والنشر، وصولًا إلى التحليلات والتوصيات والحملات التجارية والعقود والامتثال.
تبدأ النسخة الأولى بالتركيز على **TikTok**، مع بنية تسمح بإضافة Instagram وYouTube
وSnapchat وX وLinkedIn لاحقًا عبر **Adapter Pattern** دون إعادة بناء النظام.

> ⚠️ **حالة هذا المستودع**: يحتوي على **نموذج تفاعلي (Prototype)** بواجهة عربية RTL كاملة
> **+ حزمة وثائق منتج وتجارية كاملة**. النموذج تجريبي أمامي فقط (بدون خادم أو قاعدة بيانات)
> ويستخدم بيانات عربية تجريبية غير منسوبة لأشخاص حقيقيين. الأسعار أولية لاختبار السوق وقابلة
> للتعديل، ولا تشمل ضريبة القيمة المضافة عند انطباقها. **المراجعة القانونية والمالية النهائية
> يجب أن ينفذها مختص مرخّص.**

---

## 🚀 تشغيل النموذج التفاعلي

النموذج ملفات ثابتة (HTML/CSS/JS) — لا يحتاج بناءً أو تبعيات:

```bash
# من جذر المشروع
python3 -m http.server 8777
```

ثم افتح:

- **النموذج (المنصة):** <http://localhost:8777/app/index.html>
- **تسجيل الدخول (توضيحي):** <http://localhost:8777/app/login.html>
- **الموقع التعريفي الحالي:** <http://localhost:8777/index.html>

### تجربة سريعة داخل النموذج
- تنقّل بين الوحدات من الشريط الجانبي (الرئيسية، الاستراتيجية، بنك الأفكار، الإنتاج، التحليلات…).
- **بنك الأفكار**: بدّل بين Kanban / بطاقات / قائمة، واضغط أي فكرة لعرض تفاصيلها.
- **الإعداد الأولي**: معالج (Wizard) بـ ١٧ خطوة مع شريط تقدم وحفظ للعودة لاحقًا.
- **مساعد الذكاء الاصطناعي**: اختر المعايير ثم «توليد الأفكار».
- **الدور** (أسفل الشريط الجانبي): بدّل بين دور العميل ودور نوفاميتريكس للوصول إلى لوحة الإدارة.
- زر القمر في الأعلى للتبديل بين الوضع الفاتح والداكن. الواجهة مستجيبة للجوال بالكامل.

---

## 🗂️ بنية المستودع

```
techflow/
├─ app/                     # النموذج التفاعلي (Content Maker prototype)
│  ├─ index.html            # هيكل التطبيق (Shell) + التوجيه
│  ├─ login.html            # صفحة دخول توضيحية
│  ├─ css/app.css           # نظام التصميم (Design System) — RTL + فاتح/داكن
│  └─ js/
│     ├─ data.js            # بيانات عربية تجريبية (في الذاكرة)
│     ├─ ui.js              # أيقونات ومكوّنات وToast وModal
│     ├─ views.js           # عارض لكل وحدة (٣٠+ شاشة)
│     └─ app.js             # التوجيه (Router) + الشريط الجانبي + التفاعلات
├─ docs/                    # حزمة الوثائق (منتج + تقنية + تجارة + تشغيل)
├─ index.html               # الموقع التعريفي الحالي لنوفاميتريكس
├─ .env.example             # مثال لمتغيرات البيئة (لنسخة الإنتاج المقترحة)
└─ README.md
```

---

## 📚 دليل الوثائق (`docs/`)

| المجال | الملف |
|---|---|
| **الملخّص التنفيذي والتشغيلي للتسليم** ⭐ | [`executive-handover-ar.md`](docs/executive-handover-ar.md) |
| متطلبات المنتج (PRD) | [`product-requirements-document-ar.md`](docs/product-requirements-document-ar.md) |
| نطاق MVP | [`mvp-scope-ar.md`](docs/mvp-scope-ar.md) |
| خارطة الطريق | [`roadmap-ar.md`](docs/roadmap-ar.md) |
| الأدوار والصلاحيات (RBAC) | [`user-roles-and-permissions-ar.md`](docs/user-roles-and-permissions-ar.md) |
| مسارات المستخدم | [`user-flows-ar.md`](docs/user-flows-ar.md) |
| تصميم قاعدة البيانات + ERD | [`database-design.md`](docs/database-design.md) |
| الأمن والخصوصية | [`security-and-privacy-ar.md`](docs/security-and-privacy-ar.md) |
| خطة تكامل TikTok | [`tiktok-integration-plan-ar.md`](docs/tiktok-integration-plan-ar.md) |
| الباقات والأسعار (عربي) | [`packages-and-pricing-ar.md`](docs/packages-and-pricing-ar.md) |
| الباقات والأسعار (إنجليزي) | [`packages-and-pricing-en.md`](docs/packages-and-pricing-en.md) |
| مصفوفة الباقات (CSV) | [`packages-pricing-matrix.csv`](docs/packages-pricing-matrix.csv) |
| نموذج التكاليف والربحية (CSV) | [`unit-economics-model.csv`](docs/unit-economics-model.csv) |
| تحليل المنافسين | [`competitive-analysis-ar.md`](docs/competitive-analysis-ar.md) |
| دليل تقديم الخدمة المُدارة | [`service-delivery-playbook-ar.md`](docs/service-delivery-playbook-ar.md) |
| قائمة تهيئة العميل | [`client-onboarding-checklist-ar.md`](docs/client-onboarding-checklist-ar.md) |
| دليل سير عمل المحتوى | [`content-workflow-playbook-ar.md`](docs/content-workflow-playbook-ar.md) |
| قائمة الامتثال السعودي | [`compliance-checklist-ar.md`](docs/compliance-checklist-ar.md) |
| خطة الإطلاق | [`launch-plan-ar.md`](docs/launch-plan-ar.md) |
| قالب عرض المبيعات | [`sales-proposal-template-ar.md`](docs/sales-proposal-template-ar.md) |
| سيناريو العرض التوضيحي | [`demo-script-ar.md`](docs/demo-script-ar.md) |
| الافتراضات والمخاطر | [`assumptions-and-risks-ar.md`](docs/assumptions-and-risks-ar.md) |

---

## 🏗️ بنية الإنتاج المقترحة (المرحلة التالية)

النموذج الحالي أمامي فقط. البناء الإنتاجي الموصى به (موثّق في `docs/`):

- **Next.js 14 (App Router) + TypeScript** · **React** · **Tailwind CSS + shadcn/ui** (مُهيّأة لـ RTL)
- **PostgreSQL + Prisma ORM** · **Auth.js** مع **RBAC** داخلي · **Zod** للتحقق
- **Object Storage متوافق مع S3** + **Signed URLs** · **Queue/Background Jobs** (مجرّدة، Mock ثم BullMQ)
- **next-intl** (عربي أولًا) · **Recharts** · **Multi-Tenancy** بعزل صارم (`tenantId` + حذف ناعم + Audit)
- تكاملات عبر **Adapter Pattern** مع **Mock Providers** حتى تتوفر بيانات الاعتماد الرسمية.

راجع [`docs/database-design.md`](docs/database-design.md) و[`docs/security-and-privacy-ar.md`](docs/security-and-privacy-ar.md)
و[`docs/tiktok-integration-plan-ar.md`](docs/tiktok-integration-plan-ar.md).

---

## 🔒 مبادئ ملتزم بها
- **عربي أولًا / RTL كامل** — الكود والتعليقات بالإنجليزية، الواجهة بالعربية.
- **لا تكاملات وهمية** — لا يُدّعى نجاح نشر قبل تأكيد الواجهة الرسمية؛ لا Scraping مخالف؛ لا طلب كلمات مرور حسابات TikTok.
- **لا أسرار في الكود أو الواجهة** — راجع `.env.example`.
- **قوالب العقود والامتثال تشغيلية لا قانونية** — تحتاج مراجعة مختص مرخّص.
