// Shadow-DOM terminal UI and command dispatcher. User input is parsed; it is never evaluated.
(() => {
  const api = window.__www2cli;
  if (!api || api.ui) return;
  const PREFS_KEY = 'www2cliPreferences';
  const MAX_HISTORY = 50;
  let host, shadow, outputNode, inputNode, terminalNode, resizeObserver, saveTimer;
  let minimized = false, history = [], historyIndex = 0, commandHistory = [];
  let preferences = { theme: 'dark', position: 'center', width: 650, height: 410, x: null, y: null, history: [] };

  function savePreferences() {
    if (!host || !terminalNode) return;
    const rect = terminalNode.getBoundingClientRect();
    preferences = { ...preferences, width: Math.round(rect.width), height: minimized ? preferences.height : Math.round(rect.height), x: Math.round(rect.left), y: Math.round(rect.top), history: commandHistory.slice(-MAX_HISTORY) };
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => chrome.storage.local.set({ [PREFS_KEY]: preferences }).catch(() => {}), 150);
  }

  function appendOutput(text, kind = 'normal') {
    if (!outputNode) return;
    const line = document.createElement('div'); line.className = `entry ${kind}`; line.textContent = String(text);
    outputNode.append(line);
    while (outputNode.children.length > 300) outputNode.firstElementChild.remove();
    outputNode.scrollTop = outputNode.scrollHeight;
  }

  function appendCommand(command) {
    const line = document.createElement('div'); line.className = 'entry command-line';
    const prompt = document.createElement('span'); prompt.className = 'prompt'; prompt.textContent = '@rootadbc:~$ ';
    const text = document.createElement('span'); text.textContent = command;
    line.append(prompt, text); outputNode.append(line); outputNode.scrollTop = outputNode.scrollHeight;
  }

  function createUi() {
    host = document.createElement('www2cli-root');
    host.style.cssText = 'all:initial;position:fixed;inset:0 auto auto 0;z-index:2147483000;pointer-events:none;';
    document.documentElement.append(host);
    api.host = host;
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<section class="terminal" data-theme="dark" aria-label="www2CLI terminal"><header class="titlebar"><div class="drag-handle"><span class="lights" aria-hidden="true"><i></i><i></i><i></i></span><strong>www2CLI</strong><span class="window-label">@rootadbc:~</span></div><div class="window-actions"><button class="minimize" type="button" aria-label="Minimize terminal" title="Minimize">−</button><button class="close" type="button" aria-label="Close terminal" title="Close">×</button></div></header><div class="terminal-content"><div class="output" role="log" aria-live="polite" aria-relevant="additions text"></div><form class="command-form" autocomplete="off"><label class="prompt" for="command-input">@rootadbc:~$</label><input id="command-input" class="command-input" type="text" spellcheck="false" aria-label="Terminal command input" autocomplete="off" autocapitalize="off"><button class="run" type="submit" aria-label="Run command">↵</button></form></div></section>`;
    const stylesheet = document.createElement('link'); stylesheet.rel = 'stylesheet'; stylesheet.href = chrome.runtime.getURL('styles/terminal.css'); shadow.prepend(stylesheet);
    terminalNode = shadow.querySelector('.terminal');
    outputNode = shadow.querySelector('.output');
    inputNode = shadow.querySelector('.command-input');
    shadow.querySelector('.command-form').addEventListener('submit', event => { event.preventDefault(); executeCommand(inputNode.value); });
    inputNode.addEventListener('keydown', handleInputKeys);
    shadow.querySelector('.minimize').addEventListener('click', toggleMinimize);
    shadow.querySelector('.close').addEventListener('click', close);
    makeDraggable();
    resizeObserver = new ResizeObserver(() => savePreferences()); resizeObserver.observe(terminalNode);
    applyPreferences();
    appendOutput('www2CLI ready. Type “help” to see available commands.', 'muted');
    inputNode.focus();
  }

  async function applyPreferences() {
    try {
      const saved = await chrome.storage.local.get(PREFS_KEY);
      if (saved[PREFS_KEY] && typeof saved[PREFS_KEY] === 'object') preferences = { ...preferences, ...saved[PREFS_KEY] };
    } catch (_) { /* Defaults remain usable when local storage is unavailable. */ }
    if (!terminalNode) return;
    terminalNode.dataset.theme = preferences.theme === 'light' ? 'light' : 'dark';
    commandHistory = Array.isArray(preferences.history) ? preferences.history.filter(value => typeof value === 'string').slice(-MAX_HISTORY) : [];
    if (preferences.position === 'center') { terminalNode.style.left = `${Math.max(12, Math.round((innerWidth - (preferences.width || 650)) / 2))}px`; terminalNode.style.top = `${Math.max(16, Math.round((innerHeight - (preferences.height || 410)) / 3))}px`; }
    else if (preferences.position === 'bottom') { terminalNode.style.left = `${Math.max(12, Math.round((innerWidth - (preferences.width || 650)) / 2))}px`; terminalNode.style.top = `${Math.max(16, innerHeight - (preferences.height || 410) - 20)}px`; }
    else if (preferences.position === 'top-left') { terminalNode.style.left = '18px'; terminalNode.style.top = '18px'; }
    else { terminalNode.style.left = `${Math.max(8, Math.min(innerWidth - 240, Number(preferences.x) || 24))}px`; terminalNode.style.top = `${Math.max(8, Math.min(innerHeight - 120, Number(preferences.y) || 70))}px`; }
    terminalNode.style.width = `${Math.min(innerWidth - 16, Math.max(360, Number(preferences.width) || 650))}px`;
    terminalNode.style.height = `${Math.min(innerHeight - 16, Math.max(240, Number(preferences.height) || 410))}px`;
  }

  function tokenize(raw) { return api.parseArgs(raw); }

  function historySafe(raw) {
    let tokens;
    try { tokens = tokenize(raw); } catch (_) { return '[invalid command]'; }
    const name = (tokens[0] || '').toLowerCase();
    if (['type', 'find', 'goto', 'copy'].includes(name)) return name === 'type' ? `type ${tokens[1] || '[selector]'} [text omitted]` : `${name} [argument omitted]`;
    return raw.slice(0, 300);
  }

  function handleInputKeys(event) {
    if (event.key === 'ArrowUp') {
      if (!commandHistory.length) return;
      event.preventDefault(); historyIndex = Math.max(0, historyIndex - 1); inputNode.value = commandHistory[historyIndex] || ''; inputNode.setSelectionRange(inputNode.value.length, inputNode.value.length);
    } else if (event.key === 'ArrowDown') {
      if (!commandHistory.length) return;
      event.preventDefault(); historyIndex = Math.min(commandHistory.length, historyIndex + 1); inputNode.value = historyIndex === commandHistory.length ? '' : commandHistory[historyIndex]; inputNode.setSelectionRange(inputNode.value.length, inputNode.value.length);
    }
  }

  async function executeCommand(raw) {
    const source = String(raw || '').trim();
    if (!source) return;
    appendCommand(source);
    const safeHistory = historySafe(source);
    commandHistory.push(source); if (commandHistory.length > MAX_HISTORY) commandHistory.shift();
    const persisted = commandHistory.map(historySafe);
    const uniqueHistory = persisted.filter((entry, index) => index === 0 || entry !== persisted[index - 1]);
    preferences.history = uniqueHistory.slice(-MAX_HISTORY); historyIndex = commandHistory.length; inputNode.value = '';
    savePreferences();
    let tokens;
    try { tokens = tokenize(source); } catch (error) { appendOutput(error?.message || 'Invalid command quoting.', 'error'); return; }
    const name = (tokens.shift() || '').toLowerCase();
    if (!name) return;
    const command = api.commands[name];
    if (!command) { appendOutput(`Command not found: ${name}. Type help for available commands.`, 'error'); return; }
    const ctx = {
      output: appendOutput, clear: () => { outputNode.replaceChildren(); },
      getMatches: api.getMatches, isVisible: api.isVisible, linkIndex: api.linkIndex,
      terminal: terminalNode, ui: api.ui, savePreferences: () => { savePreferences(); }
    };
    try { await command.run(ctx, tokens); }
    catch (error) { appendOutput(error?.message || 'Command failed.', 'error'); }
    void safeHistory;
  }

  function toggleMinimize() {
    minimized = !minimized; terminalNode.classList.toggle('minimized', minimized);
    const button = shadow.querySelector('.minimize');
    button.textContent = minimized ? '□' : '−'; button.title = minimized ? 'Restore terminal' : 'Minimize terminal';
    button.setAttribute('aria-label', button.title);
    savePreferences(); if (!minimized) inputNode.focus();
  }

  function close() {
    if (!host) return;
    savePreferences(); resizeObserver?.disconnect(); host.remove(); host = shadow = terminalNode = outputNode = inputNode = null; api.host = null; api.ui.visible = false;
  }

  function makeDraggable() {
    const bar = shadow.querySelector('.drag-handle'); let drag = null;
    bar.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) return;
      const rect = terminalNode.getBoundingClientRect(); drag = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
      bar.setPointerCapture(event.pointerId);
    });
    bar.addEventListener('pointermove', event => {
      if (!drag) return;
      const x = Math.max(0, Math.min(innerWidth - 80, event.clientX - drag.dx));
      const y = Math.max(0, Math.min(innerHeight - 40, event.clientY - drag.dy));
      terminalNode.style.left = `${x}px`; terminalNode.style.top = `${y}px`; preferences.position = 'custom';
    });
    bar.addEventListener('pointerup', () => { if (drag) savePreferences(); drag = null; });
  }

  api.ui = {
    visible: false,
    output: appendOutput,
    setTheme(theme) { if (!['dark', 'light'].includes(theme)) return; preferences.theme = theme; if (terminalNode) terminalNode.dataset.theme = theme; savePreferences(); },
    setPosition(position) {
      if (!['center', 'bottom', 'top-left'].includes(position)) return false;
      preferences.position = position;
      const rect = terminalNode.getBoundingClientRect();
      if (position === 'center') { terminalNode.style.left = `${Math.max(8, (innerWidth - rect.width) / 2)}px`; terminalNode.style.top = `${Math.max(8, (innerHeight - rect.height) / 3)}px`; }
      else if (position === 'bottom') { terminalNode.style.left = `${Math.max(8, (innerWidth - rect.width) / 2)}px`; terminalNode.style.top = `${Math.max(8, innerHeight - rect.height - 18)}px`; }
      else { terminalNode.style.left = '18px'; terminalNode.style.top = '18px'; }
      savePreferences(); return true;
    },
    close,
    toggle() { if (host) close(); else { createUi(); api.ui.visible = true; } }
  };
})();
