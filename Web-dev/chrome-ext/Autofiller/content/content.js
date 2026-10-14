(() => {
  // The page controller keeps element references only in memory; it never reads field values.
  if (window.__autofillerController) return;
  window.__autofillerController = true;

  const MAX_FIELDS = 5;
  const selected = new Map();
  let selecting = false;
  let toastTimer;
  let toastHost;
  let toastText;

  const PROFILE_LABELS = {
    firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone', address: 'Address'
  };
  const BLOCKED_WORDS = /pass(word)?|secret|token|api.?key|auth|credential|credit.?card|card.?number|cvv|cvc|security.?code|ssn|social.?security|tax.?id|national.?id|passport|routing|iban|bank.?account|one.?time.?code|otp|pin|birth.?date|date.?of.?birth|username|user.?name/i;
  const BLOCKED_AUTOCOMPLETE = /^(current-password|new-password|one-time-code|cc-|transaction-amount|transaction-currency|username|webauthn)/i;

  function showToast(message) {
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.style.cssText = 'all:initial;position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;pointer-events:none;';
      const root = toastHost.attachShadow({ mode: 'open' });
      const box = document.createElement('div');
      box.style.cssText = 'font:13px/1.45 system-ui,sans-serif;background:#202124;color:#fff;padding:10px 14px;border-radius:12px;box-shadow:0 5px 22px #0005;max-width:min(420px,90vw);text-align:center;';
      toastText = document.createElement('span'); box.append(toastText); root.append(box); (document.documentElement || document.body).append(toastHost);
    }
    toastText.textContent = message;
    toastHost.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { if (toastHost) toastHost.hidden = true; }, 2800);
  }

  function describeField(element) {
    if (!(element instanceof Element)) return null;
    const tag = element.tagName.toLowerCase();
    if (!['input', 'textarea', 'select'].includes(tag)) return null;
    if (element.disabled || element.readOnly || element.getAttribute('aria-disabled') === 'true') return null;
    if (tag === 'input' && !['text', 'email', 'tel', ''].includes((element.getAttribute('type') || 'text').toLowerCase())) return null;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (rect.width < 2 || rect.height < 2 || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return null;

    const autocomplete = (element.getAttribute('autocomplete') || '').trim().toLowerCase();
    const metadata = [element.getAttribute('name'), element.id, element.getAttribute('placeholder'), element.getAttribute('aria-label'), autocomplete];
    if (metadata.some(value => value && (BLOCKED_WORDS.test(value) || BLOCKED_AUTOCOMPLETE.test(value)))) return null;

    let label = '';
    if (element.labels?.length) label = [...element.labels].map(item => item.innerText || item.textContent || '').join(' ').trim();
    if (!label && element.id) {
      const root = element.getRootNode();
      const labelNode = root.querySelector?.(`label[for="${CSS.escape(element.id)}"]`);
      if (labelNode) label = labelNode.innerText || labelNode.textContent || '';
    }
    if (!label) label = element.getAttribute('aria-label') || element.getAttribute('placeholder') || element.getAttribute('name') || '';
    label = label.replace(/\s+/g, ' ').trim().slice(0, 100);
    if (BLOCKED_WORDS.test(label)) return null;
    return { tag, label: label || `${tag} field`, type: tag === 'input' ? (element.type || 'text') : tag, element };
  }

  function updateSelectionStatus() {
    const count = selected.size;
    showToast(selecting ? `Select up to ${MAX_FIELDS} fields (${count}/${MAX_FIELDS}). Press Esc to stop.` : `${count} field${count === 1 ? '' : 's'} selected.`);
  }

  function setFieldOutline(element, color) {
    element.style.setProperty('outline', `2px solid ${color || '#6857e8'}`, 'important');
    element.style.setProperty('outline-offset', '2px', 'important');
  }

  function restoreFieldOutline(element, saved) {
    if (saved.outline.value) element.style.setProperty('outline', saved.outline.value, saved.outline.priority);
    else element.style.removeProperty('outline');
    if (saved.offset.value) element.style.setProperty('outline-offset', saved.offset.value, saved.offset.priority);
    else element.style.removeProperty('outline-offset');
  }

  function onPageClick(event) {
    if (!selecting) return;
    const path = event.composedPath?.() || [event.target];
    if (toastHost && path.includes(toastHost)) return;
    const candidate = path.find(item => item instanceof Element && ['INPUT', 'TEXTAREA', 'SELECT'].includes(item.tagName));
    const info = describeField(candidate);
    if (!info) {
      event.preventDefault(); event.stopImmediatePropagation();
      showToast('Choose a visible text, email, phone, textarea, or select field. Password and sensitive fields are excluded.');
      return;
    }
    event.preventDefault(); event.stopImmediatePropagation();
    if (selected.has(info.element)) { showToast('That field is already selected.'); return; }
    if (selected.size >= MAX_FIELDS) { selecting = false; showToast('Five fields selected. Reopen Autofiller to map and fill them.'); return; }
    const id = `field-${crypto.randomUUID()}`;
    const savedOutline = {
      outline: { value: candidate.style.getPropertyValue('outline'), priority: candidate.style.getPropertyPriority('outline') },
      offset: { value: candidate.style.getPropertyValue('outline-offset'), priority: candidate.style.getPropertyPriority('outline-offset') }
    };
    selected.set(info.element, { id, label: info.label, tag: info.tag, type: info.type, savedOutline });
    setFieldOutline(candidate);
    updateSelectionStatus();
    if (selected.size >= MAX_FIELDS) { selecting = false; showToast('Five fields selected. Reopen Autofiller to map and fill them.'); }
  }

  function onKeyDown(event) {
    if (selecting && event.key === 'Escape') { selecting = false; showToast('Field selection stopped. Your selected fields are ready to map.'); }
  }

  function beginSelection() {
    if (selected.size >= MAX_FIELDS) { showToast('Clear the current mapping before selecting more fields.'); return; }
    selecting = true;
    if (!window.__autofillerPickListener) {
      document.addEventListener('click', onPageClick, true);
      document.addEventListener('keydown', onKeyDown, true);
      window.__autofillerPickListener = true;
    }
    showToast(`Click a visible form field to select it (${selected.size}/${MAX_FIELDS}). Press Esc to stop.`);
  }

  function clearSelection() {
    selecting = false;
    for (const [element, details] of selected) restoreFieldOutline(element, details.savedOutline);
    selected.clear();
    showToast('Current field mapping cleared.');
  }

  function getState() {
    return { ok: true, selecting, fields: [...selected.values()].map(({ id, label, tag, type }) => ({ id, label, tag, type })) };
  }

  function findSelectOption(select, rawValue) {
    const value = String(rawValue).trim();
    const normalized = value.toLocaleLowerCase();
    return [...select.options].find(option => !option.disabled && (option.value.trim().toLocaleLowerCase() === normalized || option.textContent.trim().toLocaleLowerCase() === normalized));
  }

  function setNativeValue(element, value) {
    const prototype = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype
      : element.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (setter) setter.call(element, value); else element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  function fillFields(mappings) {
    if (!Array.isArray(mappings)) return { ok: false, error: 'No field mappings were provided.' };
    let filled = 0, skipped = 0;
    for (const mapping of mappings.slice(0, MAX_FIELDS)) {
      if (!mapping || !PROFILE_LABELS[mapping.profileKey] || typeof mapping.value !== 'string' || !mapping.value.trim()) { skipped++; continue; }
      const entry = [...selected.entries()].find(([, details]) => details.id === mapping.fieldId);
      if (!entry) { skipped++; continue; }
      const [element] = entry;
      const info = describeField(element);
      if (!info) { skipped++; continue; }
      let value = mapping.value;
      if (info.tag === 'select') {
        const option = findSelectOption(element, value);
        if (!option) { skipped++; continue; }
        value = option.value;
      }
      element.focus({ preventScroll: true });
      setNativeValue(element, value);
      setFieldOutline(element, '#27a76b');
      setTimeout(() => { const saved = selected.get(element)?.savedOutline; if (saved) restoreFieldOutline(element, saved); }, 1400);
      filled++;
    }
    const message = filled ? `Filled ${filled} field${filled === 1 ? '' : 's'}${skipped ? `; skipped ${skipped}` : ''}. Forms were not submitted.` : 'No fields were filled. Check the mapping and profile values.';
    showToast(message);
    return { ok: true, filled, skipped, status: message };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'AUTOFILLER_COMMAND') return;
    try {
      let result;
      switch (message.command) {
        case 'getState': result = getState(); break;
        case 'startSelection': beginSelection(); result = getState(); break;
        case 'stopSelection': selecting = false; result = getState(); showToast('Field selection stopped.'); break;
        case 'clearMapping': clearSelection(); result = getState(); break;
        case 'fill': result = fillFields(message.payload?.mappings); break;
        default: result = { ok: false, error: 'Unknown Autofiller action.' };
      }
      sendResponse(result);
    } catch (error) { sendResponse({ ok: false, error: error?.message || 'Autofiller could not complete this action.' }); }
    return true;
  });
})();
