// ============================================================
// SUPER APP — AUTH & USER MANAGEMENT (FIREBASE FIRESTORE)
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyCC83ANMEUhotAgetLng366fRu-ub26a_0",
    authDomain: "ts-global-super-app.firebaseapp.com",
    projectId: "ts-global-super-app",
    storageBucket: "ts-global-super-app.firebasestorage.app",
    messagingSenderId: "4116358702",
    appId: "1:4116358702:web:c13bbdaae217dd986f71ff",
    measurementId: "G-08TGP97ME"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Session helpers (localStorage — per-browser only)
function getSession() { try { return JSON.parse(localStorage.getItem('ot_session')); } catch { return null; } }
function setSession(s) { localStorage.setItem('ot_session', JSON.stringify(s)); }
function clearSession() { localStorage.removeItem('ot_session'); }
function currentUser() { return getSession(); }
function isAdmin() { const u = currentUser(); return u && u.role === 'admin'; }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ============================================================
// FIRESTORE — USER OPERATIONS
// ============================================================
async function getUsers() {
    const snap = await db.collection('users').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getUserByUsername(username) {
    const snap = await db.collection('users').where('username', '==', username).get();
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function createUser(data) {
    const existing = await getUserByUsername(data.username);
    if (existing) return { error: 'Username đã tồn tại' };
    const id = genId();
    const user = { ...data, active: data.active !== undefined ? data.active : true, created_at: new Date().toISOString() };
    await db.collection('users').doc(id).set(user);
    return { id, ...user };
}

async function updateUser(id, updates) {
    if (updates.username) {
        const existing = await getUserByUsername(updates.username);
        if (existing && existing.id !== id) return { error: 'Username đã tồn tại' };
    }
    await db.collection('users').doc(id).update(updates);
    return true;
}

async function toggleUserActive(id) {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return null;
    const u = doc.data();
    const me = currentUser();
    if (id === me.id) { showToast('Không thể vô hiệu hóa tài khoản của bạn', 'error'); return null; }
    const newActive = !u.active;
    await db.collection('users').doc(id).update({ active: newActive });
    return { id, ...u, active: newActive };
}

// Init default admin if no users exist
async function initDefaultAdmin() {
    const existing = await getUserByUsername('admin');
    if (!existing) {
        await createUser({
            username: 'admin', password: 'admin123',
            full_name: 'Sếp Sơn', role: 'admin'
        });
        console.log('✅ Default admin created');
    }
}

// ============================================================
// AUTH FUNCTIONS
// ============================================================
async function login(username, password) {
    const user = await getUserByUsername(username);
    if (!user || user.password !== password || !user.active) return null;
    const session = { id: user.id, username: user.username, full_name: user.full_name, role: user.role };
    setSession(session);
    // Also sync to localStorage for OT Tracker iframe SSO
    localStorage.setItem('ot_users', JSON.stringify(await getUsers()));
    return session;
}

function logout() { clearSession(); showLoginPage(); }

async function registerUser(fullName, username, password) {
    return await createUser({ full_name: fullName, username, password, role: 'staff' });
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
    document.getElementById('nav-users').style.display = isAdmin() ? '' : 'none';
    navigate('home');
}

// ---- Login Form ----
document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if (!username || !password) { document.getElementById('login-error').textContent = 'Vui lòng nhập username và mật khẩu'; return; }
    btn.disabled = true; btn.textContent = '⏳ Đang đăng nhập...';
    try {
        const session = await login(username, password);
        if (!session) { document.getElementById('login-error').textContent = 'Sai thông tin hoặc tài khoản đã bị vô hiệu hóa'; return; }
        showApp();
        if (session.username === 'admin' && session.role === 'admin') showToast('⚠️ Hãy đổi mật khẩu mặc định trong Quản lý nhân viên', 'warning');
    } catch (err) {
        document.getElementById('login-error').textContent = 'Lỗi kết nối. Thử lại sau.';
        console.error(err);
    } finally { btn.disabled = false; btn.textContent = '🔐 Đăng Nhập'; }
});

