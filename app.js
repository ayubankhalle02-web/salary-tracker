const KEY = 'moneyTracker.v1';
const CATS = {
  income: ['Salary', 'Allowance', 'Side income', 'Other'],
  expense: ['Food', 'Transport', 'Bills', 'Rent', 'Shopping', 'Health', 'Entertainment', 'School', 'Other'],
  saving: ['Emergency fund', 'Goal', 'Investment', 'Other'],
};
const $ = (id) => document.getElementById(id);
const peso = (n) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

let items = load();
let month = today().slice(0, 7); // '' = all time

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { alert('Could not save data (storage blocked?).'); }
}

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

  // category breakdown
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

  // list
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
    li.querySelector('button').onclick = () => {
      if (confirm('Delete this entry?')) { items = items.filter((x) => x.id !== i.id); save(); render(); }
    };
    ul.appendChild(li);
  });
}

$('type').onchange = fillCategories;
$('form').onsubmit = (e) => {
  e.preventDefault();
  const amount = parseFloat($('amount').value);
  if (!(amount > 0)) return;
  items.push({
    id: Date.now(),
    type: $('type').value,
    amount: Math.round(amount * 100) / 100,
    category: $('category').value,
    date: $('date').value,
    note: $('note').value.trim(),
  });
  save();
  $('amount').value = '';
  $('note').value = '';
  render();
};

$('month').onchange = () => { month = $('month').value; render(); };
$('allTime').onclick = () => { month = ''; $('month').value = ''; render(); };

$('export').onclick = () => {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
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
    const valid = data.filter((i) => i && CATS[i.type] && i.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(i.date));
    const known = new Set(items.map((i) => i.id));
    valid.forEach((i) => { if (!known.has(i.id)) items.push({ id: i.id || Date.now() + Math.random(), type: i.type, amount: +i.amount, category: String(i.category || 'Other'), date: i.date, note: String(i.note || '') }); });
    save(); render();
  } catch { alert('Invalid backup file.'); }
  e.target.value = '';
};

$('date').value = today();
$('month').value = month;
fillCategories();
render();
