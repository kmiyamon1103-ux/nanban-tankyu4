/* =========================================================
   資料を探究！〜南蛮貿易図屏風のひみつを見つけよう〜
   script.js（フルリライト版・GitHub Pages 対応）

   【編集ポイント】
   - パスワード変更             → PASSWORD
   - 資料の画像差し替え         → RESOURCES の image
   - クリックポイントの編集     → CLICK_POINTS の x, y, name, desc
   - AIへの相談リンク変更       → AI_LINK
   - AIテンプレ文のカスタマイズ → buildTemplate()

   座標 x, y はパーセント（0〜100）。
   画像左上が (0, 0)、右下が (100, 100)。

   注意：
   画像パスは "images/xxx.png" のように、先頭スラッシュ無しの
   相対パスで統一しています（GitHub Pages のサブパス配信でも
   確実に動くため）。
   ========================================================= */

/* ---------------- 1. 設定（編集可） ---------------- */

const PASSWORD = '6666';
const AI_LINK  = 'https://chat.openai.com/';

/* ========== アセットURL解決 ==========
   ローカル(file://)、Cursorプレビュー、GitHub Pages（サブパス配信を含む）の
   すべてで動作するよう、画像パスを document.baseURI を基準に絶対URL化する。
   ※ document.baseURI は <base> タグや末尾スラッシュの有無を吸収してくれる。 */
const ASSET_BASE = new URL('.', document.baseURI).href;
function assetURL(relPath) {
  return new URL(relPath, ASSET_BASE).href;
}

const RESOURCES = [
  { id: 1, label: '資料1', image: assetURL('images/sample1.png'), caption: '南蛮貿易図屏風（資料1）' },
  { id: 2, label: '資料2', image: assetURL('images/sample2.png'), caption: '南蛮貿易図屏風（資料2）' },
];

console.log('[南蛮貿易] アセットの基準URL:', ASSET_BASE);
console.log('[南蛮貿易] 資料1の画像URL:', RESOURCES[0].image);
console.log('[南蛮貿易] 資料2の画像URL:', RESOURCES[1].image);

const CLICK_POINTS = {
  // ========== 資料1 ==========
  1: [
    { id: 'ship',      name: '船',            x: 82, y: 28,
      desc: '遠くから来た大きな船は、多くの人や商品を運んでいました。' },
    { id: 'elephant',  name: '動物（ゾウ）',  x: 9,  y: 75,
      desc: '日本では珍しいゾウが描かれています。遠い国からやって来た動物です。' },
    { id: 'carried',   name: '運ばれている人', x: 19, y: 65,
      desc: 'お神輿のような乗り物に乗って運ばれている人物がいます。特別な立場の人かもしれません。' },
    { id: 'foreigner', name: '外国人',        x: 55, y: 55,
      desc: '中央付近にいる外国人は、日本に新しい文化や商品をもたらしました。' },
    { id: 'blackrobe', name: '黒い服の人',    x: 30, y: 46,
      desc: '黒い服を着た人々は、外国との交流に関わっていました。' },
    { id: 'building',  name: '建物',          x: 21, y: 7,
      desc: '丸い屋根の建物が描かれています。日本には珍しい形をしています。' },
    { id: 'port',      name: '海・港',        x: 65, y: 55,
      desc: '港には多くの人や船が集まり、交流の場となっていました。' },
  ],
  // ========== 資料2 ==========
  2: [
    { id: 'ship',      name: '船',                    x: 12, y: 50,
      desc: '遠くから来た大きな船は、多くの人や商品を運んでいました。' },
    { id: 'animal',    name: '動物',                  x: 14, y: 80,
      desc: '日本では珍しい動物も描かれています。' },
    { id: 'redrobe',   name: '中心人物（赤い服の人）', x: 50, y: 62,
      desc: 'この人物は、周りより目立つように描かれています。' },
    { id: 'foreigner', name: '外国人',                x: 44, y: 72,
      desc: '外国から来た人々は、日本に新しい文化や商品をもたらしました。' },
    { id: 'blackrobe', name: '黒い服の人',            x: 75, y: 65,
      desc: '黒い服を着た人々は、外国との交流に関わっていました。' },
    { id: 'merchant',  name: '商人っぽい人',          x: 88, y: 58,
      desc: '貿易によって利益を得ようとする人々もいました。' },
    { id: 'port',      name: '海・港',                x: 25, y: 55,
      desc: '港には多くの人や船が集まり、交流の場となっていました。' },
    { id: 'tiger',     name: '動物（トラ）',          x: 33, y: 78,
      desc: '日本にはいないトラのような珍しい動物も連れてこられていました。' },
  ],
};

