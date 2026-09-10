/* Football Lab Manager — Create Manager full-screen Fold layout v3.1 */
(function () {
  'use strict';

  const STYLE_ID = 'flm-manager-create-v3-style';
  const ACTIVE_CLASS = 'manager-create-v3';

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.modal.${ACTIVE_CLASS} {
  inset: 0 !important;
  display: block !important;
  padding: 0 !important;
  place-items: stretch !important;
  align-items: stretch !important;
  overflow: hidden !important;
}

.modal.${ACTIVE_CLASS} .modal-backdrop {
  background: #031021 !important;
  backdrop-filter: none !important;
}

.modal.${ACTIVE_CLASS} .modal-card {
  position: relative !important;
  z-index: 1;
  width: 100vw !important;
  max-width: none !important;
  height: 100vh !important;
  height: 100dvh !important;
  min-height: 100vh !important;
  min-height: 100dvh !important;
  max-height: none !important;
  margin: 0 !important;
  padding: clamp(28px, 4.2vw, 58px) !important;
  border: 0 !important;
  border-radius: 0 !important;
  overflow: hidden !important;
  display: grid !important;
  grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr) !important;
  grid-template-rows: auto auto 1fr auto !important;
  grid-template-areas:
    'eyebrow body'
    'title body'
    'copy body'
    '. actions' !important;
  column-gap: clamp(28px, 4vw, 64px) !important;
  row-gap: 12px !important;
  background:
    linear-gradient(90deg, rgba(3,16,33,.96) 0 41%, rgba(3,16,33,.82) 52%, rgba(3,16,33,.98) 100%),
    url('./assets/homepage/stadium-home.webp') center/cover no-repeat !important;
  box-shadow: none !important;
  transform: none !important;
}

.modal.${ACTIVE_CLASS} .modal-card::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 42%;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(62,127,199,.58) 18%, rgba(62,127,199,.58) 82%, transparent);
  pointer-events: none;
}

.modal.${ACTIVE_CLASS} #modalEyebrow {
  grid-area: eyebrow;
  align-self: end;
  margin: 0 0 8px !important;
  color: #f4c342 !important;
  font-size: clamp(10px, 1.15vw, 14px) !important;
  letter-spacing: .22em !important;
}

.modal.${ACTIVE_CLASS} #modalTitle {
  grid-area: title;
  align-self: start;
  margin: 0 !important;
  max-width: 10ch;
  color: #f4f7fb !important;
  font-size: clamp(42px, 6vw, 76px) !important;
  line-height: .94 !important;
  letter-spacing: -.045em !important;
}

.modal.${ACTIVE_CLASS} #modalCopy {
  grid-area: copy;
  align-self: start;
  max-width: 34ch !important;
  margin: 10px 0 0 !important;
  color: #afc0cf !important;
  font-size: clamp(15px, 1.8vw, 21px) !important;
  line-height: 1.58 !important;
}

.modal.${ACTIVE_CLASS} #modalBody {
  grid-area: body;
  align-self: center;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 0 0 clamp(6px, 1vw, 14px) !important;
  overflow: hidden !important;
}

.modal.${ACTIVE_CLASS} #modalBody > *,
.modal.${ACTIVE_CLASS} #modalBody form,
.modal.${ACTIVE_CLASS} .manager-create-fields,
.modal.${ACTIVE_CLASS} .manager-create-field,
.modal.${ACTIVE_CLASS} .manager-create-field > * {
  min-width: 0 !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.modal.${ACTIVE_CLASS} #modalActions {
  grid-area: actions;
  align-self: end;
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  margin: 0 !important;
  padding: 20px 0 0 clamp(6px, 1vw, 14px) !important;
  border-top: 1px solid rgba(47,104,169,.45) !important;
}

.modal.${ACTIVE_CLASS} #modalActions button {
  min-width: 132px;
  min-height: 52px;
  padding: 0 22px !important;
  font-size: 11px !important;
}

.modal.${ACTIVE_CLASS} .modal-close {
  top: 22px !important;
  right: 22px !important;
  z-index: 4;
  width: 46px !important;
  height: 46px !important;
}

.modal.${ACTIVE_CLASS} .manager-create-fields {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 16px !important;
  width: 100% !important;
}

.modal.${ACTIVE_CLASS} .manager-create-fields > .manager-create-field {
  min-width: 0 !important;
  max-width: 100% !important;
  margin: 0 !important;
}

.modal.${ACTIVE_CLASS} .manager-create-fields > .manager-create-field:last-child:nth-child(odd) {
  grid-column: 1 / -1 !important;
}

.modal.${ACTIVE_CLASS} .manager-create-fields input,
.modal.${ACTIVE_CLASS} .manager-create-fields select,
.modal.${ACTIVE_CLASS} .manager-create-fields textarea {
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  min-height: 60px !important;
  box-sizing: border-box !important;
  font-size: 17px !important;
}

/* Z Fold unfolded / compact tablet portrait: use the full width as a single composition.
   The previous desktop split squeezed the form past the right edge. */
