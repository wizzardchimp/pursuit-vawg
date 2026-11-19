/* Stops phones and browsers offering to save the game's passwords.
   Password managers only react to <input type="password">. So on fields marked data-nosave we use a
   plain text box that is MASKED with CSS (-webkit-text-security), and switch off autofill/autocorrect.
   Browsers that can't mask text keep a password field but with autocomplete="new-password". */
(function () {
  'use strict';
  var canMask = !!(window.CSS && CSS.supports && (CSS.supports('-webkit-text-security', 'disc') || CSS.supports('text-security', 'disc')));
  function rnd() { return 'f' + Math.random().toString(36).slice(2, 10); }
  function harden(el) {
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('spellcheck', 'false');
    el.setAttribute('name', rnd());
    el.setAttribute('data-lpignore', 'true');
    el.setAttribute('data-1p-ignore', 'true');
    el.setAttribute('data-bwignore', 'true');
    el.setAttribute('data-form-type', 'other');
  }
  document.querySelectorAll('input[data-nosave]').forEach(function (el) {
    harden(el);
    if (el.type === 'password') {
      if (canMask) { el.type = 'text'; el.classList.add('pw-mask'); el.setAttribute('data-masked', '1'); }
      else { el.setAttribute('autocomplete', 'new-password'); }
    }
  });
  // other text fields on these pages: no autofill suggestions either
  document.querySelectorAll('input[data-noautofill]').forEach(harden);

  // show / hide a password. Returns true when the text is now VISIBLE.
  window.pwToggle = function (el) {
    if (el.getAttribute('data-masked') === '1') {
      var show = el.classList.toggle('pw-mask') === false;
      return show;
    }
    var visible = el.type === 'password';
    el.type = visible ? 'text' : 'password';
    return visible;
  };
})();
