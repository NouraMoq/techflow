/* ============================================================================
   App shell + hash router + interactions. Prototype only (no backend).
   ========================================================================== */
(function () {
  const { icon } = UI;
  const V = VIEWS;

  // Navigation model — grouped
  const NAV = [
    { group: 'الرئيسية', items: [
      { id: 'dashboard', label: 'الرئيسية', icon: 'home', fn: V.dashboard },
      { id: 'onboarding', label: 'الإعداد الأولي', icon: 'rocket', fn: V.onboarding },
    ]},
    { group: 'الاستراتيجية والمحتوى', items: [
      { id: 'strategy', label: 'الهوية والاستراتيجية', icon: 'target', fn: V.strategy },
      { id: 'pillars', label: 'أعمدة المحتوى', icon: 'columns', fn: V.pillars },
      { id: 'ideas', label: 'بنك الأفكار', icon: 'bulb', fn: V.ideas, pill: '10' },
      { id: 'trends', label: 'رادار الترندات', icon: 'trend', fn: V.trends },
      { id: 'ai', label: 'مساعد الذكاء الاصطناعي', icon: 'sparkles', fn: V.ai },
      { id: 'scripts', label: 'السيناريوهات', icon: 'script', fn: V.scripts },
    ]},
    { group: 'الإنتاج', items: [
      { id: 'production', label: 'المحتوى والإنتاج', icon: 'workflow', fn: V.production },
      { id: 'shoots', label: 'جلسات التصوير', icon: 'camera', fn: V.shoots },
      { id: 'calendar', label: 'التقويم', icon: 'calendar', fn: V.calendar },
      { id: 'tasks', label: 'المهام', icon: 'tasks', fn: V.tasks },
      { id: 'approvals', label: 'الموافقات', icon: 'check', fn: V.approvals, pill: '4' },
      { id: 'assets', label: 'مكتبة الملفات', icon: 'folder', fn: V.assets },
    ]},
    { group: 'الأداء والتجارة', items: [
      { id: 'analytics', label: 'التحليلات', icon: 'chart', fn: V.analytics },
      { id: 'recommendations', label: 'التوصيات', icon: 'sparkles', fn: V.recommendations },
      { id: 'campaigns', label: 'الحملات والإعلانات', icon: 'handshake', fn: V.campaigns },
      { id: 'contracts', label: 'العقود والفواتير', icon: 'doc', fn: V.contracts },
      { id: 'compliance', label: 'الامتثال', icon: 'shield', fn: V.compliance },
      { id: 'crisis', label: 'السمعة والأزمات', icon: 'alert', fn: V.crisis },
      { id: 'audience', label: 'الجمهور والأسئلة', icon: 'chat', fn: V.audience },
    ]},
    { group: 'الإدارة', items: [
      { id: 'team', label: 'الفريق والصلاحيات', icon: 'users', fn: V.team },
      { id: 'portal', label: 'بوابة العميل', icon: 'portal', fn: V.portal },
      { id: 'settings', label: 'الإعدادات', icon: 'gear', fn: V.settings },
    ]},
    { group: 'نوفاميتريكس', admin: true, items: [
      { id: 'admin', label: 'لوحة الإدارة', icon: 'grid', fn: V.admin },
      { id: 'admin-plans', label: 'الباقات', icon: 'money', fn: V.adminPlans },
      { id: 'admin-profitability', label: 'التكاليف والربحية', icon: 'chart', fn: V.adminProfitability },
      { id: 'admin-integrations', label: 'التكاملات', icon: 'plug', fn: V.adminIntegrations },
      { id: 'admin-audit', label: 'سجل التدقيق', icon: 'audit', fn: V.adminAudit },
    ]},
  ];
  const findItem = (id) => { for (const g of NAV) { const it = g.items.find(x => x.id === id); if (it) return { it, group: g.group }; } return null; };

  // ---- Sidebar render
  function renderSidebar(active) {
    const nav = document.getElementById('nav');
    nav.innerHTML = NAV.map(g => `
      <div class="nav-group">
        <div class="nav-label">${g.group}</div>
        ${g.items.map(it => `<a class="nav-item ${it.id === active ? 'active' : ''}" href="#${it.id}">
          <span class="ico">${icon(it.icon)}</span><span>${it.label}</span>${it.pill ? `<span class="pill">${it.pill}</span>` : ''}
        </a>`).join('')}
      </div>`).join('');
  }

  // ---- Route
  function route() {
    let id = (location.hash || '#dashboard').slice(1);
    const found = findItem(id);
    if (!found) { id = 'dashboard'; }
    const { it, group } = findItem(id);
    renderSidebar(id);
    document.getElementById('crumbs').innerHTML = `${group} <span>/</span> <b>${it.label}</b>`;
    const content = document.getElementById('content');
    content.innerHTML = it.fn();
    content.scrollTop = 0; window.scrollTo(0, 0);
    // close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('scrim').classList.remove('on');
    bindPageEvents(id);
  }

  // ---- Page-specific event wiring (delegation handles most)
  function bindPageEvents(id) {
    if (id === 'onboarding') {
      const prev = document.querySelector('[data-wz-prev]');
      const next = document.querySelector('[data-wz-next]');
      if (prev) prev.onclick = () => { if (V.wzStep > 0) { V.wzStep--; route(); } };
      if (next) next.onclick = () => {
        if (V.wzStep < DB.onboardingSteps.length - 1) { V.wzStep++; route(); }
        else { UI.toast('تم إنشاء الاستراتيجية الأولية ✓', 'ok'); location.hash = '#strategy'; }
      };
      document.querySelectorAll('[data-wz]').forEach(s => s.onclick = () => { V.wzStep = +s.dataset.wz; route(); });
    }
    if (id === 'ai') { const b = document.getElementById('genBtn'); if (b) b.onclick = V.aiGenerate; }
  }

  // ---- Global delegated events
  document.addEventListener('click', (e) => {
    // idea view switch
    const iv = e.target.closest('[data-iv]');
    if (iv) { V.ideaView = iv.dataset.iv; route(); return; }
    // idea open
    const idea = e.target.closest('[data-idea]');
    if (idea) { V.ideaModal(idea.dataset.idea); return; }
    // approve
    const ap = e.target.closest('[data-approve]');
    if (ap) { UI.toast('تم اعتماد المحتوى ✓', 'ok'); ap.closest('.card').style.opacity = '.55'; return; }
    // recommendation apply
    const rec = e.target.closest('[data-rec]');
    if (rec) { UI.toast('تم تحويل التوصية إلى مهمة', 'ok'); return; }
    // segmented buttons (visual toggle only)
    const seg = e.target.closest('.seg button');
    if (seg && !seg.dataset.iv) { seg.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active')); seg.classList.add('active'); return; }
    // tabs (visual)
    const tab = e.target.closest('.tab');
    if (tab) { tab.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); return; }
    // primary buttons that are just demo -> toast
    const demoBtn = e.target.closest('.btn-primary');
    if (demoBtn && !demoBtn.id && !demoBtn.dataset.approve && !demoBtn.dataset.wzNext && !demoBtn.hasAttribute('data-wz-next')) {
      const label = demoBtn.textContent.trim();
      if (label && !['التالي', 'السابق', 'اعتماد', 'إرسال'].some(x => label.includes(x))) UI.toast('نموذج توضيحي: «' + label + '»');
    }
  });

  // ---- Theme
  function initTheme() {
    const saved = localStorage.getItem('cm-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeToggle').onclick = toggleTheme;
    document.addEventListener('click', (e) => { if (e.target.closest('#themeToggle2')) toggleTheme(); });
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem('cm-theme', cur);
  }

  // ---- Role/tenant switcher (visual context)
  function initSwitchers() {
    const rs = document.getElementById('roleSwitch');
    DB.roles.forEach(r => { const o = document.createElement('option'); o.value = r.id; o.textContent = r.label; rs.appendChild(o); });
    rs.value = 'creator';
    rs.onchange = () => {
      const r = DB.roles.find(x => x.id === rs.value);
      UI.toast('تبديل الدور: ' + r.label);
      // if admin role -> jump to admin dashboard
      if (r.scope === 'admin' && !location.hash.startsWith('#admin')) location.hash = '#admin';
      if (r.scope === 'client' && location.hash.startsWith('#admin')) location.hash = '#dashboard';
    };
  }

  // ---- Mobile sidebar
  function initMobile() {
    const sb = document.getElementById('sidebar'), scrim = document.getElementById('scrim');
    document.getElementById('hamburger').onclick = () => { sb.classList.toggle('open'); scrim.classList.toggle('on'); };
    scrim.onclick = () => { sb.classList.remove('open'); scrim.classList.remove('on'); };
  }

  // ---- Boot
  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', () => {
    initTheme(); initSwitchers(); initMobile(); route();
  });
})();
