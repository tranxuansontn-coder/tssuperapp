// ============================================================
// SUPER APP — AUTH & USER MANAGEMENT
// Shares localStorage keys with OT Tracker for SSO
// ============================================================
const KEYS = { users: 'ot_users', session: 'ot_session' };

function storeGet(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function storeSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function storeDel(key) { localStorage.removeItem(key); }
function getUsers() { return storeGet(KEYS.users) || []; }
function saveUsers(u) { storeSet(KEYS.users, u); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// Init default admin
(function initAdmin() {
    if (getUsers().length === 0) {
        saveUsers([{ id: genId(), username: 'admin', password: 'admin123', full_name: 'Sếp Sơn', role: 'admin', active: true, created_at: new Date().toISOString() }]);
    }
})();

// ---- Auth Functions ----
function login(username, password) {
    const user = getUsers().find(u => u.username === username && u.password === password && u.active);
    if (!user) return null;
    const session = { id: user.id, username: user.username, full_name: user.full_name, role: user.role };
    storeSet(KEYS.session, session);
    return session;
}
function logout() { storeDel(KEYS.session); showLoginPage(); }
function currentUser() { return storeGet(KEYS.session); }
function isAdmin() { const u = currentUser(); return u && u.role === 'admin'; }

function registerUser(fullName, username, password) {
    const users = getUsers();
    if (users.find(u => u.username === username)) return { error: 'Username đã tồn tại' };
    const user = { id: genId(), full_name: fullName, username, password, role: 'staff', active: true, created_at: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    return user;
}

// ---- User CRUD (admin) ----
function addUserAdmin(data) {
    const users = getUsers();
    if (users.find(u => u.username === data.username)) return { error: 'Username đã tồn tại' };
    users.push({ id: genId(), ...data, active: true, created_at: new Date().toISOString() });
    saveUsers(users);
    return true;
}
function updateUserAdmin(id, updates) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    if (updates.username && updates.username !== users[idx].username && users.find(u => u.username === updates.username && u.id !== id)) return { error: 'Username đã tồn tại' };
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
    return users[idx];
}
function toggleUserActive(id) {
    const users = getUsers();
    const u = users.find(u => u.id === id);
    if (!u) return;
    const me = currentUser();
    if (u.id === me.id) { showToast('Không thể vô hiệu hóa tài khoản của bạn', 'error'); return; }
    u.active = !u.active;
    saveUsers(users);
    return u;
}

// ============================================================
// UI — LOGIN / APP TOGGLE
// ============================================================
function showLoginPage() {
    document.getElementById('login-page').classList.add('active');
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').textContent = '';
    showLoginForm();
}
function showLoginForm() {
    document.getElementById('login-form').style.display = '';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-toggle').innerHTML = 'Chưa có tài khoản? <a onclick="showRegisterForm()">Đăng ký ngay</a>';
}
function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = '';
    document.getElementById('login-toggle').innerHTML = 'Đã có tài khoản? <a onclick="showLoginForm()">Đăng nhập</a>';
}
function showApp() {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('app-container').style.display = '';
    const user = currentUser();
    document.getElementById('sidebar-avatar').textContent = user.full_name.charAt(0).toUpperCase();
    document.getElementById('sidebar-uname').textContent = user.full_name;
    const rb = document.getElementById('sidebar-role');
    rb.textContent = user.role.toUpperCase();
    rb.className = 'role-badge role-' + user.role;
    // Show/hide admin nav
    document.getElementById('nav-users').style.display = isAdmin() ? '' : 'none';
    navigate('home');
}

// ---- Login Form ----
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if (!username || !password) { document.getElementById('login-error').textContent = 'Vui lòng nhập username và mật khẩu'; return; }
    const session = login(username, password);
    if (!session) { document.getElementById('login-error').textContent = 'Sai thông tin hoặc tài khoản đã bị vô hiệu hóa'; return; }
    showApp();
    if (session.username === 'admin' && session.role === 'admin') showToast('⚠️ Hãy đổi mật khẩu mặc định trong Quản lý nhân viên', 'warning');
});

