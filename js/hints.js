/* Pursuit hint system
   - A "?" button on every game page opens a hint sheet for the player's current stage.
   - Hints go from a gentle nudge to near-answer. Each hint revealed is COUNTED so the
     facilitator can ask "how many hints did you use?" and adjust times if they want.
   - The count is kept on the player's phone and reset when the entry passphrase is accepted.
   To change wording, edit STAGES below. Nothing else needs touching. */
(function () {
  'use strict';

  var STORE = 'pursuit-hints-v1';

  /* ── HINT TEXT (edit freely) ───────────────────────────────── */
  var STAGES = {
    login: { title: 'AutoStore login', hints: [
      "The username is already filled in. You need Marcus's password.",
      "The password is three words joined by full stops. Look at the leaderboard image: it has a clue on it.",
      "The clue says nandos spicy tango. Join the three words with full stops: nandos.spicy.tango"
    ]},
    home: { title: 'AutoStore home', hints: [
      "Marcus keeps things in more than one place. Which apps haven't you opened yet?",
      "Open Notes, read every note, and tap the photos to enlarge them.",
      "The note called logins holds a tracker app name and a login. Personal Drive is protected by a 4-digit PIN.",
      "myMail gives you the PIN once you sort the genuine emails from the scams. Use it on Personal Drive."
    ]},
    mail: { title: 'myMail assessment', hints: [
      "Tap an email's sender to see the real address, not just the display name.",
      "Tap a link to preview where it really goes. Read the domain from right to left.",
      "Warning signs: urgency, threats, \"Dear Customer\", and requests for money, gift cards or passwords.",
      "Read attachment names to the end. \"invoice.pdf.html\" is not a PDF."
    ]},
    drivepin: { title: 'Personal Drive PIN', hints: [
      "You need a 4-digit PIN.",
      "Marcus wrote a PIN in his notes, and myMail reveals it when you pass the email assessment."
    ]},
    drive: { title: 'Personal Drive', hints: [
      "Look at the tiles. One looks like an app Marcus uses to keep an eye on someone.",
      "There is also a Crossword Helper. Not every file is a clue.",
      "MyCloud is the tracker app named in his notes. The crossword gives you what you need to get in."
    ]},
    crossword: { title: 'Crossword helper', hints: [
      "The helper reveals the answers to the paper crossword, one clue at a time.",
      "The answers are all forms of online and tech-enabled abuse.",
      "Finished? Take it back to the Personal Drive."
    ]},
    mclogin: { title: 'MyCloud login', hints: [
      "You need a username and a password for the tracker app.",
      "The way in comes from the crossword. The password is on a piece of paper in your pack.",
      "Username: thelonerover. Password: madmax1 (not case sensitive)."
    ]},
    mchome: { title: 'MyCloud dashboard', hints: [
      "Each tile shows a different way Marcus watches and controls someone. Open them all.",
      "Settings holds the tracker phone number and the tracker login. The Map Tracker uses that login.",
      "Read the Keylogger carefully, and think about what the messages tell you about his behaviour."
    ]},
    mcmap: { title: 'Map tracker', hints: [
      "The map needs the tracker login, which is stored in Settings.",
      "Username: Loneranger. Password: Logman1."
    ]},
    mcsettings: { title: 'MyCloud settings', hints: [
      "Read every field. Marcus has set this up to track one phone.",
      "The phone number and the tracker login are in here. You need the login for the Map Tracker."
    ]},
    mckeylog: { title: 'Keylogger', hints: [
      "Read what is being typed on this phone, both the messages and the searches.",
      "Look at the messages sent TO her. How would you describe that behaviour?",
      "Controlling, jealous and monitoring messages are signs of coercive control."
    ]},
    mcfinance: { title: 'Financial activity', hints: [
      "Look at the payments and when they happened. These are phone notifications.",
      "Every payment leaves a trail: a notification appears on the phone that made it.",
      "Synced devices such as an iPad show the same payments, so someone with access to one can see what was spent and where."
    ]},
    mccontacts: { title: 'Contacts', hints: [
      "Use Show All Contacts, then look at the notes on each person.",
      "Who might the victim turn to for help?"
    ]},
    mcphotos: { title: 'Photos', hints: [
      "Look closely at each photo for places and people.",
      "Tap a photo to enlarge it."
    ]},
    mccctv: { title: 'CCTV', hints: [
      "Watch each camera. Some files have been deleted.",
      "A deleted file cannot be played, but its name and time still tell you something."
    ]},
    sidearea: { title: 'AutoStore', hints: [
      "Not every section holds a puzzle. Which parts of the app haven't you opened yet?",
      "Marcus leaves his most useful clues in myMail, Notes and the Personal Drive."
    ]}
  };

  /* ── WHICH STAGE AM I ON? ─────────────────────────────────── */
  function stageKey() {
    var p = location.pathname.toLowerCase().replace(/\.html$/, '');
    if (/autostore\/as_login$/.test(p)) return 'login';
    if (/as_home$/.test(p)) return 'home';
    if (/as_mail$/.test(p)) return 'mail';
    if (/as_drive$/.test(p)) {
      try { return sessionStorage.getItem('driveUnlocked') === 'true' ? 'drive' : 'drivepin'; } catch (e) { return 'drivepin'; }
    }
    if (/crossword-helper$/.test(p)) return 'crossword';
    if (/as_(stock|finance|hr)$/.test(p)) return 'sidearea';
    if (/mycloud\/login$/.test(p)) return 'mclogin';
    if (/mycloudhome$/.test(p)) return 'mchome';
    if (/mycloud\/map\/map$/.test(p)) return 'mcmap';
    if (/mycloud\/settings$/.test(p)) return 'mcsettings';
    if (/mycloud\/keylog$/.test(p)) return 'mckeylog';
    if (/mycloud\/finance$/.test(p)) return 'mcfinance';
    if (/mycloud\/contacts$/.test(p)) return 'mccontacts';
    if (/mycloud\/photos$/.test(p)) return 'mcphotos';
    if (/mycloud\/cctv\/cctv$/.test(p)) return 'mccctv';
    return null;
  }

  /* ── STORAGE (per phone) ──────────────────────────────────── */
  function load() {
    try { var s = JSON.parse(localStorage.getItem(STORE) || '{}'); return { shown: s.shown || {} }; }
    catch (e) { return { shown: {} }; }
  }
  function save(d) { try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) {} }
  function total(d) { var n = 0; for (var k in d.shown) n += d.shown[k]; return n; }

  var key = stageKey();
  if (!key) return;
  var stage = STAGES[key];
  var data = load();

  /* ── UI ───────────────────────────────────────────────────── */
  var css = ''
    + '#pHintBtn{position:fixed;right:14px;bottom:84px;z-index:800;width:50px;height:50px;border-radius:50%;border:2px solid #1e8fff;background:#0c1829;color:#7fd0ff;font:700 26.5px/1 -apple-system,"Exo 2",sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.45);cursor:pointer;-webkit-tap-highlight-color:transparent;padding:0}'
    + '#pHintBtn:active{transform:scale(.94)}'
    + '#pHintBtn .b{position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;border-radius:10px;background:#ffb020;color:#1a1200;font:700 13px/20px -apple-system,sans-serif;padding:0 5px;text-align:center}'
    + '#pHintBg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:5200;display:none}'
    + '#pHintBg.show{display:block}'
    + '#pHint{position:fixed;left:0;right:0;bottom:0;z-index:5201;max-width:480px;margin:0 auto;background:#0c1829;color:#e8f4ff;border:1px solid rgba(30,143,255,.35);border-bottom:none;border-radius:18px 18px 0 0;padding:16px 18px 20px;max-height:80vh;overflow:auto;transform:translateY(105%);transition:transform .22s ease;font-family:-apple-system,"Exo 2",Helvetica,Arial,sans-serif;box-shadow:0 -10px 40px rgba(0,0,0,.6)}'
    + '#pHint.show{transform:translateY(0)}'
    + '#pHint .g{width:38px;height:5px;border-radius:3px;background:rgba(255,255,255,.25);margin:0 auto 12px}'
    + '#pHint h2{font-size:20px;margin:0 0 2px;letter-spacing:.02em}'
    + '#pHint .sub{font-size:14.5px;color:rgba(232,244,255,.6);margin-bottom:12px}'
    + '#pHint .used{font-size:14px;color:#ffb020;margin-bottom:12px}'
    + '#pHint .card{background:rgba(30,143,255,.1);border-left:3px solid #1e8fff;border-radius:8px;padding:11px 13px;margin-bottom:9px;font-size:16.5px;line-height:1.5}'
    + '#pHint .card small{display:block;color:rgba(232,244,255,.5);font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px}'
    + '#pHint button.act{width:100%;padding:13px;border-radius:10px;border:1px solid #1e8fff;background:#1e8fff;color:#04101f;font:700 16.5px -apple-system,"Exo 2",sans-serif;cursor:pointer;margin-top:4px}'
    + '#pHint button.act.confirm{background:#ffb020;border-color:#ffb020}'
    + '#pHint button.act:disabled{opacity:.45;cursor:default}'
    + '#pHint button.close{width:100%;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#e8f4ff;font:600 16.5px -apple-system,"Exo 2",sans-serif;cursor:pointer;margin-top:8px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement('button');
  btn.id = 'pHintBtn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Need a hint?'); btn.textContent = '?';
  var badge = document.createElement('span'); badge.className = 'b'; btn.appendChild(badge);
  var bg = document.createElement('div'); bg.id = 'pHintBg';
  var sheet = document.createElement('div'); sheet.id = 'pHint'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Hints');
  document.body.appendChild(btn); document.body.appendChild(bg); document.body.appendChild(sheet);

  function updateBadge() { var n = total(data); badge.textContent = n; badge.style.display = n ? 'block' : 'none'; }

  var confirming = false, confirmTimer = null;
  function render() {
    var shown = data.shown[key] || 0, max = stage.hints.length;
    sheet.textContent = '';
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
    sheet.appendChild(el('div', 'g'));
    sheet.appendChild(el('h2', '', 'Need a hint?'));
    sheet.appendChild(el('div', 'sub', stage.title));
    sheet.appendChild(el('div', 'used', 'Hints used so far: ' + total(data) + '. Each one you reveal is counted, so tell your facilitator at the end.'));
    for (var i = 0; i < shown; i++) {
      var c = el('div', 'card'); c.appendChild(el('small', '', 'Hint ' + (i + 1) + ' of ' + max)); c.appendChild(document.createTextNode(stage.hints[i])); sheet.appendChild(c);
    }
    var act = el('button', 'act' + (confirming ? ' confirm' : ''));
    act.type = 'button';
    if (shown >= max) { act.textContent = 'No more hints for this stage'; act.disabled = true; }
    else act.textContent = confirming ? 'Tap again to confirm' : (shown === 0 ? 'Reveal a hint' : 'Reveal the next hint');
    act.addEventListener('click', function () {
      if (!confirming) { confirming = true; render(); clearTimeout(confirmTimer); confirmTimer = setTimeout(function () { confirming = false; render(); }, 3500); return; }
      confirming = false; clearTimeout(confirmTimer);
      data.shown[key] = (data.shown[key] || 0) + 1; save(data); updateBadge(); render();
    });
    sheet.appendChild(act);
    var cl = el('button', 'close', 'Close'); cl.type = 'button'; cl.addEventListener('click', close); sheet.appendChild(cl);
  }
  function open() {
    // Work out the stage again now: the Personal Drive unlocks without reloading the page
    key = stageKey() || key; stage = STAGES[key];
    data = load(); confirming = false; render(); bg.classList.add('show'); void sheet.offsetWidth; sheet.classList.add('show');
  }
  function close() { confirming = false; clearTimeout(confirmTimer); sheet.classList.remove('show'); bg.classList.remove('show'); }
  btn.addEventListener('click', open);
  bg.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  updateBadge();
})();
