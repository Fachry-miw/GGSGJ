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

let currentChatMode = 'public'; 
let chatListenerRef = null;
let keramatInitialized = false; 

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
    if(panelName === 'chat') {
        toggleSidebar(); 
        changePage('page-chat');
        openChatRoom('public');
        return; 
    }

    document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active-panel'));
    document.querySelectorAll('.circle-btn').forEach(i => i.classList.remove('active'));
    document.getElementById(`panel-${panelName}`).classList.add('active-panel');
    el.classList.add('active');
    toggleSidebar();

    if(panelName === 'history' && !keramatInitialized) {
        setTimeout(initKeramatBubbles, 100);
        keramatInitialized = true;
    }
}

function closeChatPage() {
    changePage('page-main');
}

function selectAvatar(el, imagePath) {
    document.querySelectorAll('.avatar-option').forEach(img => img.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('bio-avatar').value = imagePath;
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
        if(savedBio.avatar) {
            document.getElementById('bio-avatar').value = savedBio.avatar;
            myAvatarUrl = savedBio.avatar; 
        }
    });

    db.ref('status').on('value', (snap) => {
        renderMemberList(snap.val() || {});
    });

    db.ref('memories').on('value', (snap) => {
        renderMemoryGallery(snap.val() || {});
    });
    
    // Perbaikan Bug Papan Skor Loading Terus (Jika Database Masih Kosong)
    const lbContainer = document.getElementById('arcade-leaderboard-list');
    db.ref('arcade_leaderboard').on('value', (snap) => {
        if(!snap.exists()) {
            lbContainer.innerHTML = '<p style="color:gray; font-style:italic;">Belum ada satupun yang main. Mainkan game 1 kali untuk membuka papan skor!</p>';
        } else {
            renderLeaderboard(snap.val());
        }
    });

    renderChatSidebar();

    if(!keramatInitialized && document.getElementById('panel-history').classList.contains('active-panel')) {
        setTimeout(initKeramatBubbles, 300);
        keramatInitialized = true;
    }
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

    db.ref('biodata').once('value', (bioSnap) => {
        listContainer.innerHTML = ''; 
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

// ================= MESIN FISIKA KALIMAT KERAMAT =================
const KERAMAT_DATA = [
    { name: "Hapes", quotes: ["SSheeeeessshhh"] },
    { name: "Alif", quotes: ["What the hell", "Well well well"] },
    { name: "Roni", quotes: ["ou shit", "even anjeng"] },
    { name: "Fachry", quotes: ["I just give some words for prepare ur way"] },
    { name: "Farel", quotes: ["langsung saja reg"] },
    { name: "Fathir", quotes: ["Got caught by fbi"] },
    { name: "David", quotes: ["tak perlu menjadi yang paling terang, cukup redup tapi tak pernah padam."] }
];

function initKeramatBubbles() {
    const container = document.getElementById('keramat-container');
    if(!container) return;
    container.innerHTML = '';
    
    let bubbles = [];
    
    KERAMAT_DATA.forEach((member) => {
        let el = document.createElement('div');
        el.className = 'keramat-bubble';
        let nameEl = document.createElement('div');
        nameEl.className = 'keramat-name';
        nameEl.innerText = member.name;
        el.appendChild(nameEl);
        
        member.quotes.forEach(q => {
            let qEl = document.createElement('div');
            qEl.className = 'keramat-quote';
            qEl.innerText = `"${q}"`;
            el.appendChild(qEl);
        });
        container.appendChild(el);
        
        let rect = container.getBoundingClientRect();
        let bw = el.offsetWidth;
        let bh = el.offsetHeight;
        let x = Math.random() * (rect.width - bw);
        let y = Math.random() * (rect.height - bh);
        let vx = (Math.random() - 0.5) * 1.5; 
        let vy = (Math.random() - 0.5) * 1.5;
        
        let bubbleObj = { el, x, y, vx, vy, width: bw, height: bh, isDragging: false };
        bubbles.push(bubbleObj);
        
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        
        let startX, startY, initialX, initialY;
        const dragStart = (e) => {
            bubbleObj.isDragging = true;
            el.style.zIndex = 100;
            let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX; startY = clientY;
            initialX = bubbleObj.x; initialY = bubbleObj.y;
        };
        const dragMove = (e) => {
            if(!bubbleObj.isDragging) return;
            e.preventDefault(); 
            let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let clientY = e.touches ? e.touches[0].clientY : e.clientY;
            let newX = initialX + (clientX - startX);
            let newY = initialY + (clientY - startY);
            let cRect = container.getBoundingClientRect();
            if(newX < 0) newX = 0;
            if(newX > cRect.width - bubbleObj.width) newX = cRect.width - bubbleObj.width;
            if(newY < 0) newY = 0;
            if(newY > cRect.height - bubbleObj.height) newY = cRect.height - bubbleObj.height;
            
            bubbleObj.x = newX; bubbleObj.y = newY;
            el.style.left = newX + 'px'; el.style.top = newY + 'px';
        };
        const dragEnd = () => { bubbleObj.isDragging = false; el.style.zIndex = 10; };
        
        el.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);
        el.addEventListener('touchstart', dragStart, {passive: false});
        document.addEventListener('touchmove', dragMove, {passive: false});
        document.addEventListener('touchend', dragEnd);
    });
    
    function animate() {
        let rect = container.getBoundingClientRect();
        if(rect.width === 0) { requestAnimationFrame(animate); return; }

        bubbles.forEach(b => {
            if(b.isDragging) return;
            b.x += b.vx; b.y += b.vy;
            if(b.x <= 0 || b.x >= rect.width - b.width) { b.vx *= -1; b.x = b.x <= 0 ? 0 : rect.width - b.width; }
            if(b.y <= 0 || b.y >= rect.height - b.height) { b.vy *= -1; b.y = b.y <= 0 ? 0 : rect.height - b.height; }
            b.el.style.left = b.x + 'px'; b.el.style.top = b.y + 'px';
        });
        requestAnimationFrame(animate);
    }
    animate();
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
        myAvatarUrl = document.getElementById('bio-avatar').value;
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

// ================= SISTEM CHAT ROOM & DROPDOWN =================
function renderChatSidebar() {
    const dmContainer = document.getElementById('dm-list-container');
    if(!dmContainer) return;
    
    db.ref('biodata').once('value', (bioSnap) => {
        dmContainer.innerHTML = ''; 
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

function toggleChatDropdown(e) {
    e.stopPropagation();
    const content = document.getElementById('dm-list-container');
    const icon = document.getElementById('dropdown-arrow-icon');
    content.classList.toggle('show');
    icon.classList.toggle('fa-chevron-up');
    icon.classList.toggle('fa-chevron-down');
}

window.addEventListener('click', () => {
    const content = document.getElementById('dm-list-container');
    const icon = document.getElementById('dropdown-arrow-icon');
    if (content && content.classList.contains('show')) {
        content.classList.remove('show');
        if (icon) { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }
    }
});

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
        sender: activeUserKey, text: text, time: Date.now()
    });
    inputEl.value = '';
}

// ================= QUIZ & EMAILJS =================
function submitQuiz(e) {
    e.preventDefault();
    const ans1 = document.getElementById('quiz-ans-1').value;
    const ans2 = document.getElementById('quiz-ans-2').value;
    const ans3 = document.getElementById('quiz-ans-3').value;
    const ans4 = document.getElementById('quiz-ans-4').value;
    const ans5 = document.getElementById('quiz-ans-5').value;
    const userName = CIRCLE_USERS[activeUserKey].name;
    const currentTime = new Date().toLocaleString('id-ID');

    const templateParams = {
        from_name: userName, ans_1: ans1, ans_2: ans2, ans_3: ans3, ans_4: ans4, ans_5: ans5, time: currentTime
    };

    emailjs.send('service_bt4m9wa', 'template_iez197j', templateParams)
        .then(function() {
            showToast("Laporan Quiz dikirim ke server Email.");
            document.getElementById('quiz-form').reset();
        }, function(error) { showToast("Koneksi gagal mengirim email."); });
}

// ================= GGSGJ ARCADE =================
const gCanvas = document.getElementById("game-canvas");
const gCtx = gCanvas.getContext("2d");
let gameLoopReq;
let isPlaying = false;
let gameFrames = 0;
let gameScore = 0;
let myAvatarUrl = "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix"; // Default
let birdImg = new Image();

const bird = {
    x: 50, y: 150, width: 34, height: 34,
    velocity: 0, gravity: 0.25, jumpPower: -4.5,
    draw: function() {
        gCtx.save();
        gCtx.beginPath();
        gCtx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        gCtx.closePath();
        gCtx.clip();
        gCtx.drawImage(birdImg, this.x, this.y, this.width, this.height);
        gCtx.restore();
        
        gCtx.beginPath();
        gCtx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        gCtx.lineWidth = 3;
        gCtx.strokeStyle = "#F4D35E";
        gCtx.stroke();
    },
    update: function() {
        this.velocity += this.gravity;
        this.y += this.velocity;
        
        if(this.y + this.height >= gCanvas.height) {
            this.y = gCanvas.height - this.height;
            gameOverState();
        }
        if(this.y <= 0) {
            this.y = 0;
            this.velocity = 0;
        }
    },
    flap: function() { this.velocity = this.jumpPower; }
};

const pipes = {
    position: [],
    width: 50,
    gap: 120, 
    dx: 2.5,  
    draw: function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topYPos = p.y;
            let bottomYPos = p.y + this.gap;
            
            gCtx.fillStyle = "#2B1B17";
            gCtx.fillRect(p.x, 0, this.width, topYPos);
            gCtx.lineWidth = 2;
            gCtx.strokeStyle = "#3A86EF";
            gCtx.strokeRect(p.x, 0, this.width, topYPos);
            
            gCtx.fillRect(p.x, bottomYPos, this.width, gCanvas.height - bottomYPos);
            gCtx.strokeRect(p.x, bottomYPos, this.width, gCanvas.height - bottomYPos);
        }
    },
    update: function() {
        if(gameFrames % 90 === 0) {
            this.position.push({
                x: gCanvas.width,
                y: Math.random() * (gCanvas.height - this.gap - 100) + 50
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let bottomPipeYPos = p.y + this.gap;
            
            if(bird.x + bird.width > p.x && bird.x < p.x + this.width && bird.y < p.y && bird.y + bird.height > 0) { gameOverState(); }
            if(bird.x + bird.width > p.x && bird.x < p.x + this.width && bird.y + bird.height > bottomPipeYPos && bird.y < gCanvas.height) { gameOverState(); }
            
            p.x -= this.dx;
            if(p.x + this.width === bird.x) {
                gameScore++;
                document.getElementById('game-live-score').innerText = gameScore;
            }
            if(p.x + this.width <= 0) {
                this.position.shift();
            }
        }
    },
    reset: function() { this.position = []; }
};

function drawGame() {
    gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
    gCtx.fillStyle = "#70c5ce"; 
    gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
    pipes.draw();
    bird.draw();
}

function updateGame() {
    bird.update();
    pipes.update();
}

function gameLoop() {
    if(!isPlaying) return;
    updateGame();
    drawGame();
    gameFrames++;
    gameLoopReq = requestAnimationFrame(gameLoop);
}

function startGameEngine() {
    birdImg.src = myAvatarUrl; 
    document.getElementById('game-ui-overlay').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    document.getElementById('game-live-score').style.display = 'block';
    
    bird.y = 150;
    bird.velocity = 0;
    pipes.reset();
    gameFrames = 0;
    gameScore = 0;
    document.getElementById('game-live-score').innerText = gameScore;
    
    isPlaying = true;
    gameLoop();
}

function resetGameEngine() {
    startGameEngine();
}

function gameOverState() {
    isPlaying = false;
    cancelAnimationFrame(gameLoopReq);
    
    document.getElementById('game-live-score').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'flex';
    document.getElementById('game-final-score').innerText = gameScore;
    
    db.ref('arcade_leaderboard/' + activeUserKey).once('value', snap => {
        let currentRecord = snap.val() ? snap.val().score : -1;
        if(gameScore > currentRecord) {
            db.ref('arcade_leaderboard/' + activeUserKey).set({
                score: gameScore,
                name: CIRCLE_USERS[activeUserKey].name,
                timestamp: Date.now()
            });
            showToast("Mantap! Rekor baru berhasil dikirim ke satelit GGSGJ!");
        }
    });
}

window.addEventListener('keydown', function(e) {
    if(e.code === 'Space' && isPlaying) { e.preventDefault(); bird.flap(); }
});
gCanvas.addEventListener('mousedown', function() { if(isPlaying) bird.flap(); });
gCanvas.addEventListener('touchstart', function(e) {
    if(isPlaying) { e.preventDefault(); bird.flap(); }
}, {passive: false});

function renderLeaderboard(lbData) {
    const lbContainer = document.getElementById('arcade-leaderboard-list');
    if(!lbContainer) return;
    
    lbContainer.innerHTML = '';
    let scoresArray = [];
    for(let key in lbData) { scoresArray.push({ key: key, name: lbData[key].name, score: lbData[key].score }); }
    
    scoresArray.sort((a, b) => b.score - a.score);
    
    db.ref('biodata').once('value', (bioSnap) => {
        const allBios = bioSnap.val() || {};
        let rank = 1;
        scoresArray.forEach(p => {
            let avatarImg = (allBios[p.key] && allBios[p.key].avatar) ? allBios[p.key].avatar : "https://api.dicebear.com/7.x/adventurer/svg?seed=" + p.name;
            let rankCrown = (rank === 1) ? '👑' : ((rank === 2) ? '🥈' : ((rank === 3) ? '🥉' : `#${rank}`));
            
            lbContainer.innerHTML += `
                <div class="lb-item">
                    <div class="lb-rank">${rankCrown}</div>
                    <div class="lb-player">
                        <img src="${avatarImg}" class="lb-avatar">
                        <span>${p.name}</span>
                    </div>
                    <div class="lb-score">${p.score}</div>
                </div>
            `;
            rank++;
        });
    });
}

// ================= BACKGROUND ANIMATION (DI-OPTIMASI AGAR TIDAK LAG) =================
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");
let particlesArray = [];

function initCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesArray = [];
    // OPTIMASI: Partikel dibatasi maksimal 35 agar laptop kentang bisa bernapas panjang
    const numberOfParticles = Math.min((canvas.width * canvas.height) / 18000, 35);
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
