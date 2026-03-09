// ============================================================
// DATA LAYER
// ============================================================
const KEYS = { users: 'ot_users', session: 'ot_session', logs: 'overtime_logs' };

function store(key) {
    return {
        getAll: () => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
        save: (data) => localStorage.setItem(key, JSON.stringify(data)),
        get: () => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
        set: (val) => localStorage.setItem(key, JSON.stringify(val)),
        clear: () => localStorage.removeItem(key)
    };
}

const usersStore = store(KEYS.users);
const sessionStore = store(KEYS.session);
const logsStore = store(KEYS.logs);

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ============================================================
// INIT DEFAULT ADMIN
// ============================================================
function initDefaultAdmin() {
    const users = usersStore.getAll();
    if (users.length === 0) {
        usersStore.save([{
            id: genId(), username: 'admin', password: 'admin123',
            full_name: 'Sếp Sơn', role: 'admin', active: true,
            created_at: new Date().toISOString()
        }]);
    }
}
initDefaultAdmin();

// ============================================================
// AUTH
// ============================================================
function login(username, password) {
    const users = usersStore.getAll();
    const user = users.find(u => u.username === username && u.password === password && u.active);
    if (!user) return null;
    const session = { id: user.id, username: user.username, full_name: user.full_name, role: user.role };
    sessionStore.set(session);
    return session;
}

function logout() { sessionStore.clear(); showLogin(); }
function currentUser() { return sessionStore.get(); }
function hasRole(...roles) { const u = currentUser(); return u && roles.includes(u.role); }
function isAdmin() { return hasRole('admin'); }
function isLeaderOrAdmin() { return hasRole('admin', 'leader'); }

function getActiveUsers() { return usersStore.getAll().filter(u => u.active); }
function getAllUsers() { return usersStore.getAll(); }
function getMarketers() { return getActiveUsers().map(u => u.full_name); }

// ============================================================
// OVERTIME LOGS CRUD
// ============================================================
function addLog(entry) {
    const data = logsStore.getAll();
    entry.id = genId();
    entry.created_at = new Date().toISOString();
    data.push(entry);
    logsStore.save(data);
    return entry;
}
function updateLog(id, updates) {
    const data = logsStore.getAll();
    const idx = data.findIndex(e => e.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...updates };
    logsStore.save(data);
    return data[idx];
}
function deleteLog(id) { logsStore.save(logsStore.getAll().filter(e => e.id !== id)); }
function getFilteredLogs(filters = {}) {
    let data = logsStore.getAll();
    const user = currentUser();
    // Staff can only see own entries
    if (user && user.role === 'staff') {
        data = data.filter(e => e.marketer_name === user.full_name);
    }
    if (filters.month) data = data.filter(e => e.date && e.date.startsWith(filters.month));
    if (filters.marketer) data = data.filter(e => e.marketer_name === filters.marketer);
    if (filters.status) data = data.filter(e => e.leader_confirmation === filters.status);
    return data.sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));
}

// ============================================================
// USER MANAGEMENT CRUD
// ============================================================
function addUser(userData) {
    const users = usersStore.getAll();
    if (users.find(u => u.username === userData.username)) return { error: 'Username already exists' };
    const user = { id: genId(), ...userData, active: true, created_at: new Date().toISOString() };
    users.push(user);
    usersStore.save(users);
    return user;
}
function updateUser(id, updates) {
    const users = usersStore.getAll();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    if (updates.username && updates.username !== users[idx].username) {
        if (users.find(u => u.username === updates.username && u.id !== id)) return { error: 'Username already exists' };
    }
    users[idx] = { ...users[idx], ...updates };
    usersStore.save(users);
    return users[idx];
}
function toggleUserActive(id) {
    const users = usersStore.getAll();
    const u = users.find(u => u.id === id);
    if (!u) return;
    const me = currentUser();
    if (u.id === me.id) { showToast('Cannot deactivate your own account', 'error'); return; }
    u.active = !u.active;
    usersStore.save(users);
    return u;
}