const SCREEN_ORDER = [
  'screen-title',
  'screen-select',
  'screen-explore-1',
  'screen-memo-pre-1',
  'screen-template-1',
  'screen-memo-post-1',
  'screen-explore-2',
  'screen-memo-pre-2',
  'screen-template-2',
  'screen-memo-post-2',
  'screen-summary',
  'screen-relation',
  'screen-final',
  'screen-result',
];

const STORAGE_KEY = 'nanban-tankyu-state-v1';
const AUTH_KEY    = 'nanban-tankyu-auth-v1';

/* ---------------- 2. 状態管理 ---------------- */

const defaultState = () => ({
  selectedResource: null,
  exp1: { pointId: null, pointName: '', firstNotice: '', whereLooked: '', afterAI: '', changedMind: '' },
  exp2: { pointId: null, pointName: '', firstNotice: '', whereLooked: '', afterAI: '', changedMind: '' },
  relation: '',
  finalSummary: '',
  currentScreen: 'screen-title',
  history: [],
});

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) {
    console.warn('状態の復元に失敗。初期化します。', e);
    return defaultState();
  }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { console.warn('保存に失敗', e); }
}
function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
}

/* ---------------- 3. 認証 ---------------- */

function isAuthenticated() {
  try { return sessionStorage.getItem(AUTH_KEY) === '1'; }
  catch (e) { return false; }
}
function setAuthenticated() {
  try { sessionStorage.setItem(AUTH_KEY, '1'); } catch (e) {}
}

function initAuth() {
  const form    = document.getElementById('auth-form');
  const input   = document.getElementById('auth-input');
  const errorEl = document.getElementById('auth-error');
  if (!form || !input || !errorEl) return;

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const value = (input.value || '').trim();

    if (value === PASSWORD) {
      setAuthenticated();
      errorEl.textContent = '';
      input.value = '';
      const restoreTarget =
        state.currentScreen && state.currentScreen !== 'screen-auth'
          ? state.currentScreen
          : 'screen-title';
      state.history = [];
      showScreen(restoreTarget, { pushHistory: false });
    } else {
      errorEl.textContent = 'パスワードが違います';
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake');
      input.focus();
      input.select();
    }
  });

  input.addEventListener('input', () => {
    if (errorEl.textContent) errorEl.textContent = '';
  });
}

/* ---------------- 4. 画面切り替え ---------------- */