@media (min-width: 701px) and (max-width: 1180px) {
  .modal.${ACTIVE_CLASS} .modal-card {
    grid-template-columns: minmax(0, 1fr) !important;
    grid-template-rows: auto auto auto minmax(0, 1fr) auto !important;
    grid-template-areas: 'eyebrow' 'title' 'copy' 'body' 'actions' !important;
    row-gap: 8px !important;
    padding: clamp(24px, 3.3vw, 36px) clamp(28px, 4.2vw, 46px) clamp(22px, 3vw, 34px) !important;
    background:
      linear-gradient(180deg, rgba(3,16,33,.90) 0%, rgba(3,16,33,.80) 46%, rgba(3,16,33,.95) 100%),
      url('./assets/homepage/stadium-home.webp') center/cover no-repeat !important;
  }

  .modal.${ACTIVE_CLASS} .modal-card::after {
    display: none !important;
  }

  .modal.${ACTIVE_CLASS} #modalEyebrow {
    align-self: start;
    margin: 0 64px 6px 0 !important;
  }

  .modal.${ACTIVE_CLASS} #modalTitle {
    max-width: none !important;
    margin-right: 64px !important;
    font-size: clamp(42px, 7vw, 64px) !important;
    line-height: .96 !important;
  }

  .modal.${ACTIVE_CLASS} #modalCopy {
    max-width: 760px !important;
    margin: 8px 64px 0 0 !important;
    font-size: clamp(14px, 2vw, 18px) !important;
    line-height: 1.45 !important;
  }

  .modal.${ACTIVE_CLASS} #modalBody {
    align-self: start;
    width: 100% !important;
    max-width: 100% !important;
    padding: clamp(18px, 3vh, 32px) 0 0 !important;
    overflow: hidden !important;
  }

  .modal.${ACTIVE_CLASS} #modalBody > *,
  .modal.${ACTIVE_CLASS} #modalBody form {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
  }

  .modal.${ACTIVE_CLASS} .manager-create-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 14px 16px !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .modal.${ACTIVE_CLASS} .manager-create-fields > .manager-create-field,
  .modal.${ACTIVE_CLASS} .manager-create-fields > .manager-create-field > *,
  .modal.${ACTIVE_CLASS} .manager-create-fields input,
  .modal.${ACTIVE_CLASS} .manager-create-fields select,
  .modal.${ACTIVE_CLASS} .manager-create-fields textarea {
    min-width: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
  }

  .modal.${ACTIVE_CLASS} .manager-create-fields > .manager-create-field:last-child:nth-child(odd) {
    grid-column: 1 / -1 !important;
  }

  .modal.${ACTIVE_CLASS} #modalActions {
    width: 100% !important;
    padding: 14px 0 0 !important;
    margin: 0 !important;
  }

  .modal.${ACTIVE_CLASS} .modal-close {
    top: 18px !important;
    right: 18px !important;
  }
}

/* Folded / narrow phone: preserve the existing single-column layout. */
@media (max-width: 700px) {
  .modal.${ACTIVE_CLASS} .modal-card {
    overflow-y: auto !important;
    grid-template-columns: 1fr !important;
    grid-template-rows: auto auto auto auto auto !important;
    grid-template-areas: 'eyebrow' 'title' 'copy' 'body' 'actions' !important;
    row-gap: 12px !important;
    padding: max(22px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left)) !important;
    background: linear-gradient(180deg, rgba(3,16,33,.94), rgba(3,16,33,.985)), url('./assets/homepage/stadium-home.webp') center/cover no-repeat !important;
  }
  .modal.${ACTIVE_CLASS} .modal-card::after { display: none; }
  .modal.${ACTIVE_CLASS} #modalTitle { max-width: none; font-size: clamp(38px, 11vw, 56px) !important; }
  .modal.${ACTIVE_CLASS} #modalCopy { max-width: none !important; font-size: 14px !important; }
  .modal.${ACTIVE_CLASS} #modalBody { align-self: start; padding: 12px 0 0 !important; overflow: visible !important; }
  .modal.${ACTIVE_CLASS} .manager-create-fields { grid-template-columns: 1fr !important; gap: 12px !important; }
  .modal.${ACTIVE_CLASS} .manager-create-fields > .manager-create-field { grid-column: auto !important; }
  .modal.${ACTIVE_CLASS} #modalActions { padding-left: 0 !important; }
  .modal.${ACTIVE_CLASS} #modalActions button { flex: 1 1 0; min-width: 0; }
}
`;
    document.head.appendChild(style);
  }

  function isCreateManager(modal) {
    const eyebrow = (document.getElementById('modalEyebrow')?.textContent || '').toUpperCase();
    const title = (document.getElementById('modalTitle')?.textContent || '').toUpperCase();
    const text = (modal?.textContent || '').toUpperCase();
    return eyebrow.includes('CREATE MANAGER') || title.includes('YOUR MANAGER') || (text.includes('FIRST NAME') && text.includes('SURNAME') && text.includes('NATIONALITY'));
  }

  function sync() {
    const modal = document.getElementById('appModal');
    if (!modal) return;
    const active = modal.classList.contains('is-open') && isCreateManager(modal);
    modal.classList.toggle(ACTIVE_CLASS, active);
  }

  function boot() {
    installStyles();
    const modal = document.getElementById('appModal');
    if (!modal) return;
    const observer = new MutationObserver(() => requestAnimationFrame(sync));
    observer.observe(modal, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'aria-hidden'] });
    window.addEventListener('resize', sync, { passive: true });
    sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