// ============================================================
// SELF-REGISTRATION
// ============================================================
function registerUser(fullName, username, password) {
    const users = usersStore.getAll();
    if (users.find(u => u.username === username)) return { error: 'Username đã tồn tại' };
    const user = { id: genId(), full_name: fullName, username, password, role: 'staff', active: true, created_at: new Date().toISOString() };
    users.push(user);
    usersStore.save(users);
    return user;
}

// ============================================================
// UI — SHOW/HIDE LOGIN & APP
// ============================================================
function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-wrapper').classList.add('hidden');
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').textContent = '';
    showLoginForm();
}

function showLoginForm() {
    document.getElementById('login-form').style.display = '';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-toggle').innerHTML = 'Chưa có tài khoản? <a href="javascript:void(0)" onclick="showRegisterForm()">Đăng ký ngay</a>';
}

function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = '';
    document.getElementById('login-toggle').innerHTML = 'Đã có tài khoản? <a href="javascript:void(0)" onclick="showLoginForm()">Đăng nhập</a>';
}

function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-wrapper').classList.remove('hidden');
    const user = currentUser();
    // Update sidebar user info
    document.getElementById('sidebar-avatar').textContent = user.full_name.charAt(0).toUpperCase();
    document.getElementById('sidebar-username').textContent = user.full_name;
    document.getElementById('sidebar-userrole').textContent = user.role.toUpperCase();
    document.getElementById('sidebar-userrole').className = 'user-role role-' + user.role;
    // Show/hide admin menu
    document.getElementById('nav-users').style.display = isAdmin() ? '' : 'none';
    // Build sidebar nav visibility
    updateTopbarDate();
    populateMarketerDropdowns();
    navigateTo('dashboard');
}

// ============================================================
// LOGIN FORM
// ============================================================
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if (!username || !password) {
        document.getElementById('login-error').textContent = 'Vui lòng nhập username và mật khẩu';
        return;
    }
    const session = login(username, password);
    if (!session) {
        document.getElementById('login-error').textContent = 'Sai thông tin hoặc tài khoản đã bị vô hiệu hóa';
        return;
    }
    showApp();
    if (session.username === 'admin' && session.role === 'admin') {
        showToast('⚠️ Hãy đổi mật khẩu mặc định trong User Management', 'warning');
    }
});

// ============================================================
// REGISTER FORM
// ============================================================
document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const fullName = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const errEl = document.getElementById('register-error');
    errEl.textContent = '';
    if (!fullName || !username || !password) { errEl.textContent = 'Vui lòng điền đầy đủ thông tin'; return; }
    if (password.length < 4) { errEl.textContent = 'Mật khẩu phải có ít nhất 4 ký tự'; return; }
    if (password !== confirm) { errEl.textContent = 'Mật khẩu xác nhận không khớp'; return; }
    const result = registerUser(fullName, username, password);
    if (result.error) { errEl.textContent = result.error; return; }
    showLoginForm();
    document.getElementById('login-username').value = username;
    document.getElementById('login-error').style.color = 'var(--success)';
    document.getElementById('login-error').textContent = '✅ Đăng ký thành công! Hãy đăng nhập.';
    setTimeout(() => { document.getElementById('login-error').style.color = ''; }, 5000);
});

// ============================================================
// NAVIGATION
// ============================================================
const pageTitles = { 'dashboard': 'Dashboard', 'add-overtime': 'Add Overtime', 'history': 'Overtime History', 'users': 'User Management' };

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.dataset.page); });
});

function navigateTo(page) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pg = document.getElementById('page-' + page);
    if (pg) pg.classList.add('active');
    document.getElementById('page-title').textContent = pageTitles[page] || page;
    if (page === 'dashboard') refreshDashboard();
    if (page === 'history') refreshHistory();
    if (page === 'users') refreshUsers();
}

