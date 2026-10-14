const CATS = {
  income: ['Salary', 'Allowance', 'Side income', 'Other'],
  expense: ['Food', 'Transport', 'Bills', 'Rent', 'Shopping', 'Health', 'Entertainment', 'School', 'Other'],
  saving: ['Emergency fund', 'Goal', 'Investment', 'Other'],
};
const $ = (id) => document.getElementById(id);
const peso = (n) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

const cfg = window.MT_CONFIG || {};
const configured = cfg.url && cfg.anonKey && !cfg.url.startsWith('YOUR_');
const sb = configured ? supabase.createClient(cfg.url, cfg.anonKey) : null;

let items = [];
let month = today().slice(0, 7); // '' = all time

/* ---------- auth (username + password) ---------- */
// Supabase needs an email-style identifier, so each username is mapped to a placeholder address.
// No email is ever sent (keep "Confirm email" OFF in Supabase). If Supabase rejects this domain, change it here.
const FAKE_DOMAIN = 'example.com';
const toEmail = (u) => `${u}@${FAKE_DOMAIN}`;
const validUser = (u) => /^[a-z0-9_]{3,20}$/.test(u);
let mode = 'login';

function setMsg(text, isErr) {
  const el = $('authMsg');
  el.textContent = text || '';
  el.className = 'hint' + (isErr ? ' neg' : '');
}
function setMode(m) {
  mode = m;
  $('tabLogin').classList.toggle('active', m === 'login');
  $('tabSignup').classList.toggle('active', m === 'signup');
  $('password2').hidden = m !== 'signup';
  $('password2').required = m === 'signup';
  $('password').autocomplete = m === 'login' ? 'current-password' : 'new-password';
  $('authBtn').textContent = m === 'login' ? 'Log in' : 'Create account';
  setMsg('');
}
function showAuth(msg) {
  $('appView').hidden = true;
  $('authView').hidden = false;
  if (msg) setMsg(msg);
}
function showApp(user) {
  $('authView').hidden = true;
  $('appView').hidden = false;
  $('userName').textContent = (user.user_metadata && user.user_metadata.username) || (user.email || '').split('@')[0];
}

$('tabLogin').onclick = () => setMode('login');
$('tabSignup').onclick = () => setMode('signup');

$('authForm').onsubmit = async (e) => {
  e.preventDefault();
  const username = $('username').value.trim().toLowerCase();
  const password = $('password').value;
  if (!validUser(username)) return setMsg('Username: 3–20 characters, letters, numbers or underscore only.', true);
  if (mode === 'signup') {
    if (password.length < 8) return setMsg('Password must be at least 8 characters.', true);
    if (password !== $('password2').value) return setMsg('Passwords do not match.', true);
  }
  const btn = $('authBtn');
  btn.disabled = true;
  setMsg(mode === 'login' ? 'Logging in…' : 'Creating account…');
  try {
    if (mode === 'signup') {
      const { data, error } = await sb.auth.signUp({ email: toEmail(username), password, options: { data: { username } } });
      if (error) setMsg(/signups? not allowed|disabled/i.test(error.message) ? 'Sign-ups are closed.' : /already|registered/i.test(error.message) ? 'That username is taken.' : error.message, true);
      else if (!data.session) setMsg('Account created, but Supabase still requires email confirmation. Turn off "Confirm email" (see README).', true);
      else setMsg('');
    } else {
      const { error } = await sb.auth.signInWithPassword({ email: toEmail(username), password });
      if (error) setMsg('Wrong username or password.', true);
      else setMsg('');
    }
  } finally {
    btn.disabled = false;
  }
};
$('logout').onclick = async () => { await sb.auth.signOut(); };

/* ---------- data ---------- */
async function loadItems() {
  const { data, error } = await sb.from('transactions').select('*').order('date', { ascending: false }).limit(5000);
  if (error) { alert('Could not load data: ' + error.message); return; }
  items = data.map((r) => ({ ...r, amount: Number(r.amount) }));
  render();
}

/* ---------- UI ---------- */
function fillCategories() {
  const sel = $('category');
  sel.innerHTML = '';
  CATS[$('type').value].forEach((c) => sel.add(new Option(c, c)));
}

