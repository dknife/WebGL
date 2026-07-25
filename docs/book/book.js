/* WebGL 3D 그래픽스 — 웹 본문 공통 스크립트 (손으로 관리하는 파일)
 *
 * 기능:
 *  1. 코드 블록 위(코드 상단)에 [실행]·[복사] 버튼 바
 *  2. 실행 가능한 예제(div.listing 안의 language-javascript)에 [실행] 버튼
 *     → 화면 가운데 실행 모달(<dialog>)이 열린다. 편집 가능한 코드 창 +
 *       [실행] 버튼 + 결과(샌드박스 iframe: id=glCanvas 캔버스 + 콘솔)로 구성.
 *       glMatrix와 Three.js가 iframe에 미리 로드된다.
 *  3. 본문 그림 클릭 → viewer.html 확대 보기
 */
(function () {
  'use strict';

  /* ---------- 1. 코드 위 버튼 바 (실행 + 복사) ---------- */
  document.querySelectorAll('.content pre').forEach(function (pre) {
    var code = pre.querySelector('code');
    if (!code) return;                       // 출력(jsout 등)에는 버튼 없음
    var text = code.textContent;

    var bar = document.createElement('div');
    bar.className = 'runbar';

    // 실행: 캡션 있는 JS 예제(div.listing 안 language-javascript)에만
    var listing = pre.closest('.listing');
    var isJS = /language-javascript/.test(code.className);
    if (listing && isJS) {
      var runBtn = document.createElement('button');
      runBtn.type = 'button';
      runBtn.className = 'run';
      runBtn.textContent = '▶ 실행';
      runBtn.addEventListener('click', function () { openRunner(text); });
      bar.appendChild(runBtn);
    }

    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.textContent = '복사';
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = '복사됨!';
        setTimeout(function () { copyBtn.textContent = '복사'; }, 1500);
      });
    });
    bar.appendChild(copyBtn);

    // 버튼을 코드(또는 리스팅) 바로 위에 올린다
    var host = listing || pre;
    host.parentNode.insertBefore(bar, host);
  });

  /* ---------- 2. 실행 모달 <dialog class="runner"> ---------- */
  var dlg = null, codeEl = null, viewEl = null, statusEl = null, originalCode = '';

  function buildDialog() {
    dlg = document.createElement('dialog');
    dlg.className = 'runner';
    dlg.setAttribute('aria-label', 'WebGL 코드 실행');
    dlg.innerHTML =
      '<div class="runner-head">' +
        '<span class="runner-title">WebGL 실행</span>' +
        '<span class="runner-hint">Ctrl+Enter 실행 · Esc 닫기</span>' +
        '<button type="button" class="runner-close" aria-label="닫기">&#10005;</button>' +
      '</div>' +
      '<textarea class="runner-code" spellcheck="false" ' +
        'aria-label="자바스크립트 코드"></textarea>' +
      '<div class="runner-bar">' +
        '<button type="button" class="runner-run">&#9654; 실행</button>' +
        '<button type="button" class="runner-reset">원래 코드로</button>' +
        '<span class="runner-status"></span>' +
      '</div>' +
      '<div class="runner-view"></div>';
    codeEl = dlg.querySelector('.runner-code');
    viewEl = dlg.querySelector('.runner-view');
    statusEl = dlg.querySelector('.runner-status');

    dlg.querySelector('.runner-close').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('.runner-run').addEventListener('click', run);
    dlg.querySelector('.runner-reset').addEventListener('click', function () {
      codeEl.value = originalCode; run();
    });
    // Ctrl/Cmd+Enter 로 실행
    codeEl.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    });
    // 배경(백드롭) 클릭으로 닫기
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    // 닫을 때 iframe 정리(실행 중이던 애니메이션 루프 종료)
    dlg.addEventListener('close', function () { viewEl.innerHTML = ''; });

    document.body.appendChild(dlg);
  }

  function openRunner(codeText) {
    if (!dlg) buildDialog();
    originalCode = codeText;
    codeEl.value = codeText;
    if (!dlg.open) dlg.showModal();
    run();
  }

  function run() {
    statusEl.textContent = '실행 중…';
    viewEl.innerHTML = '';                    // 이전 실행(iframe) 제거 → 루프 정지
    var iframe = document.createElement('iframe');
    iframe.className = 'runner-frame';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.srcdoc = buildRunnerDoc(codeEl.value);
    iframe.addEventListener('load', function () { statusEl.textContent = ''; });
    viewEl.appendChild(iframe);
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
