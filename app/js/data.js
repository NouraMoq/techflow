/* ============================================================================
   Seed / demo data — Arabic, realistic, NOT attributed to real people.
   Prototype only: everything is in-memory. No backend, no secrets.
   ========================================================================== */
window.DB = (function () {
  const avatarColors = ['#4f46e5', '#06b6d4', '#7c3aed', '#be123c', '#15803d', '#b45309', '#0e7490'];
  const col = (i) => avatarColors[i % avatarColors.length];

  // Tenants (NovaMetrics = platform owner; agencies & creators = tenants)
  const tenants = [
    { id: 't-nova', name: 'نوفاميتريكس', type: 'platform' },
    { id: 't-agency', name: 'وكالة نجوم الخليج', type: 'agency' },
    { id: 't-solo', name: 'حساب فردي — ليان', type: 'creator' },
  ];

  // Current logged-in user identity (switchable in prototype)
  const roles = [
    { id: 'creator', label: 'المشهور / صانع المحتوى', scope: 'client' },
    { id: 'biz', label: 'مدير الأعمال', scope: 'client' },
    { id: 'content', label: 'مدير المحتوى', scope: 'client' },
    { id: 'writer', label: 'كاتب المحتوى', scope: 'client' },
    { id: 'editor', label: 'المونتير', scope: 'client' },
    { id: 'reviewer', label: 'المعتمد النهائي', scope: 'client' },
    { id: 'nova_admin', label: 'نوفاميتريكس — Super Admin', scope: 'admin' },
    { id: 'nova_am', label: 'نوفاميتريكس — مدير حساب', scope: 'admin' },
  ];

  const creators = [
    { id: 'c-layan', name: 'ليان القحطاني', handle: '@layan.creates', niche: 'أسلوب حياة وجمال', followers: '842K', tier: 'الاحتراف', plan: 'pro', account: 'وكالة نجوم الخليج', avatar: 'ل', color: col(0), growth: '+4.2%', posts: 61, engagement: '7.8%' },
    { id: 'c-turki', name: 'تركي المطيري', handle: '@turki.tech', niche: 'تقنية ومراجعات', followers: '1.3M', tier: 'النجم', plan: 'star', account: 'وكالة نجوم الخليج', avatar: 'ت', color: col(1), growth: '+2.1%', posts: 44, engagement: '6.2%' },
    { id: 'c-noura', name: 'نورة العتيبي', handle: '@noura.cooks', niche: 'طبخ ووصفات', followers: '520K', tier: 'الانطلاقة', plan: 'launch', account: 'حساب فردي', avatar: 'ن', color: col(2), growth: '+6.9%', posts: 38, engagement: '9.1%' },
    { id: 'c-saad', name: 'سعد الدوسري', handle: '@saad.fit', niche: 'لياقة وصحة', followers: '388K', tier: 'الاحتراف', plan: 'pro', account: 'وكالة نجوم الخليج', avatar: 'س', color: col(3), growth: '+3.4%', posts: 52, engagement: '8.3%' },
  ];

  const team = [
    { id: 'u1', name: 'ليان القحطاني', role: 'المشهور / صانع المحتوى', roleId: 'creator', avatar: 'ل', color: col(0), status: 'نشط', tasks: 3 },
    { id: 'u2', name: 'خالد الشمري', role: 'مدير المحتوى', roleId: 'content', avatar: 'خ', color: col(1), status: 'نشط', tasks: 9 },
    { id: 'u3', name: 'ريم الحربي', role: 'كاتبة المحتوى', roleId: 'writer', avatar: 'ر', color: col(2), status: 'نشط', tasks: 7 },
    { id: 'u4', name: 'ماجد العنزي', role: 'مصور', roleId: 'photographer', avatar: 'م', color: col(3), status: 'نشط', tasks: 4 },
    { id: 'u5', name: 'هند الزهراني', role: 'مونتيرة', roleId: 'editor', avatar: 'هـ', color: col(4), status: 'مشغول', tasks: 6 },
    { id: 'u6', name: 'عبدالله الغامدي', role: 'مدير الأعمال', roleId: 'biz', avatar: 'ع', color: col(5), status: 'نشط', tasks: 2 },
    { id: 'u7', name: 'سارة القرني', role: 'محللة بيانات', roleId: 'analyst', avatar: 'س', color: col(6), status: 'نشط', tasks: 3 },
  ];

  // Content Pillars
  const pillars = [
    { id: 'p1', name: 'تعليمي', pct: 30, color: '#4f46e5', desc: 'نصائح ومعلومات قيمة تبني الثقة', kpi: 'الحفظ والمشاركة', formats: 'شرح، قائمة، خطوات' },
    { id: 'p2', name: 'ترفيهي', pct: 25, color: '#06b6d4', desc: 'محتوى خفيف يرفع التفاعل والوصول', kpi: 'المشاهدات ونسبة الإكمال', formats: 'سكيت، تحدٍّ، ترند' },
    { id: 'p3', name: 'قصصي / يوميات', pct: 20, color: '#7c3aed', desc: 'قرب إنساني يبني الولاء', kpi: 'وقت المشاهدة', formats: 'فلوق، خلف الكواليس' },
    { id: 'p4', name: 'تجاري', pct: 15, color: '#b45309', desc: 'تعاونات وإعلانات مع إفصاح', kpi: 'التحويل والوصول', formats: 'مراجعة، دمج منتج' },
    { id: 'p5', name: 'تحويل وبيع', pct: 10, color: '#15803d', desc: 'دعوات لاتخاذ إجراء مباشر', kpi: 'النقرات', formats: 'CTA، عرض محدود' },
  ];

  const ideaStatuses = [
    { id: 'draft', label: 'مسودة', color: '#64748b' },
    { id: 'research', label: 'تحتاج بحثًا', color: '#b45309' },
    { id: 'proposed', label: 'مقترحة', color: '#06b6d4' },
    { id: 'approved', label: 'معتمدة', color: '#4f46e5' },
    { id: 'scripting', label: 'كتابة السيناريو', color: '#7c3aed' },
    { id: 'scheduled', label: 'مجدولة', color: '#0e7490' },
    { id: 'production', label: 'قيد الإنتاج', color: '#b45309' },
    { id: 'published', label: 'منشورة', color: '#15803d' },
  ];

  const ideas = [
    { id: 'i1', title: '٥ أخطاء شائعة في روتين العناية بالبشرة', pillar: 'p1', status: 'approved', priority: 'عالية', viral: 82, fit: 90, difficulty: 'متوسطة', owner: 'ريم الحربي', platform: 'TikTok', cta: 'احفظ الفيديو', tags: ['عناية', 'نصائح'], created: 'قبل يومين' },
    { id: 'i2', title: 'تجربتي مع منتج ترطيب لمدة أسبوع', pillar: 'p4', status: 'scripting', priority: 'عالية', viral: 71, fit: 84, difficulty: 'متوسطة', owner: 'خالد الشمري', platform: 'TikTok', cta: 'رابط في البايو', tags: ['إعلان', 'مراجعة'], created: 'قبل ٣ أيام' },
    { id: 'i3', title: 'رد على سؤال متابعة: كيف أبدأ صناعة المحتوى؟', pillar: 'p1', status: 'proposed', priority: 'متوسطة', viral: 64, fit: 88, difficulty: 'سهلة', owner: 'ريم الحربي', platform: 'TikTok', cta: 'تابعني للمزيد', tags: ['أسئلة'], created: 'اليوم' },
    { id: 'i4', title: 'ترند الانتقالات السريعة بإطلالتين', pillar: 'p2', status: 'production', priority: 'عالية', viral: 88, fit: 76, difficulty: 'متوسطة', owner: 'ماجد العنزي', platform: 'TikTok', cta: 'جرب الترند', tags: ['ترند', 'أزياء'], created: 'أمس' },
    { id: 'i5', title: 'يوم في حياتي كصانعة محتوى', pillar: 'p3', status: 'scheduled', priority: 'متوسطة', viral: 69, fit: 92, difficulty: 'سهلة', owner: 'ليان القحطاني', platform: 'TikTok', cta: 'شاركني رأيك', tags: ['يوميات'], created: 'قبل ٤ أيام' },
    { id: 'i6', title: 'كواليس تصوير حملة العلامة', pillar: 'p3', status: 'draft', priority: 'منخفضة', viral: 58, fit: 80, difficulty: 'سهلة', owner: 'خالد الشمري', platform: 'TikTok', cta: '—', tags: ['كواليس'], created: 'اليوم' },
    { id: 'i7', title: 'مقارنة سريعة بين ٣ منتجات', pillar: 'p1', status: 'research', priority: 'متوسطة', viral: 74, fit: 82, difficulty: 'مرتفعة', owner: 'سارة القرني', platform: 'TikTok', cta: 'أيهم تفضل؟', tags: ['مراجعة'], created: 'قبل يومين' },
    { id: 'i8', title: 'نصيحة سريعة قبل المناسبات', pillar: 'p2', status: 'published', priority: 'متوسطة', viral: 79, fit: 86, difficulty: 'سهلة', owner: 'ريم الحربي', platform: 'TikTok', cta: 'احفظها', tags: ['مناسبات'], created: 'الأسبوع الماضي' },
    { id: 'i9', title: 'سلسلة: أساسيات المكياج (٤ أجزاء)', pillar: 'p1', status: 'approved', priority: 'عالية', viral: 77, fit: 91, difficulty: 'مرتفعة', owner: 'خالد الشمري', platform: 'TikTok', cta: 'تابع السلسلة', tags: ['سلسلة', 'تعليمي'], created: 'قبل ٥ أيام' },
    { id: 'i10', title: 'تفاعل مع تعليقات الأسبوع', pillar: 'p2', status: 'proposed', priority: 'منخفضة', viral: 61, fit: 78, difficulty: 'سهلة', owner: 'ليان القحطاني', platform: 'TikTok', cta: 'علّق باقتراحك', tags: ['تفاعل'], created: 'اليوم' },
  ];

  const trends = [
    { id: 'tr1', name: 'انتقالات المرآة', type: 'تأثير بصري', sound: 'Aesthetic Beat', growth: 92, life: 'قصير (٧ أيام)', fit: 'مرتفعة', risk: 'منخفضة', decision: 'قيد الدراسة', expires: 'بعد ٥ أيام' },
    { id: 'tr2', name: 'تحدي "قبل وبعد"', type: 'تحدٍّ', sound: 'Glow Up Audio', growth: 78, life: 'متوسط (٢ أسبوع)', fit: 'مرتفعة', risk: 'منخفضة', decision: 'مستخدم', expires: 'بعد ١٠ أيام' },
    { id: 'tr3', name: 'صوت درامي للكشف', type: 'صوت', sound: 'Reveal Drop', growth: 64, life: 'قصير', fit: 'متوسطة', risk: 'متوسطة', decision: 'تجاهل', expires: 'بعد ٣ أيام' },
    { id: 'tr4', name: 'ترند الأسئلة السريعة', type: 'صيغة', sound: '—', growth: 55, life: 'طويل', fit: 'مرتفعة', risk: 'منخفضة', decision: 'قيد الدراسة', expires: 'بعد أسبوعين' },
  ];

  // Production workflow stages (default 18)
  const workflow = [
    'فكرة', 'بحث', 'كتابة السيناريو', 'مراجعة المحتوى', 'اعتماد صانع المحتوى',
    'تجهيز التصوير', 'تصوير', 'رفع المواد الخام', 'مونتاج أولي', 'مراجعة المونتاج',
    'تعديلات', 'اعتماد نهائي', 'تجهيز الوصف والهاشتاقات', 'جدولة', 'نشر',
    'إدخال النتائج', 'تحليل', 'إعادة استخدام المحتوى'
  ];

  const projects = [
    { id: 'pr1', title: 'سلسلة أساسيات المكياج — ج١', stage: 8, owner: 'هند الزهراني', due: '٢٠ يوليو', sla: 'ضمن الوقت', pillar: 'p1', status: 'production' },
    { id: 'pr2', title: 'ترند الانتقالات السريعة', stage: 6, owner: 'ماجد العنزي', due: '١٩ يوليو', sla: 'متأخر يوم', pillar: 'p2', status: 'production' },
    { id: 'pr3', title: 'تجربة منتج الترطيب (إعلان)', stage: 3, owner: 'ريم الحربي', due: '٢٢ يوليو', sla: 'ضمن الوقت', pillar: 'p4', status: 'scripting' },
    { id: 'pr4', title: 'يوم في حياتي', stage: 13, owner: 'ليان القحطاني', due: '١٨ يوليو', sla: 'ضمن الوقت', pillar: 'p3', status: 'scheduled' },
    { id: 'pr5', title: '٥ أخطاء في العناية', stage: 12, owner: 'خالد الشمري', due: '٢١ يوليو', sla: 'ضمن الوقت', pillar: 'p1', status: 'approved' },
  ];

  const tasks = [
    { id: 'tk1', title: 'كتابة سيناريو "تجربة الترطيب"', project: 'تجربة منتج الترطيب', owner: 'ريم الحربي', priority: 'عالية', status: 'قيد التنفيذ', due: 'اليوم', done: false },
    { id: 'tk2', title: 'مونتاج أولي — أساسيات المكياج ج١', project: 'سلسلة المكياج', owner: 'هند الزهراني', priority: 'عالية', status: 'قيد التنفيذ', due: 'غدًا', done: false },
    { id: 'tk3', title: 'تجهيز قائمة اللقطات — الانتقالات', project: 'ترند الانتقالات', owner: 'ماجد العنزي', priority: 'متوسطة', status: 'لم تبدأ', due: '١٩ يوليو', done: false },
    { id: 'tk4', title: 'اعتماد نهائي — يوم في حياتي', project: 'يوم في حياتي', owner: 'ليان القحطاني', priority: 'عالية', status: 'بانتظار المراجعة', due: 'اليوم', done: false },
    { id: 'tk5', title: 'إدخال روابط ونتائج آخر ٣ منشورات', project: 'تحليلات', owner: 'سارة القرني', priority: 'منخفضة', status: 'مكتملة', due: 'أمس', done: true },
    { id: 'tk6', title: 'تجهيز وصف وهاشتاقات — ٥ أخطاء', project: '٥ أخطاء في العناية', owner: 'خالد الشمري', priority: 'متوسطة', status: 'قيد التنفيذ', due: 'غدًا', done: false },
  ];

  const approvals = [
    { id: 'ap1', title: 'يوم في حياتي — النسخة النهائية', type: 'اعتماد نهائي', from: 'هند الزهراني', status: 'بانتظار الموافقة', version: 'v3', time: 'منذ ساعتين' },
    { id: 'ap2', title: 'تجربة الترطيب — السيناريو', type: 'مراجعة سيناريو', from: 'ريم الحربي', status: 'اعتماد مشروط', version: 'v2', time: 'أمس' },
    { id: 'ap3', title: 'أساسيات المكياج ج١ — مونتاج', type: 'مراجعة مونتاج', from: 'هند الزهراني', status: 'طلب تعديل', version: 'v1', time: 'منذ ٣ ساعات' },
    { id: 'ap4', title: '٥ أخطاء في العناية — النص', type: 'مراجعة محتوى', from: 'ريم الحربي', status: 'معتمد', version: 'v2', time: 'أمس' },
  ];

  const shoots = [
    { id: 'sh1', name: 'يوم تصوير أساسيات المكياج', date: '٢٠ يوليو ٢٠٢٦', time: '١٠:٠٠ ص', location: 'استوديو النور — الرياض', crew: 4, clips: 6, status: 'مؤكد', cost: '٣٬٢٠٠ ر.س' },
    { id: 'sh2', name: 'كواليس حملة العلامة', date: '٢٣ يوليو ٢٠٢٦', time: '٤:٠٠ م', location: 'موقع خارجي — حي حطين', crew: 5, clips: 4, status: 'قيد التجهيز', cost: '٤٬٥٠٠ ر.س' },
    { id: 'sh3', name: 'مقاطع سريعة أسبوعية', date: '٢٥ يوليو ٢٠٢٦', time: '١١:٠٠ ص', location: 'المنزل', crew: 2, clips: 8, status: 'مسودة', cost: '٨٠٠ ر.س' },
  ];

  const assets = [
    { id: 'as1', name: 'خام — أساسيات المكياج.mp4', type: 'فيديو خام', size: '2.4 GB', folder: 'المكياج', owner: 'ماجد العنزي', expiry: '—' },
    { id: 'as2', name: 'نسخة نهائية — يوم في حياتي.mp4', type: 'فيديو نهائي', size: '180 MB', folder: 'يوميات', owner: 'هند الزهراني', expiry: '—' },
    { id: 'as3', name: 'موسيقى مرخصة — Aesthetic.mp3', type: 'موسيقى', size: '4 MB', folder: 'أصوات', owner: 'النظام', expiry: 'ينتهي بعد ٩٠ يومًا' },
    { id: 'as4', name: 'شعار العلامة — PNG', type: 'هوية', size: '320 KB', folder: 'الهوية', owner: 'عبدالله الغامدي', expiry: '—' },
    { id: 'as5', name: 'صورة مصغرة — ٥ أخطاء.jpg', type: 'صورة مصغرة', size: '210 KB', folder: 'المكياج', owner: 'هند الزهراني', expiry: '—' },
    { id: 'as6', name: 'عقد تعاون — علامة الترطيب.pdf', type: 'عقد', size: '1.1 MB', folder: 'العقود', owner: 'عبدالله الغامدي', expiry: 'حقوق تنتهي بعد ٣٠ يومًا' },
  ];

  // Commercial CRM
  const opportunityStages = ['فرصة محتملة', 'تواصل أولي', 'استلام Brief', 'تسعير', 'تفاوض', 'عقد', 'إنتاج', 'منشور', 'فاتورة', 'محصّل'];
  const brands = [
    { id: 'b1', name: 'علامة الترطيب', sector: 'عناية وجمال', contact: 'أ. منيرة', stage: 'عقد', value: '٤٥٬٠٠٠ ر.س', deliverables: 3, exclusivity: 'حصرية ٦٠ يومًا', status: 'active' },
    { id: 'b2', name: 'تطبيق توصيل', sector: 'تقنية', contact: 'م. فيصل', stage: 'تفاوض', value: '٦٠٬٠٠٠ ر.س', deliverables: 4, exclusivity: 'غير حصري', status: 'negotiation' },
    { id: 'b3', name: 'مقهى محلي', sector: 'أغذية', contact: 'أ. لمياء', stage: 'استلام Brief', value: '١٢٬٠٠٠ ر.س', deliverables: 2, exclusivity: '—', status: 'brief' },
    { id: 'b4', name: 'علامة أزياء', sector: 'موضة', contact: 'أ. ريما', stage: 'فاتورة', value: '٣٨٬٠٠٠ ر.س', deliverables: 3, exclusivity: 'حصرية قطاع', status: 'invoice' },
  ];

  const contracts = [
    { id: 'ct1', brand: 'علامة الترطيب', type: 'تعاون إعلاني', value: '٤٥٬٠٠٠ ر.س', start: '١ يوليو', end: '٣١ أغسطس', exclusivity: 'حصرية ٦٠ يومًا', payment: 'مستحق جزئيًا', alerts: ['حقوق الاستخدام تنتهي بعد ٣٠ يومًا'] },
    { id: 'ct2', brand: 'علامة أزياء', type: 'حملة موسمية', value: '٣٨٬٠٠٠ ر.س', start: '١٥ يونيو', end: '١٥ يوليو', exclusivity: 'حصرية قطاع', payment: 'بانتظار الفاتورة', alerts: ['العقد ينتهي بعد ٣ أيام', 'فاتورة مستحقة'] },
  ];

  const invoices = [
    { id: 'inv1', brand: 'علامة أزياء', number: 'INV-2026-118', amount: '٣٨٬٠٠٠ ر.س', due: '٢٠ يوليو', status: 'متأخرة' },
    { id: 'inv2', brand: 'علامة الترطيب', number: 'INV-2026-121', amount: '٢٢٬٥٠٠ ر.س', due: '٣٠ يوليو', status: 'مستحقة' },
    { id: 'inv3', brand: 'مقهى محلي', number: 'INV-2026-109', amount: '١٢٬٠٠٠ ر.س', due: '١٠ يوليو', status: 'مدفوعة' },
  ];

  const compliance = [
    { q: 'هل المحتوى إعلاني؟', v: 'نعم', ok: true },
    { q: 'هل توجد منفعة مالية أو عينية؟', v: 'نعم — رعاية', ok: true },
    { q: 'هل أُضيف إفصاح إعلاني واضح؟', v: 'نعم — "بالتعاون مع"', ok: true },
    { q: 'هل الترخيص/المتطلب النظامي صالح عند الحاجة؟', v: 'قيد التحقق', ok: false },
    { q: 'هل الادعاءات قابلة للإثبات؟', v: 'نعم', ok: true },
    { q: 'هل الموسيقى والصور مرخصة؟', v: 'نعم', ok: true },
    { q: 'هل حُفظت موافقة العلامة التجارية؟', v: 'نعم — PDF', ok: true },
    { q: 'هل حُفظت النسخة النهائية المنشورة؟', v: 'بعد النشر', ok: false },
  ];

  const crisis = [
    { id: 'cr1', title: 'تعليق سلبي واسع حول إعلان', severity: 'متوسطة', source: 'تعليقات TikTok', status: 'قيد المعالجة', owner: 'عبدالله الغامدي', playbook: 'خطأ في إعلان' },
    { id: 'cr2', title: 'ادعاء استخدام محتوى دون إذن', severity: 'مرتفعة', source: 'رسالة مباشرة', status: 'بانتظار قرار', owner: 'مدير الأعمال', playbook: 'اتهام باستخدام محتوى' },
  ];

  const audienceQ = [
    { q: 'كيف أبدأ صناعة المحتوى بميزانية بسيطة؟', count: 34, tag: 'فرصة محتوى' },
    { q: 'ما المنتج الذي تنصحين به للبشرة الدهنية؟', count: 28, tag: 'إعلان محتمل' },
    { q: 'هل تقدمين ورش عمل؟', count: 12, tag: 'تصعيد' },
    { q: 'ما كاميرا التصوير المستخدمة؟', count: 41, tag: 'FAQ' },
  ];

  // Analytics
  const analytics = {
    kpis: [
      { label: 'المشاهدات (٣٠ يوم)', value: '4.8M', delta: '+18%', up: true },
      { label: 'معدل التفاعل', value: '7.8%', delta: '+0.9%', up: true },
      { label: 'متابعون جدد', value: '+34.2K', delta: '+12%', up: true },
      { label: 'نسبة إكمال الفيديو', value: '61%', delta: '-3%', up: false },
    ],
    monthly: [
      { m: 'فبراير', a: 40, b: 22 }, { m: 'مارس', a: 55, b: 30 }, { m: 'أبريل', a: 48, b: 26 },
      { m: 'مايو', a: 70, b: 38 }, { m: 'يونيو', a: 82, b: 44 }, { m: 'يوليو', a: 95, b: 52 },
    ],
    bestTimes: ['٨:٠٠ م', '٩:٣٠ م', '١:٠٠ م'],
    bestDays: ['الخميس', 'الجمعة', 'الأحد'],
    topPosts: [
      { title: 'ترند الانتقالات', views: '1.2M', eng: '9.4%', pillar: 'ترفيهي' },
      { title: '٥ أخطاء في العناية', views: '860K', eng: '8.1%', pillar: 'تعليمي' },
      { title: 'يوم في حياتي', views: '540K', eng: '7.2%', pillar: 'قصصي' },
    ],
  };

  const recommendations = [
    { id: 'rc1', text: 'قلّل مدة الفيديو التعليمي إلى أقل من ٤٥ ثانية — نسبة الإكمال أعلى بـ ٢٢٪ عند هذا الطول.', basis: 'تحليل ٦١ منشورًا', confidence: 'عالية', owner: 'مدير المحتوى', done: false },
    { id: 'rc2', text: 'حوّل "ترند الانتقالات" الناجح إلى سلسلة من ٣ أجزاء لاستثمار الزخم.', basis: 'أداء أعلى منشور', confidence: 'عالية', owner: 'كاتب المحتوى', done: false },
    { id: 'rc3', text: 'انشر الخميس ٨:٣٠ م — أفضل نافذة تفاعل خلال آخر ٣٠ يومًا.', basis: 'أفضل أوقات النشر', confidence: 'متوسطة', owner: 'مدير المحتوى', done: false },
    { id: 'rc4', text: 'زد نسبة المحتوى القصصي ٥٪ — الأعلى في وقت المشاهدة وبناء الولاء.', basis: 'توازن الأعمدة', confidence: 'متوسطة', owner: 'صانع المحتوى', done: true },
  ];

  const notifications = [
    { icon: 'check', color: 'amber', text: 'محتوى بانتظار موافقتك: "يوم في حياتي — v3"', time: 'منذ ساعتين' },
    { icon: 'clock', color: 'rose', text: 'مهمة متأخرة: مونتاج أساسيات المكياج ج١', time: 'منذ ٣ ساعات' },
    { icon: 'file', color: 'amber', text: 'حقوق استخدام محتوى "علامة الترطيب" تنتهي بعد ٣٠ يومًا', time: 'اليوم' },
    { icon: 'trend', color: 'accent', text: 'ترند مناسب على وشك الانتهاء: "انتقالات المرآة" — بعد ٥ أيام', time: 'اليوم' },
    { icon: 'money', color: 'rose', text: 'فاتورة متأخرة: INV-2026-118 بقيمة ٣٨٬٠٠٠ ر.س', time: 'أمس' },
  ];

  // NovaMetrics admin
  const clients = [
    { id: 'cl1', name: 'ليان القحطاني', plan: 'الاحتراف', mrr: '٢٬٤٩٠', am: 'أحمد العلي', onboarding: 'مكتمل', health: 'ممتاز', renewal: '١ سبتمبر', usage: 68 },
    { id: 'cl2', name: 'تركي المطيري', plan: 'النجم', mrr: '٧٬٥٠٠', am: 'أحمد العلي', onboarding: 'مكتمل', health: 'جيد', renewal: '١٥ أغسطس', usage: 82 },
    { id: 'cl3', name: 'نورة العتيبي', plan: 'الانطلاقة', mrr: '٩٩٠', am: '—', onboarding: 'قيد التهيئة', health: 'معرّض للإلغاء', renewal: '٢٠ يوليو', usage: 34 },
    { id: 'cl4', name: 'وكالة نجوم الخليج', plan: 'الوكالات', mrr: '٩٬٩٠٠', am: 'ريم السالم', onboarding: 'مكتمل', health: 'ممتاز', renewal: '١ أكتوبر', usage: 91 },
    { id: 'cl5', name: 'سعد الدوسري', plan: 'الاحتراف', mrr: '٢٬٤٩٠', am: 'ريم السالم', onboarding: 'مكتمل', health: 'جيد', renewal: '٥ سبتمبر', usage: 57 },
  ];

  const plans = [
    { id: 'launch', name: 'الانطلاقة', price: 990, annual: 9900, setup: 0, creators: 1, users: 3, social: 1, projects: 20, storage: '10 GB', analytics: 'أساسية', ai: 'محدود', support: 'إلكتروني', managed: false, tag: 'فردي', color: '#64748b' },
    { id: 'pro', name: 'الاحتراف', price: 2490, annual: 24900, setup: 1500, creators: 1, users: 8, social: 3, projects: 50, storage: '100 GB', analytics: 'متقدمة', ai: 'مرتفع', support: 'أولوية', managed: false, tag: 'فريق صغير', color: '#4f46e5' },
    { id: 'star', name: 'النجم', price: 7500, annual: 75000, setup: 3000, creators: 1, users: 10, social: 3, projects: 'متفق عليه', storage: '250 GB', analytics: 'متقدمة + تقارير', ai: 'مرتفع', support: 'مدير حساب', managed: true, tag: 'خدمة مُدارة', color: '#7c3aed' },
    { id: 'full', name: 'الإدارة المتكاملة', price: 15000, annual: 150000, setup: 7500, creators: '1+', users: '∞', social: 'الكل', projects: 'مخصص', storage: '1 TB', analytics: 'تنفيذية', ai: 'غير محدود', support: 'عالي الأولوية', managed: true, tag: 'مشاهير', color: '#be123c' },
    { id: 'agency', name: 'الوكالات', price: 9900, annual: 99000, setup: 5000, creators: 'متعدد', users: '∞', social: 'متعدد', projects: 'مخصص', storage: '2 TB', analytics: 'مجمعة', ai: 'مرتفع', support: 'مدير نجاح', managed: false, tag: 'وكالة', color: '#0e7490' },
  ];

  const addons = [
    { name: 'كتابة سيناريو إضافي', price: 'يبدأ من ٤٠٠ ر.س' },
    { name: 'تصوير يوم كامل', price: 'حسب عرض' },
    { name: 'مونتاج فيديو', price: 'يبدأ من ٣٥٠ ر.س' },
    { name: 'إدارة حملة إعلانية', price: 'حسب عرض' },
    { name: 'تقرير منافسين', price: '١٬٥٠٠ ر.س' },
    { name: 'إعداد Media Kit', price: '٢٬٠٠٠ ر.س' },
    { name: 'مساحة تخزين إضافية', price: 'يبدأ من ٥٠ ر.س/شهر' },
    { name: 'رصيد ذكاء اصطناعي إضافي', price: 'يبدأ من ١٠٠ ر.س' },
    { name: 'White Label', price: 'حسب عرض' },
    { name: 'ترحيل بيانات', price: 'حسب عرض' },
  ];

  const integrations = [
    { name: 'TikTok', status: 'يحتاج إعادة تصريح', color: 'amber', note: 'المرحلة الأولى: تجهيز يدوي' },
    { name: 'Instagram', status: 'غير متصل', color: 'slate', note: 'مخطط — المرحلة ٣' },
    { name: 'YouTube', status: 'غير متصل', color: 'slate', note: 'مخطط — المرحلة ٣' },
    { name: 'Google Drive', status: 'متصل', color: 'green', note: 'مزامنة الأصول' },
    { name: 'Google Calendar', status: 'متصل', color: 'green', note: 'مواعيد النشر' },
    { name: 'WhatsApp Business', status: 'غير متصل', color: 'slate', note: 'تكامل رسمي لاحقًا' },
    { name: 'بوابة الدفع', status: 'توجد مشكلة', color: 'rose', note: 'طبقة مزود مستقلة' },
    { name: 'التوقيع الإلكتروني', status: 'غير متصل', color: 'slate', note: 'مخطط' },
  ];

  // Onboarding wizard steps
  const onboardingSteps = [
    'نوع الحساب', 'معلومات صانع المحتوى', 'الهوية البصرية', 'الحسابات الاجتماعية',
    'مجال المحتوى', 'الجمهور المستهدف', 'الدول واللغات', 'الأهداف',
    'القيم والموضوعات', 'المرفوضات', 'نبرة الصوت', 'المنافسون',
    'الفريق والصلاحيات', 'العدد الشهري', 'أيام العمل', 'المستندات', 'الاستراتيجية الأولية'
  ];

  return {
    tenants, roles, creators, team, pillars, ideas, ideaStatuses, trends, workflow, projects,
    tasks, approvals, shoots, assets, opportunityStages, brands, contracts, invoices, compliance,
    crisis, audienceQ, analytics, recommendations, notifications, clients, plans, addons,
    integrations, onboardingSteps, col
  };
})();
