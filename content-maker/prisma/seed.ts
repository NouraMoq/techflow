// ============================================================================
// Seed — Arabic demo data (NOT attributed to real people). Idempotent-ish:
// run `npm run db:reset` to wipe & reseed. No secrets stored.
// ============================================================================
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PLANS = [
  { key: "launch", nameAr: "الانطلاقة", nameEn: "Launch", priceMonthly: 990, priceAnnual: 9900, setupFee: 0, managed: false,
    limits: { creators: 1, users: 3, social: 1, projects: 20, storageGb: 10, analytics: "أساسية", ai: "محدود", support: "إلكتروني" } },
  { key: "pro", nameAr: "الاحتراف", nameEn: "Pro", priceMonthly: 2490, priceAnnual: 24900, setupFee: 1500, managed: false,
    limits: { creators: 1, users: 8, social: 3, projects: 50, storageGb: 100, analytics: "متقدمة", ai: "مرتفع", support: "أولوية" } },
  { key: "star", nameAr: "النجم", nameEn: "Star", priceMonthly: 7500, priceAnnual: 75000, setupFee: 3000, managed: true,
    limits: { creators: 1, users: 10, social: 3, projects: "متفق عليه", storageGb: 250, analytics: "متقدمة + تقارير", ai: "مرتفع", support: "مدير حساب" } },
  { key: "full", nameAr: "الإدارة المتكاملة", nameEn: "Full Management", priceMonthly: 15000, priceAnnual: 150000, setupFee: 7500, managed: true,
    limits: { creators: "1+", users: "∞", social: "الكل", projects: "مخصص", storageGb: 1000, analytics: "تنفيذية", ai: "غير محدود", support: "عالي الأولوية" } },
  { key: "agency", nameAr: "الوكالات", nameEn: "Agency", priceMonthly: 9900, priceAnnual: 99000, setupFee: 5000, managed: false,
    limits: { creators: "متعدد", users: "∞", social: "متعدد", projects: "مخصص", storageGb: 2000, analytics: "مجمعة", ai: "مرتفع", support: "مدير نجاح" } },
];

const PILLARS = [
  { name: "تعليمي", targetPct: 30, color: "#4f46e5", kpi: "الحفظ والمشاركة" },
  { name: "ترفيهي", targetPct: 25, color: "#06b6d4", kpi: "المشاهدات ونسبة الإكمال" },
  { name: "قصصي / يوميات", targetPct: 20, color: "#7c3aed", kpi: "وقت المشاهدة" },
  { name: "تجاري", targetPct: 15, color: "#b45309", kpi: "التحويل والوصول" },
  { name: "تحويل وبيع", targetPct: 10, color: "#15803d", kpi: "النقرات" },
];