function showScreen(id, opts = {}) {
  const { pushHistory = true } = opts;

  if (pushHistory && state.currentScreen && state.currentScreen !== id) {
    state.history.push(state.currentScreen);
  }

  document.querySelectorAll('.screen').forEach((el) => {
    el.classList.toggle('active', el.id === id);
  });

  state.currentScreen = id;
  saveState();

  const header = document.getElementById('app-header');
  if (id === 'screen-title' || id === 'screen-auth') header.classList.add('hidden');
  else header.classList.remove('hidden');

  updateProgress(id);
  updateHeaderSubtitle(id);

  onEnterScreen(id);

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function updateHeaderSubtitle(id) {
  const sub = document.getElementById('header-subtitle');
  if (!sub) return;
  const phase1 = ['screen-explore-1', 'screen-memo-pre-1', 'screen-template-1', 'screen-memo-post-1'];
  const phase2 = ['screen-explore-2', 'screen-memo-pre-2', 'screen-template-2', 'screen-memo-post-2'];

  if (phase1.includes(id))            sub.textContent = '1つ目の探究';
  else if (phase2.includes(id))       sub.textContent = '2つ目の探究';
  else if (id === 'screen-summary')   sub.textContent = '2つの探究をふり返る';
  else if (id === 'screen-relation')  sub.textContent = '関連性を考える';
  else if (id === 'screen-final')     sub.textContent = '最終まとめ';
  else if (id === 'screen-result')    sub.textContent = '探究結果';
  else                                sub.textContent = '';
}

function goBack() {
  const prev = state.history.pop();
  showScreen(prev || 'screen-title', { pushHistory: false });
}

function updateProgress(id) {
  const idx  = SCREEN_ORDER.indexOf(id);
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  if (!fill || !text) return;
  if (idx < 0) {
    fill.style.width = '0%';
    text.textContent = '';
    return;
  }
  const total = SCREEN_ORDER.length - 1;
  const percent = (idx / total) * 100;
  fill.style.width = percent + '%';
  text.textContent = `${idx + 1} / ${SCREEN_ORDER.length}`;
}

function onEnterScreen(id) {
  switch (id) {
    case 'screen-select':       renderResourceCards(); break;
    case 'screen-explore-1':    setupExploreScreen(1); break;
    case 'screen-explore-2':    setupExploreScreen(2); break;
    case 'screen-memo-pre-1':
    case 'screen-memo-post-1':
    case 'screen-memo-pre-2':
    case 'screen-memo-post-2':  bindMemoFields(); break;
    case 'screen-template-1':   renderTemplate(1); break;
    case 'screen-template-2':   renderTemplate(2); break;
    case 'screen-summary':      renderSummaryBindings(); break;
    case 'screen-relation':
    case 'screen-final':        bindMemoFields(); break;
    case 'screen-result':       renderResult(); break;
  }
}

/* ---------------- 5. 資料選択 ---------------- */

function renderResourceCards() {
  const grid = document.querySelector('#screen-select .resource-grid');
  grid.innerHTML = '';

  RESOURCES.forEach((res) => {
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.dataset.resourceId = String(res.id);
    if (state.selectedResource === res.id) card.classList.add('selected');

    card.innerHTML = `
      <img class="resource-card-image" src="${res.image}" alt="${res.caption}"
           data-src="${res.image}"
           onerror="this.alt='画像が読み込めません'; this.style.height='240px'; console.error('[南蛮貿易] 画像読み込み失敗:', this.dataset.src, '→ 実際のリクエストURL:', this.src);">
      <div class="resource-card-body">
        <div class="resource-label">
          <span class="resource-badge">${res.label}</span>
          <span>${res.caption}</span>
        </div>
        <div class="resource-check">✓</div>
      </div>
    `;
    card.addEventListener('click', () => selectResource(res.id));
    grid.appendChild(card);
  });

  updateGoExploreButton();
}

function selectResource(id) {
  state.selectedResource = id;
  saveState();
  document.querySelectorAll('#screen-select .resource-card').forEach((c) => {
    c.classList.toggle('selected', Number(c.dataset.resourceId) === id);
  });
  updateGoExploreButton();
}

function updateGoExploreButton() {
  const btn = document.getElementById('btn-go-explore-first');
  if (!btn) return;
  btn.disabled = !state.selectedResource;
}

/* ---------------- 6. 資料探索（クリックポイント＆ズーム） ---------------- */

const zoomState = { 1: 1, 2: 1 };
const ZOOM_MIN = 0.6, ZOOM_MAX = 2.5, ZOOM_STEP = 0.2;

function setupExploreScreen(round) {
  const resource = RESOURCES.find((r) => r.id === state.selectedResource);
  if (!resource) {
    showScreen('screen-select');
    return;
  }

  const img = document.querySelector(`.resource-image[data-img="${round}"]`);
  if (img) {
    img.src = resource.image;
    img.alt = resource.caption;
    img.onerror = () => {
      img.alt = '画像が読み込めません';
      console.error('[南蛮貿易] 画像読み込み失敗:', resource.image, '→ 実際のリクエストURL:', img.src);
    };
  }

  zoomState[round] = 1;
  applyZoom(round);

  const stage = document.querySelector(`.image-stage[data-stage="${round}"]`);
  stage.querySelectorAll('.click-point').forEach((p) => p.remove());

  const points = CLICK_POINTS[resource.id] || [];
  points.forEach((p, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'click-point';
    dot.style.left = p.x + '%';
    dot.style.top  = p.y + '%';
    dot.dataset.pointId = p.id;
    dot.textContent = String(i + 1);
    dot.title = p.name;

    if (round === 2 && state.exp1.pointId === p.id) {
      dot.classList.add('used');
      dot.addEventListener('click', () => {
        showToast('そのポイントは1つ目で探究しました。別のポイントを選びましょう。');
      });
    } else {
      dot.addEventListener('click', () => onPointClick(round, p, dot));
    }

    stage.appendChild(dot);
  });

  resetInfoPanel(round);
}

function onPointClick(round, point, dotEl) {
  document
    .querySelectorAll(`.image-stage[data-stage="${round}"] .click-point`)
    .forEach((d) => d.classList.remove('active'));
  dotEl.classList.add('active');

  const panel = document.querySelector(`.info-panel[data-info="${round}"]`);
  panel.querySelector('.info-empty').classList.add('hidden');
  const content = panel.querySelector('.info-content');
  content.classList.remove('hidden');
  panel.querySelector('.info-badge').textContent = point.name;
  panel.querySelector('.info-name').textContent  = point.name;
  panel.querySelector('.info-desc').textContent  = point.desc;

  const btn = panel.querySelector(`[data-action="select-point-${round}"]`);
  btn.dataset.pickPointId   = point.id;
  btn.dataset.pickPointName = point.name;
}

function resetInfoPanel(round) {
  const panel = document.querySelector(`.info-panel[data-info="${round}"]`);
  panel.querySelector('.info-empty').classList.remove('hidden');
  panel.querySelector('.info-content').classList.add('hidden');
}

function applyZoom(round) {
  const stage = document.querySelector(`.image-stage[data-stage="${round}"]`);
  const label = document.getElementById(`zoom-level-${round}`);
  const z = zoomState[round];
  stage.style.transform = `scale(${z})`;
  if (label) label.textContent = Math.round(z * 100) + '%';
}

function changeZoom(round, dir) {
  let z = zoomState[round];
  if (dir === 'in')         z = Math.min(ZOOM_MAX, z + ZOOM_STEP);
  else if (dir === 'out')   z = Math.max(ZOOM_MIN, z - ZOOM_STEP);
  else if (dir === 'reset') z = 1;
  zoomState[round] = Math.round(z * 10) / 10;
  applyZoom(round);
}

/* ---------------- 7. メモ入力（双方向バインド） ---------------- */

function bindMemoFields() {
  document.querySelectorAll('[data-bind]').forEach((el) => {
    const path = el.dataset.bind;
    const value = getStateValue(path);
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = value || '';
      if (!el.dataset.bound) {
        el.addEventListener('input', () => {
          setStateValue(path, el.value);
          saveState();
        });
        el.dataset.bound = '1';
      }
    } else {
      el.textContent = value && value.length ? value : '—';
    }
  });
}

