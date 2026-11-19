/* myCloud pages: floating home/back button at the bottom + a coloured icon badge in each page title.
   - Sub pages  -> "myCloud Home" (back to the dashboard)
   - Dashboard  -> "Log Out"
   - Login      -> "Back to Personal Drive" */
(function () {
  'use strict';
  var p = location.pathname.toLowerCase().replace(/\.html$/, '');
  var label, href, home = false, out = false;
  if (/\/mycloud\/mycloudhome$/.test(p)) { label = 'Log Out'; href = '/mycloud/login.html'; out = true; }
  else if (/\/mycloud\/(photos|contacts|keylog|finance|settings|map\/map|cctv\/cctv)$/.test(p)) { label = 'myCloud Home'; href = '/mycloud/mycloudhome.html'; home = true; }
  else if (/\/mycloud\/login$/.test(p)) { label = 'Back to Personal Drive'; href = '/autostore/as_drive.html'; }
  else return;

  var css = ''
    + '#pBack{position:fixed;left:0;right:0;bottom:0;z-index:700;display:flex;justify-content:center;padding:14px 16px max(16px,env(safe-area-inset-bottom));pointer-events:none;}'
    + '#pBack a{pointer-events:auto;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:440px;padding:15px 20px;border-radius:16px;background:#1b0f2b;color:#fff;text-decoration:none;font-weight:700;font-size:16px;line-height:1;box-shadow:0 10px 28px rgba(30,10,50,.38),0 0 0 1px rgba(255,255,255,.07) inset;-webkit-tap-highlight-color:transparent;transition:transform .12s ease;}'
    + '#pBack a:active{transform:scale(.97);}'
    + '#pBack svg{width:19px;height:19px;stroke:#d9a3ff;fill:none;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round;}'
    + 'body{padding-bottom:110px !important;}'
    + '.back-btn,.home-btn,.logout-btn,.return-btn,.back-wrap,.footer-buttons,.footer{display:none !important;}'
    /* page title icon badge */
    + '.hbadge{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:11px;color:#fff;font-size:17px;margin-right:10px;vertical-align:middle;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 4px 10px rgba(0,0,0,.25);flex-shrink:0;}'
    + '.hbadge.green{background:linear-gradient(145deg,#34d399,#0f9d6b);}.hbadge.gold{background:linear-gradient(145deg,#ffc94d,#f08a00);}.hbadge.blue{background:linear-gradient(145deg,#5aa2ff,#2160e0);}.hbadge.purple{background:linear-gradient(145deg,#a58bff,#6a47ea);}.hbadge.pink{background:linear-gradient(145deg,#ff7ab8,#d6246e);}.hbadge.red{background:linear-gradient(145deg,#ff7a6b,#d93025);}.hbadge.grey{background:linear-gradient(145deg,#aab2c0,#6b7486);}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // make sure the icon font is loaded (some pages had no icons before)
  if (!document.querySelector('link[href*="all.min.css"]')) {
    var fa = document.createElement('link'); fa.rel = 'stylesheet'; fa.href = '/mycloud/css/all.min.css?v=20261119a'; document.head.appendChild(fa);
  }

  var arrow = '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>';
  var house = '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg>';
  var door = '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
  var bar = document.createElement('div'); bar.id = 'pBack';
  var a = document.createElement('a'); a.href = href;
  a.innerHTML = home ? house : (out ? door : arrow);
  a.appendChild(document.createTextNode(label));
  bar.appendChild(a); document.body.appendChild(bar);

  // icon badge in the page title (the dashboard has its own)
  var ICONS = {
    'contacts': ['blue',   'fa-address-book'],
    'keylog':   ['red',    'fa-keyboard'],
    'settings': ['grey',   'fa-sliders'],
    'finance':  ['green',  'fa-wallet'],
    'map':      ['purple', 'fa-map-marker-alt'],
    'cctv':     ['gold',   'fa-video']
  };
  var key = p.split('/').pop(), ic = ICONS[key];
  if (ic) {
    var t = document.querySelector('.header h1, .header-title, .page-title, h1');
    if (t && !t.querySelector('.hbadge')) {
      // drop a leading emoji such as the phone in "Contact Directory"
      t.childNodes.forEach(function (n) { if (n.nodeType === 3) n.textContent = n.textContent.replace(/^\s*[\u{1F300}-\u{1FAFF}☀-➿]️?\s*/u, ''); });
      var old = t.querySelector('i.fas'); if (old) old.remove();
      var b = document.createElement('span'); b.className = 'hbadge ' + ic[0];
      b.innerHTML = '<i class="fas ' + ic[1] + '"></i>';
      t.insertBefore(b, t.firstChild);
    }
  }
})();
