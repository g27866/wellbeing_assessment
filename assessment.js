document.addEventListener("DOMContentLoaded", () => {
    const tabLinks = document.querySelectorAll(".tab-link");
    const tabContents = document.querySelectorAll(".tab-content");
    const clinicForm = document.getElementById("clinicForm");

    // Tab 切換功能
    tabLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const tabId = link.dataset.tab;

            // 隱藏所有內容
            tabContents.forEach(content => content.classList.add("hidden"));
            // 移除所有連結的 active 狀態
            tabLinks.forEach(l => l.classList.remove("active"));

            // 顯示目標內容
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.remove("hidden");
            }
            // 設定目標連結為 active
            link.classList.add("active");
        });
    });

    // 預設顯示第一個 Tab
    const defaultTabLink = document.querySelector(".tab-link[data-tab='tab1']");
    const defaultTabContent = document.getElementById("tab1");
    if (defaultTabLink && defaultTabContent) {
        tabLinks.forEach(l => l.classList.remove("active"));
        tabContents.forEach(c => c.classList.add("hidden"));
        defaultTabLink.classList.add("active");
        defaultTabContent.classList.remove("hidden");
    }

    // 表單提交處理 (範例)
    clinicForm.addEventListener("submit", (event) => {
        event.preventDefault(); // 防止表單直接提交

        // 1. 收集資料
        const formData = new FormData(clinicForm);
        const data = {};
        formData.forEach((value, key) => {
            // 處理 checkbox (可能有多個值)
            if (data[key]) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });

        console.log("表單資料:", data);

        // 2. 驗證資料 (此處省略)

        // 3. 送出資料到 API (替換成您的 API)
        // fetch("YOUR_ASSESSMENT_SUBMIT_API", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify(data),
        // })
        // .then(response => response.json())
        // .then(result => {
        //     console.log("提交成功:", result);
        //     alert("問卷已成功送出！");
        //     // clinicForm.reset(); // 清空表單
        // })
        // .catch(error => {
        //     console.error("提交失敗:", error);
        //     alert("問卷送出失敗，請稍後再試。");
        // });

        alert("問卷已送出 (模擬)。請查看 console 獲取資料。"); // 模擬提示
    });
});