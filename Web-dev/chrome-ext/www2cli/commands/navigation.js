// Navigation and scrolling are performed only after an explicit terminal command.
(() => {
  const api = window.__www2cli;
  api.register('goto', 'Navigate to an http(s) URL or a numbered link from the latest links command.', (ctx, args) => {
    if (!args.length) return ctx.output('Usage: goto <url | link-number>', 'error');
    const token = args.join(' ');
    let url;
    if (/^\d+$/.test(token)) {
      const link = api.linkIndex[Number(token) - 1];
      if (!link) return ctx.output('That link number is not in the latest links list.', 'error');
      try { url = new URL(link.href, location.href); }
      catch (_) { return ctx.output('That link does not have a valid destination.', 'error'); }
      if (!['http:', 'https:'].includes(url.protocol)) return ctx.output('Only http and https destinations are allowed.', 'error');
      url = url.href;
    } else {
      try { url = new URL(token.includes('://') ? token : `https://${token}`, location.href); }
      catch (_) { return ctx.output('Invalid URL. Use a valid http(s) address.', 'error'); }
      if (!['http:', 'https:'].includes(url.protocol)) return ctx.output('Only http and https URLs are allowed.', 'error');
      url = url.href;
    }
    ctx.output(`Navigating to: ${url}`, 'success');
    setTimeout(() => { location.assign(url); }, 120);
  });
  api.register('back', 'Go back one page in this tab’s history.', ctx => { if (history.length > 1) history.back(); else ctx.output('No previous page is available.', 'muted'); });
  api.register('forward', 'Go forward one page in this tab’s history.', ctx => { history.forward(); });
  api.register('reload', 'Reload the current page.', ctx => { ctx.output('Reloading page…', 'muted'); setTimeout(() => location.reload(), 80); });
  api.register('scroll', 'Scroll up, down, top, or bottom.', (ctx, args) => {
    const direction = (args[0] || '').toLowerCase();
    if (direction === 'up') window.scrollBy({ top: -Math.max(300, innerHeight * 0.75), behavior: 'smooth' });
    else if (direction === 'down') window.scrollBy({ top: Math.max(300, innerHeight * 0.75), behavior: 'smooth' });
    else if (direction === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (direction === 'bottom') window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    else return ctx.output('Usage: scroll <up | down | top | bottom>', 'error');
    ctx.output(`Scrolled ${direction}.`, 'success');
  });
})();