function getStateValue(path) {
  return path.split('.').reduce((o, k) => (o ? o[k] : undefined), state);
}
function setStateValue(path, value) {
  const keys = path.split('.');
  let o = state;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!o[keys[i]]) o[keys[i]] = {};
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = value;
}

/* ---------------- 8. AI 相談テンプレ ---------------- */

function buildTemplate(round) {
  const exp = round === 1 ? state.exp1 : state.exp2;
  const name   = exp.pointName   || '（未選択）';
  const reason = exp.firstNotice || '（最初に気づいたことを記入してください）';
  const where  = exp.whereLooked || '（資料のどこを見たかを記入してください）';

  return (
`私は南蛮貿易図屏風の『${name}』に注目しています。
その理由は、${reason} と感じたからです。
資料では、${where} の部分を見てそう考えました。
この『${name}』がなぜ描かれているのか探究したいです。

答えを教えるのではなく、私が自分で考えるための問いを投げかけてください。
できれば、3つくらいの「考えるきっかけになる質問」を出してください。`
  );
}

function renderTemplate(round) {
  const ta = document.getElementById(`template-${round}`);
  ta.value = buildTemplate(round);
  const link = document.getElementById(`ai-link-${round}`);
  if (link) link.href = AI_LINK;
}

async function copyTemplate(targetId) {
  const ta = document.getElementById(targetId);
  if (!ta) return;
  try {
    await navigator.clipboard.writeText(ta.value);
    showToast('テンプレートをコピーしました！');
  } catch (e) {
    ta.select();
    document.execCommand('copy');
    showToast('テンプレートをコピーしました！');
  }
}