// ---- Register Form ----
document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const fullName = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const err = document.getElementById('register-error');
    err.textContent = '';
    if (!fullName || !username || !password) { err.textContent = 'Vui lòng điền đầy đủ thông tin'; return; }
    if (password.length < 4) { err.textContent = 'Mật khẩu phải có ít nhất 4 ký tự'; return; }
    if (password !== confirm) { err.textContent = 'Mật khẩu xác nhận không khớp'; return; }
    const result = registerUser(fullName, username, password);
    if (result.error) { err.textContent = result.error; return; }
    showLoginForm();
    document.getElementById('login-username').value = username;
    document.getElementById('login-error').style.color = '#10b981';
    document.getElementById('login-error').textContent = '✅ Đăng ký thành công! Hãy đăng nhập.';
    setTimeout(() => { document.getElementById('login-error').style.color = ''; }, 5000);
});

// ============================================================
// NAVIGATION (views + sidebar)
// ============================================================
const COMING_SOON_DATA = {
    voice: { icon: '<i class="fa-solid fa-microphone-lines" style="color:#10b981"></i>', title: 'Sửa Voice', sub: 'Công cụ chỉnh sửa, cắt ghép, lọc noise file audio đang được phát triển.' },
    ads: { icon: '<i class="fa-brands fa-facebook" style="color:#3b82f6"></i>', title: 'Phân Tích & Đánh Giá Ads', sub: 'Dashboard phân tích Facebook Ads với AI — sắp ra mắt.' },
    forum: { icon: '<i class="fa-solid fa-comments" style="color:#ec4899"></i>', title: 'TS Forum', sub: 'Diễn đàn nội bộ TS Global Group đang trong giai đoạn thiết kế.' },
    dailybonus: { icon: '<i class="fa-solid fa-gift" style="color:#f59e0b"></i>', title: 'Thưởng ngày', sub: 'Hệ thống tính thưởng theo hiệu suất làm việc hàng ngày — đang phát triển.' },
    teambonus: { icon: '<i class="fa-solid fa-people-group" style="color:#8b5cf6"></i>', title: 'Thưởng team', sub: 'Tính thưởng theo nhóm, đánh giá hiệu suất team — đang phát triển.' },
    monthlyincome: { icon: '<i class="fa-solid fa-wallet" style="color:#10b981"></i>', title: 'Thu nhập tháng', sub: 'Tổng thu nhập dự kiến: Lương cứng 6tr + Thưởng + OT — giúp marketing biết được lương tháng trước khi tính KPI doanh số.' }
};
const TOPBAR_LABELS = {
    home: { icon: 'fa-house', label: 'Tổng quan' },
    image: { icon: 'fa-image', label: 'Sửa ảnh & Dịch ảnh' },
    video: { icon: 'fa-film', label: 'Bóc băng Video' },
    scorer: { icon: 'fa-star', label: 'Chấm Điểm & Set Giá' },
    overtime: { icon: 'fa-clock', label: 'OT Tracker' },
    users: { icon: 'fa-users-gear', label: 'Quản lý nhân viên' },
    dailybonus: { icon: 'fa-gift', label: 'Thưởng ngày' },
    teambonus: { icon: 'fa-people-group', label: 'Thưởng team' },
    monthlyincome: { icon: 'fa-wallet', label: 'Thu nhập tháng' },
    voice: { icon: 'fa-microphone-lines', label: 'Sửa Voice' },
    ads: { icon: 'fa-chart-line', label: 'Phân Tích Ads' },
    forum: { icon: 'fa-comments', label: 'TS Forum' }
};

function navigate(view, comingKey) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (view === 'coming' && comingKey) {
        const data = COMING_SOON_DATA[comingKey] || {};
        document.getElementById('comingIcon').innerHTML = data.icon || '<i class="fa-solid fa-clock"></i>';
        document.getElementById('comingTitle').textContent = data.title || 'Sắp ra mắt';
        document.getElementById('comingSub').textContent = data.sub || '';
        document.getElementById('view-coming').classList.add('active');
        const ne = document.getElementById('nav-' + comingKey);
        if (ne) ne.classList.add('active');
        const tb = TOPBAR_LABELS[comingKey] || TOPBAR_LABELS.home;
        document.getElementById('topbar').querySelector('.topbar-title').innerHTML = `<i class="fa-solid ${tb.icon}" style="color:var(--primary)"></i><span>${tb.label}</span>`;
    } else {
        const ve = document.getElementById('view-' + view);
        if (ve) ve.classList.add('active');
        const ne = document.getElementById('nav-' + view);
        if (ne) ne.classList.add('active');
        const tb = TOPBAR_LABELS[view] || TOPBAR_LABELS.home;
        document.getElementById('topbar').querySelector('.topbar-title').innerHTML = `<i class="fa-solid ${tb.icon}" style="color:var(--primary)"></i><span>${tb.label}</span>`;
        if (view === 'users') refreshUserMgmt();
        // Reload OT Tracker iframe to pick up session (SSO)
        if (view === 'overtime') {
            const frame = document.querySelector('#view-overtime iframe');
            if (frame) frame.src = frame.src;
        }
    }
}

