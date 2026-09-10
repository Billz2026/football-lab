/*
 * Football Lab Manager — Create Manager layout polish v2.
 *
 * v1 owns detection/field marking. This layer only corrects presentation and
 * deliberately overrides the full-screen club-picker geometry that can remain
 * on the shared modal while the Create Manager step is active.
 */

(function () {
  "use strict";

  var STYLE_ID = "flm-manager-create-responsive-v2-style";
  if (document.getElementById(STYLE_ID)) return;

  var style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
/* Create Manager should be a focused dialog, never a full-height decision surface. */
.modal.manager-create-modal {
  place-items: center !important;
  align-items: center !important;
  box-sizing: border-box;
  padding: clamp(14px, 2vw, 28px) !important;
}

.modal.manager-create-modal .modal-card {
  box-sizing: border-box;
  width: min(980px, calc(100vw - 36px)) !important;
  max-width: 980px !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: calc(100vh - 36px) !important;
  max-height: calc(100dvh - 36px) !important;
  display: block !important;
  margin: auto !important;
  padding: clamp(24px, 3vw, 36px) !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
}

.modal.manager-create-modal .modal-body {
  min-height: 0 !important;
  display: block !important;
  flex: none !important;
  margin-top: 18px !important;
  padding-right: 0 !important;
  overflow: visible !important;
}

.modal.manager-create-modal .eyebrow {
  margin-bottom: 12px;
}

.modal.manager-create-modal .modal-card h2 {
  margin: 0 52px 0 0 !important;
  font-size: clamp(32px, 4vw, 46px);
  line-height: 1.02;
}

.modal.manager-create-modal .modal-copy {
  max-width: 820px;
  margin: 12px 0 0 !important;
  font-size: clamp(13px, 1.45vw, 17px);
  line-height: 1.55 !important;
}

.modal.manager-create-modal .manager-create-fields {
  width: 100%;
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 12px 14px !important;
  align-items: end;
}

.modal.manager-create-modal .manager-create-fields > .manager-create-field {
  min-width: 0;
  grid-column: auto !important;
  margin: 0 !important;
}

.modal.manager-create-modal .manager-create-fields input,
.modal.manager-create-modal .manager-create-fields select,
.modal.manager-create-modal .manager-create-fields textarea {
  width: 100% !important;
  max-width: 100% !important;
  min-height: 46px;
  box-sizing: border-box;
}

.modal.manager-create-modal .modal-actions {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center;
  gap: 10px !important;
  margin-top: 20px !important;
  padding-top: 16px;
  border-top: 1px solid rgba(47, 104, 169, .34);
}

.modal.manager-create-modal .modal-actions button {
  min-height: 46px;
  padding-right: 20px;
  padding-left: 20px;
}

/* Unfolded phones / compact tablets: keep the dialog compact but preserve two columns. */
@media (max-width: 900px) {
  .modal.manager-create-modal {
    padding: 12px !important;
  }

  .modal.manager-create-modal .modal-card {
    width: min(760px, calc(100vw - 24px)) !important;
    max-height: calc(100vh - 24px) !important;
    max-height: calc(100dvh - 24px) !important;
    padding: 22px !important;
  }

  .modal.manager-create-modal .manager-create-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  .modal.manager-create-modal .manager-create-fields > .manager-create-field:last-child:nth-child(odd) {
    grid-column: 1 / -1 !important;
  }
}

/* Folded / narrow phone: one clean column, no sideways compression. */
@media (max-width: 559px) {
  .modal.manager-create-modal {
    align-items: flex-start !important;
    padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left)) !important;
  }

  .modal.manager-create-modal .modal-card {
    width: calc(100vw - 20px) !important;
    max-height: calc(100vh - 20px) !important;
    max-height: calc(100dvh - 20px) !important;
    padding: 18px 16px 16px !important;
  }

  .modal.manager-create-modal .modal-card h2 {
    margin-right: 42px !important;
    font-size: clamp(28px, 9vw, 38px);
  }

  .modal.manager-create-modal .modal-copy {
    font-size: 13px;
    line-height: 1.45 !important;
  }

  .modal.manager-create-modal .manager-create-fields {
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 10px !important;
  }

  .modal.manager-create-modal .manager-create-fields > .manager-create-field {
    grid-column: auto !important;
  }

  .modal.manager-create-modal .modal-actions {
    margin-top: 16px !important;
    padding-top: 14px;
  }
}

/* Short browser viewports: protect the actual controls before decorative spacing. */
@media (max-height: 720px) {
  .modal.manager-create-modal .modal-card {
    padding-top: 18px !important;
    padding-bottom: 16px !important;
  }

  .modal.manager-create-modal .eyebrow {
    margin-bottom: 8px;
  }

  .modal.manager-create-modal .modal-copy {
    margin-top: 8px !important;
    line-height: 1.4 !important;
  }

  .modal.manager-create-modal .modal-body {
    margin-top: 13px !important;
  }

  .modal.manager-create-modal .modal-actions {
    margin-top: 14px !important;
    padding-top: 12px;
  }
}
`;

  document.head.appendChild(style);
})();
