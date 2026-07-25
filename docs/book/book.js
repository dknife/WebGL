/* WebGL 3D 그래픽스 — 웹 본문 공통 스크립트 (손으로 관리하는 파일)
 *
 * 기능:
 *  1. 모든 코드 블록에 [복사] 버튼
 *  2. 실행 가능한 예제(div.listing 안의 language-javascript)에 [실행] 버튼
 *     → 코드 아래에 편집 가능한 실행 패널(textarea + 샌드박스 iframe)을 연다.
 *     예제 코드는 id가 glCanvas인 600×400 캔버스가 이미 있다고 가정한다
 *     (실행기가 iframe 안에 만들어 준다). glMatrix도 미리 로드된다.
 *  3. 본문 그림 클릭 → viewer.html 확대 보기
 */
(function () {
  'use strict';

  /* ---------- 1. 복사 버튼 + 2. 실행 버튼 ---------- */
  document.querySelectorAll('.content pre').forEach(function (pre) {
    if (pre.closest('.runpanel')) return;
    var code = pre.querySelector('code');
    var text = (code || pre).textContent;

    var bar = document.createElement('div');
    bar.className = 'runbar';

    // 실행 버튼: 캡션 있는 JS 예제(div.listing)에만 붙인다
    var listing = pre.closest('.listing');
    var isJS = code && /language-javascript/.test(code.className);
    if (listing && isJS) {
      var runBtn = document.createElement('button');
      runBtn.className = 'run';
      runBtn.textContent = '실행';
      runBtn.addEventListener('click', function () {
        openRunPanel(listing, text);
      });
      bar.appendChild(runBtn);
    }

    var copyBtn = document.createElement('button');
    copyBtn.textContent = '복사';
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = '복사됨!';
        setTimeout(function () { copyBtn.textContent = '복사'; }, 1500);
      });
    });
    bar.appendChild(copyBtn);

    var host = listing || pre;
    host.parentNode.insertBefore(bar, host.nextSibling);
  });

  /* ---------- 실행 패널 ---------- */
  function openRunPanel(listing, codeText) {
    // 이미 열려 있으면 재사용
    var next = listing.nextElementSibling;               // runbar
    var panel = next && next.nextElementSibling;
    if (!(panel && panel.classList.contains('runpanel'))) {
      panel = document.createElement('div');
      panel.className = 'runpanel';
      panel.innerHTML =
        '<div class="rp-head"><span>WebGL 실행</span>' +
        '<button class="rerun">다시 실행</button>' +
        '<button class="close" title="닫기">✕</button></div>' +
        '<textarea spellcheck="false"></textarea>';
      panel.querySelector('textarea').value = codeText;
      panel.querySelector('.close').addEventListener('click', function () {
        panel.remove();
      });
      panel.querySelector('.rerun').addEventListener('click', function () {
        execute(panel);
      });
      next.parentNode.insertBefore(panel, next.nextSibling);
    }
    execute(panel);
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function execute(panel) {
    var codeText = panel.querySelector('textarea').value;
    var old = panel.querySelector('iframe');
    if (old) old.remove();
    var iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.srcdoc = buildRunnerDoc(codeText);
    panel.appendChild(iframe);
  }

  function buildRunnerDoc(codeText) {
    // </script>가 코드 안에 있으면 srcdoc이 깨지므로 이스케이프
    var safe = codeText.replace(/<\/script/gi, '<\\/script');
    return [
      '<!DOCTYPE html><html><head><meta charset="UTF-8">',
      '<style>',
      '  body { margin: 0; font-family: sans-serif; background: #fff; }',
      '  canvas { display: block; margin: 12px auto; border: 1px solid #E4E4E4; }',
      '  pre#out { margin: 0 12px 12px; padding: 8px 10px; background: #1E293B;',
      '    color: #F1F5F9; font-size: 12px; border-radius: 6px;',
      '    white-space: pre-wrap; display: none; }',
      '  pre#out.err { color: #F87171; }',
      '</style>',
      '<script src="https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/gl-matrix-min.js"><\/script>',
      '<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js"><\/script>',
      '</head><body>',
      '<canvas id="glCanvas" width="600" height="400"></canvas>',
      '<pre id="out"></pre>',
      '<script>',
      '(function () {',
      '  var out = document.getElementById("out");',
      '  function show(msg, isErr) {',
      '    out.style.display = "block";',
      '    if (isErr) out.classList.add("err");',
      '    out.textContent += msg + "\\n";',
      '  }',
      '  var origLog = console.log;',
      '  console.log = function () {',
      '    show(Array.prototype.map.call(arguments, String).join(" "));',
      '    origLog.apply(console, arguments);',
      '  };',
      '  window.onerror = function (msg, src, line) {',
      '    show("오류: " + msg + " (" + line + "행)", true);',
      '  };',
      '})();',
      '<\/script>',
      '<script>\n' + safe + '\n<\/script>',
      '</body></html>'
    ].join('\n');
  }

  /* ---------- 3. 그림 확대 보기 ---------- */
  document.querySelectorAll('.content img.tikz, .content img.gfx, .content img.shot')
    .forEach(function (img) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () {
        window.open('viewer.html?src=' + encodeURIComponent(img.getAttribute('src')),
                    '_blank');
      });
    });
})();
