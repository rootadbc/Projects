// Extracted page text is displayed only in the terminal; copying requires an explicit copy command.
(() => {
  const api = window.__www2cli;
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  api.register('extract', 'Extract text from visible elements matching a CSS selector.', (ctx, args) => {
    const selector = args.join(' ');
    if (!selector) return ctx.output('Usage: extract <selector>', 'error');
    let matches;
    try { matches = api.getMatches(selector).filter(api.isVisible); }
    catch (_) { return ctx.output('Invalid CSS selector.', 'error'); }
    const texts = matches.slice(0, 40).map(element => clean(element.innerText || element.textContent)).filter(Boolean);
    if (!texts.length) return ctx.output('No visible text found for that selector.', 'muted');
    ctx.output((texts.join('\n\n').slice(0, 16000)) + (matches.length > 40 ? `\n\n… ${matches.length - 40} more matches omitted.` : ''));
  });
  api.register('copy', 'Copy title, URL, or visible text from a CSS selector to the clipboard.', async (ctx, args) => {
    const target = args.join(' ').trim();
    if (!target) return ctx.output('Usage: copy <selector | title | url>', 'error');
    let value;
    if (target.toLowerCase() === 'title') value = document.title;
    else if (target.toLowerCase() === 'url') value = location.href;
    else {
      let matches;
      try { matches = api.getMatches(target).filter(api.isVisible); }
      catch (_) { return ctx.output('Invalid CSS selector.', 'error'); }
      value = matches.map(element => clean(element.innerText || element.textContent)).filter(Boolean).join('\n\n');
    }
    if (!value) return ctx.output('No text was available to copy.', 'muted');
    if (value.length > 100000) value = value.slice(0, 100000);
    try { await navigator.clipboard.writeText(value); ctx.output('Copied to clipboard.', 'success'); }
    catch (_) { ctx.output('Clipboard access was blocked. Allow clipboard access and try again.', 'error'); }
  });
})();