function render() {
  const view = items
    .filter((i) => !month || i.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  const sum = (t) => view.filter((i) => i.type === t).reduce((s, i) => s + i.amount, 0);
  const inc = sum('income'), exp = sum('expense'), sav = sum('saving');
  $('sumIncome').textContent = peso(inc);
  $('sumExpense').textContent = peso(exp);
  $('sumSaving').textContent = peso(sav);
  const bal = inc - exp - sav;
  $('sumBalance').textContent = peso(bal);
  $('sumBalance').className = bal < 0 ? 'neg' : '';
  $('rate').textContent = inc > 0
    ? `Savings rate: ${((sav / inc) * 100).toFixed(1)}% · Spent: ${((exp / inc) * 100).toFixed(1)}% of income`
    : '';

  const byCat = {};
  view.filter((i) => i.type === 'expense').forEach((i) => (byCat[i.category] = (byCat[i.category] || 0) + i.amount));
  const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;
  const bd = $('breakdown');
  bd.innerHTML = '';
  if (!rows.length) bd.innerHTML = '<p class="hint">No expenses in this period.</p>';
  rows.forEach(([cat, val]) => {
    const row = document.createElement('div');
    row.className = 'bar';
    row.innerHTML = '<span class="label"></span><span class="track"><span class="fill"></span></span><span class="val"></span>';
    row.querySelector('.label').textContent = cat;
    row.querySelector('.fill').style.width = (val / max) * 100 + '%';
    row.querySelector('.val').textContent = peso(val);
    bd.appendChild(row);
  });

  const ul = $('list');
  ul.innerHTML = '';
  $('empty').style.display = view.length ? 'none' : '';
  view.forEach((i) => {
    const li = document.createElement('li');
    const sign = i.type === 'income' ? '+' : '−';
    const cls = i.type === 'expense' ? 'neg' : i.type === 'saving' ? '' : 'pos';
    li.innerHTML = '<div class="info"><div class="t"></div><small></small></div><span class="amt"></span><button type="button" title="Delete">✕</button>';
    li.querySelector('.t').textContent = i.category;
    li.querySelector('small').textContent = i.date + (i.type === 'saving' ? ' · savings' : '') + (i.note ? ' · ' + i.note : '');
    const amt = li.querySelector('.amt');
    amt.textContent = sign + peso(i.amount);
    if (cls) amt.className = 'amt ' + cls;
    li.querySelector('button').onclick = async () => {
      if (!confirm('Delete this entry?')) return;
      const { error } = await sb.from('transactions').delete().eq('id', i.id);
      if (error) return alert('Delete failed: ' + error.message);
      items = items.filter((x) => x.id !== i.id);
      render();
    };
    ul.appendChild(li);
  });
}

$('type').onchange = fillCategories;
$('form').onsubmit = async (e) => {
  e.preventDefault();
  const amount = parseFloat($('amount').value);
  if (!(amount > 0)) return;
  const row = {
    type: $('type').value,
    amount: Math.round(amount * 100) / 100,
    category: $('category').value,
    date: $('date').value,
    note: $('note').value.trim(),
  };
  const { data, error } = await sb.from('transactions').insert(row).select().single();
  if (error) return alert('Save failed: ' + error.message);
  items.push({ ...data, amount: Number(data.amount) });
  $('amount').value = '';
  $('note').value = '';
  render();
};

$('month').onchange = () => { month = $('month').value; render(); };
$('allTime').onclick = () => { month = ''; $('month').value = ''; render(); };

$('export').onclick = () => {
  const clean = items.map(({ type, amount, category, date, note }) => ({ type, amount, category, date, note }));
  const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `money-tracker-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};
$('import').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error();
    const rows = data
      .filter((i) => i && CATS[i.type] && Number(i.amount) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(i.date))
      .map((i) => ({ type: i.type, amount: Math.round(Number(i.amount) * 100) / 100, category: String(i.category || 'Other'), date: i.date, note: String(i.note || '').slice(0, 80) }));
    if (!rows.length) throw new Error();
    const { error } = await sb.from('transactions').insert(rows);
    if (error) throw error;
    await loadItems();
    alert(`Imported ${rows.length} entries.`);
  } catch { alert('Invalid backup file or import failed.'); }
  e.target.value = '';
};

/* ---------- boot ---------- */
$('date').value = today();
$('month').value = month;
fillCategories();
setMode('login');

if (!sb) {
  showAuth('Setup needed: add your Supabase URL and anon key in config.js.');
  $('authForm').hidden = true;
  document.querySelector('.tabs').hidden = true;
} else {
  sb.auth.onAuthStateChange((_event, session) => {
    if (session && session.user) { showApp(session.user); loadItems(); }
    else { items = []; $('password').value = ''; $('password2').value = ''; showAuth(); }
  });
  sb.auth.getSession().then(({ data }) => { if (!data.session) showAuth(); });
}
