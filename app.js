/* ==========================================================
   GGSGJ MAIN APPLICATION LOGIC & AI COLLABORATOR ANCHOR v3.0
   [Anchor: AI-Collab-GGSGJ-Core-Engine]
   ========================================================== */

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
            initApp(activeUserKey);
            changePage('page-main');
        } else {
            changePage('page-login'); 
        }
    }, 450);
}

function handleLoginSubmit(e) {
    e.preventDefault();
    const uInput = document.getElementById('username-input').value.trim().toLowerCase();
    const pInput = document.getElementById('password-input').value.trim();
    const btn = document.getElementById('login-action-btn');
    const errMsg = document.getElementById('login-error-msg');

    btn.classList.remove('cracked', 'shattered');
    errMsg.style.display = 'none';

    if (CIRCLE_USERS[uInput] && CIRCLE_USERS[uInput].pass === pInput) {
        let activeSessions = JSON.parse(localStorage.getItem('ggsgj_active_sessions')) || {};
        let now = Date.now();

        if (activeSessions[uInput] && (now - activeSessions[uInput] < 10000)) {
            btn.classList.add('cracked');
            errMsg.innerText = "Akun ini sedang aktif di perangkat lain!";
            errMsg.style.display = 'block';
            setTimeout(() => { btn.classList.remove('cracked'); }, 400);
            return;
        }

        activeUserKey = uInput;
        localStorage.setItem('ggsgj_logged_user', uInput);
        updateHeartbeat();

        btn.classList.add('shattered');
        setTimeout(() => {
            initApp(uInput);
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

function updateHeartbeat() {
    if (!activeUserKey) return;
    let activeSessions = JSON.parse(localStorage.getItem('ggsgj_active_sessions')) || {};
    activeSessions[activeUserKey] = Date.now();
    localStorage.setItem('ggsgj_active_sessions', JSON.stringify(activeSessions));
}

setInterval(updateHeartbeat, 3000);

function logout() {
    if (activeUserKey) {
        let activeSessions = JSON.parse(localStorage.getItem('ggsgj_active_sessions')) || {};
        delete activeSessions[activeUserKey];
        localStorage.setItem('ggsgj_active_sessions', JSON.stringify(activeSessions));
    }
    activeUserKey = null;
    localStorage.removeItem('ggsgj_logged_user');
    document.getElementById('username-input').value = '';
    document.getElementById('password-input').value = '';
    changePage('page-login');
    if(document.getElementById('app-sidebar').classList.contains('open')) toggleSidebar();
    showToast("Berhasil logout.");
}

function initApp(userKey) {
    const userData = CIRCLE_USERS[userKey];
    renderMemberList();
    
    document.getElementById('current-user-greeting').innerText = userData.name;
    const savedBio = JSON.parse(localStorage.getItem(`biodata_${userKey}`)) || {};
    document.getElementById('bio-fullname').value = savedBio.fullname || userData.name;
    document.getElementById('bio-age').value = savedBio.age || '';
    document.getElementById('bio-birthday').value = savedBio.birthday || '';
    document.getElementById('bio-school').value = savedBio.school || '';

    renderMemoryGallery();

    // Khusus akun Fachry, tampilkan panel rahasia quiz
    const secretPanel = document.getElementById('fachry-secret-panel');
    if (userKey === 'fachry') {
        secretPanel.style.display = 'block';
        renderQuizResponses();
    } else {
        secretPanel.style.display = 'none';
    }
}

function renderMemberList() {
    const listContainer = document.getElementById('members-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    let activeSessions = JSON.parse(localStorage.getItem('ggsgj_active_sessions')) || {};
    let now = Date.now();

    for (let key in CIRCLE_USERS) {
        let member = CIRCLE_USERS[key];
        let isAdmin = member.role === 'admin';
        let isOnline = activeSessions[key] && (now - activeSessions[key] < 6000);

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

setInterval(() => {
    if (document.getElementById('page-main').classList.contains('active')) {
        renderMemberList();
    }
}, 3000);

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

function saveBiodata(e) {
    e.preventDefault();
    const bioData = {
        fullname: document.getElementById('bio-fullname').value,
        age: document.getElementById('bio-age').value,
        birthday: document.getElementById('bio-birthday').value,
        school: document.getElementById('bio-school').value
    };
    localStorage.setItem(`biodata_${activeUserKey}`, JSON.stringify(bioData));
    showToast("Biodata individual berhasil disimpan!");
}

/* ----------------------------------------------------------
   FITUR QUIZ & PANEL RAHASIA KHUSUS FACHRY
   ---------------------------------------------------------- */
function submitQuiz(e) {
    e.preventDefault();
    const ans1 = document.getElementById('quiz-ans-1').value;
    const ans2 = document.getElementById('quiz-ans-2').value;
    const ans3 = document.getElementById('quiz-ans-3').value;
    const userName = CIRCLE_USERS[activeUserKey].name;

    // 1. Simpan ke LocalStorage
    let allResponses = JSON.parse(localStorage.getItem('ggsgj_quiz_data')) || {};
    allResponses[activeUserKey] = {
        name: userName,
        q1: ans1,
        q2: ans2,
        q3: ans3,
        time: new Date().toLocaleDateString()
    };
    localStorage.setItem('ggsgj_quiz_data', JSON.stringify(allResponses));

    // 2. Kirim otomatis ke Email kamu via EmailJS
    const templateParams = {
        from_name: userName,
        ans_1: ans1,
        ans_2: ans2,
        ans_3: ans3
    };

    emailjs.send('service_bt4m9wa', 'template_iez197j', templateParams)
        .then(function(response) {
            showToast("Jawaban quiz berhasil dikirim ke email Fachry!");
            document.getElementById('quiz-form').reset();
            if(activeUserKey === 'fachry') renderQuizResponses();
        }, function(error) {
            showToast("Gagal mengirim email, tapi tersimpan secara lokal.");
            console.log('FAILED...', error);
        });
}

function renderQuizResponses() {
    const container = document.getElementById('quiz-responses-container');
    if (!container) return;
    const allResponses = JSON.parse(localStorage.getItem('ggsgj_quiz_data')) || {};
    container.innerHTML = '';

    let keys = Object.keys(allResponses);
    if (keys.length === 0) {
        container.innerHTML = '<p style="color: gray;">Belum ada anggota circle yang mengisi quiz.</p>';
        return;
    }

    keys.forEach(k => {
        let res = allResponses[k];
        container.innerHTML += `
            <div style="background: rgba(0,0,0,0.4); padding: 1.2rem; border-radius: 10px; border-left: 4px solid var(--color-camel);">
                <strong>👤 ${res.name}</strong> <span style="font-size:0.8rem; color:gray;">(${res.time})</span><br>
                <div style="margin-top: 0.5rem; font-size: 0.95rem; line-height: 1.5;">
                    1. ${res.q1}<br>
                    2. ${res.q2}<br>
                    3. ${res.q3}
                </div>
            </div>`;
    });
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const base64Image = event.target.result;
        let memories = JSON.parse(localStorage.getItem('ggsgj_memories')) || [];
        memories.push(base64Image);
        localStorage.setItem('ggsgj_memories', JSON.stringify(memories));
        renderMemoryGallery();
        showToast("Foto kenangan berhasil di-upload!");
    };
    reader.readAsDataURL(file);
}

function renderMemoryGallery() {
    const gallery = document.getElementById('memory-gallery-container');
    if (!gallery) return;
    const memories = JSON.parse(localStorage.getItem('ggsgj_memories')) || [];
    gallery.innerHTML = '';
    
    if (memories.length === 0) {
        gallery.innerHTML = '<p style="color:gray; grid-column: 1/-1;">Belum ada memori. Yuk upload foto pertama circle kalian!</p>';
        return;
    }

    memories.forEach((imgSrc, index) => {
        gallery.innerHTML += `
            <div class="memory-card">
                <img src="${imgSrc}" alt="Memory ${index}">
                <button class="delete-mem-btn" onclick="deleteMemory(${index})">Hapus</button>
            </div>`;
    });
}

function deleteMemory(index) {
    if(confirm("Yakin ingin menghapus foto ini?")) {
        let memories = JSON.parse(localStorage.getItem('ggsgj_memories')) || [];
        memories.splice(index, 1);
        localStorage.setItem('ggsgj_memories', JSON.stringify(memories));
        renderMemoryGallery();
        showToast("Foto dihapus.");
    }
}

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