// ---- Register Form ----
document.getElementById('register-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    const fullName = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const err = document.getElementById('register-error');
    err.textContent = '';
    if (!fullName || !username || !password) { err.textContent = 'Vui lòng điền đầy đủ thông tin'; return; }
    if (password.length < 4) { err.textContent = 'Mật khẩu phải có ít nhất 4 ký tự'; return; }
    if (password !== confirm) { err.textContent = 'Mật khẩu xác nhận không khớp'; return; }
    btn.disabled = true; btn.textContent = '⏳ Đang đăng ký...';
    try {
        const result = await registerUser(fullName, username, password);
        if (result.error) { err.textContent = result.error; return; }
        showLoginForm();
        document.getElementById('login-username').value = username;
        document.getElementById('login-error').style.color = '#10b981';
        document.getElementById('login-error').textContent = '✅ Đăng ký thành công! Hãy đăng nhập.';
        setTimeout(() => { document.getElementById('login-error').style.color = ''; }, 5000);
    } catch (error) {
        err.textContent = 'Lỗi kết nối. Thử lại sau.';
        console.error(error);
    } finally { btn.disabled = false; btn.textContent = '📝 Đăng Ký'; }
});

// ============================================================
// NAVIGATION
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
        header.nextElementSibling.classList.toggle('open');
    });
    header.classList.add('open');
    header.nextElementSibling.classList.add('open');
});

// ============================================================
// USER MANAGEMENT (ADMIN)
// ============================================================
async function refreshUserMgmt() {
    const body = document.getElementById('users-mgmt-body');
    body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">⏳ Đang tải...</td></tr>';
    try {
        const users = await getUsers();
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
    } catch (err) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#e74c3c">❌ Lỗi tải dữ liệu</td></tr>';
        console.error(err);
    }
}

function openAddUser() {
    document.getElementById('user-modal-title').textContent = 'Thêm nhân viên';
    document.getElementById('user-form').reset();
    document.getElementById('user-edit-id').value = '';
    document.getElementById('user-pw').required = true;
    document.getElementById('user-pw-hint').style.display = 'none';
    document.getElementById('user-modal').classList.add('active');
}
async function openEditUser(id) {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return;
    const u = doc.data();
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

document.getElementById('user-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const editId = document.getElementById('user-edit-id').value;
    const fn = document.getElementById('user-fn').value.trim();
    const un = document.getElementById('user-un').value.trim();
    const pw = document.getElementById('user-pw').value;
    const rl = document.getElementById('user-rl').value;
    const errEl = document.getElementById('user-form-error');
    if (!fn || !un) { errEl.textContent = 'Tên và username là bắt buộc'; return; }
    try {
        if (editId) {
            const updates = { full_name: fn, username: un, role: rl };
            if (pw) updates.password = pw;
            const res = await updateUser(editId, updates);
            if (res && res.error) { errEl.textContent = res.error; return; }
            showToast('Đã cập nhật!', 'success');
        } else {
            if (!pw) { errEl.textContent = 'Mật khẩu là bắt buộc'; return; }
            const res = await createUser({ full_name: fn, username: un, password: pw, role: rl });
            if (res && res.error) { errEl.textContent = res.error; return; }
            showToast('Đã thêm nhân viên!', 'success');
        }
        closeUserModal();
        refreshUserMgmt();
        // Sync users list to localStorage for OT Tracker
        localStorage.setItem('ot_users', JSON.stringify(await getUsers()));
    } catch (err) {
        errEl.textContent = 'Lỗi lưu dữ liệu';
        console.error(err);
    }
});

document.getElementById('user-modal').addEventListener('click', function (e) { if (e.target === this) closeUserModal(); });

async function toggleUser(id) {
    const u = await toggleUserActive(id);
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
(async function init() {
    try {
        await initDefaultAdmin();
        const session = getSession();
        if (session) {
            const doc = await db.collection('users').doc(session.id).get();
            if (doc.exists && doc.data().active) {
                showApp();
                return;
            }
            clearSession();
        }
        showLoginPage();
    } catch (err) {
        console.error('Firebase init error:', err);
        showLoginPage();
    }
})();
