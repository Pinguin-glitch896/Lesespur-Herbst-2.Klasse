(function () {
  'use strict';
  var W = window.WOCHE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  };
  var root = document.documentElement.style;
  root.setProperty('--tint', W.tint); root.setProperty('--accent', W.accent); root.setProperty('--dark', W.dark);
  document.title = 'Leseverständnis · Woche ' + W.nr;

  var state = { name: '', star: 0, tries: 0, firstScore: null, max: 0, answers: {} };
  var app = $('#app');
  var STARS = ['', '★', '★★', '★★★'];

  function header() {
    return el('div', { class: 'head' }, [
      el('div', { class: 't' }, [
        el('div', { class: 'kicker', text: 'Woche ' + W.nr + ' · ' + W.title }),
        el('h1', { text: 'Hast du alles verstanden?' })
      ]),
      el('img', { src: W.figure, alt: '' })
    ]);
  }

  // ---------- Start ----------
  function start() {
    state.star = 0; state.tries = 0; state.firstScore = null; state.answers = {};
    app.innerHTML = ''; app.appendChild(header());
    var name = el('input', { type: 'text', id: 'name', autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', placeholder: 'Vorname', value: state.name });
    var go = el('button', { class: 'btn', text: 'Los geht’s!', disabled: 'disabled' });
    var starBtns = [1, 2, 3].map(function (n) {
      return el('button', { class: 'starbtn', 'aria-pressed': 'false', onclick: function () {
        state.star = n; starBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i + 1 === n)); }); check();
      } }, [el('span', { class: 's', text: STARS[n] }), el('span', { text: 'Stern-Text ' + n })]);
    });
    function check() { state.name = name.value.trim(); if (state.name && state.star) go.removeAttribute('disabled'); else go.setAttribute('disabled', 'disabled'); }
    name.addEventListener('input', check);
    go.addEventListener('click', function () { if (!go.disabled) tasks(); });
    app.appendChild(el('div', { class: 'card' }, [
      el('label', { class: 'big', for: 'name', text: 'Wie heißt du?' }), name,
      el('div', { class: 'big', style: 'margin-top:20px;font-family:Fredoka,sans-serif;font-weight:600;margin-bottom:8px', text: 'Welchen Stern-Text hast du gelesen?' }),
      el('div', { class: 'stars' }, starBtns),
      el('div', { class: 'row' }, [go])
    ]));
    check();
  }

  // ---------- Aufgaben ----------
  var checks = [];   // functions returning [correct,total] and marking
  var reveal = [];   // functions that show the correct answers
  function choice(group, value, btn, all) {
    state.answers[group] = value;
    all.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); b.classList.remove('isok', 'isbad'); });
  }

  function tasks() {
    checks = []; reveal = []; state.answers = {};
    app.innerHTML = ''; app.appendChild(header());
    var hear = W.hoer[state.star - 1];
    var top = el('div', { class: 'row', style: 'margin-top:14px' }, [
      el('span', { class: 'hint', text: state.name + ' · ' + STARS[state.star] + ' Stern-Text ' + state.star }),
      hear ? el('a', { class: 'listen', href: hear, target: '_blank', rel: 'noopener', html: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2" fill="none" stroke="#146666" stroke-width="2.2" stroke-linecap="round"/><rect x="3" y="13" width="5" height="7" rx="2" fill="#146666"/><rect x="16" y="13" width="5" height="7" rx="2" fill="#146666"/></svg>Text noch einmal hören' }) : null
    ]);
    app.appendChild(top);
    var card = el('div', { class: 'card' });
    app.appendChild(card);
    var n = 0;
    function task(q, body) { n++; card.appendChild(el('div', { class: 'task' }, [el('div', { class: 'q' }, [el('span', { class: 'n', text: String(n) }), q]), body])); }

    if (state.star === 1) {
      var s = W.s1;
      var pics = s.pics.map(function (p, i) {
        var b = el('button', { class: 'pic', 'aria-pressed': 'false', onclick: function () { choice('pic', i, b, pics); } }, [el('img', { src: p.img, alt: '' }), el('span', { text: p.label })]);
        return b;
      });
      task(s.picQ + ' Tippe an.', el('div', { class: 'pics' }, pics));
      checks.push(function () { var ok = state.answers.pic === s.picAnswer; pics.forEach(function (b, i) { b.classList.toggle('isok', ok && i === s.picAnswer); b.classList.toggle('isbad', !ok && state.answers.pic === i); }); return [ok ? 1 : 0, 1]; });
      reveal.push(function () { pics[s.picAnswer].classList.add('isok'); });
      var rows = [];
      var grid = el('div', { class: 'tf' });
      s.tf.forEach(function (t, k) {
        var yes = el('button', { 'aria-pressed': 'false', text: 'richtig' }), no = el('button', { 'aria-pressed': 'false', text: 'falsch' });
        yes.addEventListener('click', function () { choice('tf' + k, true, yes, [yes, no]); });
        no.addEventListener('click', function () { choice('tf' + k, false, no, [yes, no]); });
        grid.appendChild(el('div', { class: 'stmt', text: t[0] })); grid.appendChild(el('div', { class: 'seg' }, [yes, no]));
        rows.push([yes, no, t[1]]);
      });
      task('Richtig oder falsch?', grid);
      checks.push(function () { var c = 0; rows.forEach(function (r, k) { var a = state.answers['tf' + k]; var ok = a === r[2]; if (ok) c++; var btn = a === true ? r[0] : a === false ? r[1] : null; if (btn) btn.classList.add(ok ? 'isok' : 'isbad'); }); return [c, rows.length]; });
      reveal.push(function () { rows.forEach(function (r) { (r[2] ? r[0] : r[1]).classList.add('isok'); }); });
    }

    if (state.star === 2) {
      W.s2.forEach(function (m, k) {
        var opts = m.opts.map(function (o, i) {
          var b = el('button', { class: 'opt', 'aria-pressed': 'false', onclick: function () { choice('mc' + k, i, b, opts); } }, [el('span', { class: 'box' }), el('span', { text: o })]);
          return b;
        });
        task(m.q, el('div', { class: 'opts' }, opts));
        checks.push(function () { var a = state.answers['mc' + k]; var ok = a === m.a; if (a != null) opts[a].classList.add(ok ? 'isok' : 'isbad'); return [ok ? 1 : 0, 1]; });
        reveal.push(function () { opts[m.a].classList.add('isok'); });
      });
    }

    if (state.star === 3) {
      var s3 = W.s3, nums = s3.order.map(function () { return 0; });
      var items = s3.order.map(function (t, i) {
        var box = el('span', { class: 'box' });
        var b = el('button', { class: 'opt', 'aria-pressed': 'false', onclick: function () {
          if (nums[i]) { nums[i] = 0; } else { var used = nums.filter(Boolean); for (var v = 1; v <= nums.length; v++) if (used.indexOf(v) < 0) { nums[i] = v; break; } }
          paint();
        } }, [box, el('span', { text: t })]);
        b._box = box; return b;
      });
      function paint() { items.forEach(function (b, i) { b._box.textContent = nums[i] || ''; b.setAttribute('aria-pressed', String(!!nums[i])); b.classList.remove('isok', 'isbad'); }); state.answers.order = nums.slice(); }
      task('In welcher Reihenfolge passiert es? Tippe die Sätze der Reihe nach an: zuerst, was am Anfang passiert.', el('div', { class: 'opts order' }, items.concat([el('div', { class: 'row', style: 'margin-top:4px' }, [el('button', { class: 'btn secondary', style: 'min-height:48px;font-size:18px;padding:8px 20px', text: 'Nochmal ordnen', onclick: function () { nums = nums.map(function () { return 0; }); paint(); } })])])));
      checks.push(function () { var c = 0; items.forEach(function (b, i) { var ok = nums[i] === s3.answer[i]; if (ok) c++; if (nums[i]) b.classList.add(ok ? 'isok' : 'isbad'); }); return [c, items.length]; });
      reveal.push(function () { nums = s3.answer.slice(); paint(); items.forEach(function (b) { b.classList.add('isok'); }); });
      var ta = el('textarea', { placeholder: 'Schreibe hier deine Antwort.' });
      ta.addEventListener('input', function () { state.answers.open = ta.value; });
      task(s3.openQ, ta);
    }

    var fb = el('div', { class: 'fb hidden', role: 'status' });
    var btn = el('button', { class: 'btn', text: 'Prüfen' });
    var next = el('button', { class: 'btn hidden', text: 'Zum Ergebnis' });
    card.appendChild(fb);
    card.appendChild(el('div', { class: 'row' }, [btn, next, el('button', { class: 'btn secondary', text: 'Zurück', onclick: start })]));
    next.addEventListener('click', result);
    btn.addEventListener('click', function () {
      if (state.star === 3 && !(state.answers.open || '').trim()) { fb.className = 'fb bad'; fb.textContent = 'Schreibe bei Aufgabe 2 noch eine Antwort.'; return; }
      card.querySelectorAll('.isok,.isbad').forEach(function (e) { e.classList.remove('isok', 'isbad'); });
      var c = 0, t = 0; checks.forEach(function (f) { var r = f(); c += r[0]; t += r[1]; });
      state.tries++; state.max = t; if (state.firstScore === null) state.firstScore = c; state.lastScore = c;
      if (c === t) {
        fb.className = 'fb ok'; fb.textContent = 'Super! Alles richtig.'; btn.classList.add('hidden'); next.classList.remove('hidden');
      } else if (state.tries < 2) {
        fb.className = 'fb bad'; fb.textContent = c + ' von ' + t + ' richtig. Schau dir die roten Antworten noch einmal an und prüfe dann nochmal.';
      } else {
        reveal.forEach(function (f) { f(); });
        fb.className = 'fb bad'; fb.textContent = c + ' von ' + t + ' richtig. Die richtigen Antworten sind jetzt grün markiert.'; btn.classList.add('hidden'); next.classList.remove('hidden');
      }
      fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ---------- Ergebnis ----------
  function stamp() {
    var d = new Date(); var p = function (x) { return (x < 10 ? '0' : '') + x; };
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ', ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ' Uhr';
  }
  function result() {
    var when = stamp(), first = state.firstScore, t = state.max;
    var perfect = first === t;
    app.innerHTML = ''; app.appendChild(header());
    var lines = [
      ['Name', state.name], ['Woche', W.nr + ' · ' + W.title], ['Stern-Text', STARS[state.star]],
      ['Beim 1. Prüfen richtig', first + ' von ' + t], ['Am Ende richtig', state.lastScore + ' von ' + t], ['Versuche', String(state.tries)], ['Datum', when]
    ];
    var sum = el('div', { class: 'sum' }, lines.map(function (l) { return el('div', {}, [el('span', { text: l[0] }), el('strong', { text: l[1] })]); }));
    if (state.star === 3) sum.appendChild(el('div', { style: 'flex-direction:column' }, [el('span', { text: W.s3.openQ }), el('strong', { class: 'read', style: 'font-weight:400', text: state.answers.open || '' })]));
    var text = 'Leseverständnis · Woche ' + W.nr + ' · ' + W.title + '\n' + lines.map(function (l) { return l[0] + ': ' + l[1]; }).join('\n') + (state.star === 3 ? '\n' + W.s3.openQ + ' ' + (state.answers.open || '') : '');
    var share = el('button', { class: 'btn', text: 'Ergebnis senden' });
    var info = el('div', { class: 'hint hidden', style: 'margin-top:10px' });
    share.addEventListener('click', function () {
      if (navigator.share) { navigator.share({ title: 'Leseverständnis ' + state.name, text: text }).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(text).then(function () { info.textContent = 'Das Ergebnis ist kopiert.'; info.classList.remove('hidden'); }); }
    });
    app.appendChild(el('div', { class: 'card result' }, [
      el('div', { class: 'medal', 'aria-hidden': 'true', style: 'color:var(--star)', text: perfect ? '★★★' : first >= t / 2 ? '★★' : '★' }),
      el('div', { class: 'big', text: (perfect ? 'Super, ' : 'Gut gemacht, ') + state.name + '!' }),
      el('div', { text: perfect ? 'Du hast alles beim ersten Mal richtig.' : 'Du hast ' + first + ' von ' + t + ' beim ersten Mal richtig.' }),
      sum,
      el('div', { class: 'row', style: 'justify-content:center' }, [share,
        el('button', { class: 'btn secondary', text: 'Anderen Stern üben', onclick: start }),
        el('button', { class: 'btn secondary', text: 'Nächstes Kind', onclick: function () { state.name = ''; start(); } })]),
      info,
      el('p', { class: 'hint', text: 'Zeige diesen Bildschirm deiner Lehrkraft oder tippe auf „Ergebnis senden“.' })
    ]));
  }

  start();
})();
