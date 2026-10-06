document.addEventListener("DOMContentLoaded", () => {
    // Navigasi Utama Halaman
    const pageIndex = document.getElementById("page-index");
    const pageLogin = document.getElementById("page-login");
    const pageMain = document.getElementById("page-main");
    const pageChat = document.getElementById("page-chat");
    const startBtn = document.getElementById("start-btn");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const hamburger = document.getElementById("hamburger");
    const floatingMenu = document.getElementById("floating-menu");

    // 1. Tombol Let's Start
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            startBtn.classList.add("pop");
            setTimeout(() => {
                pageIndex.classList.remove("active");
                pageLogin.classList.add("active");
            }, 400);
        });
    }

    // 2. Tombol Login
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            pageLogin.classList.remove("active");
            pageMain.classList.add("active");
            showToast("Selamat datang di GGSGJ Portal!");
        });
    }

    // 3. Tombol Logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            pageMain.classList.remove("active");
            pageChat.classList.remove("active");
            pageIndex.classList.add("active");
            if (floatingMenu) floatingMenu.classList.remove("open");
            if (hamburger) hamburger.classList.remove("open");
            showToast("Berhasil keluar.");
        });
    }

    // 4. Hamburger & Floating Menu
    if (hamburger && floatingMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("open");
            floatingMenu.classList.toggle("open");
        });
    }

    // 5. Navigasi Antar Panel di Main App
    const circleBtns = document.querySelectorAll(".circle-btn[data-target]");
    circleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-target");
            
            // Tutup menu melayang
            if (floatingMenu) floatingMenu.classList.remove("open");
            if (hamburger) hamburger.classList.remove("open");

            // Jika target adalah chat, buka halaman chat khusus
            if (target === "chat") {
                pageMain.classList.remove("active");
                pageChat.classList.add("active");
                return;
            }

            // Pindah panel konten aktif
            document.querySelectorAll(".content-panel").forEach(panel => {
                panel.classList.remove("active-panel");
            });
            const activePanel = document.getElementById(`panel-${target}`);
            if (activePanel) {
                activePanel.classList.add("active-panel");
            }
        });
    });

    // Tombol Kembali dari Chat ke Main
    const backToMainBtn = document.getElementById("back-to-main");
    if (backToMainBtn) {
        backToMainBtn.addEventListener("click", () => {
            pageChat.classList.remove("active");
            pageMain.classList.add("active");
        });
    }

    // 6. Mini Games & Sub-menu switcher
    const gameCards = document.querySelectorAll(".game-card");
    const gamesMenu = document.getElementById("games-menu");
    const subFlappy = document.getElementById("sub-game-flappy");
    const subPython = document.getElementById("sub-game-python");
    const backToGames = document.getElementById("back-to-games");
    const backToGamesPy = document.getElementById("back-to-games-py");

    gameCards.forEach(card => {
        card.addEventListener("click", () => {
            const gameType = card.getAttribute("data-game");
            if (gamesMenu) gamesMenu.style.display = "none";
            if (gameType === "flappy" && subFlappy) subFlappy.style.display = "block";
            if (gameType === "python" && subPython) subPython.style.display = "block";
        });
    });

    if (backToGames && subFlappy) {
        backToGames.addEventListener("click", () => {
            subFlappy.style.display = "none";
            if (gamesMenu) gamesMenu.style.display = "grid";
        });
    }

    if (backToGamesPy && subPython) {
        backToGamesPy.addEventListener("click", () => {
            subPython.style.display = "none";
            if (gamesMenu) gamesMenu.style.display = "grid";
        });
    }

    // 7. Fungsi Toast Notifikasi
    window.showToast = function(text) {
        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.innerText = text;
        toast.className = "show";
        setTimeout(() => { toast.className = ""; }, 3000);
    };
});
