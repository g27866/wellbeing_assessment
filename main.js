document.addEventListener("DOMContentLoaded", () => {
    const contentFrame = document.getElementById("content-frame");
    const menuLinks = document.querySelectorAll(".menu-link");

    function updateActiveMenu(targetLink) {
        menuLinks.forEach(link => link.classList.remove("active"));
        targetLink.classList.add("active");
    }

    menuLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault(); // 防止連結跳轉
            const pageSrc = link.dataset.src;
            if (pageSrc && contentFrame.src !== pageSrc) {
                contentFrame.src = pageSrc;
                updateActiveMenu(link);
            }
        });
    });

    // 設定預設頁面 (客戶資料) 為 active
    const defaultLink = document.getElementById("menu-customers");
    if (defaultLink) {
        contentFrame.src = defaultLink.dataset.src;
        updateActiveMenu(defaultLink);
    }
});