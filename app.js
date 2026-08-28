/* ==========================================================
   GGSGJ MAIN APPLICATION LOGIC & REAL-TIME FIREBASE ENGINE
   ========================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyBjB1xv-g2tiLilmtVg4ijVRPur5Npp4HE",
    authDomain: "ggsgj-web.firebaseapp.com",
    databaseURL: "https://ggsgj-web-default-rtdb.firebaseio.com",
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
let currentSessionId = localStorage.getItem('ggsgj_session_id') || (Date.now().toString() + Math.random().toString(36).substr(2, 5));
localStorage.setItem('ggsgj_session_id', currentSessionId);

// VARIABEL UNTUK CHAT
let currentChatMode = 'public'; 
let chatListenerRef = null;

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
    document.getElementById('floating-menu').classList.toggle('open');
    document.getElementById('hamburger-btn').classList.toggle('open');
}

function switchPanel(panelName, el) {
    // Kalau yang diklik adalah chat, maka buka halaman full-screen chat
    if(panelName === 'chat') {
        toggleSidebar(); 
        changePage('page-chat');
        openChatRoom('public');
        return; // Hentikan fungsi panel normal
    }

    document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active-panel'));
    document.querySelectorAll('.circle-btn').forEach(i => i.classList.remove('active'));
    document.getElementById(`panel-${panelName}`).classList.add('active-panel');
    el.classList.add('active');
    toggleSidebar();
}

// Fungsi untuk tombol kembali dari chat
function closeChatPage() {
    changePage('page-main');
}

function selectAvatar(el, seedName) {
    document.querySelectorAll('.avatar-option').forEach(img => img.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('bio-avatar').value = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seedName}`;
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

    const userStatusRef = db.ref('status/' + activeUserKey);
    const userSessionRef = db.ref('sessions/' + activeUserKey);

    userSessionRef.set(currentSessionId);
    userStatusRef.set('online');
    userStatusRef.onDisconnect().set('offline');

    userSessionRef.on('value', (snapshot) => {
        const activeSession = snapshot.val();
        if (activeSession && activeSession !== currentSessionId) {
            alert("Sistem mendeteksi akun ini baru saja login di perangkat lain. Anda akan dikeluarkan demi keamanan.");
            logout();
        }
    });

    db.ref('biodata/' + activeUserKey).once('value', (snap) => {
        const savedBio = snap.val() || {};
        document.getElementById('bio-fullname').value = savedBio.fullname || userData.name;
        document.getElementById('bio-age').value = savedBio.age || '';
        document.getElementById('bio-birthday').value = savedBio.birthday || '';
        document.getElementById('bio-school').value = savedBio.school || '';
        if(savedBio.avatar) document.getElementById('bio-avatar').value = savedBio.avatar;
    });

    db.ref('status').on('value', (snap) => {
        renderMemberList(snap.val() || {});
    });

    db.ref('memories').on('value', (snap) => {
        renderMemoryGallery(snap.val() || {});
    });
    
    // Siapkan Daftar DM di Chat
    renderChatSidebar();
}

function logout() {
    if (activeUserKey) {
        db.ref('status/' + activeUserKey).set('offline');
        db.ref('sessions/' + activeUserKey).off(); 
    }
    activeUserKey = null;
    localStorage.removeItem('ggsgj_logged_user');
    document.getElementById('username-input').value = '';
    document.getElementById('password-input').value = '';
    changePage('page-login');
    document.getElementById('floating-menu').classList.remove('open');
    document.getElementById('hamburger-btn').classList.remove('open');
    showToast("Berhasil logout.");
}

function renderMemberList(statusData) {
    const listContainer = document.getElementById('members-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    db.ref('biodata').once('value', (bioSnap) => {
        const allBios = bioSnap.val() || {};
        for (let key in CIRCLE_USERS) {
            let member = CIRCLE_USERS[key];
            let isAdmin = member.role === 'admin';
            let isOnline = (statusData[key] === 'online');
            let avatarImg = (allBios[key] && allBios[key].avatar) ? allBios[key].avatar : "https://api.dicebear.com/7.x/adventurer/svg?seed=" + member.name;

            listContainer.innerHTML += `
                <div class="member-card">
                    <div class="member-info-group">
                        <img src="${avatarImg}" class="member-avatar-img" alt="Avatar">
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
    });
}

// ================= FITUR DATABASE LAINNYA =================
function saveBiodata(e) {
    e.preventDefault();
    const bioData = {
        fullname: document.getElementById('bio-fullname').value,
        age: document.getElementById('bio-age').value,
        birthday: document.getElementById('bio-birthday').value,
        school: document.getElementById('bio-school').value,
        avatar: document.getElementById('bio-avatar').value
    };
    db.ref('biodata/' + activeUserKey).set(bioData).then(() => {
        showToast("Biodata & Avatar berhasil disimpan ke Cloud!");
        db.ref('status').once('value').then(snap => renderMemberList(snap.val() || {}));
        renderChatSidebar(); 
    });
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    showToast("Sedang memproses dan kompresi foto...");

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; 
            const scaleSize = MAX_WIDTH / img.width;
            
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

            db.ref('memories').push({
                imgSrc: compressedBase64,
                uploader: CIRCLE_USERS[activeUserKey].name,
                timestamp: Date.now()
            });
            showToast("Foto berhasil di-upload ke server!");
        }
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
    if(confirm("Yakin ingin menghapus foto ini dari server?")) {
        db.ref('memories/' + memoryKey).remove();
        showToast("Foto berhasil dihapus.");
    }
}

// ================= SISTEM CHAT ROOM =================
function renderChatSidebar() {
    const dmContainer = document.getElementById('dm-list-container');
    dmContainer.innerHTML = '';
    
    db.ref('biodata').once('value', (bioSnap) => {
        const allBios = bioSnap.val() || {};
        
        for (let key in CIRCLE_USERS) {
            if (key === activeUserKey) continue; 
            
            let member = CIRCLE_USERS[key];
            let avatarImg = (allBios[key] && allBios[key].avatar) ? allBios[key].avatar : "https://api.dicebear.com/7.x/adventurer/svg?seed=" + member.name;
            
            dmContainer.innerHTML += `
                <div class="chat-tab" id="tab-${key}" onclick="openChatRoom('${key}')">
                    <img src="${avatarImg}" alt="avatar">
                    <span>${member.name}</span>
                </div>
            `;
        }
    });
}

function openChatRoom(targetMode) {
    currentChatMode = targetMode;
    
    document.querySelectorAll('.chat-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${targetMode}`).classList.add('active');
    
    const headerTitle = document.getElementById('chat-header-title');
    if(targetMode === 'public') {
        headerTitle.innerHTML = '🌍 Public Group';
    } else {
        headerTitle.innerHTML = `🔒 Private Chat - ${CIRCLE_USERS[targetMode].name}`;
    }

    let chatPath = 'chats/public';
    if(targetMode !== 'public') {
        const roomKey = [activeUserKey, targetMode].sort().join('_');
        chatPath = 'chats/private/' + roomKey;
    }

    if(chatListenerRef) chatListenerRef.off();

    const box = document.getElementById('chat-messages-box');
    box.innerHTML = '<i>Memuat pesan...</i>';

    chatListenerRef = db.ref(chatPath);
    chatListenerRef.on('value', (snap) => {
        box.innerHTML = '';
        const data = snap.val();
        if(!data) {
            box.innerHTML = '<p style="color:#aaa; text-align:center;">Belum ada pesan. Mulai obrolan!</p>';
            return;
        }

        Object.keys(data).forEach(key => {
            const msg = data[key];
            const isMe = (msg.sender === activeUserKey);
            const senderName = CIRCLE_USERS[msg.sender].name;
            const timeStr = new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            box.innerHTML += `
                <div class="chat-bubble ${isMe ? 'me' : 'other'}">
                    <div class="chat-info">
                        ${isMe ? `<span>${timeStr}</span><strong>You</strong>` : `<strong>${senderName}</strong><span>${timeStr}</span>`}
                    </div>
                    <div class="chat-text">${msg.text}</div>
                </div>
            `;
        });
        
        box.scrollTop = box.scrollHeight;
    });
}

function sendChatMessage(e) {
    e.preventDefault();
    const inputEl = document.getElementById('chat-input-text');
    const text = inputEl.value.trim();
    if(!text) return;

    let chatPath = 'chats/public';
    if(currentChatMode !== 'public') {
        const roomKey = [activeUserKey, currentChatMode].sort().join('_');
        chatPath = 'chats/private/' + roomKey;
    }

    db.ref(chatPath).push({
        sender: activeUserKey,
        text: text,
        time: Date.now()
    });

    inputEl.value = '';
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
        .then(function() {
            showToast("Laporan Quiz dikirim ke server Email.");
            document.getElementById('quiz-form').reset();
        }, function(error) {
            showToast("Koneksi gagal mengirim email.");
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

if(document.getElementById('page-main').classList.contains('active') && activeUserKey) {
    setupFirebaseRealtime();
}
