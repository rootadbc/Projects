(() => {
  // Keep one controller per tab so popup reopenings retain the current on/off state.
  if (window.__slimeViewController) return;
  window.__slimeViewController = true;

  const POPUP_SELECTORS = [
    '[role="dialog"]', '[aria-modal="true"]', '[class*="modal" i]', '[id*="modal" i]',
    '[class*="popup" i]', '[id*="popup" i]', '[class*="overlay" i]', '[id*="overlay" i]',
    '[class*="subscribe" i]', '[id*="subscribe" i]', '[class*="email-capture" i]',
    '[id*="email-capture" i]', '[class*="consent" i]', '[id*="consent" i]',
    '[class*="banner" i][style*="position: fixed" i]'
  ];
  const hiddenNodes = new Map();
  const blurNodes = new Map();
  const protectedHost = /(^|\.)(bank|banking|gov|government|health|medical|hospital)(\.|$)/i.test(location.hostname);
  let popupEnabled = false;
  let blurEnabled = false;
  let popupObserver = null;
  let blurObserver = null;
  let observedPopupRoots = new WeakSet();
  let observedBlurRoots = new WeakSet();
  let mutationTimer = null;
  let pendingCleanup = null;
  let lastStatus = 'Ready when you are.';

  function snapshot() { return { popups: popupEnabled, blur: blurEnabled }; }
  function status(message) { lastStatus = String(message); }

  function getOpenRoots() {
    const roots = [document];
    const seen = new Set(roots);
    for (let index = 0; index < roots.length; index++) {
      for (const element of roots[index].querySelectorAll('*')) {
        if (element.shadowRoot && !seen.has(element.shadowRoot)) {
          seen.add(element.shadowRoot);
          roots.push(element.shadowRoot);
        }
      }
    }
    return roots;
  }

  function findPopupCandidates() {
    const candidates = new Set();
    const roots = getOpenRoots();
    for (const selector of POPUP_SELECTORS) {
      try { for (const root of roots) root.querySelectorAll(selector).forEach(node => candidates.add(node)); } catch (_) { /* Ignore unsupported selectors. */ }
    }
    return [...candidates].filter(node => node instanceof HTMLElement && node !== document.documentElement && node !== document.body && getComputedStyle(node).display !== 'none');
  }

  function hideElements(nodes) {
    let count = 0;
    for (const node of nodes) {
      if (!node.isConnected) continue;
      if (!hiddenNodes.has(node)) hiddenNodes.set(node, { value: node.style.getPropertyValue('display'), priority: node.style.getPropertyPriority('display') });
      if (node.style.getPropertyValue('display') !== 'none') { node.style.setProperty('display', 'none', 'important'); count++; }
    }
    return count;
  }

  function restoreMap(map) {
    let count = 0;
    for (const [node, values] of map) {
      if (!node.isConnected) continue;
      if ('value' in values && 'priority' in values) {
        if (values.value) node.style.setProperty('display', values.value, values.priority);
        else node.style.removeProperty('display');
      } else {
        for (const [property, prior] of Object.entries(values)) {
          if (prior.value) node.style.setProperty(property, prior.value, prior.priority);
          else node.style.removeProperty(property);
        }
      }
      count++;
    }
    map.clear(); return count;
  }

  function findBlurChanges() {
    const changesByNode = new Map();
    const elements = new Set();
    const roots = getOpenRoots();
    roots[0].querySelectorAll('body *').forEach(node => elements.add(node));
    // Shadow roots do not contain a body element; inspect their local descendants directly.
    for (const root of roots.slice(1)) root.querySelectorAll('*').forEach(node => elements.add(node));
    for (const node of elements) {
      if (!(node instanceof HTMLElement)) continue;
      const style = getComputedStyle(node), changes = {};
      if (/blur\(/i.test(style.filter)) changes.filter = 'none';
      const backdrop = style.backdropFilter || style.webkitBackdropFilter;
      if (/blur\(/i.test(backdrop)) changes['backdrop-filter'] = 'none';
      const opacity = Number(style.opacity);
      const rect = node.getBoundingClientRect();
      if (opacity > 0 && opacity < 0.35 && (style.position === 'fixed' || style.position === 'absolute') && rect.width > 80 && rect.height > 60) changes.opacity = '1';
      if (style.textShadow !== 'none' && node.children.length === 0 && (style.textShadow.match(/,/g) || []).length >= 2) changes['text-shadow'] = 'none';
      if (Object.keys(changes).length) changesByNode.set(node, changes);
    }
    return changesByNode;
  }

  function applyBlurChanges(changesByNode) {
    let count = 0;
    for (const [node, changes] of changesByNode) {
      if (!blurNodes.has(node)) blurNodes.set(node, {});
      for (const [property, value] of Object.entries(changes)) {
        if (!(property in blurNodes.get(node))) blurNodes.get(node)[property] = { value: node.style.getPropertyValue(property), priority: node.style.getPropertyPriority(property) };
        node.style.setProperty(property, value, 'important');
      }
      count++;
    }
    return count;
  }

  function handleMutations() {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      ensureObserver();
      if (popupEnabled) {
        const matches = findPopupCandidates();
        if (matches.length > 25) { pendingCleanup = 'popups'; status(`${matches.length} new popup candidates found. Open slimeView to review and confirm.`); }
        else if (matches.length) status(`Hidden ${hideElements(matches)} new pop-up candidates.`);
      }
      if (blurEnabled) {
        const changes = findBlurChanges();
        if (changes.size > 25) { pendingCleanup = 'blur'; status(`${changes.size} new blur candidates found. Open slimeView to review and confirm.`); }
        else if (changes.size) status(`Cleared visual effects on ${applyBlurChanges(changes)} new elements.`);
      }
    }, 100);
  }

  function ensureObserver() {
    if (!document.body) return;
    const observeOptions = { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'id', 'role', 'aria-modal', 'aria-hidden', 'style', 'hidden'] };
    if (!popupObserver) popupObserver = new MutationObserver(handleMutations);
    if (!blurObserver) blurObserver = new MutationObserver(handleMutations);
    for (const root of getOpenRoots()) {
      if (popupEnabled && !observedPopupRoots.has(root)) { popupObserver.observe(root, observeOptions); observedPopupRoots.add(root); }
      if (blurEnabled && !observedBlurRoots.has(root)) { blurObserver.observe(root, observeOptions); observedBlurRoots.add(root); }
    }
  }

  function setPopupEnabled(enabled, confirmLarge = false) {
    if (protectedHost) { status('Cleanup is disabled on this high-security site.'); return false; }
    if (!enabled) {
      popupEnabled = false; popupObserver?.disconnect(); observedPopupRoots = new WeakSet();
      const restored = restoreMap(hiddenNodes); pendingCleanup = null;
      status(`Pop-up cleanup OFF. Restored ${restored} elements.`); return true;
    }
    const candidates = findPopupCandidates();
    if (candidates.length > 25 && !confirmLarge) { pendingCleanup = 'popups'; status(`Found ${candidates.length} pop-up candidates. Confirm to turn pop-up cleanup ON.`); return false; }
    const count = hideElements(candidates);
    popupEnabled = true; pendingCleanup = null; ensureObserver();
    status(`Pop-up cleanup ON. Hidden ${count} candidates; new pop-ups will be handled while ON.`); return true;
  }

  function setBlurEnabled(enabled, confirmLarge = false) {
    if (protectedHost) { status('Cleanup is disabled on this high-security site.'); return false; }
    if (!enabled) {
      blurEnabled = false; blurObserver?.disconnect(); observedBlurRoots = new WeakSet();
      const restored = restoreMap(blurNodes); pendingCleanup = null;
      status(`Blur removal OFF. Restored ${restored} elements.`); return true;
    }
    const changes = findBlurChanges();
    if (changes.size > 25 && !confirmLarge) { pendingCleanup = 'blur'; status(`Found ${changes.size} blur candidates. Confirm to turn blur removal ON.`); return false; }
    const count = applyBlurChanges(changes);
    blurEnabled = true; pendingCleanup = null; ensureObserver();
    status(`Blur removal ON. Cleared effects on ${count} elements; new effects will be handled while ON.`); return true;
  }

  function restoreAll() {
    popupEnabled = false; blurEnabled = false; popupObserver?.disconnect(); blurObserver?.disconnect(); observedPopupRoots = new WeakSet(); observedBlurRoots = new WeakSet(); pendingCleanup = null;
    const count = restoreMap(hiddenNodes) + restoreMap(blurNodes);
    status(`Both switches OFF. Restored ${count} elements.`);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'SLIMEVIEW_COMMAND') return;
    try {
      switch (message.command) {
        case 'getState': break;
        case 'togglePopups': setPopupEnabled(!popupEnabled); break;
        case 'toggleBlur': setBlurEnabled(!blurEnabled); break;
        case 'confirmCleanup':
          if (pendingCleanup === 'popups') setPopupEnabled(true, true);
          else if (pendingCleanup === 'blur') setBlurEnabled(true, true);
          break;
        case 'undo': restoreAll(); break;
        default: status('Choose a cleanup action.');
      }
      sendResponse({ ok: true, status: lastStatus, confirm: Boolean(pendingCleanup), state: snapshot() });
    } catch (error) {
      sendResponse({ ok: false, error: `Could not complete action: ${error?.message || 'unknown error'}`, state: snapshot() });
    }
    return true;
  });
})();