async function main() {
  console.log("Seeding…");
  // wipe (order matters due to FKs)
  await prisma.recommendation.deleteMany();
  await prisma.audienceListItem.deleteMany();
  await prisma.audienceQuestion.deleteMany();
  await prisma.editorialCalendarItem.deleteMany();
  await prisma.shot.deleteMany();
  await prisma.shootSession.deleteMany();
  await prisma.trend.deleteMany();
  await prisma.publishJob.deleteMany();
  await prisma.oAuthConnection.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.crisisCase.deleteMany();
  await prisma.responsePlaybook.deleteMany();
  await prisma.complianceReview.deleteMany();
  await prisma.complianceItem.deleteMany();
  await prisma.assetVersion.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.contractObligation.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.brandContact.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.task.deleteMany();
  await prisma.contentProject.deleteMany();
  await prisma.scriptVersion.deleteMany();
  await prisma.script.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.contentPillar.deleteMany();
  await prisma.strategyVersion.deleteMany();
  await prisma.creatorStrategy.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.creator.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Plans
  for (const p of PLANS) {
    await prisma.plan.create({
      data: {
        key: p.key, nameAr: p.nameAr, nameEn: p.nameEn, priceMonthly: p.priceMonthly,
        priceAnnual: p.priceAnnual, setupFee: p.setupFee, managed: p.managed,
        limitsJson: JSON.stringify(p.limits),
      },
    });
  }
  const proPlan = await prisma.plan.findUniqueOrThrow({ where: { key: "pro" } });

  // NovaMetrics platform tenant + admin
  const novaTenant = await prisma.tenant.create({ data: { name: "نوفاميتريكس", type: "platform" } });
  const pass = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.create({
    data: { email: "admin@novametrics.sa", name: "أحمد العلي", passwordHash: pass },
  });
  await prisma.membership.create({
    data: { tenantId: novaTenant.id, userId: admin.id, role: "nova_admin", scope: "admin" },
  });

  // Client tenant (a creator account)
  const tenant = await prisma.tenant.create({ data: { name: "حساب ليان القحطاني", type: "creator" } });
  const org = await prisma.organization.create({ data: { tenantId: tenant.id, name: "فريق ليان" } });
  await prisma.subscription.create({
    data: { tenantId: tenant.id, planId: proPlan.id, status: "active",
      renewsAt: new Date("2026-09-01") },
  });

  // Users + memberships (client team)
  const team = [
    { email: "creator@example.sa", name: "ليان القحطاني", role: "creator" },
    { email: "content@example.sa", name: "خالد الشمري", role: "content" },
    { email: "writer@example.sa", name: "ريم الحربي", role: "writer" },
    { email: "editor@example.sa", name: "هند الزهراني", role: "editor" },
    { email: "reviewer@example.sa", name: "عبدالله الغامدي", role: "reviewer" },
  ];
  const users: Record<string, string> = {};
  for (const t of team) {
    const u = await prisma.user.create({ data: { email: t.email, name: t.name, passwordHash: pass } });
    await prisma.membership.create({ data: { tenantId: tenant.id, userId: u.id, role: t.role, scope: "client" } });
    users[t.role] = u.id;
  }

  // A SECOND isolated client tenant — proves tenant isolation in the app.
  const tenant2 = await prisma.tenant.create({ data: { name: "حساب نورة العتيبي", type: "creator" } });
  const u2 = await prisma.user.create({ data: { email: "noura@example.sa", name: "نورة العتيبي", passwordHash: pass } });
  await prisma.membership.create({ data: { tenantId: tenant2.id, userId: u2.id, role: "creator", scope: "client" } });
  const creator2 = await prisma.creator.create({
    data: { tenantId: tenant2.id, name: "نورة العتيبي", handle: "@noura.cooks", niche: "طبخ ووصفات", planKey: "launch" },
  });
  await prisma.idea.create({
    data: { tenantId: tenant2.id, creatorId: creator2.id, title: "وصفة سريعة في ٦٠ ثانية",
      status: "approved", priority: "high", viralScore: 74, fitScore: 88, tagsJson: JSON.stringify(["طبخ"]) },
  });

  // Creator (client tenant 1)
  const creator = await prisma.creator.create({
    data: {
      tenantId: tenant.id, organizationId: org.id, name: "ليان القحطاني", handle: "@layan.creates",
      niche: "أسلوب حياة وجمال", bio: "صانعة محتوى في أسلوب الحياة والجمال.", toneOfVoice: "ودّية عملية راقية",
      planKey: "pro",
    },
  });
  await prisma.socialAccount.create({
    data: { tenantId: tenant.id, creatorId: creator.id, platform: "tiktok", handle: "@layan.creates",
      url: "https://tiktok.com/@layan.creates", status: "needs_reauth" },
  });

  // Strategy + version
  const strategy = await prisma.creatorStrategy.create({
    data: {
      tenantId: tenant.id, creatorId: creator.id,
      vision: "أن أكون المرجع الأول في محتوى الجمال العملي للمرأة الخليجية.",
      mission: "أبسّط روتين العناية والجمال بتجارب صادقة قابلة للتطبيق يوميًا.",
      promise: "محتوى صادق، مجرَّب، وخالٍ من المبالغة.",
      personaJson: JSON.stringify({
        swot: { strengths: ["ثقة الجمهور", "اتساق النشر"], weaknesses: ["اعتماد على منصة واحدة"],
          opportunities: ["نمو سوق الجمال"], threats: ["تغيّر الخوارزمية"] },
        goals: { m3: "الوصول إلى 1M متابع", m6: "3 تعاونات تجارية", m12: "إطلاق خدمة تعليمية" },
      }),
    },
  });
  await prisma.strategyVersion.create({
    data: { strategyId: strategy.id, version: 4, status: "approved",
      snapshotJson: JSON.stringify({ note: "النسخة المعتمدة" }) },
  });

  // Pillars
  const pillarIds: string[] = [];
  for (const p of PILLARS) {
    const created = await prisma.contentPillar.create({
      data: { tenantId: tenant.id, creatorId: creator.id, name: p.name, targetPct: p.targetPct, color: p.color, kpi: p.kpi },
    });
    pillarIds.push(created.id);
  }

  // Ideas
  const ideas = [
    { title: "٥ أخطاء شائعة في روتين العناية بالبشرة", pillar: 0, status: "approved", priority: "high", viral: 82, fit: 90, owner: "writer", tags: ["عناية", "نصائح"] },
    { title: "تجربتي مع منتج ترطيب لمدة أسبوع", pillar: 3, status: "scripting", priority: "high", viral: 71, fit: 84, owner: "content", tags: ["إعلان", "مراجعة"] },
    { title: "رد على سؤال متابعة: كيف أبدأ صناعة المحتوى؟", pillar: 0, status: "proposed", priority: "medium", viral: 64, fit: 88, owner: "writer", tags: ["أسئلة"] },
    { title: "ترند الانتقالات السريعة بإطلالتين", pillar: 1, status: "production", priority: "high", viral: 88, fit: 76, owner: "content", tags: ["ترند", "أزياء"] },
    { title: "يوم في حياتي كصانعة محتوى", pillar: 2, status: "scheduled", priority: "medium", viral: 69, fit: 92, owner: "creator", tags: ["يوميات"] },
    { title: "كواليس تصوير حملة العلامة", pillar: 2, status: "draft", priority: "low", viral: 58, fit: 80, owner: "content", tags: ["كواليس"] },
    { title: "مقارنة سريعة بين ٣ منتجات", pillar: 0, status: "research", priority: "medium", viral: 74, fit: 82, owner: "writer", tags: ["مراجعة"] },
    { title: "سلسلة: أساسيات المكياج (٤ أجزاء)", pillar: 0, status: "approved", priority: "high", viral: 77, fit: 91, owner: "content", tags: ["سلسلة", "تعليمي"] },
  ];
  for (const i of ideas) {
    await prisma.idea.create({
      data: {
        tenantId: tenant.id, creatorId: creator.id, pillarId: pillarIds[i.pillar], title: i.title,
        status: i.status, priority: i.priority, viralScore: i.viral, fitScore: i.fit,
        ownerId: users[i.owner], createdBy: users["content"], tagsJson: JSON.stringify(i.tags),
      },
    });
  }

  // Projects
  const projects = [
    { title: "سلسلة أساسيات المكياج — ج١", stage: 8, owner: "هند الزهراني", status: "production", due: "2026-07-20" },
    { title: "ترند الانتقالات السريعة", stage: 6, owner: "ماجد العنزي", status: "production", due: "2026-07-19" },
    { title: "تجربة منتج الترطيب (إعلان)", stage: 3, owner: "ريم الحربي", status: "scripting", due: "2026-07-22" },
    { title: "يوم في حياتي", stage: 13, owner: "ليان القحطاني", status: "scheduled", due: "2026-07-18" },
    { title: "٥ أخطاء في العناية", stage: 12, owner: "خالد الشمري", status: "approved", due: "2026-07-21" },
  ];
  for (const p of projects) {
    const proj = await prisma.contentProject.create({
      data: { tenantId: tenant.id, creatorId: creator.id, title: p.title, stageIndex: p.stage,
        status: p.status, ownerName: p.owner, dueDate: new Date(p.due) },
    });
    if (p.stage >= 10) {
      await prisma.approval.create({
        data: { tenantId: tenant.id, projectId: proj.id, title: p.title + " — النسخة النهائية",
          type: "final", status: "pending", version: "v3" },
      });
    }
  }

  // Tasks
  const tasks = [
    { title: "كتابة سيناريو تجربة الترطيب", owner: "ريم الحربي", priority: "high", status: "in_progress" },
    { title: "مونتاج أولي — أساسيات المكياج ج١", owner: "هند الزهراني", priority: "high", status: "in_progress" },
    { title: "تجهيز قائمة اللقطات — الانتقالات", owner: "ماجد العنزي", priority: "medium", status: "todo" },
    { title: "اعتماد نهائي — يوم في حياتي", owner: "ليان القحطاني", priority: "high", status: "review" },
    { title: "إدخال روابط ونتائج آخر ٣ منشورات", owner: "سارة القرني", priority: "low", status: "done" },
  ];
  for (const t of tasks) {
    await prisma.task.create({
      data: { tenantId: tenant.id, title: t.title, ownerName: t.owner, priority: t.priority,
        status: t.status, done: t.status === "done" },
    });
  }

  // ----------------------- Commercial: brands & pipeline ------------------
  const brandsData = [
    { name: "علامة الترطيب", sector: "عناية وجمال", contact: "أ. منيرة", stage: "contract", type: "sponsorship", offer: 50000, deal: 45000, exclusivity: "حصرية ٦٠ يومًا" },
    { name: "تطبيق توصيل", sector: "تقنية", contact: "م. فيصل", stage: "negotiation", type: "ugc", offer: 65000, deal: 60000, exclusivity: "غير حصري" },
    { name: "مقهى محلي", sector: "أغذية", contact: "أ. لمياء", stage: "brief", type: "sponsorship", offer: 12000, deal: 12000, exclusivity: "—" },
    { name: "علامة أزياء", sector: "موضة", contact: "أ. ريما", stage: "invoice", type: "seasonal", offer: 40000, deal: 38000, exclusivity: "حصرية قطاع" },
  ];
  const brandIds: Record<string, string> = {};
  for (const b of brandsData) {
    const brand = await prisma.brand.create({
      data: { tenantId: tenant.id, name: b.name, sector: b.sector, status: "active" },
    });
    brandIds[b.name] = brand.id;
    await prisma.brandContact.create({
      data: { brandId: brand.id, name: b.contact, role: "جهة الاتصال", email: "contact@example.sa" },
    });
    await prisma.opportunity.create({
      data: {
        tenantId: tenant.id, brandId: brand.id, title: `${b.type === "seasonal" ? "حملة موسمية" : "تعاون"} — ${b.name}`,
        stage: b.stage, type: b.type, offerValue: b.offer, dealValue: b.deal, source: "تواصل مباشر", createdBy: users["biz"],
      },
    });
  }

  // Campaign + deliverables (for the brand under contract)
  const campaign = await prisma.campaign.create({
    data: {
      tenantId: tenant.id, brandId: brandIds["علامة الترطيب"], name: "حملة إطلاق منتج الترطيب",
      status: "in_production", startDate: new Date("2026-07-01"), endDate: new Date("2026-08-31"),
    },
  });
  for (const d of [
    { title: "فيديو مراجعة المنتج", status: "in_progress", due: "2026-07-25" },
    { title: "فيديو خلف الكواليس", status: "todo", due: "2026-07-28" },
    { title: "ستوري تفاعلي", status: "delivered", due: "2026-07-20" },
  ]) {
    await prisma.deliverable.create({
      data: { campaignId: campaign.id, title: d.title, platform: "tiktok", status: d.status, dueDate: new Date(d.due) },
    });
  }

  // Contracts + obligations + invoices + payments
  const c1 = await prisma.contract.create({
    data: {
      tenantId: tenant.id, brandId: brandIds["علامة الترطيب"], type: "ad_collab", value: 45000,
      startDate: new Date("2026-07-01"), endDate: new Date("2026-08-31"),
      exclusivity: "حصرية ٦٠ يومًا", usageRights: "حق استخدام عضوي ٣٠ يومًا", paymentStatus: "partial",
    },
  });
  await prisma.contractObligation.createMany({
    data: [
      { contractId: c1.id, type: "usage_rights_end", title: "انتهاء حقوق استخدام المحتوى", dueDate: new Date("2026-08-17"), status: "open" },
      { contractId: c1.id, type: "post_duration", title: "بقاء المنشور مدة ٣٠ يومًا", dueDate: new Date("2026-08-01"), status: "open" },
      { contractId: c1.id, type: "delivery", title: "تسليم الفيديو النهائي", dueDate: new Date("2026-07-25"), status: "open" },
    ],
  });
  const c2 = await prisma.contract.create({
    data: {
      tenantId: tenant.id, brandId: brandIds["علامة أزياء"], type: "seasonal", value: 38000,
      startDate: new Date("2026-06-15"), endDate: new Date("2026-07-21"),
      exclusivity: "حصرية قطاع", usageRights: "٦٠ يومًا", paymentStatus: "overdue",
    },
  });
  await prisma.contractObligation.createMany({
    data: [
      { contractId: c2.id, type: "exclusivity_end", title: "انتهاء الحصرية", dueDate: new Date("2026-07-21"), status: "open" },
      { contractId: c2.id, type: "payment", title: "تحصيل الدفعة النهائية", dueDate: new Date("2026-07-20"), status: "overdue" },
    ],
  });

  const inv1 = await prisma.invoice.create({
    data: { tenantId: tenant.id, contractId: c2.id, number: "INV-2026-118", brandName: "علامة أزياء", amount: 38000, dueDate: new Date("2026-07-20"), status: "overdue" },
  });
  await prisma.invoice.create({
    data: { tenantId: tenant.id, contractId: c1.id, number: "INV-2026-121", brandName: "علامة الترطيب", amount: 22500, dueDate: new Date("2026-07-30"), status: "due" },
  });
  const inv3 = await prisma.invoice.create({
    data: { tenantId: tenant.id, number: "INV-2026-109", brandName: "مقهى محلي", amount: 12000, dueDate: new Date("2026-07-10"), status: "paid" },
  });
  await prisma.paymentRecord.create({ data: { invoiceId: inv3.id, amount: 12000, method: "تحويل بنكي" } });
  await prisma.paymentRecord.create({ data: { invoiceId: inv1.id, amount: 19000, method: "دفعة أولى" } });

  // ----------------------------- Assets -----------------------------------
  const assetsData = [
    { name: "خام — أساسيات المكياج.mp4", type: "raw_video", folder: "المكياج", size: "2.4 GB", owner: "ماجد العنزي", expiry: null, tags: ["مكياج"] },
    { name: "نسخة نهائية — يوم في حياتي.mp4", type: "final_video", folder: "يوميات", size: "180 MB", owner: "هند الزهراني", expiry: null, tags: ["يوميات"] },
    { name: "موسيقى مرخصة — Aesthetic.mp3", type: "music", folder: "أصوات", size: "4 MB", owner: "النظام", expiry: "2026-10-16", tags: ["مرخصة"] },
    { name: "شعار العلامة — PNG", type: "logo", folder: "الهوية", size: "320 KB", owner: "عبدالله الغامدي", expiry: null, tags: ["هوية"] },
    { name: "صورة مصغرة — ٥ أخطاء.jpg", type: "thumbnail", folder: "المكياج", size: "210 KB", owner: "هند الزهراني", expiry: null, tags: [] },
    { name: "عقد تعاون — علامة الترطيب.pdf", type: "contract", folder: "العقود", size: "1.1 MB", owner: "عبدالله الغامدي", expiry: "2026-08-17", tags: ["عقد"] },
  ];
  for (const a of assetsData) {
    const asset = await prisma.asset.create({
      data: {
        tenantId: tenant.id, name: a.name, type: a.type, folder: a.folder, sizeLabel: a.size,
        ownerName: a.owner, rightsExpiry: a.expiry ? new Date(a.expiry) : null,
        storageKey: `tenants/${tenant.id}/assets/${a.name}`, tagsJson: JSON.stringify(a.tags), createdBy: users["content"],
      },
    });
    await prisma.assetVersion.create({ data: { assetId: asset.id, version: 1, note: "النسخة الأولى" } });
  }

  // -------------------- Compliance checklist (platform-managed) -----------
  const complianceQuestions = [
    { q: "هل المحتوى إعلاني؟", c: "advertising" },
    { q: "هل توجد منفعة مالية أو عينية؟", c: "advertising" },
    { q: "هل أُضيف إفصاح إعلاني واضح؟", c: "disclosure" },
    { q: "هل الترخيص/المتطلب النظامي المرتبط بالحساب صالح عند الحاجة؟", c: "advertising" },
    { q: "هل المنتج أو الخدمة مسموح بالإعلان عنها؟", c: "product" },
    { q: "هل الادعاءات قابلة للإثبات؟", c: "advertising" },
    { q: "هل تمت مراجعة الأسعار والعروض؟", c: "pricing" },
    { q: "هل توجد حقوق ملكية فكرية؟", c: "rights" },
    { q: "هل الموسيقى والصور مرخصة؟", c: "rights" },
    { q: "هل حصلنا على موافقات الأشخاص الظاهرين؟", c: "privacy" },
    { q: "هل يحتوي المحتوى على بيانات شخصية؟", c: "privacy" },
    { q: "هل توجد فئات عمرية أو منتجات حساسة؟", c: "product" },
    { q: "هل تم حفظ نسخة من موافقة العلامة التجارية؟", c: "rights" },
    { q: "هل تم حفظ النسخة النهائية المنشورة؟", c: "rights" },
  ];
  const itemIds: string[] = [];
  for (let i = 0; i < complianceQuestions.length; i++) {
    const it = await prisma.complianceItem.create({
      data: { question: complianceQuestions[i].q, category: complianceQuestions[i].c, order: i, active: true },
    });
    itemIds.push(it.id);
  }

  // One demo review (partially complete → needs attention)
  const answers = complianceQuestions.map((cq, i) => {
    const answer = i === 3 || i === 13 ? "no" : "yes"; // two unresolved items
    return { question: cq.q, answer, ok: answer !== "no" };
  });
  await prisma.complianceReview.create({
    data: {
      tenantId: tenant.id, subject: "تجربة منتج الترطيب (إعلان)", status: "failed",
      answersJson: JSON.stringify(answers), reviewedBy: "عبدالله الغامدي",
      notes: "بانتظار تأكيد صلاحية المتطلب النظامي وحفظ النسخة المنشورة.", createdBy: users["reviewer"],
    },
  });

  // -------------------- Crisis playbooks (platform-managed) ---------------
  const playbooks = [
    { key: "wrong_info", title: "معلومة غير صحيحة", scenario: "انتشار معلومة خاطئة منسوبة لصانع المحتوى.", steps: ["توثيق المصدر", "صياغة تصحيح واضح", "اعتماد الرد", "النشر والمتابعة"] },
    { key: "ad_error", title: "خطأ في إعلان", scenario: "خطأ في محتوى إعلاني منشور (سعر/ادعاء/إفصاح).", steps: ["إيقاف الترويج", "تقييم الأثر", "تصحيح أو حذف", "إبلاغ العلامة"] },
    { key: "late_delivery", title: "تأخر تسليم", scenario: "تأخر تسليم متفق عليه لعلامة تجارية.", steps: ["إشعار العميل مبكرًا", "خطة تعويض", "تحديث الجدول"] },
    { key: "offensive_comment", title: "تعليق مسيء منتشر", scenario: "تعليق مسيء واسع الانتشار.", steps: ["عدم الجدال", "رد رسمي واحد", "تصعيد إذا لزم"] },
    { key: "misunderstanding", title: "سوء فهم", scenario: "سوء فهم لمحتوى أو تصريح.", steps: ["توضيح ودّي", "سياق إضافي"] },
    { key: "content_leak", title: "تسريب محتوى", scenario: "تسريب محتوى قبل موعد النشر.", steps: ["تقييم المصدر", "قرار النشر المبكر", "مراجعة الوصول"] },
    { key: "unauthorized_use", title: "استخدام محتوى دون إذن", scenario: "اتهام باستخدام محتوى دون إذن.", steps: ["مراجعة الحقوق", "رد قانوني بمراجعة مختص", "تسوية"] },
    { key: "brand_crisis", title: "أزمة علامة تجارية", scenario: "أزمة مرتبطة بعلامة متعاون معها.", steps: ["تقييم الارتباط", "بيان مسافة إن لزم", "تنسيق مع العلامة"] },
  ];
  const pbIds: Record<string, string> = {};
  for (const p of playbooks) {
    const pb = await prisma.responsePlaybook.create({
      data: {
        key: p.key, title: p.title, scenario: p.scenario, stepsJson: JSON.stringify(p.steps),
        approvedResponses: "رد رسمي محترم يوضح الحقيقة دون تصعيد.",
        forbiddenResponses: "الجدال العلني، السخرية، الوعود غير الموثقة.", active: true,
      },
    });
    pbIds[p.key] = pb.id;
  }

  // Demo crisis cases
  await prisma.crisisCase.create({
    data: {
      tenantId: tenant.id, title: "تعليق سلبي واسع حول إعلان", severity: "medium",
      source: "تعليقات TikTok", parties: "متابعون + علامة الترطيب",
      keyMessages: "نشكر الملاحظات، وسنراجع الملاحظة بجدية.", suggestedResponse: "رد رسمي واحد يوضح السياق.",
      forbiddenResponse: "الرد على كل تعليق أو الدخول في جدال.", responderName: "عبدالله الغامدي",
      approvalStatus: "pending", status: "in_progress", channel: "TikTok", playbookId: pbIds["ad_error"], createdBy: users["biz"],
    },
  });
  await prisma.crisisCase.create({
    data: {
      tenantId: tenant.id, title: "ادعاء استخدام محتوى دون إذن", severity: "high",
      source: "رسالة مباشرة", parties: "طرف خارجي",
      keyMessages: "نأخذ حقوق الملكية بجدية، وقيد المراجعة.", suggestedResponse: "رد مقتضب + مراجعة قانونية.",
      forbiddenResponse: "الاعتراف أو النفي قبل المراجعة القانونية.", responderName: "مدير الأعمال",
      approvalStatus: "draft", status: "open", channel: "خاص", playbookId: pbIds["unauthorized_use"], createdBy: users["biz"],
    },
  });

  // -------------------- Integration (mock) + a ready publish job ----------
  const integration = await prisma.integration.create({
    data: {
      tenantId: tenant.id, provider: "tiktok", status: "needs_reauth", mode: "mock",
      note: "اتصال تجريبي (Mock) — أعد التصريح لتفعيله. لا حساب حقيقي.",
    },
  });
  await prisma.oAuthConnection.create({
    data: {
      integrationId: integration.id, accountRef: "@layan.creates (تجريبي)",
      scopesJson: JSON.stringify(["video.publish", "video.list", "user.info.basic"]),
      tokenRef: "secret://vault/tiktok/" + tenant.id, // reference only — never a raw token
      expiresAt: new Date("2026-09-16"),
    },
  });
  const readyProject = await prisma.contentProject.findFirst({ where: { tenantId: tenant.id, stageIndex: { gte: 12 } } });
  await prisma.publishJob.create({
    data: {
      tenantId: tenant.id, projectId: readyProject?.id ?? null, platform: "tiktok",
      caption: "٥ أخطاء شائعة في العناية بالبشرة — احفظوا الفيديو! #عناية #بشرة",
      status: "ready", mode: "mock", createdBy: users["content"],
    },
  });

  // --------------------------- Shoot sessions -----------------------------
  const shoot1 = await prisma.shootSession.create({
    data: {
      tenantId: tenant.id, name: "يوم تصوير أساسيات المكياج", date: new Date("2026-07-20T10:00:00"),
      location: "استوديو النور — الرياض", crewJson: JSON.stringify(["ماجد العنزي", "هند الزهراني", "ليان القحطاني", "مساعد إضاءة"]),
      status: "confirmed", cost: 3200, notes: "إضاءة ناعمة + خلفية بيضاء.", createdBy: users["content"],
    },
  });
  const shots1 = [
    { title: "مقدمة السلسلة", scenario: "ترحيب + عرض المنتجات", wardrobe: "كاجوال فاتح", status: "shot" },
    { title: "خطوة الأساس", scenario: "تطبيق كريم الأساس خطوة بخطوة", wardrobe: "كاجوال فاتح", status: "shot" },
    { title: "خطوة العيون", scenario: "ظلال + آيلاينر", wardrobe: "كاجوال فاتح", status: "todo" },
    { title: "اللمسة النهائية", scenario: "أحمر شفاه + مثبت", wardrobe: "كاجوال فاتح", status: "todo" },
    { title: "النتيجة والدعوة", scenario: "قبل/بعد + CTA", wardrobe: "كاجوال فاتح", status: "todo" },
  ];
  for (let i = 0; i < shots1.length; i++) {
    await prisma.shot.create({ data: { sessionId: shoot1.id, order: i, ...shots1[i] } });
  }

  const shoot2 = await prisma.shootSession.create({
    data: {
      tenantId: tenant.id, name: "كواليس حملة العلامة", date: new Date("2026-07-23T16:00:00"),
      location: "موقع خارجي — حي حطين", crewJson: JSON.stringify(["ماجد العنزي", "هند الزهراني", "منسق إنتاج"]),
      status: "planned", cost: 4500, notes: "تصوير خلال الساعة الذهبية.", createdBy: users["content"],
    },
  });
  for (let i = 0; i < 4; i++) {
    await prisma.shot.create({ data: { sessionId: shoot2.id, order: i, title: `مقطع كواليس ${i + 1}`, status: "todo" } });
  }

  await prisma.shootSession.create({
    data: {
      tenantId: tenant.id, name: "مقاطع سريعة أسبوعية", date: new Date("2026-07-25T11:00:00"),
      location: "المنزل", crewJson: JSON.stringify(["ليان القحطاني", "مساعد"]),
      status: "draft", cost: 800, createdBy: users["creator"],
    },
  });

  // ------------------------------ Trends ----------------------------------
  const trends = [
    { name: "انتقالات المرآة", type: "effect", sound: "Aesthetic Beat", hashtag: "#mirror_transition", growth: 92, life: "قصير (٧ أيام)", fit: "high", risk: "low", angle: "انتقال بين إطلالتي نهار/مساء", decision: "studying", exp: "2026-07-24" },
    { name: 'تحدي "قبل وبعد"', type: "challenge", sound: "Glow Up Audio", hashtag: "#glow_up", growth: 78, life: "متوسط (أسبوعان)", fit: "high", risk: "low", angle: "روتين العناية قبل/بعد أسبوع", decision: "use", exp: "2026-07-30" },
    { name: "صوت درامي للكشف", type: "sound", sound: "Reveal Drop", hashtag: "#reveal", growth: 64, life: "قصير", fit: "medium", risk: "medium", angle: "كشف نتيجة منتج", decision: "ignore", exp: "2026-07-22" },
    { name: "ترند الأسئلة السريعة", type: "format", sound: "—", hashtag: "#quick_qa", growth: 55, life: "طويل", fit: "high", risk: "low", angle: "أكثر ٥ أسئلة من المتابعين", decision: "studying", exp: "2026-08-05" },
  ];
  for (const t of trends) {
    await prisma.trend.create({
      data: {
        tenantId: tenant.id, name: t.name, type: t.type, sound: t.sound, hashtag: t.hashtag,
        growthScore: t.growth, expectedLife: t.life, fit: t.fit, risk: t.risk, angle: t.angle,
        decision: t.decision, expiresAt: new Date(t.exp), createdBy: users["writer"],
      },
    });
  }

  // ----------------------------- Scripts ----------------------------------
  const scriptIdea = await prisma.idea.findFirst({ where: { tenantId: tenant.id, title: { contains: "الترطيب" } } });
  const script1 = await prisma.script.create({
    data: {
      tenantId: tenant.id, ideaId: scriptIdea?.id ?? null,
      title: "تجربة منتج الترطيب — سيناريو", status: "review", version: 2,
      hook: "جربت منتج الترطيب اللي كلكم تسألون عنه... والنتيجة صدمتني!",
      intro: "اليوم بشاركم تجربتي الحقيقية بعد أسبوع كامل من الاستخدام اليومي، بكل صدق.",
      body: "• الملمس والامتصاص\n• الرائحة\n• النتيجة بعد ٣ أيام\n• هل يستحق السعر؟",
      cta: "لو جربتوه قبل، قولولي رأيكم بالتعليقات — والرابط في البايو.",
      onScreenText: "تجربة أسبوع كامل ✨",
      description: "تجربتي الصادقة مع منتج الترطيب بعد أسبوع. #عناية #بشرة #ترطيب",
      hashtagsJson: JSON.stringify(["عناية", "بشرة", "ترطيب", "روتيني"]),
      music: "هادئة — مرخصة", wardrobe: "كاجوال فاتح", location: "المنزل — إضاءة طبيعية",
      totalDuration: "٣٨ ثانية", disclosure: true,
      notes: "إظهار الإفصاح الإعلاني واضحًا على الشاشة وفي الوصف.",
      createdBy: users["writer"], updatedBy: users["content"],
    },
  });
  await prisma.scriptVersion.create({ data: { scriptId: script1.id, version: 1, contentJson: JSON.stringify({ note: "المسودة الأولى" }) } });
  await prisma.scriptVersion.create({ data: { scriptId: script1.id, version: 2, contentJson: JSON.stringify({ note: "بعد ملاحظات مدير المحتوى" }) } });

  const seriesIdea = await prisma.idea.findFirst({ where: { tenantId: tenant.id, title: { contains: "المكياج" } } });
  await prisma.script.create({
    data: {
      tenantId: tenant.id, ideaId: seriesIdea?.id ?? null, title: "أساسيات المكياج ج١ — سيناريو",
      status: "approved", version: 3, hook: "أول خطوة يغلط فيها الكل في المكياج!",
      cta: "تابعوا السلسلة كاملة", totalDuration: "٤٥ ثانية", createdBy: users["content"],
    },
  });

  // ------------------------ Editorial calendar ----------------------------
  // Manual items + "no-publish" days. Derived events (shoots/publish/deliverables)
  // are aggregated by the calendar VIEW from their own tables.
  const y = 2026, m = 7; // July 2026 (matches seed data window)
  const calItems = [
    { d: 3, type: "publish", title: "نشر: ٥ أخطاء في العناية" },
    { d: 8, type: "approval", title: "اعتماد: يوم في حياتي" },
    { d: 12, type: "campaign", title: "انطلاق حملة الترطيب" },
    { d: 15, type: "event", title: "مناسبة موسمية" },
    { d: 18, type: "publish", title: "نشر أسبوعي" },
    { d: 26, type: "event", title: "مراجعة شهرية للأداء" },
    { d: 5, type: "no_publish", title: "يوم عدم نشر" },
    { d: 19, type: "no_publish", title: "يوم عدم نشر" },
  ];
  for (const c of calItems) {
    await prisma.editorialCalendarItem.create({
      data: { tenantId: tenant.id, title: c.title, type: c.type, date: new Date(Date.UTC(y, m - 1, c.d, 9)), createdBy: users["content"] },
    });
  }

  // ----------------------- Audience & questions ---------------------------
  const questions = [
    { text: "كيف أبدأ صناعة المحتوى بميزانية بسيطة؟", count: 34, category: "content_opportunity", status: "new" },
    { text: "ما المنتج الذي تنصحين به للبشرة الدهنية؟", count: 28, category: "potential_ad", status: "new" },
    { text: "هل تقدمين ورش عمل؟", count: 12, category: "escalation", status: "new" },
    { text: "ما كاميرا التصوير المستخدمة؟", count: 41, category: "faq", status: "answered", source: "تعليقات" },
    { text: "متى موعد الحلقة القادمة من السلسلة؟", count: 19, category: "faq", status: "new" },
  ];
  for (const q of questions) {
    await prisma.audienceQuestion.create({
      data: { tenantId: tenant.id, text: q.text, count: q.count, category: q.category, status: q.status, source: q.source ?? "إدخال يدوي", createdBy: users["content"] },
    });
  }
  for (const r of ["شكرًا لسؤالك 🌸", "الرابط في البايو", "قريبًا إن شاء الله"]) {
    await prisma.audienceListItem.create({ data: { tenantId: tenant.id, kind: "response", text: r, createdBy: users["content"] } });
  }
  for (const w of ["شكوى", "استرجاع", "قانوني"]) {
    await prisma.audienceListItem.create({ data: { tenantId: tenant.id, kind: "sensitive", text: w, createdBy: users["content"] } });
  }

  console.log("Seed complete ✓");
  console.log("Login: creator@example.sa / password123  (client)");
  console.log("Login: admin@novametrics.sa / password123  (NovaMetrics admin)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
