// Explicit interactions only; selectors are parsed as CSS and no arbitrary code is evaluated.
(() => {
  const api = window.__www2cli;
  const sensitive = /pass(word)?|secret|token|api.?key|auth(entication|orization|[-_ ]?token)|credential|credit.?card|card.?number|cvv|cvc|security.?code|ssn|social.?security|tax.?id|national.?id|passport|routing|iban|bank.?account|one.?time.?code|otp|pin/i;
  const blockedAutocomplete = /^(current-password|new-password|one-time-code|cc-|webauthn)/i;
  function isSafeEditable(element) {
    if (!(element instanceof HTMLElement) || !api.isVisible(element) || element.disabled || element.readOnly) return false;
    if (!(['INPUT', 'TEXTAREA'].includes(element.tagName) || element.isContentEditable)) return false;
    if (element.tagName === 'INPUT' && !['text', 'email', 'tel', 'search', 'url', ''].includes((element.type || 'text').toLowerCase())) return false;
    const info = [element.name, element.id, element.placeholder, element.getAttribute('aria-label'), element.autocomplete].join(' ');
    return !sensitive.test(info) && !blockedAutocomplete.test(element.autocomplete || '');
  }
  function selectTarget(selector, ctx) {
    if (!selector) throw new Error('Provide a CSS selector. Put selectors with spaces in quotes.');
    try { return api.getMatches(selector).filter(element => api.isVisible(element)); }
    catch (_) { throw new Error('Invalid CSS selector.'); }
  }
  api.register('click', 'Click a visible element matching a CSS selector, or a numbered link from links.', (ctx, args) => {
    if (!args.length) return ctx.output('Usage: click <selector | link-number>', 'error');
    const token = args.join(' ');
    let target;
    if (/^\d+$/.test(token)) target = api.linkIndex[Number(token) - 1];
    else {
      const matches = selectTarget(token, ctx);
      if (matches.length !== 1) return ctx.output(matches.length ? `Selector matched ${matches.length} visible elements. Use a more specific selector.` : 'No visible element matched that selector.', 'error');
      target = matches[0];
    }
    if (!target || !target.isConnected || !api.isVisible(target)) return ctx.output('No visible link exists at that index. Run links to refresh the numbered list.', 'error');
    target.click(); ctx.output('Clicked the requested element.', 'success');
  });
  api.register('type', 'Set text on one safe visible input, textarea, or contenteditable element.', (ctx, args) => {
    if (args.length < 2) return ctx.output('Usage: type <selector> <text>  (quote selectors or text containing spaces)', 'error');
    const selector = args[0], value = args.slice(1).join(' '), matches = selectTarget(selector, ctx);
    if (matches.length !== 1) return ctx.output(matches.length ? `Selector matched ${matches.length} elements; use a unique selector.` : 'No visible field matched that selector.', 'error');
    const element = matches[0];
    if (!isSafeEditable(element)) return ctx.output('Target is not a supported, safe editable field. Password and likely sensitive fields are blocked.', 'error');
    element.focus({ preventScroll: true });
    if (element.isContentEditable) element.textContent = value;
    else {
      const prototype = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (setter) setter.call(element, value); else element.value = value;
    }
    element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: value }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    ctx.output('Text entered. The form was not submitted.', 'success');
  });
  api.register('submit', 'Submit a form matching a CSS selector using native browser validation.', (ctx, args) => {
    const matches = selectTarget(args.join(' '), ctx).filter(element => element instanceof HTMLFormElement);
    if (!matches.length) return ctx.output('No visible form matched. Usage: submit <form-selector>', 'error');
    if (matches.length !== 1) return ctx.output(`Selector matched ${matches.length} forms; use a unique selector.`, 'error');
    const form = matches[0]; ctx.output('Submitting the selected form as explicitly requested…', 'success');
    setTimeout(() => { try { form.requestSubmit(); } catch (_) { /* Native validation or site handlers may block submission. */ } }, 100);
  });
})();
