// Shared command registry and small, non-executing DOM utilities.
(() => {
  const api = window.__www2cli ||= { commands: Object.create(null), linkIndex: [], host: null, ui: null };
  api.register = (name, description, run) => { api.commands[name] = { name, description, run }; };
  api.getRoots = () => {
    const roots = [document], seen = new Set(roots);
    for (let i = 0; i < roots.length; i++) for (const element of roots[i].querySelectorAll('*')) {
      if (element.shadowRoot && !seen.has(element.shadowRoot)) { seen.add(element.shadowRoot); roots.push(element.shadowRoot); }
    }
    return roots;
  };
  api.getMatches = selector => {
    const roots = api.getRoots(), matches = [];
    for (const root of roots) if (root !== api.host?.shadowRoot) matches.push(...root.querySelectorAll(selector));
    return matches.filter(element => element.getRootNode() !== api.host?.shadowRoot && !api.host?.contains(element));
  };
  api.isVisible = element => {
    if (!(element instanceof Element) || element.getRootNode() === api.host?.shadowRoot || element.closest?.('www2cli-root')) return false;
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.05;
  };
  api.parseArgs = input => {
    const args = []; let current = '', quote = '', escaped = false;
    for (const char of input) {
      if (escaped) { current += char; escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (quote) { if (char === quote) quote = ''; else current += char; continue; }
      if (char === '"' || char === "'") { quote = char; continue; }
      if (/\s/.test(char)) { if (current) { args.push(current); current = ''; } continue; }
      current += char;
    }
    if (escaped) current += '\\';
    if (quote) throw new Error('Unclosed quote.');
    if (current) args.push(current);
    return args;
  };

  api.register('help', 'Show all commands and examples.', ctx => {
    const list = Object.values(api.commands).sort((a, b) => a.name.localeCompare(b.name));
    ctx.output('www2CLI commands:\n' + list.map(command => `  ${command.name.padEnd(24)} ${command.description}`).join('\n') + '\n\nExamples:\n  links\n  goto 3\n  extract "main h2"\n  type "input[name=email]" "name@example.com"\n  theme light');
  });
  api.register('clear', 'Clear the terminal output.', ctx => ctx.clear());
  api.register('theme', 'Set terminal theme to dark or light.', (ctx, args) => {
    const theme = (args[0] || '').toLowerCase();
    if (!['dark', 'light'].includes(theme)) return ctx.output('Usage: theme <dark | light>', 'error');
    api.ui?.setTheme(theme); ctx.output(`Terminal theme set to ${theme}.`, 'success');
  });
  api.register('position', 'Move terminal to center, bottom, or top-left.', (ctx, args) => {
    const position = (args[0] || '').toLowerCase();
    if (!api.ui?.setPosition(position)) return ctx.output('Usage: position <center | bottom | top-left>', 'error');
    ctx.output(`Terminal moved to ${position}.`, 'success');
  });
  api.register('close', 'Close the terminal overlay.', () => api.ui?.close());
})();
