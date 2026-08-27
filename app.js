/* ==========================================================
   GGSGJ MAIN APPLICATION LOGIC & REAL-TIME FIREBASE ENGINE
   ========================================================== */

// 1. INisialisasi Firebase dengan Kunci Rahasia Kamu
const firebaseConfig = {
    apiKey: "AIzaSyBjB1xv-g2tiLilmtVg4ijVRPur5Npp4HE",
    authDomain: "ggsgj-web.firebaseapp.com",
    projectId: "ggsgj-web",
    storageBucket: "ggsgj-web.firebasestorage.app",
    messagingSenderId: "234555191251",
    appId: "1:234555191251:web:9a96b1a31460f1f7cb0926",
    measurementId: "G-5195816JJ6"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const CIRCLE_USERS = {
    "hafiz":  { pass: "AdminHafiz", name: "Hafiz", role: "admin" },
    "alif":   { pass: "AlifAdmin", name: "Alif", role: "admin" },
    "rooney": { pass: "RooneyAlgava", name: "Rooney", role: "admin" },
    "fachry": { pass: "Farnovgun", name: "Fachry", role: "member" },
    "david":  { pass: "Davidmember", name: "David", role: "member" },
    "farel":  { pass: "Farelbucin", name: "Farel", role: "member" },
    "fathir": { pass: "Fathirkeren", name: "Fathir", role: "member" }
};

let activeUserKey = localStorage.getItem('ggsgj_logged_user') || null;
// Bikin ID unik untuk setiap tab/browser yang buka web ini
let currentSessionId = localStorage.getItem('ggsgj_session_id') || (Date.now().toString() + Math.random().toString(36).substr(2, 5));
localStorage.setItem('ggsgj_session_id', currentSessionId);

// ================= UI & NAVIGATION =================
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

function changePage(targetPageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(targetPageId).classList.add('active');
}

function triggerBubble(btn) {
    const circle = document.createElement('span');
    circle.classList.add('bubble-effect');
    const d = Math.max(btn.clientWidth, btn.clientHeight);
    circle.style.width = circle.style.height = `${d}px`;
    circle.style.left = `0px`; circle.style.top = `0px`;
    btn.appendChild(circle);
    btn.classList.add('pop');
    
    setTimeout(() => { 
        circle.remove(); 
        btn.classList.remove('pop'); 
        if (activeUserKey && CIRCLE_USERS[activeUserKey]) {
            setupFirebaseRealtime();
            changePage('page-main');
        } else {
            changePage('page-login'); 
        }
    }, 450);
}

function toggleSidebar() {
    document.getElementById('app-sidebar').classList.toggle('open');
    document.getElementById('hamburger-btn').classList.toggle('open');
}

function switchPanel(panelName, el) {
    document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active-panel'));
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    document.getElementById(`panel-${panelName}`).classList.add('active-panel');
    el.classList.add('active');
    if (window.innerWidth <= 768) toggleSidebar();
}

// ================= AUTH & REAL-TIME STATUS =================
function handleLoginSubmit(e) {
    e.preventDefault();
    const uInput = document.getElementById('username-input').value.trim().toLowerCase();
    const pInput = document.getElementById('password-input').value.trim();
    const btn = document.getElementById('login-action-btn');
    const errMsg = document.getElementById('login-error-msg');

    btn.classList.remove('cracked', 'shattered');
    errMsg.style.display = 'none';

    if (CIRCLE_USERS[uInput] && CIRCLE_USERS[uInput].pass === pInput) {
        activeUserKey = uInput;
        localStorage.setItem('ggsgj_logged_user', uInput);
        
        // Animasi Kaca Pecah
        btn.classList.add('shattered');
        setTimeout(() => {
            setupFirebaseRealtime();
            changePage('page-main');
            btn.classList.remove('shattered');
            showToast(`Halo, ${CIRCLE_USERS[uInput].name}! Selamat datang di GGSGJ.`);
        }, 450);
    } else {
        btn.classList.add('cracked');
        errMsg.innerText = "Ups, username atau password salah!";
        errMsg.style.display = 'block';
        setTimeout(() => { btn.classList.remove('cracked'); }, 400);
    }
}

function setupFirebaseRealtime() {
    const userData = CIRCLE_USERS[activeUserKey];
    document.getElementById('current-user-greeting').innerText = userData.name;

    // 1. Set Status Online & Session 1 Device
    const userStatusRef = db.ref('status/' + activeUserKey);
    const userSessionRef = db.ref('sessions/' + activeUserKey);

    userSessionRef.set(currentSessionId);
    userStatusRef.set('online');
    
    // Kalau tiba-tiba tab di-close atau koneksi putus, otomatis jadi offline
    userStatusRef.onDisconnect().set('offline');

    // Mencegah Login Ganda (Single Device Force Logout)
    userSessionRef.on('value', (snapshot) => {
        const activeSession = snapshot.val();
        if (activeSession && activeSession !== currentSessionId) {
            alert("Sistem mendeteksi akun ini baru saja login di perangkat lain. Anda akan dikeluarkan demi keamanan.");
            logout();
        }
    });

    // 2. Tarik Data Biodata
    db.ref('biodata/' + activeUserKey).once('value', (snap) => {
        const savedBio = snap.val() || {};
        document.getElementById('bio-fullname').value = savedBio.fullname || userData.name;
        document.getElementById('bio-age').value = savedBio.age || '';
        document.getElementById('bio-birthday').value = savedBio.birthday || '';
        document.getElementById('bio-school').value = savedBio.school || '';
    });

    // 3. Listener Realtime Member Online
    db.ref('status').on('value', (snap) => {
        renderMemberList(snap.val() || {});
    });

    // 4. Listener Realtime Gallery Memory
    db.ref('memories').on('value', (snap) => {
        renderMemoryGallery(snap.val() || {});
    });
}

function logout() {
    if (activeUserKey) {
        db.ref('status/' + activeUserKey).set('offline');
        db.ref('sessions/' + activeUserKey).off(); // Matikan listener
    }
    activeUserKey = null;
    localStorage.removeItem('ggsgj_logged_user');
    document.getElementById('username-input').value = '';
    document.getElementById('password-input').value = '';
    changePage('page-login');
    if(document.getElementById('app-sidebar').classList.contains('open')) toggleSidebar();
    showToast("Berhasil logout.");
}

function renderMemberList(statusData) {
    const listContainer = document.getElementById('members-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    for (let key in CIRCLE_USERS) {
        let member = CIRCLE_USERS[key];
        let isAdmin = member.role === 'admin';
        let isOnline = (statusData[key] === 'online');

        listContainer.innerHTML += `
            <div class="member-card">
                <div class="member-info-group">
                    <span>${member.name}</span>
                    <span class="role-tag ${isAdmin ? 'role-admin' : 'role-member'}">${isAdmin ? 'Admin' : 'Member'}</span>
                </div>
                <div class="status-indicator">
                    <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
                    <span style="color: ${isOnline ? 'var(--color-white)' : 'var(--offline-gray)'};">
                        ${isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>`;
    }
}

// ================= FITUR DATABASE LAINNYA =================
function saveBiodata(e) {
    e.preventDefault();
    const bioData = {
        fullname: document.getElementById('bio-fullname').value,
        age: document.getElementById('bio-age').value,
        birthday: document.getElementById('bio-birthday').value,
        school: document.getElementById('bio-school').value
    };
    // Simpan ke Firebase Realtime
    db.ref('biodata/' + activeUserKey).set(bioData).then(() => {
        showToast("Biodata berhasil disimpan ke Cloud Server!");
    });
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Batasi ukuran file (Optional tapi bagus untuk mencegah server penuh)
    if(file.size > 2000000) {
        alert("Ukuran foto maksimal 2MB ya, biar server nggak jebol!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const base64Image = event.target.result;
        // Push langsung ke database Firebase
        db.ref('memories').push({
            imgSrc: base64Image,
            uploader: CIRCLE_USERS[activeUserKey].name,
            timestamp: Date.now()
        });
        showToast("Foto sedang di-upload ke server...");
    };
    reader.readAsDataURL(file);
}

function renderMemoryGallery(memoriesObj) {
    const gallery = document.getElementById('memory-gallery-container');
    if (!gallery) return;
    gallery.innerHTML = '';
    
    const keys = Object.keys(memoriesObj);
    if (keys.length === 0) {
        gallery.innerHTML = '<p style="color:gray; grid-column: 1/-1;">Belum ada memori. Yuk upload foto pertama circle kalian!</p>';
        return;
    }

    // Urutkan dari yang terbaru
    keys.reverse().forEach(key => {
        let mem = memoriesObj[key];
        gallery.innerHTML += `
            <div class="memory-card">
                <img src="${mem.imgSrc}" alt="Memory">
                <button class="delete-mem-btn" onclick="deleteMemory('${key}')">Hapus</button>
            </div>`;
    });
}

function deleteMemory(memoryKey) {
    if(confirm("Yakin ingin menghapus foto ini dari server? (Akan hilang untuk semua orang)")) {
        db.ref('memories/' + memoryKey).remove();
        showToast("Foto berhasil dihapus.");
    }
}

// ================= QUIZ & EMAILJS =================
function submitQuiz(e) {
    e.preventDefault();
    const ans1 = document.getElementById('quiz-ans-1').value;
    const ans2 = document.getElementById('quiz-ans-2').value;
    const ans3 = document.getElementById('quiz-ans-3').value;
    const userName = CIRCLE_USERS[activeUserKey].name;
    const currentTime = new Date().toLocaleString('id-ID');

    const templateParams = {
        from_name: userName,
        ans_1: ans1,
        ans_2: ans2,
        ans_3: ans3,
        time: currentTime
    };

    emailjs.send('service_bt4m9wa', 'template_iez197j', templateParams)
        .then(function(response) {
            showToast("Mantap! Laporan Quiz berhasil dikirim ke server Email.");
            document.getElementById('quiz-form').reset();
        }, function(error) {
            showToast("Koneksi gagal mengirim email.");
            console.log('FAILED...', error);
        });
}

// ================= BACKGROUND ANIMATION =================
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");
let particlesArray = [];

function initCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesArray = [];
    const numberOfParticles = (canvas.width * canvas.height) / 18000;
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2.5) + 1;
        let x = Math.random() * innerWidth;
        let y = Math.random() * innerHeight;
        let dirX = (Math.random() * 0.8) - 0.4;
        let dirY = (Math.random() * 0.8) - 0.4;
        let color = Math.random() > 0.5 ? '#3A86EF' : '#F4D35E';
        particlesArray.push({x, y, dirX, dirY, size, color});
    }
}

function animateParticles() {
    requestAnimationFrame(animateParticles);
    if (!ctx) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    
    for (let i = 0; i < particlesArray.length; i++) {
        let p = particlesArray[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2, false);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.4;
        ctx.fill();

        p.x += p.dirX;
        p.y += p.dirY;

        if (p.x > innerWidth || p.x < 0) p.dirX = -p.dirX;
        if (p.y > innerHeight || p.y < 0) p.dirY = -p.dirY;
    }
}

window.addEventListener('resize', initCanvas);
initCanvas();
animateParticles();

// Jika otomatis bypass login (karena sesi masih ada), panggil setup real-time
if(document.getElementById('page-main').classList.contains('active') && activeUserKey) {
    setupFirebaseRealtime();
}
