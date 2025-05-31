// main.js
document.addEventListener("DOMContentLoaded", () => {
    // DOM 元素獲取
    const contentFrame = document.getElementById("content-frame");
    const menuLinks = document.querySelectorAll(".menu-link");
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    const authButton = document.getElementById("auth-button");
    const authButtonText = document.getElementById("auth-button-text");
    
    const menuCustomers = document.getElementById("menu-customers");
    const menuAssessment = document.getElementById("menu-assessment");
    const menuCalendar = document.getElementById("menu-calendar");

    // Firebase Configuration (請再次確認所有值與您 Firebase 控制台的設定完全一致)
    const firebaseConfig = {
        apiKey: "AIzaSyDB27Iggneh6tQqs7ldGghuvm8xVdyQPhs",
        authDomain: "wellbeing-369fb.firebaseapp.com",
        projectId: "wellbeing-369fb",
        storageBucket: "wellbeing-369fb.firebasestorage.app", // 根據您的確認，使用此值
        messagingSenderId: "45684081814",
        appId: "1:45684081814:web:7a8d2f5ae375e3c7d6eeb7"
    };

    let db; 
    let auth; 
    let functions; // 新增 functions 變數
    let currentUserInfo = null; 

    try {
        // 確保 Firebase SDK 已載入
        if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
            const app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            functions = firebase.functions(); // 初始化 Functions 服務

            // 如果您的 Cloud Functions 部署在特定區域 (例如 'asia-east1')，請使用以下方式初始化：
            // functions = firebase.app().functions('asia-east1'); 
            // 請將 'asia-east1' 替換為您 Cloud Function 實際部署的區域。
            // 如果您不確定，或者函式部署在預設區域 (us-central1)，則 firebase.functions() 通常即可。

            console.log("[main.js] Firebase App, Auth, Firestore, and Functions initialized successfully.");

            // 將 Firebase 實例掛載到 window，供 iframe 存取
            window.firebaseApp = app; 
            window.firebaseAuth = auth; 
            window.firebaseDb = db;   
            window.firebaseFunctions = functions; // <<< 新增：確保將 functions 實例掛載到 window

            auth.onAuthStateChanged(async user => { // 使用 async 以便在內部使用 await
                const loginPromptPageName = "login-prompt.html"; 
                const defaultContentPage = "customers.html";

                if (user) {
                    currentUserInfo = {
                        uid: user.uid,
                        displayName: user.displayName || user.email.split('@')[0],
                        email: user.email
                    };
                    console.log("[main.js] Auth state changed: User signed in", currentUserInfo);
                    
                    authButtonText.textContent = `登出 (${currentUserInfo.displayName})`;
                    authButton.title = `以 ${currentUserInfo.email} 登出`;

                    try {
                        const userDocRef = db.collection("users").doc(user.uid);
                        const userDoc = await userDocRef.get();

                        if (userDoc.exists) {
                            console.log("[main.js] User IS AUTHORIZED (document exists in /users). UID:", user.uid);

                            menuCustomers.style.display = "";
                            menuAssessment.style.display = "";
                            menuCalendar.style.display = ""; 
                            contentFrame.classList.remove('empty');

                            const defaultLink = menuCustomers; 
                            let currentIframePath = '';
                            try {
                                if (contentFrame.src && contentFrame.src !== 'about:blank' && !contentFrame.src.startsWith('data:')) {
                                     currentIframePath = new URL(contentFrame.src, window.location.href).pathname;
                                }
                            } catch (e) { 
                                console.warn("[main.js] 無法解析當前 iframe src:", contentFrame.src, e); 
                            }
                            
                            const loginPromptFullPath = new URL(loginPromptPageName, window.location.href).pathname;

                            if (contentFrame.src === 'about:blank' || 
                                contentFrame.src.startsWith('data:') || 
                                currentIframePath === loginPromptFullPath || 
                                currentIframePath.endsWith(loginPromptPageName) ) {
                                
                                if (defaultLink && defaultLink.dataset.src) {
                                    contentFrame.src = new URL(defaultLink.dataset.src, window.location.href).href;
                                    updateActiveMenu(defaultLink);
                                } else {
                                    contentFrame.src = new URL(defaultContentPage, window.location.href).href;
                                    updateActiveMenu(menuCustomers);
                                }
                            } else {
                                let activeFound = false;
                                menuLinks.forEach(link => { 
                                    if (link.dataset.src) {
                                        const linkFullSrc = new URL(link.dataset.src, window.location.href).href;
                                        if (contentFrame.src === linkFullSrc) {
                                            updateActiveMenu(link);
                                            activeFound = true;
                                        }
                                    }
                                });
                                if (!activeFound) {
                                    if (defaultLink && defaultLink.dataset.src) {
                                        contentFrame.src = new URL(defaultLink.dataset.src, window.location.href).href;
                                        updateActiveMenu(defaultLink);
                                    } else {
                                        contentFrame.src = new URL(defaultContentPage, window.location.href).href;
                                        updateActiveMenu(menuCustomers);
                                    }
                                }
                            }
                        } else {
                            console.warn("[main.js] User IS NOT AUTHORIZED (document does NOT exist in /users). UID:", user.uid);
                            authButtonText.textContent = `登出 (未授權: ${currentUserInfo.displayName})`;
                            
                            menuCustomers.style.display = "none";
                            menuAssessment.style.display = "none";
                            menuCalendar.style.display = "none"; 
                            
                            try {
                                contentFrame.src = new URL(`${loginPromptPageName}?uid=${user.uid}`, window.location.href).href;
                            } catch(e) {
                                contentFrame.src = "about:blank"; 
                                console.error("[main.js] 設定 login-prompt.html URL (含UID) 時發生錯誤:", e);
                                alert(`您的帳號 UID: ${user.uid}\n此帳號尚未授權，請複製此 UID 提供給管理員。`);
                            }
                            contentFrame.classList.add('empty');
                            menuLinks.forEach(link => link.classList.remove("active"));
                        }
                    } catch (error) { 
                        console.error("[main.js] 檢查 Firestore 使用者權限時發生錯誤:", error);
                        authButtonText.textContent = `登出 (權限檢查錯誤)`; // 更明確的錯誤提示
                        menuCustomers.style.display = "none";
                        menuAssessment.style.display = "none";
                        menuCalendar.style.display = "none"; 
                        try {
                            contentFrame.src = new URL(loginPromptPageName, window.location.href).href; 
                        } catch(e) { contentFrame.src = "about:blank"; }
                        contentFrame.classList.add('empty');
                        menuLinks.forEach(link => link.classList.remove("active"));
                        alert("檢查帳號權限時發生系統錯誤，請稍後再試或聯繫管理員。");
                    }

                } else { // 使用者已登出
                    currentUserInfo = null;
                    console.log("[main.js] Auth state changed: User signed out");
                    authButtonText.textContent = "Login";
                    authButton.title = "使用 Google 帳號登入";

                    menuCustomers.style.display = "none";
                    menuAssessment.style.display = "none";
                    menuCalendar.style.display = "none"; 
                    
                    try {
                        contentFrame.src = new URL(loginPromptPageName, window.location.href).href;
                    } catch(e) {
                        contentFrame.src = "about:blank";
                        console.error("[main.js] 設定 login-prompt.html URL 時發生錯誤:", e);
                    }
                    contentFrame.classList.add('empty');
                    menuLinks.forEach(link => link.classList.remove("active"));
                }
            });

            authButton.addEventListener("click", () => {
                if (auth.currentUser) {
                    auth.signOut().catch(error => {
                        console.error("[main.js] Sign out error", error);
                        alert(`登出時發生錯誤: ${error.message}`);
                    });
                } else {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    auth.signInWithPopup(provider)
                        .then((result) => {
                            console.log("[main.js] Google Sign-In successful for:", result.user.email);
                        })
                        .catch(error => {
                            console.error("[main.js] Google Sign-In Error:", error.code, error.message);
                            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                                alert(`登入失敗: ${error.message}`);
                            }
                        });
                }
            });

            menuLinks.forEach(link => {
                link.addEventListener("click", (event) => {
                    event.preventDefault();
                    if (!auth.currentUser) { 
                        alert("請先登入以存取此頁面。");
                        return;
                    }
                    
                    const pageSrc = link.dataset.src;
                    if (pageSrc) {
                        const targetSrc = new URL(pageSrc, window.location.href).href;
                         if (contentFrame.src !== targetSrc) {
                            contentFrame.src = targetSrc;
                        }
                        updateActiveMenu(link); 
                    }
                });
            });

        } else {
            console.error("[main.js] Firebase SDK (firebase object) not loaded or initializeApp is not a function!");
            alert("系統初始化嚴重失敗 (Firebase SDK 未正確載入)。請檢查 HTML 中的 SDK 引用。");
            if(authButton) authButton.disabled = true;
            if(authButtonText) authButtonText.textContent = "Login (SDK Error)";
        }
    } catch (e) {
        console.error("[main.js] Firebase 初始化過程中發生頂層錯誤:", e);
        alert("系統初始化過程中發生嚴重錯誤，請檢查 Firebase 設定或網路。");
        if(authButton) authButton.disabled = true;
        if(authButtonText) authButtonText.textContent = "Login (Init Error)";
    }

    function updateActiveMenu(targetLink) {
        menuLinks.forEach(link => link.classList.remove("active"));
        if (targetLink) {
            targetLink.classList.add("active");
        }
    }
    
    window.updateActiveMenuFromChild = function(menuIdToActivate) {
        const targetLink = document.getElementById(menuIdToActivate);
        if (targetLink) {
            updateActiveMenu(targetLink);
        }
    };

    // ScrollToTopBtn logic
    if (scrollToTopBtn) {
        window.onscroll = function() { scrollFunction(); }; 
        function scrollFunction() {
            if (window.pageYOffset > 50) { 
                scrollToTopBtn.style.display = "block";
                requestAnimationFrame(() => { 
                    scrollToTopBtn.style.opacity = "1";
                    scrollToTopBtn.style.visibility = "visible";
                });
            } else {
                scrollToTopBtn.style.opacity = "0";
                scrollToTopBtn.style.visibility = "hidden";
                setTimeout(() => {
                    if (scrollToTopBtn.style.opacity === "0") {
                       scrollToTopBtn.style.display = "none";
                    }
                }, 300); 
            }
        }
        scrollToTopBtn.addEventListener("click", () => {
            window.scrollTo({top: 0, behavior: 'smooth'}); 
        });
    }
});

// 全域函數，讓 iframe 內的 JS 可以獲取登入者資訊
function getCurrentEditorName() {
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        const user = window.firebaseAuth.currentUser;
        return user.displayName || user.email.split('@')[0] || "未知操作者";
    }
    return "系統預設"; 
}