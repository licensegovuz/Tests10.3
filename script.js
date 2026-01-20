// ==========================================
// script.js (БЕЗ Telegram-авторизации и БЕЗ отправки результатов)
// ==========================================

// ===== ОПРЕДЕЛЕНИЕ СТРАНИЦЫ =====
// Если на странице есть блок с ID "question", значит мы в test.html
const isTestPage = !!document.getElementById('question');
// Если есть блок "app", значит мы в index.html
const app = document.getElementById('app');

// ===== HELPERS (Чтение настроек) =====
function getTimerValue() {
  const custom = parseInt(document.getElementById('custom-timer')?.value);
  const preset = parseInt(document.getElementById('preset-timer')?.value);
  return custom || preset || 30;
}

function getQuestionsCount() {
  const custom = parseInt(document.getElementById('custom-count')?.value);
  const preset = parseInt(document.getElementById('preset-count')?.value);
  return custom || preset || 15;
}

function getSelectedTheme() {
  return document.getElementById('theme-select')?.value || 'tests.json';
}

// ==========================================
// ЛОГИКА ДЛЯ МЕНЮ (INDEX.HTML)
// ==========================================
if (!isTestPage && app) {
  renderMenu();
}

function renderMenu() {
  app.innerHTML = `
<div class="card">
    <div class="author">Created by Sayfiddinov</div>
    <h2>Добро пожаловать 👋</h2>
    <p><b>Гость</b></p>

    <label>📚 Выберите тему</label>
    <div class="row">
        <select id="theme-select">
            <option value="tests1.json">Тема 1</option>
            <option value="tests2.json">Тема 2</option>
            <option value="tests34.json">Темы 3-4</option>
            <option value="tests5.json">Тема 5</option>
            <option value="tests6.json">Тема 6</option>
            <option value="tests7.json">Тема 7</option>
            <option value="tests8.json">Тема 8</option>
            <option value="tests9.json">Тема 9</option>
            <option value="tests10.json">Тема 10</option>
            <option value="tests.json" selected>Все темы (Микс)</option>
        </select>
    </div>

    <label>⏱ Время на вопрос (сек)</label>  
    <div class="row">  
        <select id="preset-timer">  
            <option value="10">10</option>  
            <option value="20">20</option>  
            <option value="30" selected>30</option>  
            <option value="60">60</option>  
        </select>  
        <input id="custom-timer" type="number" min="5" placeholder="своё">  
    </div>  

    <label>📝 Количество вопросов</label>  
    <div class="row">  
        <select id="preset-count">
            <option value="1000000000" selected>Все вопросы</option>
            <option value="15">15</option>  
            <option value="25">25</option>  
            <option value="30">30</option>  
            <option value="35">35</option>  
            <option value="50">50</option>  
        </select>  
        <input id="custom-count" type="number" min="1" placeholder="своё">  
    </div>  

    <button class="main" id="startBtn">Начать тест</button>  
</div>`;

  document.getElementById('startBtn').onclick = () => {
    localStorage.setItem('timer', getTimerValue());
    localStorage.setItem('qCount', getQuestionsCount());
    localStorage.setItem('currentThemeFile', getSelectedTheme());
    window.location.href = 'test.html';
  };
}

// ==========================================
// ЛОГИКА ДЛЯ ТЕСТА (TEST.HTML)
// ==========================================

// Переменные теста
let timeLimit = 30;
let session = null;
let tests = [];
let timer = null;
let timeLeft = 0;
let selected = null;

if (isTestPage) {
  startTest();
}