/* ---------------- 9. サマリー / 結果 ---------------- */

function renderSummaryBindings() {
  document.querySelectorAll('#screen-summary [data-bind]').forEach((el) => {
    const v = getStateValue(el.dataset.bind);
    el.textContent = v && v.length ? v : '—';
  });
}

function renderResult() {
  const resource = RESOURCES.find((r) => r.id === state.selectedResource) || { label: '—', caption: '—' };
  const e1 = state.exp1, e2 = state.exp2;
  const container = document.getElementById('result-content');

  const fallback = (v) => (v && v.length ? v : '（未記入）');

  container.innerHTML = `
    <dl class="result-meta">
      <div class="result-meta-item"><dt>選んだ資料</dt><dd>${escapeHTML(resource.label)}</dd></div>
      <div class="result-meta-item"><dt>1つ目に注目したもの</dt><dd>${escapeHTML(fallback(e1.pointName))}</dd></div>
      <div class="result-meta-item"><dt>2つ目に注目したもの</dt><dd>${escapeHTML(fallback(e2.pointName))}</dd></div>
    </dl>

    <div class="result-section">
      <h4>1つ目の探究で分かったこと</h4>
      <p>${escapeHTML(fallback(e1.afterAI))}</p>
    </div>
    <div class="result-section">
      <h4>1つ目で考えが変わったこと</h4>
      <p>${escapeHTML(fallback(e1.changedMind))}</p>
    </div>
    <div class="result-section">
      <h4>2つ目の探究で分かったこと</h4>
      <p>${escapeHTML(fallback(e2.afterAI))}</p>
    </div>
    <div class="result-section">
      <h4>2つ目で考えが変わったこと</h4>
      <p>${escapeHTML(fallback(e2.changedMind))}</p>
    </div>
    <div class="result-section">
      <h4>2つの関連性</h4>
      <p>${escapeHTML(fallback(state.relation))}</p>
    </div>
    <div class="result-section">
      <h4>最終まとめ</h4>
      <p>${escapeHTML(fallback(state.finalSummary))}</p>
    </div>

    <div class="result-narrative">${buildNarrative(resource, e1, e2)}</div>
  `;
}

function buildNarrative(resource, e1, e2) {
  const fb = (v, d='') => (v && v.length ? v : d);
  const p1 = fb(e1.pointName, '（1つ目）');
  const p2 = fb(e2.pointName, '（2つ目）');
  const n1 = fb(e1.firstNotice, '気づいたこと');
  const a1 = fb(e1.afterAI, '');
  const c1 = fb(e1.changedMind, '');
  const a2 = fb(e2.afterAI, '');
  const rel = fb(state.relation, '2つは何らかの形でつながっていると考えました。');
  const fin = fb(state.finalSummary, 'この資料は、当時の人や物の交流を伝えていると考えます。');

  const part1 = `私は南蛮貿易図屏風の<strong>『${escapeHTML(p1)}』</strong>と<strong>『${escapeHTML(p2)}』</strong>に注目しました。`;
  const part2 = `最初、${escapeHTML(p1)}については「${escapeHTML(n1)}」ということに気づきました。`;
  const part3 = a1 ? `AIとの対話や調査を通して、${escapeHTML(a1)} と考えるようになりました。` : '';
  const part3b = c1 ? `（${escapeHTML(c1)}）` : '';
  const part4 = a2 ? `また、${escapeHTML(p2)}については、${escapeHTML(a2)} ということが分かりました。` : '';
  const part5 = `この2つは、${escapeHTML(rel)} という点で関係していると考えます。`;
  const part6 = `そのため、この資料は <strong>${escapeHTML(fin)}</strong>`;

  return [part1, part2, part3, part3b, part4, part5, part6]
    .filter(Boolean)
    .join('\n\n');
}