// ============================================================
// TOPBAR DATE
// ============================================================
function updateTopbarDate() {
    const now = new Date();
    document.getElementById('topbar-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ============================================================
// POPULATE MARKETER DROPDOWNS
// ============================================================
function populateMarketerDropdowns() {
    const marketers = getMarketers();
    const user = currentUser();
    const selectors = ['#f-marketer', '#edit-marketer', '#dash-filter-marketer', '#hist-filter-marketer'];
    selectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (!el) return;
        const isFilter = sel.includes('filter');
        while (el.options.length > 1) el.remove(1);
        const list = (user.role === 'staff' && !isFilter) ? [user.full_name] : marketers;
        list.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name; opt.textContent = name;
            el.appendChild(opt);
        });
        if (user.role === 'staff' && !isFilter) el.value = user.full_name;
    });
}

// ============================================================
// HELPER
// ============================================================
function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
function timeToMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function formatDate(ds) {
    if (!ds) return '';
    return new Date(ds + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function calcTotal(sId, eId, tId) {
    const s = document.getElementById(sId).value, e = document.getElementById(eId).value;
    const el = document.getElementById(tId);
    if (s && e) { const d = (timeToMinutes(e) - timeToMinutes(s)) / 60; el.value = d > 0 ? d.toFixed(1) + ' hrs' : ''; }
    else el.value = '';
}

// ============================================================
// FORM VALIDATION
// ============================================================
function validateOT(prefix) {
    const g = id => document.getElementById(prefix + id);
    const ep = prefix === 'f-' ? 'err-' : 'edit-err-';
    const marketer = g('marketer').value, date = g('date').value;
    const start = g('start').value, end = g('end').value;
    const campaign = g('campaign').value.trim();
    let valid = true;
    document.querySelectorAll(`[id^="${ep}"]`).forEach(el => el.textContent = '');
    [g('marketer'), g('date'), g('start'), g('end'), g('campaign')].forEach(el => { if (el) el.classList.remove('error'); });

    function err(field, msg) { document.getElementById(ep + field).textContent = msg; g(field).classList.add('error'); valid = false; }

    if (!marketer) err('marketer', 'Required');
    if (!date) err('date', 'Required');
    if (!start) err('start', 'Required');
    else if (timeToMinutes(start) < 1020) err('start', 'Cannot be before 17:00');
    else if (timeToMinutes(start) >= 1260) err('start', 'Must be before 21:00');
    if (!end) err('end', 'Required');
    else if (timeToMinutes(end) > 1260) err('end', 'Cannot be after 21:00');
    else if (timeToMinutes(end) <= 1020) err('end', 'Must be after 17:00');
    if (start && end && timeToMinutes(end) <= timeToMinutes(start)) err('end', 'Must be after start');
    if (!campaign) err('campaign', 'Required');

    return valid ? { marketer, date, start, end, campaign } : null;
}

// ============================================================
// ADD OVERTIME FORM
// ============================================================
document.getElementById('f-start').addEventListener('change', () => calcTotal('f-start', 'f-end', 'f-total'));
document.getElementById('f-end').addEventListener('change', () => calcTotal('f-start', 'f-end', 'f-total'));

document.getElementById('ot-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const v = validateOT('f-');
    if (!v) return;
    const hrs = (timeToMinutes(v.end) - timeToMinutes(v.start)) / 60;
    addLog({
        marketer_name: v.marketer, date: v.date, start_time: v.start, end_time: v.end,
        total_hours: parseFloat(hrs.toFixed(2)), campaign_id: v.campaign,
        leader_confirmation: document.getElementById('f-status').value
    });
    showToast('Overtime entry saved!', 'success');
    resetOTForm();
});

function resetOTForm() {
    document.getElementById('ot-form').reset();
    document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('f-total').value = '';
    document.querySelectorAll('[id^="err-"]').forEach(el => el.textContent = '');
    document.querySelectorAll('#ot-form input,#ot-form select').forEach(el => el.classList.remove('error'));
    const user = currentUser();
    if (user && user.role === 'staff') document.getElementById('f-marketer').value = user.full_name;
}

// ============================================================
// HISTORY TABLE
// ============================================================
function refreshHistory() {
    const filters = {
        month: document.getElementById('hist-filter-month').value,
        marketer: document.getElementById('hist-filter-marketer').value,
        status: document.getElementById('hist-filter-status').value
    };
    const data = getFilteredLogs(filters);
    const body = document.getElementById('history-body');
    const canEdit = isLeaderOrAdmin();

    if (!data.length) {
        body.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📭</div><h4>No records found</h4><p>Try adjusting filters or add a new entry.</p></div></td></tr>`;
        return;
    }
    body.innerHTML = data.map(e => `<tr>
        <td>${formatDate(e.date)}</td>
        <td><strong>${e.marketer_name}</strong></td>
        <td><code style="background:#f0f2f5;padding:2px 7px;border-radius:4px;font-size:.8rem">${e.campaign_id}</code></td>
        <td>${e.start_time}</td><td>${e.end_time}</td>
        <td><strong>${e.total_hours}h</strong></td>
        <td><span class="badge badge-${e.leader_confirmation.toLowerCase()}">${e.leader_confirmation}</span></td>
        <td>${canEdit ? `<div class="actions-cell">
            <button class="btn-icon edit" title="Edit" onclick="openEditOT('${e.id}')">✏️</button>
            <button class="btn-icon danger" title="Delete" onclick="confirmDeleteOT('${e.id}')">🗑️</button>
        </div>` : '—'}</td>
    </tr>`).join('');
}

['hist-filter-month', 'hist-filter-marketer', 'hist-filter-status'].forEach(id => {
    document.getElementById(id).addEventListener('change', refreshHistory);
});

// ============================================================
// EDIT OT MODAL
// ============================================================
document.getElementById('edit-start').addEventListener('change', () => calcTotal('edit-start', 'edit-end', 'edit-total'));
document.getElementById('edit-end').addEventListener('change', () => calcTotal('edit-start', 'edit-end', 'edit-total'));

function openEditOT(id) {
    const entry = logsStore.getAll().find(e => e.id === id);
    if (!entry) return;
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-marketer').value = entry.marketer_name;
    document.getElementById('edit-date').value = entry.date;
    document.getElementById('edit-start').value = entry.start_time;
    document.getElementById('edit-end').value = entry.end_time;
    document.getElementById('edit-campaign').value = entry.campaign_id;
    document.getElementById('edit-status').value = entry.leader_confirmation;
    calcTotal('edit-start', 'edit-end', 'edit-total');
    document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
    document.querySelectorAll('[id^="edit-err-"]').forEach(el => el.textContent = '');
}

document.getElementById('edit-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const v = validateOT('edit-');
    if (!v) return;
    const hrs = (timeToMinutes(v.end) - timeToMinutes(v.start)) / 60;
    updateLog(document.getElementById('edit-id').value, {
        marketer_name: v.marketer, date: v.date, start_time: v.start, end_time: v.end,
        total_hours: parseFloat(hrs.toFixed(2)), campaign_id: v.campaign,
        leader_confirmation: document.getElementById('edit-status').value
    });
    closeEditModal();
    showToast('Entry updated!', 'success');
    refreshHistory(); refreshDashboard();
});

document.getElementById('edit-modal').addEventListener('click', function (e) { if (e.target === this) closeEditModal(); });

function confirmDeleteOT(id) {
    if (confirm('Delete this overtime entry?')) {
        deleteLog(id);
        showToast('Entry deleted', 'info');
        refreshHistory(); refreshDashboard();
    }
}

// ============================================================
// DASHBOARD
// ============================================================
let barChart = null, lineChart = null;

function refreshDashboard() {
    const filters = {
        month: document.getElementById('dash-filter-month').value,
        marketer: document.getElementById('dash-filter-marketer').value,
        status: document.getElementById('dash-filter-status').value
    };
    const data = getFilteredLogs(filters);
    const totalHours = data.reduce((s, e) => s + (e.total_hours || 0), 0);
    document.getElementById('stat-total-hours').textContent = totalHours.toFixed(1);
    document.getElementById('stat-total-entries').textContent = data.length;
    const approved = data.filter(e => e.leader_confirmation === 'Approved').length;
    document.getElementById('stat-approved-pct').textContent = (data.length ? Math.round(approved / data.length * 100) : 0) + '%';

    // OT Earnings: weekday 40,000/hr, Sunday 50,000/hr
    const OT_RATE_WEEKDAY = 40000;
    const OT_RATE_SUNDAY = 50000;
    const BASE_SALARY = 6000000;
    let totalEarnings = 0;
    data.forEach(e => {
        if (!e.date || !e.total_hours) return;
        const dayOfWeek = new Date(e.date + 'T00:00:00').getDay(); // 0 = Sunday
        const rate = dayOfWeek === 0 ? OT_RATE_SUNDAY : OT_RATE_WEEKDAY;
        totalEarnings += e.total_hours * rate;
    });
    const fmtVND = (n) => n.toLocaleString('vi-VN') + 'đ';
    document.getElementById('stat-ot-earnings').textContent = fmtVND(totalEarnings);
    const monthlyIncome = BASE_SALARY + totalEarnings;
    document.getElementById('stat-monthly-income').textContent = fmtVND(monthlyIncome);
    document.getElementById('stat-income-detail').textContent = `6tr + ${fmtVND(totalEarnings)} OT`;

    const mh = {};
    data.forEach(e => { mh[e.marketer_name] = (mh[e.marketer_name] || 0) + (e.total_hours || 0); });
    const sorted = Object.entries(mh).sort((a, b) => b[1] - a[1]);
    document.getElementById('stat-top-marketer').textContent = sorted.length ? sorted[0][0].split(' ').pop() : '—';

    // Ranking
    const rb = document.getElementById('ranking-body');
    if (!sorted.length) {
        rb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-light);padding:24px">No data</td></tr>';
    } else {
        rb.innerHTML = sorted.map(([name, hrs], i) => {
            const rc = i < 3 ? `rank-${i + 1}` : 'rank-default';
            return `<tr><td><span class="rank-num ${rc}">${i + 1}</span></td><td><strong>${name}</strong></td><td>${hrs.toFixed(1)}h</td><td>${data.filter(e => e.marketer_name === name).length}</td></tr>`;
        }).join('');
    }

    // Bar Chart
    const barCtx = document.getElementById('chart-bar').getContext('2d');
    if (barChart) barChart.destroy();
    const colors = ['#e63946', '#ff6b6b', '#f4845f', '#f7b267', '#f7d08a', '#7ec8e3', '#5fa8d3', '#3a86a7'];
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: { labels: sorted.map(([n]) => n.split(' ').pop()), datasets: [{ label: 'Hours', data: sorted.map(([, h]) => +h.toFixed(1)), backgroundColor: sorted.map((_, i) => colors[i % colors.length]), borderRadius: 8, borderSkipped: false, barPercentage: 0.6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { title: items => sorted[items[0].dataIndex][0], label: item => item.raw + ' hours' } } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' } }, x: { grid: { display: false } } } }
    });

    // Line Chart
    const lineCtx = document.getElementById('chart-line').getContext('2d');
    if (lineChart) lineChart.destroy();
    const dm = {};
    data.forEach(e => { dm[e.date] = (dm[e.date] || 0) + (e.total_hours || 0); });
    const ds = Object.entries(dm).sort((a, b) => a[0].localeCompare(b[0]));
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: { labels: ds.map(([d]) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })), datasets: [{ label: 'Hours', data: ds.map(([, h]) => +h.toFixed(1)), borderColor: '#e63946', backgroundColor: 'rgba(230,57,70,.08)', fill: true, tension: .4, pointRadius: 5, pointBackgroundColor: '#e63946', pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 7 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' } }, x: { grid: { display: false } } } }
    });
}

['dash-filter-month', 'dash-filter-marketer', 'dash-filter-status'].forEach(id => {
    document.getElementById(id).addEventListener('change', refreshDashboard);
});

// ============================================================
// USER MANAGEMENT
// ============================================================
function refreshUsers() {
    const users = getAllUsers();
    const body = document.getElementById('users-body');
    body.innerHTML = users.map(u => `<tr>
        <td><strong>${u.full_name}</strong></td>
        <td><code style="background:#f0f2f5;padding:2px 7px;border-radius:4px;font-size:.8rem">${u.username}</code></td>
        <td><span class="badge badge-${u.role}">${u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span></td>
        <td><span class="badge badge-${u.active ? 'active' : 'inactive'}">${u.active ? 'Active' : 'Inactive'}</span></td>
        <td><div class="actions-cell">
            <button class="btn-icon edit" title="Edit" onclick="openEditUser('${u.id}')">✏️</button>
            <button class="btn-icon ${u.active ? 'danger' : 'edit'}" title="${u.active ? 'Deactivate' : 'Activate'}" onclick="toggleUser('${u.id}')">${u.active ? '🚫' : '✅'}</button>
        </div></td>
    </tr>`).join('');
}

// Add User Modal
function openAddUser() {
    document.getElementById('user-modal-title').textContent = 'Add New User';
    document.getElementById('user-form').reset();
    document.getElementById('user-edit-id').value = '';
    document.getElementById('user-password-group').style.display = '';
    document.getElementById('user-password').required = true;
    document.getElementById('user-modal').classList.add('active');
}

function openEditUser(id) {
    const u = getAllUsers().find(u => u.id === id);
    if (!u) return;
    document.getElementById('user-modal-title').textContent = 'Edit User';
    document.getElementById('user-edit-id').value = id;
    document.getElementById('user-fullname').value = u.full_name;
    document.getElementById('user-username').value = u.username;
    document.getElementById('user-password').value = '';
    document.getElementById('user-password').required = false;
    document.getElementById('user-password-group').style.display = '';
    document.getElementById('user-password-hint').style.display = '';
    document.getElementById('user-role').value = u.role;
    document.getElementById('user-modal').classList.add('active');
}

function closeUserModal() {
    document.getElementById('user-modal').classList.remove('active');
    document.getElementById('user-form-error').textContent = '';
}

document.getElementById('user-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const editId = document.getElementById('user-edit-id').value;
    const fullName = document.getElementById('user-fullname').value.trim();
    const username = document.getElementById('user-username').value.trim();
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;

    if (!fullName || !username) {
        document.getElementById('user-form-error').textContent = 'Name and username are required';
        return;
    }

    if (editId) {
        const updates = { full_name: fullName, username: username, role: role };
        if (password) updates.password = password;
        const result = updateUser(editId, updates);
        if (result && result.error) { document.getElementById('user-form-error').textContent = result.error; return; }
        showToast('User updated!', 'success');
    } else {
        if (!password) { document.getElementById('user-form-error').textContent = 'Password is required'; return; }
        const result = addUser({ full_name: fullName, username: username, password: password, role: role });
        if (result && result.error) { document.getElementById('user-form-error').textContent = result.error; return; }
        showToast('User created!', 'success');
    }
    closeUserModal();
    refreshUsers();
    populateMarketerDropdowns();
});

document.getElementById('user-modal').addEventListener('click', function (e) { if (e.target === this) closeUserModal(); });

function toggleUser(id) {
    const u = toggleUserActive(id);
    if (u) {
        showToast(u.active ? 'User activated' : 'User deactivated', 'info');
        refreshUsers();
        populateMarketerDropdowns();
    }
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = `<span>${icons[type] || ''}</span> ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// ============================================================
// APP INIT
// ============================================================
function initApp() {
    const user = currentUser();
    if (user) {
        // Verify user still exists and is active
        const u = usersStore.getAll().find(u => u.id === user.id && u.active);
        if (u) { showApp(); return; }
        sessionStore.clear();
    }
    showLogin();
}

// Set default month values
document.getElementById('dash-filter-month').value = currentMonth();
document.getElementById('hist-filter-month').value = currentMonth();
document.getElementById('f-date').value = new Date().toISOString().split('T')[0];

// Logout button
document.getElementById('btn-logout').addEventListener('click', logout);

initApp();