function startTest() {
  timeLimit = parseInt(localStorage.getItem('timer')) || 30;
  const countLimit = parseInt(localStorage.getItem('qCount')) || 15;
  const themeFile = localStorage.getItem('currentThemeFile') || 'tests.json';

  session = {
    id: `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    start: Date.now(),
    index: 0,
    score: 0,
    review: false,
    answers: []
  };

  fetch(themeFile)
    .then(r => {
      if (!r.ok) throw new Error("Файл темы не найден");
      return r.json();
    })
    .then(data => {
      const shuffledQuestions = data
        .sort(() => Math.random() - 0.5)
        .slice(0, countLimit);

      tests = shuffledQuestions.map(q => {
        const correctText = q.options[q.answer];
        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
        const newAnswerIndex = shuffledOptions.indexOf(correctText);
        return { ...q, options: shuffledOptions, answer: newAnswerIndex };
      });

      showQuestion();
    })
    .catch(err => {
      alert("Ошибка загрузки теста: " + err.message);
      window.location.href = 'index.html';
    });
}

function showQuestion() {
  clearInterval(timer);
  selected = null;

  const q = tests[session.index];
  if (!q) return finish();

  const state = session.answers[session.index] || { selected: null, answered: false, timeout: false };
  selected = state.selected;

  const qContainer = document.getElementById('question');
  const optionsEl = document.getElementById('options');

  if (!qContainer || !optionsEl) return;

  qContainer.innerHTML = `
    <div class="progress">
      ${session.review ? `Просмотр ${session.index + 1} / ${tests.length}` : `Вопрос ${session.index + 1} из ${tests.length}`}
    </div>
    <div>${q.question}</div>
  `;

  optionsEl.innerHTML = '';
  let confirmBtn = null;

  q.options.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = text;

    if (state.answered || state.timeout || session.review) {
      btn.disabled = true;
      if (i === q.answer) btn.classList.add('correct');
      if (state.selected !== null && i === state.selected && i !== q.answer) btn.classList.add('wrong');
    } else {
      btn.onclick = () => {
        selected = i;
        optionsEl.querySelectorAll('.option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (confirmBtn) confirmBtn.disabled = false;
      };
      if (i === selected) btn.classList.add('selected');
    }

    optionsEl.appendChild(btn);
  });

  if (!state.answered && !state.timeout && !session.review) {
    confirmBtn = document.createElement('button');
    confirmBtn.className = 'main';
    confirmBtn.textContent = 'Ответить';
    confirmBtn.disabled = selected === null;
    confirmBtn.onclick = () => confirmAnswer(false);
    optionsEl.appendChild(confirmBtn);
    startTimer();
  }

  renderNavButtons();
}

function startTimer() {
  timeLeft = timeLimit;
  const t = document.getElementById('timer');
  if (!t) return;

  t.textContent = `⏱ ${timeLeft}`;
  t.className = 'timer';
  t.classList.remove('warning');

  timer = setInterval(() => {
    timeLeft--;
    t.textContent = `⏱ ${timeLeft}`;
    if (timeLeft <= 5) t.classList.add('warning');
    if (timeLeft <= 0) {
      clearInterval(timer);
      confirmAnswer(true);
    }
  }, 1000);
}

function confirmAnswer(fromTimer) {
  clearInterval(timer);
  const q = tests[session.index];

  session.answers[session.index] = {
    selected: fromTimer ? null : selected,
    answered: !fromTimer,
    timeout: fromTimer
  };

  if (!fromTimer && selected === q.answer) session.score++;
  showQuestion();
}

function renderNavButtons() {
  const optionsEl = document.getElementById('options');
  let nav = document.querySelector('.nav-buttons');

  if (!nav) {
    nav = document.createElement('div');
    nav.className = 'nav-buttons';
    optionsEl.appendChild(nav);
  }

  nav.innerHTML = '';
  const state = session.answers[session.index];
  const isLast = session.index === tests.length - 1;

  if (session.index > 0 && (state?.answered || state?.timeout || session.review)) {
    const prev = document.createElement('button');
    prev.textContent = '←';
    prev.onclick = () => { session.index--; showQuestion(); };
    nav.appendChild(prev);
  }

  if (state && !isLast) {
    const next = document.createElement('button');
    next.textContent = '→';
    next.onclick = () => { session.index++; showQuestion(); };
    nav.appendChild(next);
  }

  if (state && isLast && !session.review) {
    const finishBtn = document.createElement('button');
    finishBtn.className = 'main';
    finishBtn.textContent = 'Завершить тест';
    finishBtn.onclick = finish;
    nav.appendChild(finishBtn);
  }
}

function finish() {
  const card = document.querySelector('.card');
  if (!card) return;

  card.innerHTML = `
    <h2>Тест завершён</h2>
    <p>👤 Гость</p>
    <p>✅ ${session.score}/${tests.length}</p>
    <button class="main" onclick="startReview()">📋 Просмотреть ответы</button>
    <button class="main" onclick="window.location.href='index.html'">🏠 В главное меню</button>
  `;
}

function startReview() {
  session.review = true;
  session.index = 0;

  const card = document.querySelector('.card');
  if (!card) return;

  card.innerHTML = `<div id="timer"></div><div id="question"></div><div id="options"></div>`;
  showQuestion();
}