function escapeHTML(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------------- 10. トースト ---------------- */

let toastTimer = null;
function showToast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 350);
  }, 2200);
}

/* ---------------- 11. アクションハンドラ ---------------- */

function handleAction(action, target) {
  switch (action) {
    case 'go-select':
      showScreen('screen-select'); break;

    case 'go-explore-first':
      if (!state.selectedResource) { showToast('資料を選んでください'); return; }
      showScreen('screen-explore-1'); break;

    case 'select-point-1': {
      const pid = target.dataset.pickPointId;
      const pname = target.dataset.pickPointName;
      if (!pid) { showToast('ポイントを選んでください'); return; }
      state.exp1.pointId = pid;
      state.exp1.pointName = pname;
      saveState();
      showScreen('screen-memo-pre-1');
      break;
    }

    case 'select-point-2': {
      const pid = target.dataset.pickPointId;
      const pname = target.dataset.pickPointName;
      if (!pid) { showToast('ポイントを選んでください'); return; }
      if (pid === state.exp1.pointId) {
        showToast('1つ目と別のポイントを選びましょう。');
        return;
      }
      state.exp2.pointId = pid;
      state.exp2.pointName = pname;
      saveState();
      showScreen('screen-memo-pre-2');
      break;
    }

    case 'go-template-1':   showScreen('screen-template-1'); break;
    case 'go-template-2':   showScreen('screen-template-2'); break;
    case 'go-memo-post-1':  showScreen('screen-memo-post-1'); break;
    case 'go-memo-post-2':  showScreen('screen-memo-post-2'); break;
    case 'go-explore-2':    showScreen('screen-explore-2'); break;
    case 'go-summary':      showScreen('screen-summary'); break;
    case 'go-relation':     showScreen('screen-relation'); break;
    case 'go-final':        showScreen('screen-final'); break;
    case 'go-result':       showScreen('screen-result'); break;
    case 'back':            goBack(); break;
    case 'copy-template':   copyTemplate(target.dataset.target); break;
    case 'print':           window.print(); break;
    case 'restart':
      if (confirm('入力したすべての内容を消して最初に戻ります。よろしいですか？')) {
        resetState();
        location.reload();
      }
      break;
  }
}

/* ---------------- 12. 初期化 ---------------- */

function initEventDelegation() {
  document.body.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    handleAction(el.dataset.action, el);
  });

  document.querySelectorAll('.btn-zoom').forEach((btn) => {
    btn.addEventListener('click', () => {
      const screen = btn.closest('.screen');
      const round = screen && screen.id === 'screen-explore-2' ? 2 : 1;
      changeZoom(round, btn.dataset.zoom);
    });
  });

  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('入力した内容を消して最初に戻ります。よろしいですか？')) {
        resetState();
        location.reload();
      }
    });
  }
}

function init() {
  initEventDelegation();
  initAuth();

  if (!isAuthenticated()) {
    showScreen('screen-auth', { pushHistory: false });
    setTimeout(() => {
      const input = document.getElementById('auth-input');
      if (input) input.focus();
    }, 50);
    return;
  }

  let restoreTarget = state.currentScreen || 'screen-title';
  if (restoreTarget === 'screen-auth') restoreTarget = 'screen-title';
  showScreen(restoreTarget, { pushHistory: false });
}

document.addEventListener('DOMContentLoaded', init);
