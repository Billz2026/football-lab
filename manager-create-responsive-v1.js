/*
 * Football Lab Manager — Create Manager responsive modal patch.
 *
 * This module is deliberately scoped to the Create Manager flow. It leaves
 * the shared modal presentation untouched for every other manager screen.
 */

(function () {
  "use strict";

  var MODAL_CLASS = "manager-create-modal";
  var FIELDS_CLASS = "manager-create-fields";
  var FIELD_CLASS = "manager-create-field";
  var STYLE_ID = "flm-manager-create-responsive-style";

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "@media (max-width: 899px) {",
      "  .modal." + MODAL_CLASS + " {",
      "    align-items: flex-start;",
      "    box-sizing: border-box;",
      "    padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));",
      "  }",
      "  .modal." + MODAL_CLASS + " .modal-card {",
      "    box-sizing: border-box;",
      "    width: min(720px, calc(100vw - 24px));",
      "    height: auto !important;",
      "    min-height: 0 !important;",
      "    max-height: calc(100vh - 24px) !important;",
      "    max-height: calc(100dvh - 24px) !important;",
      "    margin: auto;",
      "    padding: 18px 18px 16px;",
      "    overflow-x: hidden !important;",
      "    overflow-y: auto !important;",
      "    overscroll-behavior: contain;",
      "  }",
      "  .modal." + MODAL_CLASS + " .modal-content {",
      "    min-height: 0 !important;",
      "  }",
      "  .modal." + MODAL_CLASS + " .modal-content h1,",
      "  .modal." + MODAL_CLASS + " .modal-content h2,",
      "  .modal." + MODAL_CLASS + " .modal-content h3 {",
      "    margin-top: 0;",
      "    margin-right: 42px;",
      "    margin-bottom: 8px;",
      "    line-height: 1.15;",
      "  }",
      "  .modal." + MODAL_CLASS + " .modal-content p {",
      "    margin-top: 6px;",
      "    margin-bottom: 12px;",
      "  }",
      "  .modal." + MODAL_CLASS + " ." + FIELD_CLASS + " {",
      "    min-width: 0;",
      "  }",
      "  .modal." + MODAL_CLASS + " ." + FIELDS_CLASS + " input,",
      "  .modal." + MODAL_CLASS + " ." + FIELDS_CLASS + " select,",
      "  .modal." + MODAL_CLASS + " ." + FIELDS_CLASS + " textarea {",
      "    box-sizing: border-box;",
      "    max-width: 100%;",
      "  }",
      "}",
      "@media (min-width: 560px) and (max-width: 899px) {",
      "  .modal." + MODAL_CLASS + " ." + FIELDS_CLASS + " {",
      "    display: grid !important;",
      "    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;",
      "    column-gap: 14px !important;",
      "    row-gap: 10px !important;",
      "    align-items: end;",
      "  }",
      "  .modal." + MODAL_CLASS + " ." + FIELDS_CLASS + " > ." + FIELD_CLASS + " {",
      "    margin: 0 !important;",
      "  }",
      "  .modal." + MODAL_CLASS + " ." + FIELDS_CLASS + " > :not(." + FIELD_CLASS + ") {",
      "    grid-column: 1 / -1;",
      "  }",
      "}",
      "@media (max-width: 559px) {",
      "  .modal." + MODAL_CLASS + " .modal-card {",
      "    width: calc(100vw - 20px);",
      "    max-height: calc(100vh - 20px) !important;",
      "    max-height: calc(100dvh - 20px) !important;",
      "    padding: 16px 14px 14px;",
      "  }",
      "  .modal." + MODAL_CLASS + " ." + FIELDS_CLASS + " {",
      "    display: grid !important;",
      "    grid-template-columns: minmax(0, 1fr) !important;",
      "    gap: 9px !important;",
      "  }",
      "  .modal." + MODAL_CLASS + " ." + FIELDS_CLASS + " > ." + FIELD_CLASS + " {",
      "    margin: 0 !important;",
      "  }",
      "}",
      "@media (max-width: 899px) and (max-height: 520px) {",
      "  .modal." + MODAL_CLASS + " .modal-card {",
      "    padding-top: 14px;",
      "    padding-bottom: 12px;",
      "  }",
      "}"
    ].join("\n");

    document.head.appendChild(style);
  }

  function normaliseText(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function controlDescriptor(control, root) {
    var bits = [
      control.name,
      control.id,
      control.placeholder,
      control.getAttribute("aria-label")
    ];

    var wrappingLabel = control.closest("label");
    if (wrappingLabel) bits.push(wrappingLabel.textContent);

    if (control.id) {
      try {
        var explicitLabel = root.querySelector('label[for="' + CSS.escape(control.id) + '"]');
        if (explicitLabel) bits.push(explicitLabel.textContent);
      } catch (error) {
        /* CSS.escape is not essential to layout detection. */
      }
    }

    return normaliseText(bits.filter(Boolean).join(" "));
  }

  function isManagerCreation(root) {
    var controls = Array.prototype.slice.call(root.querySelectorAll("input, select, textarea"))
      .filter(function (control) {
        return (control.type || "").toLowerCase() !== "hidden";
      });

    if (controls.length < 2) return false;

    var text = normaliseText(root.textContent);
    if (/\bcreate\s+(?:your\s+)?manager\b/.test(text)) return true;
    if (/\bmanager\s+(?:details|profile|identity|information)\b/.test(text)) return true;

    var cuePattern = /\b(first\s*name|surname|last\s*name|nationality|date\s*of\s*birth|dob|manager\s*name)\b/;
    var cueCount = controls.reduce(function (count, control) {
      return count + (cuePattern.test(controlDescriptor(control, root)) ? 1 : 0);
    }, 0);

    return /\bmanager\b/.test(text) && cueCount >= 2;
  }

  function fieldWrapper(control, root) {
    var selectors = [
      ".form-field",
      ".form-group",
      ".field",
      ".input-group",
      ".select-group",
      ".control-group",
      ".form-control-wrap",
      "label"
    ];

    var wrapper = control.closest(selectors.join(","));
    if (!wrapper || wrapper === root || wrapper.tagName === "FORM") {
      wrapper = control.parentElement;
    }

    if (!wrapper || wrapper === root || wrapper.tagName === "FORM") return control;
    return wrapper;
  }

  function markBestFieldGrid(root) {
    Array.prototype.forEach.call(root.querySelectorAll("." + FIELDS_CLASS), function (node) {
      node.classList.remove(FIELDS_CLASS);
    });
    Array.prototype.forEach.call(root.querySelectorAll("." + FIELD_CLASS), function (node) {
      node.classList.remove(FIELD_CLASS);
    });

    var controls = Array.prototype.slice.call(root.querySelectorAll("input, select, textarea"))
      .filter(function (control) {
        var type = (control.type || "").toLowerCase();
        return type !== "hidden" && type !== "button" && type !== "submit" && type !== "reset";
      });

    var groups = [];

    controls.forEach(function (control) {
      var wrapper = fieldWrapper(control, root);
      var parent = wrapper.parentElement;
      if (!parent || parent === root && wrapper === control) return;

      var existing = groups.find(function (group) { return group.parent === parent; });
      if (!existing) {
        existing = { parent: parent, wrappers: [] };
        groups.push(existing);
      }
      if (existing.wrappers.indexOf(wrapper) === -1) existing.wrappers.push(wrapper);
    });

    groups.sort(function (a, b) { return b.wrappers.length - a.wrappers.length; });
    var best = groups.find(function (group) { return group.wrappers.length >= 2; });
    if (!best) return;

    best.parent.classList.add(FIELDS_CLASS);
    best.wrappers.forEach(function (wrapper) {
      if (wrapper.parentElement === best.parent) wrapper.classList.add(FIELD_CLASS);
    });
  }

  function boot() {
    installStyles();

    var modal = document.getElementById("appModal");
    var content = document.getElementById("modalContent");
    if (!modal || !content) return;

    var scheduled = false;

    function sync() {
      scheduled = false;
      var active = modal.classList.contains("is-open") && isManagerCreation(content);
      modal.classList.toggle(MODAL_CLASS, active);

      if (active) {
        markBestFieldGrid(content);
      } else {
        Array.prototype.forEach.call(content.querySelectorAll("." + FIELDS_CLASS), function (node) {
          node.classList.remove(FIELDS_CLASS);
        });
        Array.prototype.forEach.call(content.querySelectorAll("." + FIELD_CLASS), function (node) {
          node.classList.remove(FIELD_CLASS);
        });
      }
    }

    function scheduleSync() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(sync);
    }

    new MutationObserver(scheduleSync).observe(content, {
      childList: true,
      subtree: true,
      characterData: true
    });

    new MutationObserver(scheduleSync).observe(modal, {
      attributes: true,
      attributeFilter: ["class", "aria-hidden"]
    });

    window.addEventListener("resize", scheduleSync, { passive: true });
    scheduleSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
