// main.js (安全重構版本，移除 firestore 驗證，改用 getUserInfo cloud function)
document.addEventListener("DOMContentLoaded", () => {
  const contentFrame = document.getElementById("content-frame");
  const menuLinks = document.querySelectorAll(".menu-link");
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  const authButton = document.getElementById("auth-button");
  const authButtonText = document.getElementById("auth-button-text");
  const menuCustomers = document.getElementById("menu-customers");
  const menuAssessment = document.getElementById("menu-assessment");
  const menuCalendar = document.getElementById("menu-calendar");

  const firebaseConfig = {
    apiKey: "[REDACTED]",
    authDomain: "wellbeing-369fb.firebaseapp.com",
    projectId: "wellbeing-369fb",
    storageBucket: "wellbeing-369fb.appspot.com",
    messagingSenderId: "45684081814",
    appId: "1:45684081814:web:7a8d2f5ae375e3c7d6eeb7"
  };

  let app, auth, db, functions;
  try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    functions = firebase.functions("asia-east1");

    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    window.firebaseFunctions = functions;

    auth.onAuthStateChanged(async (user) => {
      const loginPromptPage = "login-prompt.html";
      const defaultPage = "customers.html";

      if (user) {
        try {
          const getUserInfo = functions.httpsCallable("getUserInfo");
          const result = await getUserInfo();
          const userInfo = result.data;

          authButtonText.textContent = `登出 (${userInfo.displayName || "使用者"})`;
          authButton.title = `以 ${userInfo.email || "帳號"} 登出`;

          menuCustomers.style.display = "";
          menuAssessment.style.display = "";
          menuCalendar.style.display = "";
          contentFrame.classList.remove("empty");

          // 載入 iframe 預設頁面
          const currentIframePath = new URL(contentFrame.src || '', window.location.href).pathname;
          const loginPath = new URL(loginPromptPage, window.location.href).pathname;

          if (!contentFrame.src || contentFrame.src === "about:blank" || currentIframePath.endsWith(loginPromptPage)) {
            const defaultLink = menuCustomers;
            contentFrame.src = new URL(defaultLink.dataset.src || defaultPage, window.location.href).href;
            updateActiveMenu(defaultLink);
          }
        } catch (error) {
          console.warn("[main.js] 使用者未授權或讀取錯誤：", error);

          authButtonText.textContent = "登出 (未授權)";
          menuCustomers.style.display = "none";
          menuAssessment.style.display = "none";
          menuCalendar.style.display = "none";

          contentFrame.src = new URL(`${loginPromptPage}?uid=${user.uid}`, window.location.href).href;
          contentFrame.classList.add("empty");
          menuLinks.forEach(link => link.classList.remove("active"));

          alert(`此帳號尚未授權，請提供 UID 給管理員：${user.uid}`);
        }
      } else {
        // 已登出
        authButtonText.textContent = "Login";
        authButton.title = "使用 Google 帳號登入";

        menuCustomers.style.display = "none";
        menuAssessment.style.display = "none";
        menuCalendar.style.display = "none";

        contentFrame.src = new URL(loginPromptPage, window.location.href).href;
        contentFrame.classList.add("empty");
        menuLinks.forEach(link => link.classList.remove("active"));
      }
    });

    authButton.addEventListener("click", () => {
      if (auth.currentUser) {
        auth.signOut().catch(error => {
          alert(`登出錯誤：${error.message}`);
        });
      } else {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(error => {
          if (error.code !== 'auth/popup-closed-by-user') {
            alert(`登入失敗：${error.message}`);
          }
        });
      }
    });

    menuLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (!auth.currentUser) {
          alert("請先登入以存取此頁面。")
          return;
        }
        const src = link.dataset.src;
        if (src) {
          contentFrame.src = new URL(src, window.location.href).href;
          updateActiveMenu(link);
        }
      });
    });

    if (scrollToTopBtn) {
      window.onscroll = () => {
        scrollToTopBtn.style.display = (window.pageYOffset > 50) ? "block" : "none";
      };
      scrollToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    function updateActiveMenu(target) {
      menuLinks.forEach(link => link.classList.remove("active"));
      if (target) target.classList.add("active");
    }

    window.updateActiveMenuFromChild = function(menuId) {
      const target = document.getElementById(menuId);
      if (target) updateActiveMenu(target);
    };
  } catch (e) {
    console.error("[main.js] 初始化失敗：", e);
    alert("初始化錯誤，請稍後再試。")
  }
});

function getCurrentEditorName() {
  if (window.firebaseAuth?.currentUser) {
    const user = window.firebaseAuth.currentUser;
    return user.displayName || user.email.split('@')[0] || "未知操作者";
  }
  return "系統預設";
} 
