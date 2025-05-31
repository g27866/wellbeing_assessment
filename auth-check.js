// auth-check.js
(function() {
    function performAuthCheck() {
        try {
            if (window.self === window.top) {
                console.warn("禁止直接存取此頁面。將重導至主系統登入頁面。");
                // 根據你的 index.html 位置調整路徑
                // 如果 index.html 在根目錄，使用 "/index.html"
                // 如果 index.html 與此頁面在同一目錄，通常不需要更改 window.location.href 的相對路徑，但為保險起見，指向根目錄的 index.html
                window.top.location.href = window.top.location.origin ? window.top.location.origin + "/index.html" : "/index.html";
                return false; // 驗證失敗
            }

            const parentAuth = window.parent.firebase && window.parent.firebase.auth ? window.parent.firebase.auth() : null;
            if (!parentAuth || !parentAuth.currentUser) {
                console.warn("父視窗未通過驗證或 Firebase Auth 未初始化。正在阻止內容載入。");
                document.body.innerHTML = `
                    <div style="text-align: center; padding: 50px; font-family: 'Noto Sans TC', sans-serif; color: #333;">
                        <h1 style="color: #d32f2f; font-size: 1.5em;">存取被拒絕 (E401)</h1>
                        <p style="font-size: 1.1em; margin-top: 10px;">您必須先登入主系統才能檢視此頁面內容。</p>
                        <p style="margin-top: 20px;"><a href="/index.html" target="_top" style="color: #007bff; text-decoration: underline;">返回主系統頁面</a></p>
                    </div>`;
                return false; // 驗證失敗
            }
            return true; // 驗證成功
        } catch (e) {
            console.error("從父視窗檢查驗證狀態時發生錯誤:", e);
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: 'Noto Sans TC', sans-serif; color: #333;">
                    <h1 style="color: #d32f2f; font-size: 1.5em;">系統錯誤 (E500)</h1>
                    <p style="font-size: 1.1em; margin-top: 10px;">無法驗證您的登入狀態。</p>
                    <p style="margin-top: 20px;"><a href="/index.html" target="_top" style="color: #007bff; text-decoration: underline;">返回主系統頁面</a></p>
                </div>`;
            return false; // 驗證失敗
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (performAuthCheck() && typeof initializePage === 'function') {
                initializePage();
            }
        });
    } else {
        if (performAuthCheck() && typeof initializePage === 'function') {
            initializePage();
        }
    }
})();