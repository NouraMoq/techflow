/* ============================================================================
   UI helpers — icons, component builders, toast, modal. No dependencies.
   ========================================================================== */
window.UI = (function () {
  // Minimal inline SVG icon set (stroke = currentColor)
  const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const icons = {
    home: P('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
    rocket: P('<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2"/><path d="M9 12a15 15 0 0 1 8-8c3 0 3 0 3 3a15 15 0 0 1-8 8"/><circle cx="14.5" cy="9.5" r="1.5"/><path d="M9 12l-3 .5L11 18l.5-3"/>'),
    target: P('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
    columns: P('<rect x="3" y="4" width="6" height="16" rx="1.5"/><rect x="10.5" y="4" width="6" height="16" rx="1.5"/><rect x="18" y="4" width="3" height="16" rx="1.5"/>'),
    bulb: P('<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z"/>'),
    trend: P('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
    script: P('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 12h7M9 16h7M9 8h2"/>'),
    workflow: P('<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h6a3 3 0 0 1 3 3v6"/>'),
    camera: P('<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    calendar: P('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>'),
    tasks: P('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'),
    check: P('<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
    folder: P('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    chart: P('<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>'),
    sparkles: P('<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>'),
    handshake: P('<path d="M8 12l3-3 2 2 3-3"/><path d="M3 8l4-2 5 3 5-3 4 2v6l-4 4-3-2"/>'),
    doc: P('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>'),
    shield: P('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="m9 12 2 2 4-4"/>'),
    alert: P('<path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17v.5"/>'),
    users: P('<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 6a3 3 0 0 1 0 6M17 14c2.5.7 4 2.6 4 6"/>'),
    chat: P('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>'),
    portal: P('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><circle cx="7" cy="6.5" r=".6"/>'),
    grid: P('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    money: P('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v6M18 9v6"/>'),
    plug: P('<path d="M9 3v6M15 3v6"/><path d="M7 9h10v3a5 5 0 0 1-10 0z"/><path d="M12 17v4"/>'),
    bell: P('<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    gear: P('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
    life: P('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5 5l3.5 3.5M15.5 15.5 19 19M19 5l-3.5 3.5M8.5 15.5 5 19"/>'),
    search: P('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    clock: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    plus: P('<path d="M12 5v14M5 12h14"/>'),
    file: P('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>'),
    x: P('<path d="M6 6l12 12M18 6 6 18"/>'),
    menu: P('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    moon: P('<path d="M20 14A8 8 0 0 1 10 4a7 7 0 1 0 10 10z"/>'),
    building: P('<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>'),
    audit: P('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
    heart: P('<path d="M12 20s-7-4.3-9.2-8.4C1.2 8.7 2.6 5.5 5.6 5.1 7.7 4.8 9.4 6 12 9c2.6-3 4.3-4.2 6.4-3.9 3 .4 4.4 3.6 2.8 6.5C19 15.7 12 20 12 20z"/>'),
    edit: P('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>'),
    eye: P('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
  };
  const icon = (n) => icons[n] || icons.grid;

  const av = (letter, color) => `<span class="u-av" style="background:${color}">${letter}</span>`;
  const initials = (name) => name.trim().charAt(0);

  // Toast
  function toast(msg, kind) {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${icon(kind === 'ok' ? 'check' : 'bell')}<span>${msg}</span>`;
    t.querySelector('svg').style.cssText = 'width:18px;height:18px;color:' + (kind === 'ok' ? '#4ade80' : '#93c5fd');
    box.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; t.style.transition = '.25s'; }, 2600);
    setTimeout(() => t.remove(), 2900);
  }

  // Modal
  function modal(title, bodyHTML, footHTML) {
    closeModal();
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>${title}</h3><button class="tb-btn" data-close style="margin-inline-start:auto">${icon('x')}</button></div>
      <div class="modal-body">${bodyHTML}</div>
      ${footHTML ? `<div class="modal-foot">${footHTML}</div>` : ''}
    </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('on'));
    ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('[data-close]')) closeModal(); });
    return ov;
  }
  function closeModal() {
    const ov = document.querySelector('.overlay');
    if (ov) { ov.classList.remove('on'); setTimeout(() => ov.remove(), 200); }
  }

  // Small builders
  const stat = (s) => `<div class="stat">
      <div class="st-ico" style="background:${s.tint};color:${s.ink}">${icon(s.icon)}</div>
      <div class="st-val">${s.value}</div>
      <div class="st-lbl">${s.label}</div>
      ${s.delta ? `<div class="st-delta ${s.up ? 'delta-up' : 'delta-down'}">${s.up ? '▲' : '▼'} ${s.delta}</div>` : ''}
    </div>`;

  const meter = (pct, color) => `<div class="meter"><div class="bar"><i style="width:${pct}%;background:${color || 'var(--primary)'}"></i></div><span class="mv">${pct}%</span></div>`;

  const badgeFor = (color) => ({ slate: 'b-slate', green: 'b-green', amber: 'b-amber', rose: 'b-rose', accent: 'b-accent', violet: 'b-violet', primary: 'b-primary' }[color] || 'b-slate');

  return { icon, av, initials, toast, modal, closeModal, stat, meter, badgeFor };
})();
