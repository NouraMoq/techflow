/* ============================================================================
   Views — one renderer per module. Pure functions returning HTML strings.
   Data comes from window.DB; helpers from window.UI.
   ========================================================================== */
window.VIEWS = (function () {
  const { icon, av, toast, modal, stat, meter, badgeFor } = UI;
  const D = DB;

  const head = (title, sub, actions) => `
    <div class="page-head">
      <div class="ph-txt"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>
      ${actions ? `<div class="ph-actions">${actions}</div>` : ''}
    </div>`;
  const btn = (label, ic, cls) => `<button class="btn ${cls || 'btn-ghost'}">${ic ? icon(ic) : ''}${label}</button>`;
  const card = (inner, cls) => `<div class="card ${cls || ''}">${inner}</div>`;
  const cardHead = (t, sub, actions) => `<div class="card-head"><div><h3>${t}</h3>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${actions ? `<div class="hactions">${actions}</div>` : ''}</div>`;
  const pillarName = (id) => (D.pillars.find(p => p.id === id) || {}).name || '—';
  const pillarColor = (id) => (D.pillars.find(p => p.id === id) || {}).color || 'var(--slate)';

  /* ------------------------------- DASHBOARD ------------------------------ */
  function dashboard() {
    const stats = [
      { icon: 'bulb', tint: 'var(--primary-soft)', ink: 'var(--primary-ink)', value: '10', label: 'أفكار نشطة', delta: '+3', up: true },
      { icon: 'workflow', tint: 'var(--accent-tint)', ink: '#0e7490', value: '5', label: 'مشاريع قيد الإنتاج', delta: '+1', up: true },
      { icon: 'check', tint: 'var(--amber-tint)', ink: 'var(--amber)', value: '4', label: 'بانتظار الموافقة', delta: '2 متأخرة', up: false },
      { icon: 'chart', tint: 'var(--green-tint)', ink: 'var(--green)', value: '4.8M', label: 'مشاهدات (٣٠ يوم)', delta: '+18%', up: true },
    ];
    const upcoming = D.projects.slice(0, 4).map(p => `
      <div class="tl-item ${p.sla.includes('متأخر') ? '' : 'muted'}">
        <b>${p.title}</b>
        <div class="tm">${D.workflow[p.stage]} · ${p.owner} · استحقاق ${p.due} · <span style="color:${p.sla.includes('متأخر') ? 'var(--rose)' : 'var(--green)'}">${p.sla}</span></div>
      </div>`).join('');
    const notifs = D.notifications.map(n => `
      <div class="row" style="padding:9px 0;border-bottom:1px solid var(--border);align-items:flex-start">
        <span class="st-ico" style="width:30px;height:30px;background:var(--${n.color}-tint);color:var(--${n.color === 'accent' ? 'accent' : n.color});flex-shrink:0">${icon(n.icon)}</span>
        <div style="min-width:0"><div style="font-size:12.8px;font-weight:600">${n.text}</div><div class="faint" style="font-size:11px">${n.time}</div></div>
      </div>`).join('');
    return head('مرحبًا، ليان 👋', 'لوحة اليوم — نظرة سريعة على المحتوى والإنتاج والأداء.',
      btn('فكرة جديدة', 'plus', 'btn-primary') + btn('تقرير الأسبوع', 'doc'))
      + `<div class="grid g-4 mb">${stats.map(stat).join('')}</div>`
      + `<div class="grid g-12">
          <div>
            ${card(cardHead('الإنتاج القادم', 'أقرب المشاريع في خط الإنتاج', btn('الكل', '', 'btn-sm btn-ghost')) + `<div class="card-pad"><div class="timeline">${upcoming}</div></div>`)}
            <div class="mt">${card(cardHead('توازن أعمدة المحتوى', 'التوزيع الفعلي مقابل المستهدف') + `<div class="card-pad">${pillarsBars()}</div>`)}</div>
          </div>
          <div>
            ${card(cardHead('التنبيهات', 'ما يحتاج انتباهك') + `<div class="card-pad" style="padding-top:4px">${notifs}</div>`)}
            <div class="mt">${card(`<div class="card-pad"><div class="callout info">${icon('sparkles')}<div><b>توصية ذكية</b><p>قلّل مدة الفيديو التعليمي إلى أقل من ٤٥ ثانية — نسبة الإكمال أعلى بـ ٢٢٪.</p></div></div></div>`)}</div>
          </div>
        </div>`;
  }

  function pillarsBars() {
    return D.pillars.map(p => `
      <div class="mb" style="margin-bottom:11px">
        <div class="row between" style="margin-bottom:5px"><b style="font-size:13px">${p.name}</b><span class="tnum faint" style="font-size:12px">${p.pct}%</span></div>
        <div class="bar"><i style="width:${p.pct * 2.5}%;background:${p.color}"></i></div>
      </div>`).join('');
  }

  /* ------------------------------ ONBOARDING ------------------------------ */
  let wzStep = 0;
  function onboarding() {
    const steps = D.onboardingSteps;
    const stepsHTML = steps.map((s, i) => `
      <div class="wz-step ${i < wzStep ? 'done' : ''} ${i === wzStep ? 'active' : ''}" data-wz="${i}">
        <span class="n">${i < wzStep ? '✓' : i + 1}</span><span>${s}</span>
      </div>`).join('');
    return head('الإعداد الأولي', 'رحلة تهيئة العميل — ' + steps.length + ' خطوات، مع الحفظ والعودة لاحقًا.',
      btn('حفظ ومتابعة لاحقًا', 'check'))
      + `<div class="card card-pad mb"><div class="row between wrap"><b>التقدم: خطوة ${wzStep + 1} من ${steps.length}</b><span class="faint">${Math.round((wzStep / (steps.length - 1)) * 100)}%</span></div><div class="bar mt-s"><i style="width:${(wzStep / (steps.length - 1)) * 100}%"></i></div></div>`
      + `<div class="wizard">
          <div class="wz-steps card card-pad">${stepsHTML}</div>
          <div class="card card-pad">${onboardingStepBody(wzStep)}
            <div class="divider"></div>
            <div class="row between">
              <button class="btn btn-ghost" data-wz-prev ${wzStep === 0 ? 'disabled style="opacity:.5"' : ''}>السابق</button>
              <button class="btn btn-primary" data-wz-next>${wzStep === steps.length - 1 ? 'إنشاء الاستراتيجية' : 'التالي'}</button>
            </div>
          </div>
        </div>`;
  }
  function onboardingStepBody(i) {
    const bodies = [
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:6px">اختر نوع الحساب</h3><p class="muted mb">يحدد نوع الحساب طريقة تنظيم الفريق والصلاحيات.</p>
       <div class="grid g-3">
         ${['فرد', 'فريق', 'وكالة'].map((t, k) => `<label class="card card-pad" style="cursor:pointer;text-align:center;${k === 1 ? 'border-color:var(--primary);box-shadow:0 0 0 2px var(--primary-soft)' : ''}">
           <div class="st-ico" style="margin:0 auto 10px;background:var(--primary-soft);color:var(--primary-ink)">${icon(k === 2 ? 'building' : 'users')}</div><b>${t}</b></label>`).join('')}
       </div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">معلومات صانع المحتوى</h3>
       <div class="grid g-2"><div class="field"><label>الاسم الظاهر</label><input class="inp" value="ليان القحطاني"></div>
       <div class="field"><label>اسم المستخدم / الهاندل</label><input class="inp" value="@layan.creates"></div></div>
       <div class="field"><label>نبذة</label><textarea class="ta">صانعة محتوى في أسلوب الحياة والجمال، أشارك تجارب عملية ونصائح يومية.</textarea></div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">الهوية البصرية</h3>
       <div class="callout info mb">${icon('eye')}<div><b>ارفع صورة الملف وألوان الهوية</b><p>ستُستخدم في البوابة والتقارير والقوالب.</p></div></div>
       <div class="row wrap"><div class="avatar" style="width:64px;height:64px;border-radius:18px;font-size:24px">ل</div>
       <div class="chips">${['#4f46e5', '#06b6d4', '#7c3aed', '#be123c'].map(c => `<span class="chip on" style="background:${c};color:#fff;border:none">${c}</span>`).join('')}</div></div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">الحسابات الاجتماعية</h3>
       <div class="field"><label>TikTok</label><input class="inp" value="tiktok.com/@layan.creates"></div>
       <div class="callout warn mt">${icon('alert')}<div><b>الربط الرسمي لاحقًا</b><p>في المرحلة الأولى يتم التجهيز اليدوي؛ الربط عبر واجهة TikTok الرسمية في المرحلة الثانية.</p></div></div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">مجال المحتوى</h3>
       <div class="chips">${['أسلوب حياة', 'جمال وعناية', 'موضة', 'طبخ', 'سفر', 'تقنية', 'لياقة'].map((t, k) => `<span class="chip ${k < 2 ? 'on' : ''}">${t}</span>`).join('')}</div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">الجمهور المستهدف</h3>
       <div class="grid g-2"><div class="field"><label>الفئة العمرية</label><select class="sel"><option>١٨-٢٤</option><option selected>٢٥-٣٤</option><option>٣٥-٤٤</option></select></div>
       <div class="field"><label>الجنس الأساسي</label><select class="sel"><option selected>إناث</option><option>ذكور</option><option>مختلط</option></select></div></div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">الدول واللغات</h3>
       <div class="field"><label>الدول</label><div class="chips">${['السعودية', 'الإمارات', 'الكويت', 'قطر'].map((t, k) => `<span class="chip ${k < 2 ? 'on' : ''}">${t}</span>`).join('')}</div></div>
       <div class="field"><label>اللغات</label><div class="chips"><span class="chip on">العربية</span><span class="chip">الإنجليزية</span></div></div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">الأهداف التجارية والإعلامية</h3>
       <div class="chips">${['زيادة المتابعين', 'رفع التفاعل', 'تعاونات تجارية', 'بناء علامة شخصية', 'إطلاق منتج'].map((t, k) => `<span class="chip ${k < 3 ? 'on' : ''}">${t}</span>`).join('')}</div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">القيم والموضوعات المقبولة</h3>
       <textarea class="ta">الأصالة، الاحترافية، احترام الجمهور، محتوى عائلي مناسب.</textarea>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">الموضوعات والعلامات المرفوضة</h3>
       <div class="callout warn mb">${icon('alert')}<div><b>حدود واضحة</b><p>لن يقترح النظام أو الذكاء الاصطناعي محتوى ضمن هذه القائمة.</p></div></div>
       <div class="chips">${['التبغ', 'المقامرة', 'محتوى سياسي', 'ادعاءات طبية'].map(t => `<span class="chip on" style="background:var(--rose-tint);color:var(--rose);border:none">${t} <span class="x">✕</span></span>`).join('')}</div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">نبرة الصوت والشخصية</h3>
       <div class="chips mb">${['ودّي', 'ملهم', 'عملي', 'راقٍ', 'مرح'].map((t, k) => `<span class="chip ${k < 3 ? 'on' : ''}">${t}</span>`).join('')}</div>
       <div class="field"><label>عبارات مفضلة</label><input class="inp" value="خلّونا نجرب، تعالوا معي، جربوها وقولولي"></div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">المنافسون والحسابات المرجعية</h3>
       <div class="field"><label>حسابات مرجعية</label><input class="inp" placeholder="@reference1، @reference2"></div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">الفريق والصلاحيات</h3>
       <div class="tbl-wrap">${teamMiniTable()}</div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">العدد الشهري المستهدف</h3>
       <div class="grid g-2"><div class="field"><label>مقاطع شهريًا</label><input class="inp" value="١٦"></div><div class="field"><label>أعمدة رئيسية</label><input class="inp" value="٥"></div></div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">أيام العمل</h3>
       <div class="field"><label>أيام التصوير</label><div class="chips">${['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map((t, k) => `<span class="chip ${k === 0 || k === 3 ? 'on' : ''}">${t}</span>`).join('')}</div></div>`,
      `<h3 style="font-weight:800;font-size:16px;margin-bottom:12px">المستندات والتراخيص</h3>
       <div class="callout info">${icon('shield')}<div><b>رفع آمن</b><p>ارفع العقود والنماذج وبيانات التراخيص عند الحاجة. لا تُخزَّن مفاتيح أو كلمات مرور في الواجهة.</p></div></div>`,
      `<div class="callout info mb">${icon('sparkles')}<div><b>الاستراتيجية الأولية جاهزة</b><p>أنشأنا مسودة استراتيجية بناءً على مدخلاتك. راجعها واعتمدها لبدء خطة المحتوى.</p></div></div>
       <div class="grid g-2">${['٥ أعمدة محتوى', '١٦ مقطعًا/شهر', 'أهداف ٣/٦/١٢ شهرًا', 'نبرة صوت محددة'].map(t => `<div class="card card-pad"><div class="row">${icon('check')}<b style="font-size:13px">${t}</b></div></div>`).join('')}</div>`,
    ];
    return bodies[i] || bodies[0];
  }
  function teamMiniTable() {
    return `<table class="tbl"><thead><tr><th>العضو</th><th>الدور</th><th>الصلاحية</th></tr></thead><tbody>
      ${D.team.slice(0, 4).map(m => `<tr><td><div class="u">${av(m.avatar, m.color)}<div class="u-meta"><b>${m.name}</b></div></div></td><td>${m.role}</td><td><span class="badge b-primary">تحرير</span></td></tr>`).join('')}
    </tbody></table>`;
  }

  /* ------------------------------- STRATEGY ------------------------------- */
  function strategy() {
    const blocks = [
      ['الرؤية', 'أن أكون المرجع الأول في محتوى الجمال العملي للمرأة الخليجية.'],
      ['الرسالة', 'أبسّط روتين العناية والجمال بتجارب صادقة قابلة للتطبيق يوميًا.'],
      ['الوعد للجمهور', 'محتوى صادق، مجرَّب، وخالٍ من المبالغة.'],
      ['الشخصية الرقمية', 'ودودة، عملية، راقية، وقريبة من جمهورها.'],
    ];
    const swot = [
      ['نقاط القوة', 'green', ['ثقة الجمهور العالية', 'اتساق النشر', 'جودة الإنتاج']],
      ['نقاط الضعف', 'amber', ['اعتماد على منصة واحدة', 'محدودية المحتوى التجاري']],
      ['الفرص', 'primary', ['نمو سوق الجمال', 'تعاونات إقليمية', 'محتوى تعليمي مدفوع']],
      ['المخاطر', 'rose', ['تغيّر خوارزمية المنصة', 'إرهاق المحتوى']],
    ];
    return head('الهوية والاستراتيجية', 'استراتيجية العلامة الشخصية — مع سجل إصدارات واعتماد.',
      btn('إصدار جديد', 'plus') + btn('اعتماد النسخة', 'check', 'btn-primary'))
      + `<div class="row between mb wrap">
          <div class="row"><span class="badge b-green"><span class="bd"></span> النسخة المعتمدة v4</span><span class="faint">آخر تحديث: ١٢ يوليو ٢٠٢٦</span></div>
          <div class="seg"><button class="active">النظرة العامة</button><button>الجمهور (Personas)</button><button>سجل الإصدارات</button></div>
        </div>`
      + `<div class="grid g-2 mb">${blocks.map(b => card(`<div class="card-pad"><div class="faint" style="font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${b[0]}</div><div style="font-size:14.5px;font-weight:600">${b[1]}</div></div>`)).join('')}</div>`
      + `<div class="grid g-4 mb">${swot.map(s => card(`<div class="card-pad"><div class="badge ${badgeFor(s[1])}" style="margin-bottom:10px">${s[0]}</div>${s[2].map(x => `<div class="row" style="margin-bottom:6px;font-size:13px">${icon('check')}<span>${x}</span></div>`).join('')}</div>`)).join('')}</div>`
      + `<div class="grid g-2">
          ${card(cardHead('أهداف ٣ / ٦ / ١٢ شهرًا') + `<div class="card-pad">
            ${[['٣ أشهر', 'الوصول إلى ١M متابع + تثبيت وتيرة ١٦ مقطع/شهر', 60], ['٦ أشهر', '٣ تعاونات تجارية بجودة عالية', 35], ['١٢ شهرًا', 'إطلاق منتج/خدمة تعليمية', 15]].map(g => `<div class="mb"><div class="row between" style="margin-bottom:5px"><b style="font-size:13px">${g[0]}</b><span class="faint" style="font-size:12px">${g[1]}</span></div>${meter(g[2])}</div>`).join('')}
          </div>`)}
          ${card(cardHead('دليل الأزمات والحدود') + `<div class="card-pad">
            <div class="callout warn mb">${icon('shield')}<div><b>مستوى مشاركة الحياة الخاصة: محدود</b><p>لا مشاركة لتفاصيل العائلة أو الموقع الحي.</p></div></div>
            <div class="row" style="margin-bottom:7px;font-size:13px">${icon('alert')}<span>الموضوعات الحساسة: سياسة، دين، ادعاءات طبية.</span></div>
            <div class="row" style="font-size:13px">${icon('chat')}<span>دليل الردود: احترام، عدم الجدال، تصعيد المسيء.</span></div>
          </div>`)}
        </div>`;
  }

  /* -------------------------------- PILLARS ------------------------------- */
  function pillars() {
    const total = D.pillars.reduce((s, p) => s + p.pct, 0);
    const balanced = total === 100;
    return head('أعمدة المحتوى', 'توزيع المحتوى على الأعمدة الاستراتيجية مع مؤشرات لكل عمود.',
      btn('عمود جديد', 'plus', 'btn-primary'))
      + (balanced ? '' : `<div class="callout warn mb">${icon('alert')}<div><b>الخطة غير متوازنة</b><p>مجموع النسب ${total}% — عدّل التوزيع ليصبح ١٠٠٪.</p></div></div>`)
      + `<div class="grid g-3">${D.pillars.map(p => card(`<div class="card-pad">
          <div class="row between mb"><div class="row"><span class="tag-dot" style="background:${p.color}"></span><b style="font-size:15px">${p.name}</b></div><span class="badge b-slate">${p.pct}%</span></div>
          <p class="muted" style="font-size:12.5px;min-height:36px">${p.desc}</p>
          <div class="mt-s">${meter(p.pct * 2.5, p.color)}</div>
          <div class="divider"></div>
          <div style="font-size:12px" class="faint"><div class="row between" style="margin-bottom:4px"><span>المؤشر</span><b style="color:var(--ink)">${p.kpi}</b></div><div class="row between"><span>الصيغ</span><b style="color:var(--ink)">${p.formats}</b></div></div>
        </div>`)).join('')}</div>`
      + `<div class="mt">${card(cardHead('التوزيع البصري') + `<div class="card-pad"><div class="row" style="gap:20px;flex-wrap:wrap"><div class="donut" style="background:conic-gradient(${donutGradient()})"><div class="dc"><b>١٠٠٪</b><span>مغطّى</span></div></div><div style="flex:1;min-width:200px">${pillarsBars()}</div></div></div>`)}</div>`;
  }
  function donutGradient() {
    let acc = 0; const seg = [];
    D.pillars.forEach(p => { const from = acc; acc += p.pct * 3.6; seg.push(`${p.color} ${from}deg ${acc}deg`); });
    return seg.join(',');
  }

  /* ------------------------------ IDEA BANK ------------------------------- */
  let ideaView = 'kanban';
  function ideas() {
    const seg = `<div class="seg" id="ideaSeg">
      ${[['kanban', 'Kanban'], ['cards', 'بطاقات'], ['list', 'قائمة']].map(v => `<button data-iv="${v[0]}" class="${ideaView === v[0] ? 'active' : ''}">${v[1]}</button>`).join('')}
    </div>`;
    return head('بنك الأفكار', `${D.ideas.length} فكرة — من المسودة إلى النشر.`, seg + btn('فكرة جديدة', 'plus', 'btn-primary'))
      + (ideaView === 'kanban' ? ideasKanban() : ideaView === 'cards' ? ideasCards() : ideasList());
  }
  function ideasKanban() {
    const cols = D.ideaStatuses.slice(0, 6);
    return `<div class="kanban">${cols.map(st => {
      const items = D.ideas.filter(i => i.status === st.id);
      return `<div class="kcol"><div class="kcol-head"><span class="dotc" style="background:${st.color}"></span><b>${st.label}</b><span class="cnt">${items.length}</span></div>
        ${items.map(i => `<div class="kcard" data-idea="${i.id}">
          <div class="row between" style="margin-bottom:6px"><span class="tag-dot" style="background:${pillarColor(i.pillar)}"></span><span class="badge ${i.priority === 'عالية' ? 'b-rose' : i.priority === 'متوسطة' ? 'b-amber' : 'b-slate'}" style="font-size:10px">${i.priority}</span></div>
          <h4>${i.title}</h4>
          <div class="kmeta"><span>${icon('trend')} ${i.viral}%</span><span>${av(UI.initials(i.owner), 'var(--slate)')}</span></div>
        </div>`).join('') || `<div class="faint" style="font-size:12px;text-align:center;padding:14px 0">لا أفكار</div>`}
      </div>`;
    }).join('')}</div>`;
  }
  function ideasCards() {
    return `<div class="grid g-3">${D.ideas.map(i => {
      const st = D.ideaStatuses.find(s => s.id === i.status) || {};
      return card(`<div class="card-pad" data-idea="${i.id}" style="cursor:pointer">
        <div class="row between mb"><span class="badge" style="background:${st.color}22;color:${st.color}">${st.label}</span><span class="tag-dot" style="background:${pillarColor(i.pillar)}"></span></div>
        <h4 style="font-size:14.5px;font-weight:700;line-height:1.4;min-height:40px">${i.title}</h4>
        <div class="chips mt-s">${i.tags.map(t => `<span class="chip" style="font-size:11px;padding:2px 8px">#${t}</span>`).join('')}</div>
        <div class="divider"></div>
        <div class="row between faint" style="font-size:12px"><span>انتشار ${i.viral}٪</span><span>ملاءمة ${i.fit}٪</span><span>${i.owner.split(' ')[0]}</span></div>
      </div>`);
    }).join('')}</div>`;
  }
  function ideasList() {
    return card(`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الفكرة</th><th>العمود</th><th>الحالة</th><th>الأولوية</th><th>انتشار</th><th>المسؤول</th></tr></thead><tbody>
      ${D.ideas.map(i => { const st = D.ideaStatuses.find(s => s.id === i.status) || {};
        return `<tr data-idea="${i.id}" style="cursor:pointer"><td><b>${i.title}</b></td><td><span class="tag-dot" style="background:${pillarColor(i.pillar)}"></span> ${pillarName(i.pillar)}</td>
        <td><span class="badge" style="background:${st.color}22;color:${st.color}">${st.label}</span></td>
        <td><span class="badge ${i.priority === 'عالية' ? 'b-rose' : i.priority === 'متوسطة' ? 'b-amber' : 'b-slate'}">${i.priority}</span></td>
        <td class="tnum">${i.viral}%</td><td>${i.owner}</td></tr>`; }).join('')}
    </tbody></table></div>`);
  }
  function ideaModal(id) {
    const i = D.ideas.find(x => x.id === id); if (!i) return;
    modal(i.title, `
      <div class="row wrap mb"><span class="badge b-primary">${pillarName(i.pillar)}</span><span class="badge b-slate">${i.platform}</span><span class="badge ${i.priority === 'عالية' ? 'b-rose' : 'b-amber'}">${i.priority}</span></div>
      <div class="grid g-3 mb">
        <div class="stat" style="padding:12px"><div class="st-val" style="font-size:20px">${i.viral}%</div><div class="st-lbl">قابلية الانتشار</div></div>
        <div class="stat" style="padding:12px"><div class="st-val" style="font-size:20px">${i.fit}%</div><div class="st-lbl">ملاءمة الهوية</div></div>
        <div class="stat" style="padding:12px"><div class="st-val" style="font-size:16px">${i.difficulty}</div><div class="st-lbl">صعوبة التنفيذ</div></div>
      </div>
      <div class="field"><label>الوصف</label><div class="muted" style="font-size:13px">فكرة ضمن عمود «${pillarName(i.pillar)}» موجهة للجمهور الأساسي، مع دعوة لاتخاذ إجراء: «${i.cta}».</div></div>
      <div class="field"><label>الهاشتاقات</label><div class="chips">${i.tags.map(t => `<span class="chip">#${t}</span>`).join('')}</div></div>`,
      btn('تحويل إلى سيناريو', 'script', 'btn-primary') + btn('اعتماد', 'check', 'btn-soft'));
  }

  /* -------------------------------- TRENDS -------------------------------- */
  function trends() {
    return head('رادار الترندات', 'رصد يدوي وبيانات تجريبية — دون أي جمع غير مصرّح به للبيانات.',
      btn('إضافة ترند', 'plus', 'btn-primary'))
      + `<div class="callout info mb">${icon('shield')}<div><b>التزام</b><p>لا Web Scraping مخالف لشروط المنصات. المصادر الرسمية تُضاف عبر طبقة تكامل مستقبلية.</p></div></div>`
      + `<div class="grid g-2">${D.trends.map(t => card(`<div class="card-pad">
          <div class="row between mb"><b style="font-size:15px">${t.name}</b><span class="badge ${t.decision === 'مستخدم' ? 'b-green' : t.decision === 'تجاهل' ? 'b-slate' : 'b-amber'}">${t.decision}</span></div>
          <div class="row wrap" style="gap:8px;margin-bottom:12px"><span class="badge b-slate">${t.type}</span><span class="badge b-accent">${t.sound}</span></div>
          <div class="mb"><div class="row between" style="font-size:12px;margin-bottom:4px"><span class="faint">درجة النمو</span><b class="tnum">${t.growth}%</b></div>${meter(t.growth, t.growth > 80 ? 'var(--green)' : 'var(--amber)')}</div>
          <div class="grid g-2" style="gap:8px;font-size:12px" class="faint">
            <div><span class="faint">العمر المتوقع</span><br><b>${t.life}</b></div>
            <div><span class="faint">الملاءمة</span><br><b>${t.fit}</b></div>
            <div><span class="faint">المخاطر</span><br><b>${t.risk}</b></div>
            <div><span class="faint">ينتهي</span><br><b style="color:var(--rose)">${t.expires}</b></div>
          </div>
        </div>`)).join('')}</div>`;
  }

  /* ---------------------------------- AI ---------------------------------- */
  function ai() {
    return head('مساعد الذكاء الاصطناعي', 'توليد أفكار وزوايا وسيناريوهات ضمن استراتيجية صانع المحتوى ونبرته.',
      '')
      + `<div class="grid g-12">
          <div>${card(cardHead('إعداد التوليد', 'اختر المعايير قبل التوليد') + `<div class="card-pad">
            <div class="grid g-2">
              <div class="field"><label>الهدف</label><select class="sel"><option>رفع التفاعل</option><option>زيادة المتابعين</option><option>تحويل وبيع</option></select></div>
              <div class="field"><label>الجمهور</label><select class="sel"><option>الأساسي — إناث ٢٥-٣٤</option><option>الثانوي</option></select></div>
              <div class="field"><label>النبرة</label><select class="sel"><option>ودّية عملية</option><option>ملهمة</option><option>مرحة</option></select></div>
              <div class="field"><label>طول الفيديو</label><select class="sel"><option>أقل من ٣٠ث</option><option selected>٣٠-٤٥ث</option><option>٦٠ث</option></select></div>
              <div class="field"><label>نوع الفيديو</label><select class="sel"><option>تعليمي</option><option>ترفيهي</option><option>مراجعة</option></select></div>
              <div class="field"><label>المنصة</label><select class="sel"><option>TikTok</option></select></div>
            </div>
            <div class="field"><label>يحتوي إعلانًا؟</label><div class="chips"><span class="chip">لا</span><span class="chip on">نعم — مع إفصاح</span></div></div>
            <button class="btn btn-primary" style="width:100%" id="genBtn">${icon('sparkles')} توليد الأفكار</button>
            <p class="hint mt-s">لن يُختلق أي رقم أو اقتباس دون مصدر. تُحفظ جميع الإصدارات.</p>
          </div>`)}</div>
          <div>${card(cardHead('المخرجات', 'قيّم وعدّل') + `<div class="card-pad" id="genOut">
            <div class="empty"><div class="ei">${icon('sparkles')}</div><h3>جاهز للتوليد</h3><p>اختر المعايير ثم اضغط «توليد الأفكار» لعرض المقترحات هنا.</p></div>
          </div>`)}</div>
        </div>`;
  }
  function aiGenerate() {
    const out = document.getElementById('genOut'); if (!out) return;
    out.innerHTML = `<div class="skel" style="height:70px;margin-bottom:10px"></div><div class="skel" style="height:70px;margin-bottom:10px"></div><div class="skel" style="height:70px"></div>`;
    setTimeout(() => {
      const items = [
        ['٣ أخطاء تفسد روتينك الصباحي', 'Hook: «توقفي عن فعل هذا كل صباح!»', 'تعليمي'],
        ['جرّبت الترند لمدة أسبوع — النتيجة', 'Hook: «قلتوا لي أجربه، فجربته»', 'ترفيهي'],
        ['سؤالكم الأكثر تكرارًا هذا الأسبوع', 'Hook: «سألتوني كثير عن هذا»', 'تفاعلي'],
      ];
      out.innerHTML = items.map(it => `<div class="card card-pad mb" style="margin-bottom:10px">
        <div class="row between mb"><b style="font-size:14px">${it[0]}</b><span class="badge b-primary">${it[2]}</span></div>
        <p class="muted" style="font-size:12.5px">${it[1]}</p>
        <div class="row mt-s"><button class="btn btn-sm btn-soft">${icon('check')} حفظ في البنك</button><button class="btn btn-sm btn-ghost">${icon('script')} سيناريو</button><span class="faint" style="margin-inline-start:auto;font-size:12px">⭐ قيّم</span></div>
      </div>`).join('');
      toast('تم توليد ٣ أفكار', 'ok');
    }, 900);
  }

  /* ------------------------------- SCRIPTS -------------------------------- */
  function scripts() {
    return head('محرر السيناريو', 'سيناريو «تجربة منتج الترطيب» — v2 · مع إصدارات وتعليقات ووضع Teleprompter.',
      btn('Teleprompter', 'eye') + btn('نسخة جديدة', 'plus') + btn('إرسال للمراجعة', 'check', 'btn-primary'))
      + `<div class="grid g-12">
          <div>${card(`<div class="card-pad">
            ${scriptField('Hook (أول ٣ ثوانٍ)', 'جربت منتج الترطيب اللي كلكم تسألون عنه... والنتيجة صدمتني!')}
            ${scriptField('المقدمة', 'اليوم بشاركم تجربتي الحقيقية بعد أسبوع كامل من الاستخدام اليومي، بكل صدق.')}
            ${scriptField('جسم المحتوى', '• الملمس والامتصاص\n• الرائحة\n• النتيجة بعد ٣ أيام\n• هل يستحق السعر؟')}
            ${scriptField('CTA', 'لو جربتوه قبل، قولولي رأيكم بالتعليقات — والرابط في البايو.')}
            <div class="callout warn">${icon('alert')}<div><b>إفصاح إعلاني</b><p>هذا المحتوى بالتعاون مع «علامة الترطيب» — يجب إظهار الإفصاح على الشاشة وفي الوصف.</p></div></div>
          </div>`)}</div>
          <div>
            ${card(cardHead('تفاصيل الإنتاج') + `<div class="card-pad">
              ${[['المدة الكلية', '٣٨ ثانية'], ['اللقطات', '٦ لقطات'], ['B-roll', 'قطرات المنتج، الملمس'], ['الموسيقى', 'هادئة — مرخصة'], ['الموقع', 'المنزل — إضاءة طبيعية'], ['الملابس', 'كاجوال فاتح']].map(r => `<div class="row between" style="padding:7px 0;border-bottom:1px solid var(--border);font-size:13px"><span class="faint">${r[0]}</span><b>${r[1]}</b></div>`).join('')}
            </div>`)}
            <div class="mt">${card(cardHead('التعليقات') + `<div class="card-pad">
              <div class="row" style="align-items:flex-start;margin-bottom:10px">${av('خ', 'var(--accent)')}<div><b style="font-size:13px">خالد الشمري</b> <span class="faint" style="font-size:11px">على ٠:١٢</span><p style="font-size:12.5px" class="muted">نبدأ بلقطة قريبة للمنتج.</p></div></div>
              <div class="row" style="align-items:flex-start">${av('ل', 'var(--primary)')}<div><b style="font-size:13px">ليان</b> <span class="faint" style="font-size:11px">رد</span><p style="font-size:12.5px" class="muted">تمام، نضيف الإفصاح واضح.</p></div></div>
            </div>`)}</div>
          </div>
        </div>`;
  }
  function scriptField(label, val) {
    return `<div class="field"><label>${label}</label><textarea class="ta" style="min-height:${val.includes('\n') ? '90' : '60'}px">${val}</textarea></div>`;
  }

  /* ------------------------------ PRODUCTION ------------------------------ */
  function production() {
    return head('المحتوى والإنتاج', 'خط الإنتاج (Workflow) — ١٨ مرحلة قابلة للتخصيص لكل عميل.',
      btn('تخصيص Workflow', 'gear') + btn('مشروع جديد', 'plus', 'btn-primary'))
      + `<div class="card card-pad mb"><div class="row wrap" style="gap:6px">${D.workflow.map((s, i) => `<span class="badge ${i < 5 ? 'b-green' : i < 8 ? 'b-amber' : 'b-slate'}" style="font-size:10.5px">${i + 1}. ${s}</span>`).join('')}</div></div>`
      + card(`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>المشروع</th><th>المرحلة الحالية</th><th>المسؤول</th><th>الاستحقاق</th><th>SLA</th><th>التقدم</th></tr></thead><tbody>
        ${D.projects.map(p => `<tr><td><b>${p.title}</b><br><span class="tag-dot" style="background:${pillarColor(p.pillar)}"></span> <span class="faint" style="font-size:11.5px">${pillarName(p.pillar)}</span></td>
          <td><span class="badge b-primary">${p.stage + 1}. ${D.workflow[p.stage]}</span></td>
          <td>${p.owner}</td><td>${p.due}</td>
          <td><span class="badge ${p.sla.includes('متأخر') ? 'b-rose' : 'b-green'}">${p.sla}</span></td>
          <td style="min-width:120px">${meter(Math.round((p.stage / 17) * 100))}</td></tr>`).join('')}
      </tbody></table></div>`);
  }

  /* -------------------------------- SHOOTS -------------------------------- */
  function shoots() {
    return head('جلسات التصوير', 'إدارة أيام التصوير مع Call Sheet ووضع يوم التصوير.',
      btn('Call Sheet', 'doc') + btn('جلسة جديدة', 'plus', 'btn-primary'))
      + `<div class="grid g-3">${D.shoots.map(s => card(`<div class="card-pad">
          <div class="row between mb"><span class="st-ico" style="background:var(--accent-tint);color:#0e7490">${icon('camera')}</span><span class="badge ${s.status === 'مؤكد' ? 'b-green' : s.status === 'مسودة' ? 'b-slate' : 'b-amber'}">${s.status}</span></div>
          <b style="font-size:15px">${s.name}</b>
          <div class="muted mt-s" style="font-size:12.5px">${icon('calendar')} ${s.date} · ${s.time}</div>
          <div class="muted" style="font-size:12.5px;margin-top:4px">📍 ${s.location}</div>
          <div class="divider"></div>
          <div class="row between faint" style="font-size:12px"><span>${icon('users')} ${s.crew} أفراد</span><span>${icon('camera')} ${s.clips} مقاطع</span><span class="tnum">${s.cost}</span></div>
        </div>`)).join('')}</div>`
      + `<div class="mt">${card(cardHead('وضع يوم التصوير', 'قائمة المقاطع بالترتيب — واجهة كبيرة للجوال') + `<div class="card-pad">
          ${['المقطع ١: مقدمة أساسيات المكياج', 'المقطع ٢: خطوة الأساس', 'المقطع ٣: خطوة العيون', 'المقطع ٤: اللمسة النهائية'].map((c, i) => `<label class="row" style="padding:12px;border:1px solid var(--border);border-radius:var(--r-sm);margin-bottom:8px;font-size:14px;font-weight:600"><span class="st-ico" style="width:30px;height:30px;background:${i === 0 ? 'var(--green-tint)' : 'var(--surface-2)'};color:${i === 0 ? 'var(--green)' : 'var(--faint)'}">${i === 0 ? '✓' : i + 1}</span>${c}</label>`).join('')}
        </div>`)}</div>`;
  }

  /* ------------------------------- CALENDAR ------------------------------- */
  function calendar() {
    const dows = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const events = { 3: [['نشر: ٥ أخطاء', 'b-green']], 5: [['تصوير المكياج', 'b-accent']], 8: [['اعتماد: يوم في حياتي', 'b-amber']], 12: [['نشر: الانتقالات', 'b-green'], ['حملة العلامة', 'b-violet']], 15: [['تسليم إعلاني', 'b-rose']], 18: [['نشر أسبوعي', 'b-green']], 22: [['تصوير كواليس', 'b-accent']], 25: [['مراجعة شهرية', 'b-primary']] };
    let cells = '';
    for (let i = 0; i < 35; i++) {
      const day = i - 2;
      const out = day < 1 || day > 31;
      const evs = events[day] || [];
      cells += `<div class="day ${out ? 'out' : ''} ${day === 18 ? 'today' : ''}">${out ? '' : `<div class="dn">${day}</div>${evs.map(e => `<div class="ev ${e[1]}" style="background:var(--${e[1].replace('b-', '')}-tint,var(--surface-2))">${e[0]}</div>`).join('')}`}</div>`;
    }
    return head('التقويم التحريري', 'يوليو ٢٠٢٦ — تخطيط ونشر وتصوير وحملات في مكان واحد.',
      `<div class="seg"><button class="active">شهري</button><button>أسبوعي</button><button>يومي</button></div>` + btn('عنصر جديد', 'plus', 'btn-primary'))
      + `<div class="callout warn mb">${icon('alert')}<div><b>تنبيه توازن</b><p>تركّز ٤ عناصر في عمود «تجاري» هذا الأسبوع — وزّع على الأعمدة الأخرى.</p></div></div>`
      + card(`<div class="card-pad"><div class="cal">${dows.map(d => `<div class="dow">${d}</div>`).join('')}${cells}</div></div>`);
  }

  /* --------------------------------- TASKS -------------------------------- */
  function tasks() {
    const groups = [['قيد التنفيذ', 'b-primary'], ['بانتظار المراجعة', 'b-amber'], ['لم تبدأ', 'b-slate'], ['مكتملة', 'b-green']];
    return head('المهام', 'مهام متصلة بالمحتوى والحملات — عرض حسب الحالة.',
      `<div class="seg"><button class="active">لوحة</button><button>مهامي</button><button>الجدول</button></div>` + btn('مهمة جديدة', 'plus', 'btn-primary'))
      + `<div class="kanban">${groups.map(g => {
        const items = D.tasks.filter(t => t.status === g[0]);
        return `<div class="kcol"><div class="kcol-head"><b>${g[0]}</b><span class="cnt">${items.length}</span></div>
          ${items.map(t => `<div class="kcard">
            <div class="row between mb"><span class="badge ${t.priority === 'عالية' ? 'b-rose' : t.priority === 'متوسطة' ? 'b-amber' : 'b-slate'}" style="font-size:10px">${t.priority}</span><span class="faint" style="font-size:11px">${t.due}</span></div>
            <h4 style="${t.done ? 'text-decoration:line-through;opacity:.6' : ''}">${t.title}</h4>
            <div class="kmeta"><span>${icon('folder')} ${t.project}</span><span>${av(UI.initials(t.owner), 'var(--slate)')}</span></div>
          </div>`).join('') || `<div class="faint" style="font-size:12px;text-align:center;padding:12px 0">—</div>`}
        </div>`;
      }).join('')}</div>`;
  }

  /* ------------------------------ APPROVALS ------------------------------- */
  function approvals() {
    return head('الموافقات', 'مراجعة واعتماد المحتوى — سجل موثّق يمنع نشر نسخة غير معتمدة.',
      btn('رابط مراجعة آمن', 'portal', 'btn-soft'))
      + `<div class="grid g-2">${D.approvals.map(a => card(`<div class="card-pad">
          <div class="row between mb"><b style="font-size:14.5px">${a.title}</b><span class="badge b-slate">${a.version}</span></div>
          <div class="row wrap" style="gap:8px;margin-bottom:12px"><span class="badge b-primary">${a.type}</span>
            <span class="badge ${a.status === 'معتمد' ? 'b-green' : a.status.includes('تعديل') ? 'b-amber' : a.status.includes('مشروط') ? 'b-accent' : 'b-slate'}">${a.status}</span></div>
          <div class="muted" style="font-size:12.5px">من ${a.from} · ${a.time}</div>
          <div class="divider"></div>
          <div class="row"><button class="btn btn-sm btn-primary" data-approve="${a.id}">${icon('check')} اعتماد</button><button class="btn btn-sm btn-ghost">تعليق</button><button class="btn btn-sm btn-danger">رفض</button></div>
        </div>`)).join('')}</div>`;
  }

  /* -------------------------------- ASSETS -------------------------------- */
  function assets() {
    const folders = ['الكل', 'المكياج', 'يوميات', 'أصوات', 'الهوية', 'العقود'];
    return head('مكتبة الملفات', 'مكتبة أصول رقمية — إصدارات، صلاحيات، وتنبيه انتهاء الحقوق.',
      btn('مجلد', 'folder') + btn('رفع', 'plus', 'btn-primary'))
      + `<div class="tabs">${folders.map((f, i) => `<button class="tab ${i === 0 ? 'active' : ''}">${f}</button>`).join('')}</div>`
      + card(`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الملف</th><th>النوع</th><th>المجلد</th><th>الحجم</th><th>المالك</th><th>الحقوق</th></tr></thead><tbody>
        ${D.assets.map(a => `<tr><td><div class="u"><span class="u-av" style="background:var(--surface-2);color:var(--muted)">${icon(a.type.includes('عقد') ? 'doc' : a.type.includes('فيديو') ? 'camera' : a.type.includes('موسيقى') ? 'chat' : 'file')}</span><div class="u-meta"><b>${a.name}</b></div></div></td>
          <td>${a.type}</td><td>${a.folder}</td><td class="tnum">${a.size}</td><td>${a.owner}</td>
          <td>${a.expiry === '—' ? '<span class="faint">—</span>' : `<span class="badge b-amber">${a.expiry}</span>`}</td></tr>`).join('')}
      </tbody></table></div>`);
  }

  /* ------------------------------ ANALYTICS ------------------------------- */
  function analytics() {
    const a = D.analytics;
    return head('التحليلات', 'بيانات تجريبية في MVP — قابلة للربط بالمصادر الرسمية أو الإدخال اليدوي.',
      `<div class="seg"><button class="active">٣٠ يوم</button><button>ربع سنوي</button><button>مقارنة</button></div>` + btn('تصدير', 'doc'))
      + `<div class="grid g-4 mb">${a.kpis.map(k => stat({ icon: 'chart', tint: 'var(--primary-soft)', ink: 'var(--primary-ink)', value: k.value, label: k.label, delta: k.delta, up: k.up })).join('')}</div>`
      + `<div class="grid g-12 mb">
          ${card(cardHead('نمو المشاهدات والتفاعل', 'شهر بشهر') + `<div class="card-pad"><div class="chart">${a.monthly.map(m => `<div class="col"><div class="bars"><i style="height:${m.a}%"></i><i class="b2" style="height:${m.b}%"></i></div><small>${m.m}</small></div>`).join('')}</div><div class="row mt" style="gap:16px;font-size:12px"><span class="row" style="gap:6px"><span class="tag-dot" style="background:var(--primary)"></span> مشاهدات</span><span class="row" style="gap:6px"><span class="tag-dot" style="background:var(--accent)"></span> تفاعل</span></div></div>`)}
          ${card(cardHead('أفضل الأوقات') + `<div class="card-pad">
            <div class="mb"><div class="faint mb" style="font-size:12px">أفضل أوقات النشر</div>${a.bestTimes.map(t => `<span class="badge b-primary" style="margin:0 0 6px 6px">${t}</span>`).join('')}</div>
            <div><div class="faint mb" style="font-size:12px">أفضل الأيام</div>${a.bestDays.map(t => `<span class="badge b-accent" style="margin:0 0 6px 6px">${t}</span>`).join('')}</div>
          </div>`)}
        </div>`
      + card(cardHead('أعلى المحتويات أداءً') + `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>المحتوى</th><th>العمود</th><th>المشاهدات</th><th>التفاعل</th></tr></thead><tbody>
        ${a.topPosts.map(p => `<tr><td><b>${p.title}</b></td><td><span class="badge b-slate">${p.pillar}</span></td><td class="tnum">${p.views}</td><td class="tnum">${p.eng}</td></tr>`).join('')}
      </tbody></table></div>`);
  }

  /* --------------------------- RECOMMENDATIONS ---------------------------- */
  function recommendations() {
    return head('التوصيات الذكية', 'الأرقام تتحوّل إلى إجراءات — مع الأساس ومستوى الثقة والمسؤول.',
      '')
      + `<div class="grid g-2">${D.recommendations.map(r => card(`<div class="card-pad ${r.done ? 'style="opacity:.7"' : ''}">
          <div class="row between mb"><span class="st-ico" style="background:var(--primary-soft);color:var(--primary-ink)">${icon('sparkles')}</span>
            <span class="badge ${r.confidence === 'عالية' ? 'b-green' : 'b-amber'}">ثقة ${r.confidence}</span></div>
          <p style="font-size:14px;font-weight:600;line-height:1.5">${r.text}</p>
          <div class="divider"></div>
          <div class="row between faint" style="font-size:12px"><span>${icon('chart')} ${r.basis}</span><span>${r.owner}</span></div>
          <div class="row mt-s">${r.done ? '<span class="badge b-green">✓ نُفّذت</span>' : `<button class="btn btn-sm btn-primary" data-rec="${r.id}">تطبيق</button><button class="btn btn-sm btn-ghost">تأجيل</button>`}</div>
        </div>`)).join('')}</div>`;
  }

  /* ------------------------------ CAMPAIGNS ------------------------------- */
  function campaigns() {
    return head('الحملات والإعلانات', 'CRM مصغّر لإدارة العلامات والفرص التجارية.',
      btn('فرصة جديدة', 'plus', 'btn-primary'))
      + `<div class="kanban">${D.opportunityStages.slice(0, 6).map(st => {
        const items = D.brands.filter(b => b.stage === st);
        return `<div class="kcol"><div class="kcol-head"><b>${st}</b><span class="cnt">${items.length}</span></div>
          ${items.map(b => `<div class="kcard"><h4>${b.name}</h4>
            <div class="row wrap" style="gap:6px;margin:6px 0"><span class="badge b-slate" style="font-size:10px">${b.sector}</span></div>
            <div class="kmeta between"><b class="tnum" style="color:var(--ink)">${b.value}</b><span>${b.deliverables} تسليمات</span></div>
          </div>`).join('') || `<div class="faint" style="font-size:12px;text-align:center;padding:12px 0">—</div>`}
        </div>`;
      }).join('')}</div>`
      + `<div class="mt">${card(cardHead('العلامات التجارية') + `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>العلامة</th><th>القطاع</th><th>جهة الاتصال</th><th>المرحلة</th><th>القيمة</th><th>الحصرية</th></tr></thead><tbody>
        ${D.brands.map(b => `<tr><td><b>${b.name}</b></td><td>${b.sector}</td><td>${b.contact}</td><td><span class="badge b-primary">${b.stage}</span></td><td class="tnum">${b.value}</td><td>${b.exclusivity}</td></tr>`).join('')}
      </tbody></table></div>`)}</div>`;
  }

  /* ------------------------------ CONTRACTS ------------------------------- */
  function contracts() {
    return head('العقود والالتزامات', 'سجل العقود مع تنبيهات للالتزامات التي قد تُنسى.',
      btn('قالب عقد', 'doc') + btn('عقد جديد', 'plus', 'btn-primary'))
      + `<div class="callout info mb">${icon('shield')}<div><b>تنبيه قانوني</b><p>القوالب تشغيلية وتحتاج مراجعة قانونية من مختص مرخّص — ليست بديلًا عن المحامي.</p></div></div>`
      + `<div class="grid g-2 mb">${D.contracts.map(c => card(`<div class="card-pad">
          <div class="row between mb"><b style="font-size:15px">${c.brand}</b><span class="badge b-primary">${c.type}</span></div>
          <div class="grid g-2" style="gap:8px;font-size:12.5px;margin-bottom:10px">
            <div><span class="faint">القيمة</span><br><b class="tnum">${c.value}</b></div><div><span class="faint">المدة</span><br><b>${c.start} - ${c.end}</b></div>
            <div><span class="faint">الحصرية</span><br><b>${c.exclusivity}</b></div><div><span class="faint">الدفع</span><br><b>${c.payment}</b></div>
          </div>
          ${c.alerts.map(al => `<div class="callout warn" style="padding:9px 12px;margin-bottom:6px">${icon('alert')}<div><b style="font-size:12.5px">${al}</b></div></div>`).join('')}
        </div>`)).join('')}</div>`
      + card(cardHead('الفواتير والمستحقات') + `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الرقم</th><th>العلامة</th><th>المبلغ</th><th>الاستحقاق</th><th>الحالة</th></tr></thead><tbody>
        ${D.invoices.map(inv => `<tr><td class="tnum">${inv.number}</td><td>${inv.brand}</td><td class="tnum">${inv.amount}</td><td>${inv.due}</td>
          <td><span class="badge ${inv.status === 'مدفوعة' ? 'b-green' : inv.status === 'متأخرة' ? 'b-rose' : 'b-amber'}">${inv.status}</span></td></tr>`).join('')}
      </tbody></table></div>`);
  }

  /* ------------------------------ COMPLIANCE ------------------------------ */
  function compliance() {
    const done = D.compliance.filter(c => c.ok).length;
    return head('الامتثال', 'قائمة تحقق للمحتوى التجاري في السعودية — قابلة للتحديث من لوحة نوفاميتريكس.',
      btn('سجل التدقيق', 'audit'))
      + `<div class="callout info mb">${icon('shield')}<div><b>تنبيه نظامي</b><p>الأنظمة والسياسات قد تتغير — التفاصيل تحتاج «تحققًا نظاميًا محدثًا» ومراجعة مختص. لا يُدّعى امتثال نهائي تلقائيًا.</p></div></div>`
      + `<div class="card card-pad mb"><div class="row between"><b>اكتمال التحقق</b><span class="tnum faint">${done}/${D.compliance.length}</span></div><div class="bar mt-s"><i style="width:${(done / D.compliance.length) * 100}%;background:var(--green)"></i></div></div>`
      + card(`<div class="card-pad">${D.compliance.map(c => `<label class="row between" style="padding:11px 0;border-bottom:1px solid var(--border)">
          <div class="row"><span class="st-ico" style="width:28px;height:28px;background:${c.ok ? 'var(--green-tint)' : 'var(--amber-tint)'};color:${c.ok ? 'var(--green)' : 'var(--amber)'}">${icon(c.ok ? 'check' : 'clock')}</span><b style="font-size:13.5px">${c.q}</b></div>
          <span class="badge ${c.ok ? 'b-green' : 'b-amber'}">${c.v}</span>
        </label>`).join('')}</div>`);
  }

  /* -------------------------------- CRISIS -------------------------------- */
  function crisis() {
    const playbooks = ['معلومة غير صحيحة', 'خطأ في إعلان', 'تأخر تسليم', 'تعليق مسيء منتشر', 'سوء فهم', 'تسريب محتوى', 'استخدام محتوى دون إذن', 'أزمة علامة تجارية'];
    return head('مركز السمعة والأزمات', 'تسجيل المواقف وإدارتها بـ Playbooks جاهزة قابلة للتعديل.',
      btn('تسجيل موقف', 'plus', 'btn-primary'))
      + `<div class="grid g-2 mb">${D.crisis.map(c => card(`<div class="card-pad">
          <div class="row between mb"><b style="font-size:15px">${c.title}</b><span class="badge ${c.severity === 'مرتفعة' ? 'b-rose' : 'b-amber'}">خطورة ${c.severity}</span></div>
          <div class="grid g-2" style="gap:8px;font-size:12.5px;margin-bottom:10px"><div><span class="faint">المصدر</span><br><b>${c.source}</b></div><div><span class="faint">المسؤول</span><br><b>${c.owner}</b></div>
            <div><span class="faint">الحالة</span><br><span class="badge b-amber">${c.status}</span></div><div><span class="faint">Playbook</span><br><b>${c.playbook}</b></div></div>
          <button class="btn btn-sm btn-soft">${icon('shield')} فتح خطة الاستجابة</button>
        </div>`)).join('')}</div>`
      + card(cardHead('Playbooks جاهزة', 'قوالب استجابة قابلة للتعديل') + `<div class="card-pad"><div class="grid g-4">${playbooks.map(p => `<div class="card card-pad" style="text-align:center"><div class="st-ico" style="margin:0 auto 8px;background:var(--rose-tint);color:var(--rose)">${icon('shield')}</div><b style="font-size:12.5px">${p}</b></div>`).join('')}</div></div>`);
  }

  /* ------------------------------- AUDIENCE ------------------------------- */
  function audience() {
    return head('الجمهور والأسئلة', 'إدارة التفاعل دون أي جمع غير مصرّح — إدخال يدوي أو تكامل رسمي لاحقًا.',
      btn('سؤال جديد', 'plus', 'btn-primary'))
      + `<div class="grid g-2">
          ${card(cardHead('أكثر الأسئلة تكرارًا', 'فرص محتوى محتملة') + `<div class="card-pad">${D.audienceQ.map(q => `<div class="row between" style="padding:11px 0;border-bottom:1px solid var(--border)">
            <div><b style="font-size:13.5px">${q.q}</b><div class="faint" style="font-size:11.5px">${q.count} مرة</div></div>
            <span class="badge ${q.tag === 'تصعيد' ? 'b-rose' : q.tag.includes('إعلان') ? 'b-amber' : q.tag.includes('فرصة') ? 'b-primary' : 'b-slate'}">${q.tag}</span>
          </div>`).join('')}</div>`)}
          ${card(cardHead('الردود المعتمدة والكلمات الحساسة') + `<div class="card-pad">
            <div class="faint mb" style="font-size:12px">ردود معتمدة</div><div class="chips mb">${['شكرًا لسؤالك 🌸', 'الرابط في البايو', 'قريبًا إن شاء الله'].map(t => `<span class="chip on">${t}</span>`).join('')}</div>
            <div class="faint mb" style="font-size:12px">كلمات حساسة (تصعيد)</div><div class="chips">${['شكوى', 'استرجاع', 'قانوني'].map(t => `<span class="chip" style="background:var(--rose-tint);color:var(--rose);border:none">${t}</span>`).join('')}</div>
          </div>`)}
        </div>`;
  }

  /* --------------------------------- TEAM --------------------------------- */
  function team() {
    const perms = ['إنشاء فكرة', 'كتابة سيناريو', 'اعتماد', 'نشر', 'التحليلات', 'البيانات المالية'];
    const rolePerms = { 'creator': [1, 0, 1, 1, 1, 1], 'content': [1, 1, 1, 1, 1, 0], 'writer': [1, 1, 0, 0, 1, 0], 'editor': [0, 0, 0, 0, 1, 0], 'biz': [1, 0, 1, 0, 1, 1] };
    return head('الفريق والصلاحيات', 'نظام صلاحيات RBAC — من يستطيع فعل ماذا.',
      btn('دعوة عضو', 'plus', 'btn-primary'))
      + `<div class="grid g-4 mb">${D.team.slice(0, 4).map(m => card(`<div class="card-pad" style="text-align:center">
          <div class="avatar" style="width:52px;height:52px;margin:0 auto 10px;font-size:20px;background:${m.color}">${m.avatar}</div>
          <b style="font-size:14px">${m.name}</b><div class="faint" style="font-size:12px">${m.role}</div>
          <div class="mt-s"><span class="badge ${m.status === 'نشط' ? 'b-green' : 'b-amber'}">${m.status}</span></div>
        </div>`)).join('')}</div>`
      + card(cardHead('مصفوفة الصلاحيات', 'RBAC') + `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الدور</th>${perms.map(p => `<th>${p}</th>`).join('')}</tr></thead><tbody>
        ${Object.keys(rolePerms).map(rid => { const r = D.roles.find(x => x.id === rid) || { label: rid };
          return `<tr><td><b>${r.label}</b></td>${rolePerms[rid].map(v => `<td>${v ? '<span style="color:var(--green)">✓</span>' : '<span class="faint">✗</span>'}</td>`).join('')}</tr>`; }).join('')}
      </tbody></table></div>`);
  }

  /* -------------------------------- PORTAL -------------------------------- */
  function portal() {
    return head('بوابة العميل', 'واجهة مبسّطة للمشهور — سهلة ومناسبة للجوال.',
      `<span class="badge b-violet">وضع المشهور</span>`)
      + `<div class="grid g-2 mb">
          ${card(`<div class="card-pad"><div class="row between mb"><b>يحتاج موافقتك</b><span class="badge b-rose">١</span></div>
            <div class="card card-pad" style="background:var(--surface-2)"><b style="font-size:14px">يوم في حياتي — v3</b><div class="faint mt-s" style="font-size:12px">جاهز للاعتماد النهائي</div>
            <div class="row mt-s"><button class="btn btn-sm btn-primary">${icon('check')} اعتماد</button><button class="btn btn-sm btn-ghost">طلب تعديل</button></div></div></div>`)}
          ${card(`<div class="card-pad"><b class="mb" style="display:block">تصوير اليوم</b>
            <div class="row">${icon('camera')}<div><b style="font-size:13.5px">أساسيات المكياج</b><div class="faint" style="font-size:12px">١٠:٠٠ ص · استوديو النور</div></div></div>
            <div class="divider"></div><b class="mb" style="display:block">خطة الأسبوع</b>
            <div class="faint" style="font-size:13px">٤ مقاطع مجدولة · ٢ قيد الإنتاج · حملة واحدة نشطة</div></div>`)}
        </div>`
      + `<div class="grid g-4 mb">${[['المشاهدات', '4.8M'], ['متابعون جدد', '+34K'], ['التفاعل', '7.8%'], ['منشورات', '٦١']].map(k => `<div class="stat"><div class="st-val" style="font-size:22px">${k[1]}</div><div class="st-lbl">${k[0]}</div></div>`).join('')}</div>`
      + card(`<div class="card-pad"><div class="row between"><b>تسجيل فكرة سريعة</b>${icon('bulb')}</div><div class="row mt-s"><input class="inp" placeholder="اكتب فكرتك أو سجّلها صوتيًا..."><button class="btn btn-primary">إرسال</button></div></div>`);
  }

  /* ------------------------------- SETTINGS ------------------------------- */
  function settings() {
    return head('الإعدادات', 'إعدادات الحساب والمظهر واللغة.', '')
      + `<div class="grid g-2">
          ${card(cardHead('الحساب') + `<div class="card-pad">
            <div class="field"><label>اسم صانع المحتوى</label><input class="inp" value="ليان القحطاني"></div>
            <div class="field"><label>البريد</label><input class="inp" value="creator@example.sa"></div>
            <div class="field"><label>نوع الحساب</label><input class="inp" value="فردي — باقة الاحتراف" disabled></div>
          </div>`)}
          ${card(cardHead('المظهر واللغة') + `<div class="card-pad">
            <div class="row between mb"><b style="font-size:13.5px">الوضع الداكن</b><button class="btn btn-sm btn-ghost" id="themeToggle2">${icon('moon')} تبديل</button></div>
            <div class="field"><label>اللغة</label><select class="sel"><option>العربية (افتراضي)</option><option>English</option></select></div>
            <div class="field"><label>المنطقة الزمنية</label><select class="sel"><option>الرياض (GMT+3)</option></select></div>
          </div>`)}
        </div>`;
  }

  /* ============================ NOVAMETRICS ADMIN ========================= */
  function admin() {
    const stats = [
      { icon: 'money', tint: 'var(--green-tint)', ink: 'var(--green)', value: '٢٣٬٣٨٠', label: 'الإيراد الشهري المتكرر (ر.س)', delta: '+9%', up: true },
      { icon: 'users', tint: 'var(--primary-soft)', ink: 'var(--primary-ink)', value: '٥', label: 'العملاء النشطون', delta: '+1', up: true },
      { icon: 'alert', tint: 'var(--rose-tint)', ink: 'var(--rose)', value: '١', label: 'معرّض للإلغاء', delta: 'انتباه', up: false },
      { icon: 'chart', tint: 'var(--accent-tint)', ink: '#0e7490', value: '٦٨٪', label: 'متوسط الاستخدام', delta: '+4%', up: true },
    ];
    return head('لوحة نوفاميتريكس', 'إدارة العملاء والاشتراكات والربحية وصحة النظام.',
      btn('عميل جديد', 'plus', 'btn-primary'))
      + `<div class="grid g-4 mb">${stats.map(stat).join('')}</div>`
      + `<div class="grid g-12">
          ${card(cardHead('العملاء', 'الحالة والتهيئة والصحة', btn('الكل', '', 'btn-sm btn-ghost')) + `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>العميل</th><th>الباقة</th><th>MRR</th><th>مدير الحساب</th><th>الصحة</th><th>الاستخدام</th></tr></thead><tbody>
            ${D.clients.map(c => `<tr><td><b>${c.name}</b><br><span class="faint" style="font-size:11px">${c.onboarding}</span></td><td><span class="badge b-primary">${c.plan}</span></td><td class="tnum">${c.mrr}</td><td>${c.am}</td>
              <td><span class="badge ${c.health === 'ممتاز' ? 'b-green' : c.health.includes('إلغاء') ? 'b-rose' : 'b-amber'}">${c.health}</span></td><td style="min-width:110px">${meter(c.usage)}</td></tr>`).join('')}
          </tbody></table></div>`)}
          <div>
            ${card(cardHead('صحة النظام') + `<div class="card-pad">${[['التكاملات', 'جيد', 'green'], ['قاعدة البيانات', 'مستقر', 'green'], ['طابور المهام', 'طبيعي', 'green'], ['بوابة الدفع', 'مشكلة', 'rose']].map(s => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${s[0]}</span><span class="badge b-${s[2]}">${s[1]}</span></div>`).join('')}</div>`)}
            <div class="mt">${card(`<div class="card-pad"><div class="callout warn">${icon('alert')}<div><b>تهيئة متأخرة</b><p>«نورة العتيبي» — التهيئة قيد الانتظار والتجديد بعد يومين.</p></div></div></div>`)}</div>
          </div>
        </div>`;
  }

  function adminPlans() {
    return head('الباقات والأسعار', 'أسعار أولية لاختبار السوق — قابلة للتعديل من لوحة الإدارة (لا تشمل ضريبة القيمة المضافة).',
      btn('إضافة باقة', 'plus', 'btn-primary'))
      + `<div class="grid g-3 mb">${D.plans.map(p => card(`<div class="card-pad" style="${p.id === 'pro' ? 'border-color:var(--primary);box-shadow:0 0 0 2px var(--primary-soft)' : ''}">
          <div class="row between mb"><b style="font-size:16px">${p.name}</b>${p.managed ? '<span class="badge b-violet">مُدارة</span>' : `<span class="badge b-slate">${p.tag}</span>`}</div>
          <div class="row" style="align-items:baseline;gap:4px"><span class="st-val" style="font-size:26px">${p.price.toLocaleString('ar-EG')}</span><span class="faint">ر.س/شهر</span></div>
          <div class="faint" style="font-size:12px">سنويًا ${p.annual.toLocaleString('ar-EG')} · تأسيس ${p.setup ? p.setup.toLocaleString('ar-EG') : '٠'}</div>
          <div class="divider"></div>
          ${[['صناع المحتوى', p.creators], ['المستخدمون', p.users], ['الحسابات', p.social], ['المشاريع/شهر', p.projects], ['التخزين', p.storage], ['التحليلات', p.analytics], ['الذكاء الاصطناعي', p.ai], ['الدعم', p.support]].map(r => `<div class="row between" style="font-size:12.5px;padding:3px 0"><span class="faint">${r[0]}</span><b>${r[1]}</b></div>`).join('')}
        </div>`)).join('')}</div>`
      + card(cardHead('الإضافات المدفوعة', 'أسعار قابلة للتعديل') + `<div class="card-pad"><div class="grid g-2">${D.addons.map(a => `<div class="row between" style="padding:9px 12px;border:1px solid var(--border);border-radius:var(--r-sm)"><b style="font-size:13px">${a.name}</b><span class="badge b-slate">${a.price}</span></div>`).join('')}</div></div>`);
  }

  function adminProfitability() {
    const rows = [
      ['الانطلاقة', '٩٩٠', '١٥٠', '٨٤٠', '٨٥٪'], ['الاحتراف', '٢٬٤٩٠', '٤٢٠', '٢٬٠٧٠', '٨٣٪'],
      ['النجم', '٧٬٥٠٠', '٤٬٤٨٠', '٣٬٠٢٠', '٤٠٪'], ['الإدارة المتكاملة', '١٥٬٠٠٠', '٦٬٧٠٠', '٨٬٣٠٠', '٥٥٪'], ['الوكالات', '٩٬٩٠٠', '٢٬٩٠٠', '٧٬٠٠٠', '٧١٪'],
    ];
    return head('التكاليف والربحية', 'نموذج تكلفة وربحية لكل باقة — فرضيات قابلة للتعديل (لا تشمل الضريبة).', btn('تصدير CSV', 'doc'))
      + `<div class="grid g-4 mb">${[['هامش متوسط', '٦٧٪', 'green'], ['نقطة التعادل', '٤ عملاء', 'primary'], ['LTV:CAC', '٤.٢×', 'accent'], ['CAC متوسط', '١٬٨٠٠ ر.س', 'slate']].map(k => `<div class="stat"><div class="st-val" style="font-size:22px">${k[1]}</div><div class="st-lbl">${k[0]}</div></div>`).join('')}</div>`
      + card(`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الباقة</th><th>السعر الشهري</th><th>التكلفة المباشرة</th><th>إجمالي الربح</th><th>هامش الربح</th></tr></thead><tbody>
        ${rows.map(r => `<tr><td><b>${r[0]}</b></td><td class="tnum">${r[1]}</td><td class="tnum">${r[2]}</td><td class="tnum" style="color:var(--green)">${r[3]}</td><td><span class="badge ${parseInt(r[4]) >= 70 ? 'b-green' : 'b-amber'}">${r[4]}</span></td></tr>`).join('')}
      </tbody></table></div>`)
      + `<div class="callout info mt">${icon('money')}<div><b>ملاحظة</b><p>الأرقام فرضيات لاختبار السوق؛ تُحدَّث بعد حساب التكلفة الفعلية واستعداد العملاء للدفع. راجع <b>docs/unit-economics-model.csv</b>.</p></div></div>`;
  }

  function adminIntegrations() {
    return head('التكاملات', 'Integration Hub — حالة كل تكامل. لا تكاملات وهمية تدّعي العمل.', '')
      + `<div class="grid g-4">${D.integrations.map(i => card(`<div class="card-pad" style="text-align:center">
          <div class="st-ico" style="margin:0 auto 10px;background:var(--surface-2);color:var(--muted)">${icon('plug')}</div>
          <b style="font-size:14px">${i.name}</b>
          <div class="mt-s"><span class="badge b-${i.color}">${i.status}</span></div>
          <div class="faint mt-s" style="font-size:11.5px">${i.note}</div>
        </div>`)).join('')}</div>`;
  }

  function adminAudit() {
    const logs = [
      ['ليان القحطاني', 'اعتمدت المحتوى', 'يوم في حياتي — v3', 'منذ ساعتين'],
      ['خالد الشمري', 'عدّل السيناريو', 'تجربة الترطيب — v2', 'منذ ٣ ساعات'],
      ['نظام', 'أنشأ تنبيه', 'انتهاء حقوق استخدام', 'اليوم'],
      ['عبدالله الغامدي', 'رفع ملف', 'عقد تعاون.pdf', 'أمس'],
      ['أحمد العلي (نوفاميتريكس)', 'حدّث الباقة', 'ترقية إلى الاحتراف', 'أمس'],
    ];
    return head('سجل التدقيق', 'Audit Log — سجل كامل للأحداث الحساسة، دون تسجيل أي بيانات سرية.', btn('تصدير', 'doc'))
      + card(`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>المستخدم</th><th>الإجراء</th><th>العنصر</th><th>الوقت</th></tr></thead><tbody>
        ${logs.map(l => `<tr><td><b>${l[0]}</b></td><td>${l[1]}</td><td class="faint">${l[2]}</td><td class="faint">${l[3]}</td></tr>`).join('')}
      </tbody></table></div>`);
  }

  return {
    dashboard, onboarding, onboardingStepBody, strategy, pillars, ideas, ideaModal, trends, ai, aiGenerate,
    scripts, production, shoots, calendar, tasks, approvals, assets, analytics, recommendations,
    campaigns, contracts, compliance, crisis, audience, team, portal, settings,
    admin, adminPlans, adminProfitability, adminIntegrations, adminAudit,
    get wzStep() { return wzStep; }, set wzStep(v) { wzStep = v; },
    get ideaView() { return ideaView; }, set ideaView(v) { ideaView = v; },
  };
})();