// ---- Collapsible Nav Groups ----
document.querySelectorAll('.nav-group-header').forEach(header => {
    header.addEventListener('click', () => {
        header.classList.toggle('open');
        const items = header.nextElementSibling;
        items.classList.toggle('open');
    });
    // Open by default
    header.classList.add('open');
    header.nextElementSibling.classList.add('open');
});

// ============================================================
// USER MANAGEMENT VIEW
// ============================================================
function refreshUserMgmt() {
    const users = getUsers();
    const body = document.getElementById('users-mgmt-body');
    body.innerHTML = users.map(u => `<tr>
        <td><strong style="color:var(--text-bright)">${u.full_name}</strong></td>
        <td><code>${u.username}</code></td>
        <td><span class="mgmt-badge ${u.role}">${u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span></td>
        <td><span class="mgmt-badge ${u.active ? 'active' : 'inactive'}">${u.active ? 'Active' : 'Inactive'}</span></td>
        <td><div class="actions-cell">
            <button class="btn-mgmt-icon" title="Sửa" onclick="openEditUser('${u.id}')">✏️</button>
            <button class="btn-mgmt-icon ${u.active ? 'danger' : ''}" title="${u.active ? 'Vô hiệu hóa' : 'Kích hoạt'}" onclick="toggleUser('${u.id}')">${u.active ? '🚫' : '✅'}</button>
        </div></td>
    </tr>`).join('');
}

function openAddUser() {
    document.getElementById('user-modal-title').textContent = 'Thêm nhân viên';
    document.getElementById('user-form').reset();
    document.getElementById('user-edit-id').value = '';
    document.getElementById('user-pw').required = true;
    document.getElementById('user-pw-hint').style.display = 'none';
    document.getElementById('user-modal').classList.add('active');
}
function openEditUser(id) {
    const u = getUsers().find(u => u.id === id);
    if (!u) return;
    document.getElementById('user-modal-title').textContent = 'Sửa nhân viên';
    document.getElementById('user-edit-id').value = id;
    document.getElementById('user-fn').value = u.full_name;
    document.getElementById('user-un').value = u.username;
    document.getElementById('user-pw').value = '';
    document.getElementById('user-pw').required = false;
    document.getElementById('user-pw-hint').style.display = '';
    document.getElementById('user-rl').value = u.role;
    document.getElementById('user-modal').classList.add('active');
}
function closeUserModal() {
    document.getElementById('user-modal').classList.remove('active');
    document.getElementById('user-form-error').textContent = '';
}
document.getElementById('user-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const editId = document.getElementById('user-edit-id').value;
    const fn = document.getElementById('user-fn').value.trim();
    const un = document.getElementById('user-un').value.trim();
    const pw = document.getElementById('user-pw').value;
    const rl = document.getElementById('user-rl').value;
    const errEl = document.getElementById('user-form-error');
    if (!fn || !un) { errEl.textContent = 'Tên và username là bắt buộc'; return; }
    if (editId) {
        const updates = { full_name: fn, username: un, role: rl };
        if (pw) updates.password = pw;
        const res = updateUserAdmin(editId, updates);
        if (res && res.error) { errEl.textContent = res.error; return; }
        showToast('Đã cập nhật!', 'success');
    } else {
        if (!pw) { errEl.textContent = 'Mật khẩu là bắt buộc'; return; }
        const res = addUserAdmin({ full_name: fn, username: un, password: pw, role: rl });
        if (res && res.error) { errEl.textContent = res.error; return; }
        showToast('Đã thêm nhân viên!', 'success');
    }
    closeUserModal();
    refreshUserMgmt();
});
document.getElementById('user-modal').addEventListener('click', function (e) { if (e.target === this) closeUserModal(); });
function toggleUser(id) {
    const u = toggleUserActive(id);
    if (u) { showToast(u.active ? 'Đã kích hoạt' : 'Đã vô hiệu hóa', 'info'); refreshUserMgmt(); }
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
// INIT
// ============================================================
(function init() {
    const user = currentUser();
    if (user) {
        const u = getUsers().find(u => u.id === user.id && u.active);
        if (u) { showApp(); return; }
        storeDel(KEYS.session);
    }
    showLoginPage();
})();
