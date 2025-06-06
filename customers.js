// customers.js

function initializePage() {
    console.log("[customers.js] initializePage() called - 頁面初始化開始");

    // 從父視窗獲取 Firebase 相關實例
    const db = window.parent.firebaseDb;
    const functions = window.parent.firebaseFunctions;
    const firestoreTools = window.parent.firebaseFirestoreNamespace;
    const Timestamp = firestoreTools ? firestoreTools.Timestamp : null;
    const serverTimestamp = firestoreTools ? firestoreTools.FieldValue.serverTimestamp : null;
    const increment = firestoreTools ? firestoreTools.FieldValue.increment : null;
    const getCurrentEditorName = window.parent.getCurrentEditorName;
    const getCurrentUserRole = window.parent.getCurrentUserRole; // 獲取使用者角色函數



    if (!db || !functions || !Timestamp || !serverTimestamp || !increment || !getCurrentEditorName || !getCurrentUserRole) {
        console.error("[customers.js] Firebase instances or role function not fully available from parent!");
        alert("系統錯誤：無法正確初始化資料庫連接元件或權限服務，請重新整理。");
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = true);
        return;
    }

    // DOM Elements (整合後的版本)
    const searchSection = document.getElementById("search-section");
    const searchNameInput = document.getElementById("search-name");
    const searchPhoneInput = document.getElementById("search-phone");
    const searchDisplayIdInput = document.getElementById("search-display-id"); // 已加入
    const searchButton = document.getElementById("search-button");
    const clearSearchButton = document.getElementById("clear-search-button");
    const searchMessage = document.getElementById("search-message");
    const searchResultsListContainer = document.getElementById("search-results-list-container"); // 已加入
    const searchResultsRowsContainer = document.getElementById("search-results-rows-container"); // 已加入
    const addCustomerSection = document.getElementById("add-customer-section");
    const addNameInput = document.getElementById("add-name");
    const addDisplayNameInput = document.getElementById("add-display-name"); // 已加入
    const addMobileInput = document.getElementById("add-mobile");
    // const addLocalTelInput = document.getElementById("add-localtel"); // 已移除 (根據先前討論)
    // const addEmailInput = document.getElementById("add-email");       // 已移除 (根據先前討論)
    const addBirthInput = document.getElementById("add-birth");
    const createButton = document.getElementById("create-button");
    const clearAddCustomerButton = document.getElementById("clear-add-customer-button");
    const addMessage = document.getElementById("add-message");

    const customerDataSection = document.getElementById("customer-data-section");
    const customerDocIdHolder = document.getElementById("customer-id-holder");
    const currentLineUidHolder = document.getElementById("current-line-uid-holder");
    const customerInfoContent = document.getElementById("customer-info-content");
    const editCustomerButtonHeader = document.getElementById("edit-customer-button-header");
    const customerInfoActionsFooter = document.getElementById("customer-info-actions-footer");
    const cancelEditCustomerButton = document.getElementById("cancel-edit-customer-button");
    const saveCustomerChangesButton = document.getElementById("save-customer-changes-button");
    const addAssessmentButton = document.getElementById("add-assessment-button");
    const gotoAssessmentRecordsButton = document.getElementById("goto-assessment-records-btn");

    const treatmentHistoryContent = document.getElementById("treatment-history-content");
    const appointmentHistoryContent = document.getElementById("appointment-history-content");
    const assessmentHistoryContent = document.getElementById("assessment-history-content");
    const assessmentRecordsSection = document.getElementById("assessment-records-section");

    const treatmentFilterPending = document.getElementById("filter-treatment-pending");
    const treatmentFilterCompleted = document.getElementById("filter-treatment-completed");
    const treatmentFilterRevoked = document.getElementById("filter-treatment-revoked");

    const appointmentFilterBooked = document.getElementById("filter-appt-booked");
    const appointmentFilterCompleted = document.getElementById("filter-appt-completed");
    const appointmentFilterCancelled = document.getElementById("filter-appt-cancelled");

    const showAddTreatmentBtn = document.getElementById("show-add-treatment-btn");
    const addTreatmentFormContainer = document.getElementById("add-treatment-form-container");
    const addTreatmentCategorySelect = document.getElementById("add-treatment-category");
    const addTreatmentNameSelect = document.getElementById("add-treatment-name");
    const addTreatmentCountInput = document.getElementById("add-treatment-count");
    const addTreatmentAmountInput = document.getElementById("add-treatment-amount"); // 已加入
    const addTreatmentFirstUseDateTimeInput = document.getElementById("add-treatment-first-use-datetime");
    const submitAddTreatmentButton = document.getElementById("submit-add-treatment");
    const cancelAddTreatmentButton = document.getElementById("cancel-add-treatment");
    const addTreatmentMessage = document.getElementById("add-treatment-message");

    const inlineAppointmentFormTemplate = document.getElementById("inline-appointment-form-template");
    const inlineEditTreatmentUnitsTemplate = document.getElementById("inline-edit-treatment-units-template"); // 已加入

    const statusUpdateMenuOld = document.getElementById("status-update-menu"); // 舊的，會被新版動態選單取代

    const revokeTreatmentModal = document.getElementById("revoke-treatment-modal");
    const revokeReasonInput = document.getElementById("revoke-reason-input"); // 已加入
    const revokeConfirmInput = document.getElementById("revoke-confirm-input");
    const confirmRevokeBtn = document.getElementById("confirm-revoke-btn");
    const cancelRevokeBtn = document.getElementById("cancel-revoke-btn");
    const revokeModalMessage = document.getElementById("revoke-modal-message");
    let currentTreatmentPackageToRevokeId = null;

    const LINE_ICON_URL = "https://g27866.github.io/wellbeing_assessment/line-icon.png";
    const LINE_ICON_GRAY_URL = "https://g27866.github.io/wellbeing_assessment/line-icon_gray.png";

    const treatmentDataStructure = [ // 維持您提供的結構
        { category: "一般門診", name: "門診治療", times: 1, room:"診療室", durationMinutes: 30 },
        { category: "一般門診", name: "健康檢查-自律神經", times: 1, room:"診療室", durationMinutes: 30 },
        { category: "一般門診", name: "健康檢查-心電圖", times: 1, room:"診療室", durationMinutes: 20 },
        { category: "一般門診", name: "健康檢查-頸動脈超音波", times: 1, room:"診療室", durationMinutes: 30 },
        { category: "一般門診", name: "健康檢查-呼吸中止居家檢測", times: 1, room:"診療室", durationMinutes: 15 },
        { category: "一般門診", name: "健康檢查-其它", times: 1, room:"診療室", durationMinutes: 30 },
        { category: "震波治療", name: "患部震波", times: 1, room:"震波室", durationMinutes: 30 },
        { category: "震波治療", name: "性功能震波" , times: 1, room:"震波室", durationMinutes: 30 },
        { category: "PRP治療", name: "二代PRP", times: 1, room:"診療室", durationMinutes: 60 },
        { category: "PRP治療", name: "訊聯PRP PLUS", times: 1, room:"診療室", durationMinutes: 60 },
        { category: "外泌體", name: "生髮", times: 1, room:"診療室", durationMinutes: 45 },
        { category: "外泌體", name: "保養" , times: 1, room:"點滴室", durationMinutes: 60 },
        { category: "外泌體", name: "訊聯幹細胞" , times: 1, room:"點滴室", durationMinutes: 90 },
        { category: "點滴療程", name: "記憶力強化" , times: 1, room:"點滴室", durationMinutes: 60 },
        { category: "點滴療程", name: "血液循環" , times: 1, room:"點滴室", durationMinutes: 60 },
        { category: "點滴療程", name: "美白抗氧" , times: 1, room:"點滴室", durationMinutes: 60 },
        { category: "點滴療程", name: "保肝排毒", times: 1, room:"點滴室", durationMinutes: 60 },
        { category: "點滴療程", name: "抗老逆齡", times: 3, room:"點滴室", durationMinutes: 60 },
        { category: "點滴療程", name: "燃脂增肌", times: 4, room:"點滴室", durationMinutes: 60 },
        { category: "點滴療程", name: "好眠好心情", times: 3, room:"點滴室", durationMinutes: 60 },
        { category: "點滴療程", name: "各類治療點滴" , times: 3, room:"點滴室", durationMinutes: 60 },
        { category: "修復式醫美", name: "體重控制瘦瘦針" , times: 3, room:"診療室", durationMinutes: 30 },
        { category: "修復式醫美", name: "肉毒桿菌注射" , times: 3, room:"診療室", durationMinutes: 30 },
        { category: "疫苗注射", name: "HPV", times: 2, room:"診療室", durationMinutes: 15 },
        { category: "疫苗注射", name: "帶狀疱疹", times: 2, room:"診療室", durationMinutes: 15 },
    ];

    let currentEditingCustomerData = null;
    let currentLoadedCustomerId = null;
    let allCustomerTreatments = [];
    let allCustomerAppointments = [];
    let allCustomerAssessments = [];
    // 清理：將 assessmentsLoaded 移至 initializePage 內部作用域，並確保只有一個定義
    let assessmentsLoaded = false;

    if (!db || !functions || !Timestamp || !serverTimestamp || !increment || !getCurrentEditorName || !getCurrentUserRole) {
        console.error("[customers.js] Firebase instances or role function not fully available from parent!", {
            db: !!db, functions: !!functions, Timestamp: !!Timestamp, serverTimestamp: !!serverTimestamp,
            increment: !!increment, getCurrentEditorName: !!getCurrentEditorName, getCurrentUserRole: !!getCurrentUserRole
        });
        alert("系統錯誤：無法正確初始化資料庫連接元件或權限服務，請重新整理。");
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = true);
        return;
    }
    // --- Helper Functions ---
// customers.js

    async function loadAssessmentHistoryLazy() {
        if (assessmentsLoaded) return; // 如果已經載入過，則不再執行

        // 檢查 db 實例和當前是否有載入客戶的 Firestore Document ID (currentLoadedCustomerId)
        // 並且也需要 currentEditingCustomerData 來獲取 displayCustomerId
        if (!db || !currentLoadedCustomerId || !currentEditingCustomerData) {
            console.warn("[customers.js] DB not available or no customer loaded (or missing displayCustomerId) for assessment history.");
            if (assessmentHistoryContent) assessmentHistoryContent.innerHTML = `<p class='text-base p-4'>問卷紀錄待載入 (請先查詢客戶)...</p>`;
            return;
        }

        try {
            if (assessmentHistoryContent) assessmentHistoryContent.innerHTML = `<p class='text-base p-4'>載入問卷紀錄中...</p>`;
            
            // currentLoadedCustomerId 是客戶在 'customers' 集合中的 Firestore Document ID
            // currentEditingCustomerData.displayCustomerId 是客戶的顯示ID (例如 "000001")
            console.log(`[customers.js] Lazy loading assessment history for customer Firestore Doc ID: ${currentLoadedCustomerId}, using displayCustomerId for query: ${currentEditingCustomerData.displayCustomerId}`);
            
            // 從 'assessmentRecords' 集合中查詢
            // 使用 'customerId' 欄位進行比對，該欄位儲存的是客戶的 displayCustomerId
            const snap = await db.collection("assessmentRecords")
                                .where("customerId", "==", currentEditingCustomerData.displayCustomerId) // ✨ 核心改動：使用 displayCustomerId 進行查詢
                                .orderBy("submittedAt", "desc") // 按提交時間降序排列
                                .get();
                                
            allCustomerAssessments = snap.docs.map(d => ({ id: d.id, ...d.data() })); // 將查詢結果轉換並儲存
            renderAssessmentHistory(); // 渲染問卷歷史列表
            assessmentsLoaded = true; // 標記為已載入
        } catch (err) {
            console.error("[customers.js] Lazy load assessment error:", err);
            if (assessmentHistoryContent) assessmentHistoryContent.innerHTML = `<p class='error-text p-4'>載入問卷紀錄失敗: ${err.message}</p>`;
        }
    }

    function showUiSection(sectionToShow, keepSearchVisible = false) {
        if(addCustomerSection) addCustomerSection.classList.add("hidden");
        if(customerDataSection) customerDataSection.classList.add("hidden");
        if (revokeTreatmentModal) revokeTreatmentModal.classList.add("hidden");
        if (searchResultsListContainer) searchResultsListContainer.classList.add("hidden"); // 新增：隱藏結果列表

        if (!keepSearchVisible && searchSection) {
            searchSection.classList.add("hidden");
        } else if (searchSection) {
            searchSection.classList.remove("hidden");
        }
        if (sectionToShow) {
            sectionToShow.classList.remove("hidden");
        }
    }

    function setDateTimeInputDefault(inputElement) {
        if (!inputElement) return;
        const now = new Date();
        const roundedMinutes = Math.floor(now.getMinutes() / 30) * 30;
        now.setMinutes(roundedMinutes, 0, 0);
        const pad = (n) => n.toString().padStart(2, "0");
        const localISO =
            `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
            `T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        inputElement.value = localISO;
    }

    function convertFirestoreTimestampToInputDate(timestamp) {
        if (!timestamp || typeof timestamp.toDate !== "function") return "";
        try {
            const d = timestamp.toDate();
            const pad = (n) => n.toString().padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        } catch (e) {
            console.error("Error converting Firestore timestamp:", e, timestamp);
            return "";
        }
    }

    function formatFirestoreTimestampForDisplay(timestamp) {
        if (!timestamp || typeof timestamp.toDate !== 'function') return 'N/A';
        try {
            const date = timestamp.toDate();
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch (e) {
            console.error("Error formatting Firestore timestamp for display:", e, timestamp);
            return 'Invalid Date';
        }
    }

    function displayGeneralMessage(element, message, isError = true) {
            if (element) {
                element.textContent = message; // 設定文字內容

                // 管理錯誤/成功狀態的 class，同時保留其他 class
                if (message) { // 如果有訊息，才設定樣式
                    if (isError) {
                        element.classList.add('error-text');
                        element.classList.remove('success-text');
                    } else {
                        element.classList.add('success-text');
                        element.classList.remove('error-text');
                    }
                    // 可以根據需要確保元素可見，例如：
                    // element.style.display = 'block'; 
                } else {
                    // 如果訊息為空，清除狀態 class，並可選擇隱藏元素
                    element.classList.remove('error-text', 'success-text');
                    // element.style.display = 'none'; // 可選
                }
            }
        }
    


    async function generateNewDisplayCustomerId() {
        if (!functions) {
            console.error("[customers.js] Firebase Functions instance not available.");
            throw new Error("無法初始化雲端函數服務。");
        }
        console.log("[customers.js] Calling Cloud Function 'generateDisplayCustomerId'...");
        try {
            const generateIdFunction = functions.httpsCallable('generateDisplayCustomerId');
            const result = await generateIdFunction();
            if (result.data && result.data.displayCustomerId) {
                return result.data.displayCustomerId;
            } else {
                throw new Error("從雲端函數獲取客戶ID的格式不正確。");
            }
        } catch (error) {
            console.error("[customers.js] Error calling 'generateDisplayCustomerId' Cloud Function:", error);
            let alertMsg = `產生客戶ID時發生雲端錯誤: ${error.message || '未知錯誤'}`;
            if (error.code === 'unauthenticated') alertMsg = "錯誤：您需要登入才能執行此操作。";
            else if (error.code === 'permission-denied') alertMsg = "錯誤：您的帳號無權限執行此操作。請聯繫管理員。";
            else if (error.code === 'not-found') alertMsg = "錯誤：找不到指定的雲端函數。";
            alert(alertMsg);
            throw error;
        }
    }

    function validateSearchInputs() {
        const name = searchNameInput ? searchNameInput.value.trim() : '';
        const phone = searchPhoneInput ? searchPhoneInput.value.trim() : '';
        const displayId = searchDisplayIdInput ? searchDisplayIdInput.value.trim() : '';
        let errors = [];

        if (!name && !phone && !displayId) {
            errors.push("請至少輸入姓名、電話或客戶代號進行查詢。");
        }

        // 針對客戶代號的驗證：如果輸入，則必須是1到6位數字
        if (displayId) {
            if (!/^\d+$/.test(displayId)) { // 必須完全是數字
                errors.push("客戶代號必須為數字。");
            } else if (displayId.length > 6) { // 長度不可超過6位 (雖然 input 事件已限制，多一層防護)
                errors.push("客戶代號不可超過6位數字。");
            } else if (parseInt(displayId, 10) === 0 && displayId.length > 1 && !name && !phone) {
                 // 如果只輸入了類似 "00" 且沒有其他條件，可能也視為無效或提示
                 // 但目前主要驗證 1-6 位數字即可，補零會在查詢時處理
            } else if (displayId.length === 0 && (name || phone)) {
                // 如果客戶代號為空，但有其他查詢條件，這是允許的
            } else if (displayId.length < 1) { // 此條件其實包含在 displayId.length === 0 中
                 // errors.push("客戶代號若有輸入，至少需1位數字。"); // 其實可以允許1位數
            }
             // 簡化：若 displayId 有值，則必須是1到6位數字
            if (displayId.length > 0 && !/^\d{1,6}$/.test(displayId)) {
                 errors.push("客戶代號必須為1至6位數字。");
            }
        }


        if (errors.length > 0) {
            displayGeneralMessage(searchMessage, errors.join(" "), true);
            return false;
        }
        displayGeneralMessage(searchMessage, "", false);
        return true;
    }

    function validateAddOrEditCustomerInputs(isEdit = false) { // 更新：移除 localTel, email；displayName 選填
        const nameInput = isEdit ? document.getElementById('edit-customer-name') : addNameInput;
        const name = nameInput ? nameInput.value.trim() : '';
        // 暱稱 (displayName) 是選填，不特別驗證
        const genderRadio = isEdit ? document.querySelector('input[name="edit-gender"]:checked') : document.querySelector('input[name="add-gender"]:checked');
        const gender = genderRadio ? genderRadio.value : null;
        const mobileInput = isEdit ? document.getElementById('edit-customer-mobile') : addMobileInput;
        const mobile = mobileInput ? mobileInput.value.trim() : '';
        let errors = [];

        if (!name || name.length < 1) errors.push("客戶姓名為必填。");
        
        if (!gender && !isEdit) { // 新增時性別必填
             errors.push("性別為必填。");
        }
        // 編輯時，若原本有性別，目前UI不允許清空，所以不用特別驗證 "不可改為空"

        if (!mobile) errors.push("行動電話為必填。"); // 行動電話改為必填
        if (mobile && !/^(\+?\d{1,3}[-.\s]?)?(\(?\d{1,}\)?[-.\s]?)?[\d\s-]{7,15}$/.test(mobile) && !/^09\d{8}$/.test(mobile)) {
             errors.push("行動電話格式不符 (台灣手機請輸入09xxxxxxxx 或含國碼)。");
        } else if (mobile && mobile.startsWith("09") && mobile.length !== 10) {
            errors.push("台灣行動電話格式應為10碼。");
        }

        const messageElement = isEdit ? document.getElementById('edit-customer-message') : addMessage;
        if (errors.length > 0) {
            displayGeneralMessage(messageElement, errors.join(" "), true);
            return false;
        }
        if (messageElement) displayGeneralMessage(messageElement, "", false);
        return true;
    }

    async function handleSearchCustomer() {
        if (!validateSearchInputs()) return; // validateSearchInputs 現在允許客戶代號為1-6位數字

        displayGeneralMessage(searchMessage, "資料查詢中...", false);
        if(searchResultsListContainer) searchResultsListContainer.classList.add("hidden");
        if(searchResultsRowsContainer) searchResultsRowsContainer.innerHTML = '';

        const sNameInputVal = searchNameInput.value.trim(); // 保留原始大小寫給後續處理
        const sPhoneVal = searchPhoneInput.value.trim();
        let sDisplayIdVal = searchDisplayIdInput ? searchDisplayIdInput.value.trim() : ''; // 獲取原始輸入

        // ⭐ 自動補零邏輯 ⭐
        if (sDisplayIdVal && /^\d{1,5}$/.test(sDisplayIdVal)) { // 如果是1到5位純數字
            sDisplayIdVal = sDisplayIdVal.padStart(6, '0');
            if(searchDisplayIdInput) searchDisplayIdInput.value = sDisplayIdVal; // 更新輸入框顯示補零後的值
            console.log(`[customers.js] Padded displayId to: ${sDisplayIdVal}`);
        }
        // 此時 sDisplayIdVal 如果有效，應該是6位數字字串或空字串

        let results = [];
        
        if (!db) {
             displayGeneralMessage(searchMessage, "資料庫連接失敗。", true); return;
        }
        console.log(`[customers.js] Searching - Name: '${sNameInputVal}', Phone: '${sPhoneVal}', DisplayID (used for query): '${sDisplayIdVal}'`);

        try {
            let baseQuery = db.collection("customers");
            let initialResults = [];
            let queriesMade = 0;

            // 查詢邏輯調整：優先使用客戶代號 (已補零)
            if (sDisplayIdVal) { // 此時 sDisplayIdVal 應為6位數或空
                queriesMade++;
                const displayIdSnapshot = await baseQuery.where("displayCustomerId", "==", sDisplayIdVal).get();
                displayIdSnapshot.forEach(doc => initialResults.push({ firestoreId: doc.id, ...doc.data() }));
            }
            // 其次使用電話查詢
            else if (sPhoneVal) {
                queriesMade++;
                const mobileSnapshot = await baseQuery.where("mobile", "==", sPhoneVal).get();
                mobileSnapshot.forEach(doc => initialResults.push({ firestoreId: doc.id, ...doc.data() }));
            }
            // 如果只有姓名查詢
            else if (sNameInputVal) {
                queriesMade++;
                let nameSnapshot;
                if (sNameInputVal.endsWith('*')) {
                    const prefix = sNameInputVal.slice(0, -1);
                    if (prefix) {
                        nameSnapshot = await baseQuery.where("name", ">=", prefix)
                                                    .where("name", "<=", prefix + '\uf8ff')
                                                    .get();
                    } else {
                        nameSnapshot = await baseQuery.limit(50).get(); 
                        displayGeneralMessage(searchMessage, "請提供更明確的姓名搜尋條件。", true);
                    }
                } else {
                    nameSnapshot = await baseQuery.where("name", "==", sNameInputVal).get();
                }
                if (nameSnapshot) {
                    nameSnapshot.forEach(doc => initialResults.push({ firestoreId: doc.id, ...doc.data() }));
                }
            }

            results = initialResults;

            // 如果同時有姓名和其他條件，對初步結果進行客戶端姓名篩選
            if (sNameInputVal && (sDisplayIdVal || sPhoneVal) && results.length > 0) {
                const nameFilterLower = sNameInputVal.toLowerCase();
                results = results.filter(customer => {
                    const customerNameLower = (customer.name || "").toLowerCase();
                    if (nameFilterLower.includes('*')) {
                        // 將使用者輸入的 * 轉換為正規表達式的 .*? (非貪婪匹配任何字符)
                        // 並確保 ^ 和 $ 以匹配整個字串，除非使用者明確用 * 表示部分匹配
                        // 為了簡單起見，這裡的 * 處理為 "包含" 模式下的萬用字元
                        // 例如 "測*試" -> /^測.*?試$/i
                        // 例如 "測試*" -> /^測試.*?$/i
                        // 例如 "*測試" -> /^.*?測試$/i
                        const regexPattern = nameFilterLower.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*?');
                        const regex = new RegExp(`^${regexPattern}$`, 'i');
                        return regex.test(customer.name || "");
                    } else {
                        return customerNameLower.includes(nameFilterLower);
                    }
                });
            }
            
            // 去重
            const uniqueResultsMap = new Map();
            results.forEach(r => uniqueResultsMap.set(r.firestoreId, r));
            results = Array.from(uniqueResultsMap.values());


            displayGeneralMessage(searchMessage, "", false);
            if (results.length === 1) {
                if(searchResultsListContainer) searchResultsListContainer.classList.add("hidden");
                await loadCustomerDataIntoUI(results[0].firestoreId);
                showUiSection(customerDataSection, true);
            } else if (results.length > 1) {
                if(addCustomerSection) addCustomerSection.classList.add("hidden");
                if(customerDataSection) customerDataSection.classList.add("hidden");
                
                let listHtml = '';
                results.sort((a,b) => (a.name || "").localeCompare(b.name || ""));
                results.forEach(result => {
                    listHtml += `
                        <div class="grid grid-cols-[1fr_2fr_1.5fr_auto] gap-x-2 items-center py-2.5 border-b border-gray-100 text-sm hover:bg-gray-50 cursor-pointer select-customer-row" data-id="${result.firestoreId}">
                            <span>${result.displayCustomerId || 'N/A'}</span>
                            <span>${result.name || 'N/A'}</span>
                            <span>${result.mobile || 'N/A'}</span>
                            <span class="text-right">
                                <button class="action-button select-customer-from-list-btn text-xs" data-id="${result.firestoreId}">選取</button>
                            </span>
                        </div>`;
                });
                if(searchResultsRowsContainer) searchResultsRowsContainer.innerHTML = listHtml;
                if(searchResultsListContainer) searchResultsListContainer.classList.remove("hidden");

                if(searchResultsRowsContainer) {
                    searchResultsRowsContainer.querySelectorAll('.select-customer-from-list-btn, .select-customer-row').forEach(el => {
                        el.addEventListener('click', async function(event) {
                            event.stopPropagation();
                            const customerId = this.dataset.id || this.closest('.select-customer-row')?.dataset.id;
                            if (customerId) {
                                if(searchResultsListContainer) searchResultsListContainer.classList.add("hidden");
                                if(searchResultsRowsContainer) searchResultsRowsContainer.innerHTML = '';
                                await loadCustomerDataIntoUI(customerId);
                                showUiSection(customerDataSection, true);
                            }
                        });
                    });
                }

            } else { // results.length === 0
                if(searchResultsListContainer) searchResultsListContainer.classList.add("hidden");
                displayGeneralMessage(searchMessage, "查無客戶資料，您可以直接新增。", false);
                clearAddCustomerForm();
                if(addNameInput && searchNameInput.value.trim()) addNameInput.value = searchNameInput.value.trim();
                if(addMobileInput && searchPhoneInput.value.trim()) addMobileInput.value = searchPhoneInput.value.trim();
                showUiSection(addCustomerSection, true);
                if(customerDataSection) customerDataSection.classList.add("hidden");
            }
        } catch (error) {
            console.error("[customers.js] 搜尋客戶錯誤:", error);
            displayGeneralMessage(searchMessage, `查詢錯誤: ${error.message}`, true);
            if(searchResultsListContainer) searchResultsListContainer.classList.add("hidden");
        }
    }

    async function handleCreateCustomer() {
        if (!validateAddOrEditCustomerInputs(false)) return;
        displayGeneralMessage(addMessage, "準備資料中...", false);
        const editorName = getCurrentEditorName();
        try {
            const displayId = await generateNewDisplayCustomerId();
            const birthDateValue = addBirthInput.value;
            const birthDateString = birthDateValue || null;
            const newCustomerDataForParent = {
                displayCustomerId: displayId,
                name: addNameInput.value.trim(),
                // name_lowercase: addNameInput.value.trim().toLowerCase(), // 已移除
                displayName: addDisplayNameInput.value.trim() || null,
                gender: document.querySelector('input[name="add-gender"]:checked') ? document.querySelector('input[name="add-gender"]:checked').value : null,
                mobile: addMobileInput.value.trim(),
                birthDate: birthDateString,
                lineUid: null,
                createdBy: editorName,
                updatedBy: editorName
            };
            window.parent.postMessage({ type: 'SAVE_NEW_CUSTOMER', payload: newCustomerDataForParent }, window.parent.location.origin);
            displayGeneralMessage(addMessage, "資料傳送中，請稍候...", false);
        } catch (error) {
            displayGeneralMessage(addMessage, `準備資料時發生錯誤: ${error.message}`, true);
        }
    }
    
    function clearSearchForm() { // 更新：包含 displayId, 並隱藏結果列表
        if(searchNameInput) searchNameInput.value = '';
        if(searchPhoneInput) searchPhoneInput.value = '';
        if(searchDisplayIdInput) searchDisplayIdInput.value = ''; // 新增
        displayGeneralMessage(searchMessage, '', false);
        if(searchResultsListContainer) searchResultsListContainer.classList.add("hidden");
        if(searchResultsRowsContainer) searchResultsRowsContainer.innerHTML = '';
    }

    function clearAddCustomerForm() { // 更新：加入 displayName, 移除 localTel, email
        if(addNameInput) addNameInput.value = '';
        if(addDisplayNameInput) addDisplayNameInput.value = ''; // 新增
        const addGenderMale = document.getElementById('add-gender-male');
        if (addGenderMale) addGenderMale.checked = true;
        else { document.querySelectorAll('input[name="add-gender"]').forEach(r => r.checked = false); }
        if(addMobileInput) addMobileInput.value = '';
        // if(addLocalTelInput) addLocalTelInput.value = ''; // 移除
        // if(addEmailInput) addEmailInput.value = '';       // 移除
        if(addBirthInput) addBirthInput.value = '';
        displayGeneralMessage(addMessage, "", false);
    }

    async function loadCustomerDataIntoUI(docId) { // 更新：載入時隱藏結果列表
        if (!docId) { console.error("[customers.js] loadCustomerDataIntoUI: 無效的 docId"); return; }
        if (!db) {
             if(customerInfoContent) customerInfoContent.innerHTML = `<p class='error-text p-4'>資料庫連接失敗。</p>`; return;
        }
        if(searchResultsListContainer) searchResultsListContainer.classList.add("hidden");

        currentLoadedCustomerId = docId;
        assessmentsLoaded = false;
        if(customerDocIdHolder) customerDocIdHolder.value = docId;

        if(customerInfoContent) customerInfoContent.innerHTML = "<p class='text-base p-4'>載入客戶資料中...</p>";
        if(treatmentHistoryContent) treatmentHistoryContent.innerHTML = "<p class='text-base p-4'>載入療程紀錄中...</p>";
        if(appointmentHistoryContent) appointmentHistoryContent.innerHTML = "<p class='text-base p-4'>載入預約紀錄中...</p>";
        if(assessmentHistoryContent) assessmentHistoryContent.innerHTML = "<p class='text-base p-4'>問卷紀錄待載入...</p>";
        if (assessmentRecordsSection) assessmentRecordsSection.classList.add("hidden");

        toggleCustomerInfoEditMode(false);
        if(addTreatmentFormContainer) addTreatmentFormContainer.classList.add('hidden');

        try {
            const customerDoc = await db.collection("customers").doc(docId).get();
            if (!customerDoc.exists) throw new Error(`客戶資料 (ID: ${docId}) 不存在。`);
            
            const customerInfo = { firestoreId: customerDoc.id, ...customerDoc.data() };
            currentEditingCustomerData = JSON.parse(JSON.stringify(customerInfo));
            if(currentLineUidHolder) currentLineUidHolder.value = customerInfo.lineUid || "";
            renderCustomerInfo(customerInfo, false); // 使用更新後的 renderCustomerInfo

            const packagesSnapshot = await db.collection("customerTreatmentPackages")
                                            .where("customerId", "==", docId)
                                            .orderBy("purchaseDate", "desc")
                                            .get();
            allCustomerTreatments = packagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            allCustomerAppointments = [];
            for (const pkg of allCustomerTreatments) {
                const apptsSnapshot = await db.collection("customerTreatmentPackages").doc(pkg.id).collection("appointments").get();
                apptsSnapshot.forEach(apptDoc => {
                    allCustomerAppointments.push({
                        id: apptDoc.id,
                        packageId: pkg.id,
                        treatmentName: pkg.treatmentName, // 保留用於顯示
                        ...apptDoc.data()
                    });
                });
            }
            allCustomerAppointments = calculateAppointmentSequences(allCustomerAppointments, allCustomerTreatments); // 計算次數
            renderTreatmentHistory(); // 使用更新後的 renderTreatmentHistory
            renderAppointmentHistory(null, true); // 使用更新後的 renderAppointmentHistory

        } catch (error) {
            console.error("[customers.js] 載入客戶完整資料失敗:", error);
            if(customerInfoContent) customerInfoContent.innerHTML = `<p class='error-text p-4'>載入客戶資料失敗: ${error.message}</p>`;
            if(treatmentHistoryContent) treatmentHistoryContent.innerHTML = "";
            if(appointmentHistoryContent) appointmentHistoryContent.innerHTML = "";
            if(assessmentHistoryContent) assessmentHistoryContent.innerHTML = "";
        }
    }
    
    // 更新：計算預約次數 (第 X 次 / 共 Y 次)
    function calculateAppointmentSequences(appointments, packages) {
        const packageMap = new Map(packages.map(p => [p.id, { purchasedUnits: p.purchasedUnits }]));
        const appointmentsWithDetails = [];
        const appointmentsByPackage = {}; // Group appointments by packageId

        // Group appointments by packageId
        appointments.forEach(appt => {
            if (!appointmentsByPackage[appt.packageId]) {
                appointmentsByPackage[appt.packageId] = [];
            }
            appointmentsByPackage[appt.packageId].push(appt);
        });

        for (const packageId in appointmentsByPackage) {
            const pkgDetails = packageMap.get(packageId);
            if (!pkgDetails) continue;

            // Sort appointments within this package by date
            let sortedAppointments = [...appointmentsByPackage[packageId]]
                .sort((a, b) => (a.appointmentDateTime.seconds || 0) - (b.appointmentDateTime.seconds || 0));
            
            let sequenceCounter = 0;
            sortedAppointments.forEach(appt => {
                let currentSequence = null;
                if (appt.status !== "已取消") { // Only count non-cancelled appointments for sequence
                    sequenceCounter++;
                    currentSequence = sequenceCounter;
                }
                appointmentsWithDetails.push({
                    ...appt,
                    sequence: currentSequence, // Will be null for "已取消" if we only want sequence for used slots
                    packagePurchasedUnits: pkgDetails.purchasedUnits
                });
            });
        }
        return appointmentsWithDetails;
    }

    // 更新：客戶基本資料的渲染邏輯 (2x3 佈局，新舊欄位)
    function renderCustomerInfo(info, isEditing = false) {
        if (!info) {
            if(customerInfoContent) customerInfoContent.innerHTML = "<p class='error-text p-4'>無法載入客戶詳細資料。</p>";
            return;
        }
        const lineIconSrc = info.lineUid ? LINE_ICON_URL : LINE_ICON_GRAY_URL;
        const lineStatusText = info.lineUid ? '已綁定LINE' : '未綁定LINE';
        const customerDisplayIdText = info.displayCustomerId || 'N/A';
        const customerIdDisplayHtml = `<p class="customer-id-display text-xs text-gray-400">客戶代號: ${customerDisplayIdText} (Ref: ${info.firestoreId})</p>`;
        const isLineInitiallyBound = !!info.lineUid;

        if (isEditing) {
            if(customerInfoContent) customerInfoContent.innerHTML = `
                ${customerIdDisplayHtml}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-base items-baseline">
                    <div>
                        <label for="edit-customer-name" class="form-label sr-only">客戶姓名</label>
                        <input id="edit-customer-name" class="custom-form-input customer-info-field" value="${info.name || ''}" placeholder="客戶姓名 (*)">
                    </div>
                    <div>
                        <label for="edit-customer-display-name" class="form-label sr-only">客戶暱稱</label>
                        <input id="edit-customer-display-name" class="custom-form-input customer-info-field" value="${info.displayName || ''}" placeholder="客戶暱稱">
                    </div>
                    <div>
                        <p class="form-label text-sm text-gray-700 mb-1 md:mb-0">性別</p>
                        <div class="flex gap-x-3 capsule-radio-group">
                            <input type="radio" name="edit-gender" value="Male" id="edit-gender-male" class="custom-form-input" ${info.gender === 'Male' ? 'checked' : ''}>
                            <label for="edit-gender-male" class="capsule-radio-label">男 Male</label>
                            <input type="radio" name="edit-gender" value="Female" id="edit-gender-female" class="custom-form-input" ${info.gender === 'Female' ? 'checked' : ''}>
                            <label for="edit-gender-female" class="capsule-radio-label">女 Female</label>
                            <input type="radio" name="edit-gender" value="Other" id="edit-gender-other" class="custom-form-input" ${info.gender === 'Other' ? 'checked' : ''}>
                            <label for="edit-gender-other" class="capsule-radio-label">其他 Other</label>
                        </div>
                    </div>
                    <div>
                        <label for="edit-customer-mobile" class="form-label sr-only">行動電話</label>
                        <input id="edit-customer-mobile" class="custom-form-input customer-info-field" value="${info.mobile || ''}" placeholder="行動電話 (*)">
                    </div>
                    <div>
                        <label for="edit-customer-birth" class="form-label sr-only">出生日期</label>
                        <input type="date" id="edit-customer-birth" title="出生日期" class="custom-form-input customer-info-field" value="${convertFirestoreTimestampToInputDate(info.birthDate) || ''}">
                    </div>
                    <div>
                        <label class="form-label text-sm text-gray-700 mb-1 md:mb-0">LINE 狀態:</label>
                        <select id="edit-customer-line-status" class="custom-form-input customer-info-field" ${!isLineInitiallyBound ? 'disabled title="未綁定狀態不可於此更改"' : ''}>
                            <option value="linked" ${info.lineUid ? 'selected' : ''}>已綁定</option>
                            <option value="unlinked" ${!info.lineUid ? 'selected' : ''} ${!isLineInitiallyBound ? 'disabled' : ''}>解除綁定</option>
                        </select>
                         ${!isLineInitiallyBound ? `<span class="text-xs text-gray-400 ml-1">(未綁定LINE)</span>` : ''}
                    </div>
                </div>
                <p id="edit-customer-message" class="mt-2 text-sm"></p>`;
            // 移除 email 欄位的 toLowerCase 事件監聽器，因為 email 欄位已從此表單移除
        } else {
             if(customerInfoContent) customerInfoContent.innerHTML = `
                ${customerIdDisplayHtml}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-base items-baseline">
                    <div><span class="font-semibold inline-block min-w-[5em]">客戶姓名:</span> <span class="customer-info-field-ro">${info.name || 'N/A'}</span></div>
                    <div><span class="font-semibold inline-block min-w-[5em]">客戶暱稱:</span> <span class="customer-info-field-ro">${info.displayName || 'N/A'}</span></div>
                    <div><span class="font-semibold inline-block min-w-[5em]">客戶性別:</span> <span class="customer-info-field-ro">${info.gender || 'N/A'}</span></div>
                    
                    <div><span class="font-semibold inline-block min-w-[5em]">行動電話:</span> <span class="customer-info-field-ro">${info.mobile || 'N/A'}</span></div>
                    <div><span class="font-semibold inline-block min-w-[5em]">出生日期:</span> <span class="customer-info-field-ro">${convertFirestoreTimestampToInputDate(info.birthDate) || 'N/A'}</span></div>
                    <div class="flex items-baseline">
                      <span class="font-semibold inline-block min-w-[5em] shrink-0">LINE帳號:</span>
                      <span class="inline-flex items-center customer-info-field-ro">
                        ${lineStatusText}
                        <img src="${lineIconSrc}" alt="Line Status" class="line-icon ml-1">
                      </span>
                    </div>
                </div>`;
        }
    }

    function toggleCustomerInfoEditMode(enableEditing) {
        const customerFirestoreId = currentLoadedCustomerId;
        const editMsgElement = document.getElementById('edit-customer-message');

        if(editCustomerButtonHeader) editCustomerButtonHeader.classList.toggle('hidden', enableEditing);
        if(customerInfoActionsFooter) customerInfoActionsFooter.classList.toggle('hidden', !enableEditing);

        if (!customerFirestoreId && enableEditing) {
            displayGeneralMessage(editMsgElement || searchMessage, "沒有客戶資料可編輯。", true);
            if(customerInfoActionsFooter) customerInfoActionsFooter.classList.add('hidden');
            if(editCustomerButtonHeader) editCustomerButtonHeader.classList.remove('hidden');
            return;
        }
        if (enableEditing) {
            if (!currentEditingCustomerData || currentEditingCustomerData.firestoreId !== customerFirestoreId) {
                 displayGeneralMessage(editMsgElement || searchMessage, "編輯錯誤：客戶資料不一致。", true);
                 if(customerInfoActionsFooter) customerInfoActionsFooter.classList.add('hidden');
                 if(editCustomerButtonHeader) editCustomerButtonHeader.classList.remove('hidden');
                 return;
            }
            renderCustomerInfo(currentEditingCustomerData, true);
        } else {
            if (currentEditingCustomerData && currentEditingCustomerData.firestoreId === customerFirestoreId) {
                 renderCustomerInfo(currentEditingCustomerData, false);
            } else if (customerFirestoreId) {
                 if (customerInfoContent) customerInfoContent.innerHTML = "<p class='error-text p-4'>顯示錯誤，請重新查詢客戶。</p>";
            }
            if (editMsgElement) displayGeneralMessage(editMsgElement, '', false);
        }
    }

    async function handleSaveCustomerChanges() {
        if (!validateAddOrEditCustomerInputs(true)) return;
        const customerFirestoreId = currentLoadedCustomerId;
        if (!customerFirestoreId) {
            displayGeneralMessage(document.getElementById('edit-customer-message'), "錯誤：未指定客戶ID。", true); return;
        }
        const editorName = getCurrentEditorName();
        const lineStatusSelect = document.getElementById('edit-customer-line-status');
        const birthDateValue = document.getElementById('edit-customer-birth').value;
        const birthDateString = birthDateValue || null;
        const updatedFieldsForParent = {
            firestoreId: customerFirestoreId,
            name: document.getElementById('edit-customer-name').value.trim(),
            // name_lowercase: document.getElementById('edit-customer-name').value.trim().toLowerCase(), // 已移除
            displayName: document.getElementById('edit-customer-display-name').value.trim() || null,
            gender: document.querySelector('input[name="edit-gender"]:checked')?.value || null,
            birthDate: birthDateString,
            mobile: document.getElementById('edit-customer-mobile').value.trim(),
            updatedBy: editorName,
            lineUidAction: (lineStatusSelect && !lineStatusSelect.disabled && lineStatusSelect.value === "unlinked" && currentEditingCustomerData.lineUid !== null) ? 'unlink' : 'keep'
        };
        if(saveCustomerChangesButton) { saveCustomerChangesButton.textContent = "傳送中..."; saveCustomerChangesButton.disabled = true; }
        if(cancelEditCustomerButton) cancelEditCustomerButton.disabled = true;
        window.parent.postMessage({ type: 'SAVE_CUSTOMER_CHANGES', payload: updatedFieldsForParent }, window.parent.location.origin);
    }

    // --- 療程購買和預約相關函數 ---
    function populateTreatmentCategories() {
        if (!addTreatmentCategorySelect) return;
        const categories = [...new Set(treatmentDataStructure.map(item => item.category))];
        addTreatmentCategorySelect.innerHTML = '<option value="">請選擇類別</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category; option.textContent = category;
            addTreatmentCategorySelect.appendChild(option);
        });
        populateTreatmentNames();
    }

    function populateTreatmentNames() {
        if (!addTreatmentCategorySelect || !addTreatmentNameSelect || !addTreatmentCountInput) return;
        const selectedCategory = addTreatmentCategorySelect.value;
        addTreatmentNameSelect.innerHTML = '<option value="">請選擇療程</option>';
        addTreatmentCountInput.value = ''; // 清空購買數量
        if(addTreatmentAmountInput) addTreatmentAmountInput.value = ''; // 清空金額
        if (selectedCategory) {
            treatmentDataStructure
                .filter(item => item.category === selectedCategory)
                .forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.name; option.textContent = item.name;
                    option.dataset.defaultTimes = item.times;
                    addTreatmentNameSelect.appendChild(option);
                });
        }
        handleTreatmentNameChange();
    }

    function handleTreatmentNameChange() {
        if (!addTreatmentNameSelect || !addTreatmentCountInput) return;
        const selectedOption = addTreatmentNameSelect.options[addTreatmentNameSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.defaultTimes) {
            addTreatmentCountInput.value = selectedOption.dataset.defaultTimes;
        } else {
            addTreatmentCountInput.value = '1';
        }
    }

    async function handleAddTreatmentPurchase() { // 更新：加入 amount
        const customerFirestoreId = currentLoadedCustomerId;
        if (!customerFirestoreId) { displayGeneralMessage(addTreatmentMessage, "錯誤：未選擇客戶。", true); return; }
        const editorName = getCurrentEditorName();
        const customerData = currentEditingCustomerData;

        const category = addTreatmentCategorySelect.value;
        const name = addTreatmentNameSelect.value;
        const purchasedUnits = parseInt(addTreatmentCountInput.value);
        const amountStr = addTreatmentAmountInput ? addTreatmentAmountInput.value.trim() : ''; // 新增：讀取金額
        const amount = amountStr ? parseFloat(amountStr) : null; // 新增：轉換金額
        const firstUseDateTimeStr = addTreatmentFirstUseDateTimeInput.value;

        if (!category || !name || !purchasedUnits || purchasedUnits <= 0 || !firstUseDateTimeStr) {
            displayGeneralMessage(addTreatmentMessage, "請填寫完整的療程類別、名稱、數量及首次預約日期。", true); return;
        }
        if (addTreatmentAmountInput && amount !== null && isNaN(amount)) { // 新增：金額格式驗證
            displayGeneralMessage(addTreatmentMessage, "購買金額格式不正確。", true); return;
        }

        const treatmentDetails = treatmentDataStructure.find(t => t.name === name && t.category === category);
        if (!treatmentDetails) { displayGeneralMessage(addTreatmentMessage, "錯誤：找不到所選療程設定。", true); return; }
        
        const durationMinutes = treatmentDetails.durationMinutes || 30;
        let defaultRoom = treatmentDetails.room || "診療室";

        const purchaseDataForParent = {
            customerId: customerFirestoreId,
            customerDisplayId: customerData.displayCustomerId || 'N/A',
            customerName: customerData.name || 'N/A',
            treatmentCategory: category, treatmentName: name, purchasedUnits: purchasedUnits, 
            amount: amount, // 新增：傳遞金額
            editorName: editorName,
            firstAppointment: {
                firstUseDateTime: firstUseDateTimeStr, durationMinutes: durationMinutes, room: defaultRoom,
                notes: "首次預約 (隨套票購買)", editorName: editorName
            }
        };
        
        if (submitAddTreatmentButton) { submitAddTreatmentButton.disabled = true; submitAddTreatmentButton.textContent = "處理中..."; }
        if (cancelAddTreatmentButton) cancelAddTreatmentButton.disabled = true;

        window.parent.postMessage({ type: 'ADD_TREATMENT_PURCHASE', payload: purchaseDataForParent }, window.parent.location.origin);
        displayGeneralMessage(addTreatmentMessage, "療程購買請求已傳送...", false);
    }

    // 更新：renderTreatmentHistory (按鈕邏輯, 已用罄樣式)
    function renderTreatmentHistory() {
        if (!treatmentHistoryContent || !allCustomerTreatments) return;
        const customerFirestoreId = currentLoadedCustomerId;
        if (!customerFirestoreId) {
             treatmentHistoryContent.innerHTML = "<p class='text-base py-2'>請先查詢並載入客戶資料。</p>"; return;
        }

        let treatmentsToRender = [...allCustomerTreatments];
        const isFilterPresent = treatmentFilterPending && treatmentFilterCompleted && treatmentFilterRevoked;

        if (isFilterPresent) {
            const showPending = treatmentFilterPending.checked;
            const showCompleted = treatmentFilterCompleted.checked;
            const showRevoked = treatmentFilterRevoked.checked;
            treatmentsToRender = treatmentsToRender.filter(t => {
                const remaining = (t.purchasedUnits || 0) - (t.usedUnits || 0);
                const isRevoked = t.status === "revoked";
                const isPending = !isRevoked && remaining > 0;
                const isCompleted = !isRevoked && remaining <= 0;
                if (!showPending && !showCompleted && !showRevoked) return true;
                return (showPending && isPending) || (showCompleted && isCompleted) || (showRevoked && isRevoked);
            });
        }

        const previouslySelectedTreatmentRow = treatmentHistoryContent.querySelector('.treatment-row.selected');
        const previouslySelectedPackageId = previouslySelectedTreatmentRow ? previouslySelectedTreatmentRow.dataset.treatmentId : null;
        console.log("[renderTreatmentHistory] DEBUG: Currently selected Package ID for button visibility:", previouslySelectedPackageId); // 偵錯日誌
        const currentUserRole = getCurrentUserRole ? getCurrentUserRole() : null;
        console.log("[renderTreatmentHistory] DEBUG: Current User Role:", currentUserRole); // 偵錯日誌

        treatmentHistoryContent.innerHTML = "";
        if (treatmentsToRender.length === 0) {
            treatmentHistoryContent.innerHTML = "<p class='text-base py-2'>沒有符合條件的購買紀錄。</p>";
            renderAppointmentHistory(null, true);
            return;
        }

        let headerHtml = `
            <div class="grid grid-cols-[2fr_1.5fr_1fr_1fr_2.5fr] md:grid-cols-5 gap-x-2 py-2 border-b border-gray-300 font-semibold text-sm sticky top-0 bg-white z-10">
                <span>療程名稱</span>
                <span class="text-center">購買日期</span>
                <span class="text-center">次數記錄</span>
                <span class="text-center">購買金額</span>
                <span class="text-right pr-2"></span>
            </div>
            <div class="treatment-rows-container"></div>`; // 表格內容容器
        treatmentHistoryContent.innerHTML = headerHtml;
        const rowsContainer = treatmentHistoryContent.querySelector('.treatment-rows-container');

        let rowsHtml = '';
        treatmentsToRender.forEach((pkg) => {
            const remaining = (pkg.purchasedUnits || 0) - (pkg.usedUnits || 0);
            const countsDisplay = `${pkg.purchasedUnits || 0} - ${pkg.usedUnits || 0} `;
            const isSelected = (pkg.id === previouslySelectedPackageId);
            const isSelectedClass = isSelected ? 'selected' : ''; // 用於高亮選中行
            const purchaseAmountDisplay = pkg.amount !== null && pkg.amount !== undefined ? `$${pkg.amount.toLocaleString()}` : 'N/A';
            let managementButtonsHtml = '';

            if (pkg.status === "revoked") {
                const revokedInfo = pkg.revokedInfo ? `註銷者: ${pkg.revokedInfo.revokedBy}, 時間: ${formatFirestoreTimestampForDisplay(pkg.revokedInfo.revokedAt)}${pkg.revokedInfo.reason ? `, 原因: ${pkg.revokedInfo.reason}` : ''}` : '註銷資訊未知';
                managementButtonsHtml = `<button class="button-revoked" title="${revokedInfo}" disabled>已註銷</button>`;
            } else {
                let adminButtonsHtml = '';
                // **核心判斷：該列被選取 且 使用者是 admin**
                if (isSelected && currentUserRole === 'admin') {
                    console.log(`[renderTreatmentHistory] DEBUG: Admin buttons WILL be generated for selected pkg ${pkg.id}`); // 偵錯日誌
                    const editBtnHtml = `<button class="action-button-secondary open-edit-units-btn text-xs whitespace-nowrap mr-1 border border-blue-500 text-blue-500 hover:bg-blue-50" data-treatment-id="${pkg.id}" data-current-units="${pkg.purchasedUnits}" title="編輯此筆療程購買數量">編輯</button>`;
                    const revokeBtnHtml = `<button class="action-button-secondary open-revoke-modal-btn text-xs whitespace-nowrap mr-1 border border-red-500 text-red-500 hover:bg-red-50" data-treatment-id="${pkg.id}" title="註銷此筆療程購買紀錄">註銷</button>`;
                    adminButtonsHtml = `${editBtnHtml}${revokeBtnHtml}`;
                } else if (isSelected) { // 如果只是被選取但不是admin，也印個日誌
                     console.log(`[renderTreatmentHistory] DEBUG: Row ${pkg.id} is selected, but user is NOT admin. No admin buttons.`); // 偵錯日誌
                }

                let addAppointmentButtonHtml = '';
                if (remaining > 0) {
                    addAppointmentButtonHtml = `<button class="action-button add-inline-appointment-btn text-xs whitespace-nowrap" data-treatment-id="${pkg.id}" data-treatment-name="${pkg.treatmentName}" title="為此療程新增預約">新增預約</button>`;
                } else {
                    // **更新：「已用罄」改為灰色按鈕樣式**
                    addAppointmentButtonHtml = '<button class="button-used-up" disabled>使用完畢</button>';
                }
                managementButtonsHtml = `${adminButtonsHtml}${addAppointmentButtonHtml}`;
            }

            rowsHtml += `
                <div class="treatment-row grid grid-cols-[2fr_1.5fr_1fr_1fr_2.5fr] md:grid-cols-5 gap-x-2 items-center py-2.5 border-b border-gray-100 text-sm hover:bg-teal-50 ${isSelectedClass}" data-treatment-id="${pkg.id}" data-status="${pkg.status || 'active'}">
                    <span class="truncate pr-1 col-span-1">${pkg.treatmentName}</span>
                    <span class="text-center text-gray-600 col-span-1">${formatFirestoreTimestampForDisplay(pkg.purchaseDate)}</span>
                    <span class="text-center text-gray-600 col-span-1 treatment-units-display" data-original-purchased="${pkg.purchasedUnits}" data-used="${pkg.usedUnits}">${countsDisplay}</span>
                    <span class="text-center text-gray-600 col-span-1">${purchaseAmountDisplay}</span>
                    <span class="text-right h-full flex items-center justify-end col-span-1 space-x-1 pr-1">
                        ${managementButtonsHtml}
                    </span>
                </div>`;
        });
        if (rowsContainer) { // 確保 rowsContainer 存在
            rowsContainer.innerHTML = rowsHtml;
        } else {
            console.error("Error: .treatment-rows-container not found for appending rows.");
            // Fallback，但可能導致重複表頭 (應避免)
            // treatmentHistoryContent.innerHTML += rowsHtml;
        }
        
        attachTreatmentRowEventListeners();
        attachAddInlineAppointmentEventListeners();
        attachOpenRevokeModalEventListeners();
        attachOpenEditUnitsEventListeners(); // 新增

        if (!treatmentHistoryContent.querySelector('.treatment-row.selected')) {
            renderAppointmentHistory(null, true);
        }
    }

    // 新增：處理編輯購買數量的按鈕事件
    function attachOpenEditUnitsEventListeners() {
        document.querySelectorAll('.open-edit-units-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const packageId = e.target.dataset.treatmentId;
                const currentUnits = e.target.dataset.currentUnits;
                const row = e.target.closest('.treatment-row');
                if (!row) return;

                // 移除任何已存在的編輯表單
                document.querySelectorAll('.inline-edit-treatment-units-active-form').forEach(form => {
                    // 嘗試恢復原先的文字顯示
                    const prevRowUnitsCellOriginalText = form.closest('.treatment-row')?.querySelector('.treatment-units-display .original-units-text') || form.closest('.treatment-row')?.querySelector('.treatment-units-display');
                    if(prevRowUnitsCellOriginalText && prevRowUnitsCellOriginalText.style) prevRowUnitsCellOriginalText.style.display = 'block';
                    form.remove();
                });

                const unitsDisplayCell = row.querySelector('.treatment-units-display');
                // 創建一個 span 來保存並稍後恢復原始文字 (如果還沒有)
                let originalTextSpan = unitsDisplayCell.querySelector('.original-units-text');
                if (!originalTextSpan) {
                    originalTextSpan = document.createElement('span');
                    originalTextSpan.className = 'original-units-text';
                    originalTextSpan.textContent = unitsDisplayCell.textContent; // 保存當前文字
                    // 清空 cell 並加入 span (以便後續隱藏/顯示)
                    // unitsDisplayCell.innerHTML = ''; // 這樣會移除 dataset，不好
                    // unitsDisplayCell.appendChild(originalTextSpan);
                }
                
                if (unitsDisplayCell) { // 隱藏原始文字內容
                    // unitsDisplayCell.style.visibility = 'hidden'; // 或用其他方式隱藏
                    Array.from(unitsDisplayCell.childNodes).forEach(node => { // 隱藏原始直接子節點
                         if(node.style) node.style.display = 'none';
                         else if (node.nodeType === Node.TEXT_NODE) { // 包裝文字節點以便隱藏
                             const wrapper = document.createElement('span');
                             wrapper.className = 'original-units-text-wrapper'; // 臨時class
                             wrapper.style.display = 'none';
                             node.parentNode.insertBefore(wrapper, node);
                             wrapper.appendChild(node);
                         }
                    });
                }


                const formCloneContainer = inlineEditTreatmentUnitsTemplate.cloneNode(true); // 從模板複製
                const formClone = formCloneContainer.firstElementChild; // 獲取實際的表單 div
                formClone.classList.add('inline-edit-treatment-units-active-form'); // 標記活動表單
                const input = formClone.querySelector('input[type="number"]');
                input.value = currentUnits;
                const messageEl = formClone.querySelector('.inline-edit-units-message');

                formClone.querySelector('.save-inline-edit-units').addEventListener('click', async () => {
                    const newUnits = parseInt(input.value);
                    const usedUnits = parseInt(unitsDisplayCell.dataset.used || "0"); // 從 cell 的 dataset 獲取已使用數量
                    if (isNaN(newUnits) || newUnits < 0 || newUnits < usedUnits) {
                        displayGeneralMessage(messageEl, `數量無效 (必須 >= ${usedUnits})。`, true); return;
                    }
                    displayGeneralMessage(messageEl, '傳送中...', false);
                    // 發送給父視窗處理 Firestore 更新
                     window.parent.postMessage({
                        type: 'UPDATE_TREATMENT_UNITS',
                        payload: {
                            packageId: packageId, newPurchasedUnits: newUnits,
                            editorName: getCurrentEditorName(), customerFirestoreId: currentLoadedCustomerId
                        }
                    }, window.parent.location.origin);
                });
                formClone.querySelector('.cancel-inline-edit-units').addEventListener('click', () => {
                    if (unitsDisplayCell) { // 恢復原始文字顯示
                         // unitsDisplayCell.style.visibility = 'visible';
                         Array.from(unitsDisplayCell.childNodes).forEach(node => {
                             if(node.style && node !== formClone) node.style.display = ''; // 顯示原始直接子節點
                             else if (node.classList && node.classList.contains('original-units-text-wrapper')) {
                                 node.style.display = ''; // 顯示包裝器
                             }
                         });
                         // if(originalTextSpan) originalTextSpan.style.display = 'block';
                    }
                    formClone.remove();
                });
                if (unitsDisplayCell) { // 將編輯表單放入次數顯示的儲存格
                    unitsDisplayCell.appendChild(formClone);
                }
            });
        });
    }

    function attachTreatmentRowEventListeners() { // 更新：確保點擊按鈕時不觸發列選取
        document.querySelectorAll('.treatment-row').forEach(row => {
            row.addEventListener('click', function(event) {
                // 如果點擊的是按鈕或行內表單的任何部分，則不觸發列選擇/取消選擇邏輯
                if (event.target.closest('button') || event.target.closest('.inline-edit-treatment-units') || event.target.closest('.inline-appointment-form')) {
                    return; 
                }
                const previouslySelected = treatmentHistoryContent.querySelector('.treatment-row.selected');
                const packageId = this.dataset.treatmentId;

                // 移除任何已存在的行內表單 (預約或編輯數量)
                document.querySelectorAll('.inline-appointment-form:not(#inline-appointment-form-template)').forEach(form => form.remove());
                document.querySelectorAll('.inline-edit-treatment-units-active-form').forEach(form => {
                     // 恢復原先的文字顯示
                     const unitsDisplayCellOriginalText = form.closest('.treatment-row')?.querySelector('.treatment-units-display .original-units-text') || form.closest('.treatment-row')?.querySelector('.treatment-units-display');
                     if(unitsDisplayCellOriginalText && unitsDisplayCellOriginalText.style) unitsDisplayCellOriginalText.style.display = 'block'; // Restore display
                     form.remove();
                });

                if (previouslySelected === this && !this.classList.contains('selected-by-button-action')) {
                    // 如果再次點擊已選中的列 (且不是因為點擊新增預約按鈕導致的選中) -> 取消選取
                    this.classList.remove('selected');
                    renderAppointmentHistory(null, true); // 顯示客戶所有預約
                } else {
                    // 選取新的列或切換選取
                    if (previouslySelected) {
                        previouslySelected.classList.remove('selected');
                    }
                    this.classList.add('selected');
                    renderAppointmentHistory(packageId, false); // 顯示此療程的預約
                }
                // 清除因按鈕點擊導致的特殊選中標記 (如果有的話)
                document.querySelectorAll('.treatment-row.selected-by-button-action').forEach(r => r.classList.remove('selected-by-button-action'));
                
                renderTreatmentHistory(); // **重新渲染療程列表以更新按鈕可見性**
            });
        });
    }

    function attachAddInlineAppointmentEventListeners() { // 更新：選取相關列並處理表單插入
        document.querySelectorAll('.add-inline-appointment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡到列的點擊事件
                const packageId = e.target.dataset.treatmentId;
                const treatmentName = e.target.dataset.treatmentName;
                const clickedRow = e.target.closest('.treatment-row');

                // 取消其他列的選中狀態，選中當前操作的列
                const previouslySelected = treatmentHistoryContent.querySelector('.treatment-row.selected');
                if (previouslySelected && previouslySelected !== clickedRow) {
                    previouslySelected.classList.remove('selected');
                }
                // 移除任何已存在的行內表單 (預約或編輯數量)
                document.querySelectorAll('.inline-appointment-form:not(#inline-appointment-form-template)').forEach(form => form.remove());
                document.querySelectorAll('.inline-edit-treatment-units-active-form').forEach(form => {
                    const unitsDisplayCellOriginalText = form.closest('.treatment-row')?.querySelector('.treatment-units-display .original-units-text') || form.closest('.treatment-row')?.querySelector('.treatment-units-display');
                     if(unitsDisplayCellOriginalText && unitsDisplayCellOriginalText.style) unitsDisplayCellOriginalText.style.display = 'block';
                    form.remove();
                });

                if (inlineAppointmentFormTemplate) {
                    const formClone = inlineAppointmentFormTemplate.cloneNode(true);
                    formClone.id = `inline-form-${packageId}`; // 確保 ID 唯一
                    formClone.classList.remove('hidden');
                    if(formClone.querySelector('.inline-treatment-name')) formClone.querySelector('.inline-treatment-name').textContent = treatmentName;
                    if(formClone.querySelector('.inline-treatment-id-holder')) formClone.querySelector('.inline-treatment-id-holder').value = packageId;
                    const dateTimeInputForInline = formClone.querySelector('.inline-appointment-datetime');
                    setDateTimeInputDefault(dateTimeInputForInline);

                    if (clickedRow) { // 將當前點擊的列標記為選中 (如果是因按鈕觸發)
                        if(!clickedRow.classList.contains('selected')) clickedRow.classList.add('selected');
                        clickedRow.classList.add('selected-by-button-action'); // 特殊標記
                        renderAppointmentHistory(packageId, false); // 顯示此療程的預約
                    } else {
                        renderAppointmentHistory(null, true); // 如果找不到列，顯示所有預約
                    }
                    renderTreatmentHistory(); // 重新渲染療程列表以更新選中狀態和按鈕

                    // 找到重新渲染後的目標列來插入表單
                    const targetRowForForm = treatmentHistoryContent.querySelector(`.treatment-row[data-treatment-id="${packageId}"]`);
                    if (targetRowForForm && targetRowForForm.parentNode) {
                        // 插入表單到該列之後
                        targetRowForForm.parentNode.insertBefore(formClone, targetRowForForm.nextSibling);
                    } else if (treatmentHistoryContent) { // Fallback，附加到列表末尾
                        treatmentHistoryContent.appendChild(formClone);
                        console.warn(`[customers.js] 行內預約表單：渲染後找不到 packageId ${packageId} 對應的療程行。`);
                    } else {
                        console.error("[customers.js] 行內預約表單：無法插入。treatmentHistoryContent 未找到。");
                    }

                    formClone.querySelector('.submit-inline-appointment').addEventListener('click', () => submitInlineAppointment(formClone, packageId, treatmentName));
                    formClone.querySelector('.cancel-inline-appointment').addEventListener('click', () => {
                        formClone.remove();
                        if(clickedRow) clickedRow.classList.remove('selected-by-button-action'); // 清除特殊標記
                        // 可選：如果只是因為按鈕而選中，則取消選中，這需要更複雜的狀態管理
                        renderTreatmentHistory(); // 重新渲染以更新按鈕和選中狀態
                    });
                }
            });
        });
    }
    
    async function submitInlineAppointment(formClone, packageId, treatmentNameForDisplay) { // 更新：傳遞 customerName
        const customerFirestoreId = currentLoadedCustomerId;
        const editorName = getCurrentEditorName();
        const datetimeInput = formClone.querySelector(".inline-appointment-datetime");
        const messageEl = formClone.querySelector(".inline-appointment-message");

        if (!datetimeInput || !datetimeInput.value) { displayGeneralMessage(messageEl, "請選擇預約時間。", true); return; }
        const appointmentDateTimeStr = datetimeInput.value;
        const treatmentDetails = treatmentDataStructure.find(t => t.name === treatmentNameForDisplay); // 假設 treatmentNameForDisplay 足夠唯一
        const durationMinutes = Number(treatmentDetails?.durationMinutes || 30);
        let room = treatmentDetails?.room || "診療室";
        const customerName = currentEditingCustomerData ? currentEditingCustomerData.name : "N/A"; // 新增：獲取客戶姓名

        const appointmentDataForParent = {
            packageId: packageId,
            appointmentDateTime: appointmentDateTimeStr,
            durationMinutes: durationMinutes,
            room: room,
            notes: "行內表單新增預約",
            editorName: editorName,
            customerFirestoreId: customerFirestoreId,
            treatmentName: treatmentNameForDisplay, // 新增
            customerName: customerName             // 新增
        };
        const submitBtn = formClone.querySelector('.submit-inline-appointment');
        const cancelBtn = formClone.querySelector('.cancel-inline-appointment');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "傳送中..."; }
        if (cancelBtn) cancelBtn.disabled = true;

        window.parent.postMessage({ type: 'ADD_INLINE_APPOINTMENT', payload: appointmentDataForParent }, window.parent.location.origin);
        displayGeneralMessage(messageEl, "預約請求已傳送...", false);
    }


    function attachOpenRevokeModalEventListeners() { // 更新：加入 revokeReasonInput
         document.querySelectorAll('.open-revoke-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentTreatmentPackageToRevokeId = e.target.dataset.treatmentId;
                if (revokeConfirmInput) revokeConfirmInput.value = '';
                if (revokeReasonInput) revokeReasonInput.value = ''; // 清空原因
                displayGeneralMessage(revokeModalMessage, '', false);
                if (revokeTreatmentModal) revokeTreatmentModal.classList.remove('hidden');
            });
        });
    }
    
    async function handleRevokeTreatment() { // 更新：加入 revocationReason
        if (!currentTreatmentPackageToRevokeId) return;
        if (!revokeConfirmInput || revokeConfirmInput.value !== "註銷") {
            displayGeneralMessage(revokeModalMessage, "輸入內容不符，紀錄未註銷。", true); return;
        }
        const editorName = getCurrentEditorName();
        const customerFirestoreId = currentLoadedCustomerId;
        const reason = revokeReasonInput ? revokeReasonInput.value.trim() : ""; // 獲取原因

        const revokeDataForParent = {
            packageIdToRevoke: currentTreatmentPackageToRevokeId,
            editorName: editorName,
            customerFirestoreId: customerFirestoreId,
            revocationReason: reason // 新增：傳遞原因
        };
        if (confirmRevokeBtn) { confirmRevokeBtn.disabled = true; confirmRevokeBtn.textContent = "註銷中..."; }
        if (cancelRevokeBtn) cancelRevokeBtn.disabled = true;

        window.parent.postMessage({ type: 'REVOKE_TREATMENT_PACKAGE', payload: revokeDataForParent }, window.parent.location.origin);
        displayGeneralMessage(revokeModalMessage, "註銷請求已傳送...", false);
    }
    
    // 更新：renderAppointmentHistory (新欄位"次數", 狀態按鈕改為新版)
    function renderAppointmentHistory(selectedPackageId = null, showAllForCustomer = false) {
         if (!appointmentHistoryContent || !allCustomerAppointments) return;
        let appointmentsToDisplay = [];

        if (selectedPackageId) {
            appointmentsToDisplay = allCustomerAppointments.filter(appt => appt.packageId === selectedPackageId);
        } else if (showAllForCustomer) {
            appointmentsToDisplay = [...allCustomerAppointments];
        }

        const isApptFilterPresent = appointmentFilterBooked && appointmentFilterCompleted && appointmentFilterCancelled;
        if (isApptFilterPresent) {
            const selectedStatuses = [];
            if (appointmentFilterBooked.checked) selectedStatuses.push("已預約");
            if (appointmentFilterCompleted.checked) selectedStatuses.push("已完成");
            if (appointmentFilterCancelled.checked) selectedStatuses.push("已取消");
            if (selectedStatuses.length > 0) {
                 appointmentsToDisplay = appointmentsToDisplay.filter(appt => selectedStatuses.includes(appt.status));
            }
        }
        // 按預約日期時間降序排列
        appointmentsToDisplay.sort((a,b) => (b.appointmentDateTime.seconds || 0) - (a.appointmentDateTime.seconds || 0));

        appointmentHistoryContent.innerHTML = ""; // 清空舊內容
        // 表頭 (6欄)
        let headerHtml = `
            <div class="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1.5fr] md:grid-cols-6 gap-x-2 py-2 border-b border-gray-300 font-semibold text-sm sticky top-0 bg-white z-10">
                <span>療程名稱</span>
                <span class="text-center">預約時間</span>                
                <span class="text-center">次數</span>
                <span class="text-center">ROOM</span>
                <span class="text-center">狀態</span>
                <span class="text-right pr-2"></span>
            </div>
            <div class="appointment-rows-container"></div>`; // 內容容器
        appointmentHistoryContent.innerHTML = headerHtml;
        const rowsContainer = appointmentHistoryContent.querySelector('.appointment-rows-container');

        if (appointmentsToDisplay.length === 0) {
            const msg = (showAllForCustomer || !selectedPackageId) ? "此客戶尚無符合條件的預約紀錄。" : "此療程尚無符合條件的預約紀錄。"
            if(rowsContainer) rowsContainer.innerHTML = `<p class='text-base py-2'>${msg}</p>`;
            return;
        }

         let rowsHtml = '';
         appointmentsToDisplay.forEach(a => {
            const statusClassInfo = { "已預約": "text-green-600", "已完成": "text-blue-600", "已取消": "text-red-500", "未到": "text-orange-500" };
            const statusClass = statusClassInfo[a.status] || 'text-gray-600';
            const statusHoverTitle = a.statusModifiedBy && a.statusModifiedAt ? `修改者: ${a.statusModifiedBy}, 時間: ${formatFirestoreTimestampForDisplay(a.statusModifiedAt)}` : `狀態: ${a.status}`;
            // 次數顯示：如果是已取消，顯示 '-'，否則顯示 X / Y 或 N/A
            const countDisplay = a.status === '已取消' ? '-' : (a.sequence !== null && a.packagePurchasedUnits ? `${a.packagePurchasedUnits} - ${a.sequence}` : 'N/A');


            rowsHtml += `
                <div class="appointment-row grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1.5fr] md:grid-cols-6 gap-x-2 items-center py-2.5 border-b border-gray-100 text-sm hover:bg-teal-50" data-appointment-id="${a.id}" data-package-id="${a.packageId}">
                    <span class="truncate pr-1 col-span-1">${a.treatmentName || 'N/A'}</span>
                    <span class="text-center text-gray-600 col-span-1">${formatFirestoreTimestampForDisplay(a.appointmentDateTime)}</span>                    
                    <span class="text-center text-gray-600 col-span-1">${countDisplay}</span>
                    <span class="text-center text-gray-600 col-span-1">${a.room || '未指定'}</span>
                    <span class="${statusClass} text-center font-medium col-span-1" title="${statusHoverTitle}">${a.status}</span>
                    <span class="text-right h-full flex items-center justify-end col-span-1 pr-1">
                        <button class="action-button open-status-change-menu-btn text-xs whitespace-nowrap"
                                data-appointment-id="${a.id}"
                                data-current-status="${a.status}"
                                data-package-id="${a.packageId}"
                                title="變更此預約狀態">變更狀態</button>
                    </span>
                </div>`;
         });
         if (rowsContainer) { // 確保 rowsContainer 存在
             rowsContainer.innerHTML = rowsHtml;
         }
         attachOpenStatusChangeMenuEventListeners(); // 綁定新版狀態變更選單事件
    }
    
    // 新增：處理預約狀態變更的滑出選單
    function attachOpenStatusChangeMenuEventListeners() {
        document.querySelectorAll('.open-status-change-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                const appointmentId = e.target.dataset.appointmentId;
                const currentStatus = e.target.dataset.currentStatus;
                const packageId = e.target.dataset.packageId;
                
                // 移除任何已存在的選單
                const existingMenu = document.getElementById('dynamic-status-menu');
                if (existingMenu) existingMenu.remove();

                // 如果點擊的是已經激活選單的按鈕，則關閉選單並返回
                if (btn.classList.contains('status-menu-active')) {
                    btn.classList.remove('status-menu-active');
                    return;
                }
                // 移除其他按鈕的激活狀態
                document.querySelectorAll('.open-status-change-menu-btn.status-menu-active').forEach(activeBtn => {
                    activeBtn.classList.remove('status-menu-active');
                });
                btn.classList.add('status-menu-active'); // 標記當前按鈕為激活


                const menu = document.createElement('div');
                menu.id = 'dynamic-status-menu';
                menu.className = 'status-change-menu'; // 使用 style.css 中定義的樣式

                const availableStatuses = ["已預約", "已完成", "已取消"]; // 您可以加入 "未到" 等其他狀態
                availableStatuses.forEach(status => {
                    if (status !== currentStatus) { // 不包含當前狀態
                        const optionButton = document.createElement('button');
                        optionButton.textContent = status;
                        optionButton.dataset.newStatus = status;
                        optionButton.addEventListener('click', () => {
                            handleUpdateAppointmentStatus(appointmentId, packageId, status); // 直接更新狀態
                            menu.remove(); // 移除選單
                            btn.classList.remove('status-menu-active'); // 取消按鈕激活狀態
                        });
                        menu.appendChild(optionButton);
                    }
                });

                document.body.appendChild(menu); // 附加到 body 以避免父元素樣式影響及 z-index 問題

                // 定位選單到按鈕左側
                const buttonRect = btn.getBoundingClientRect();
                const menuWidth = menu.offsetWidth || 100; // 如果選單尚未渲染完成，預估寬度

                menu.style.position = 'absolute';
                menu.style.top = `${buttonRect.top + window.scrollY}px`;
                menu.style.left = `${buttonRect.left + window.scrollX - menuWidth - 5}px`; // 減去選單寬度和一些間距
                menu.style.display = 'flex'; // 確保可見
            });
         });
    }

    // 更新：處理預約狀態變更 (直接由選單按鈕觸發)
    async function handleUpdateAppointmentStatus(appointmentId, packageId, newStatus) {
        const customerFirestoreId = currentLoadedCustomerId;
        const editorName = getCurrentEditorName();

        console.log(`[customers.js] Updating status for appt: ${appointmentId}, pkg: ${packageId} to ${newStatus}`);

        const statusUpdateDataForParent = {
            appointmentId: appointmentId,
            packageId: packageId,
            newStatus: newStatus,
            editorName: editorName,
            customerFirestoreId: customerFirestoreId
        };

        // 不再需要從 statusUpdateMenu 讀取狀態，因為 newStatus 已傳入
        // statusUpdateMenuOld.classList.add('hidden'); // 舊選單應始終隱藏

        window.parent.postMessage({
            type: 'UPDATE_APPOINTMENT_STATUS',
            payload: statusUpdateDataForParent
        }, window.parent.location.origin);
        // 此處不再禁用按鈕，因為選單會立即消失
    }

    function renderAssessmentHistory() {
        if (!assessmentHistoryContent) return; // 確保元素存在
        if (!currentLoadedCustomerId) { // 確保有客戶ID
             assessmentHistoryContent.innerHTML = "<p class='text-base py-2'>請先查詢並載入客戶資料。</p>"; return;
        }
        if (!assessmentsLoaded && allCustomerAssessments.length === 0) { // 如果尚未加載且沒有資料，顯示提示
            assessmentHistoryContent.innerHTML = "<p class='text-base py-2'>問卷紀錄待載入 (請點擊上方「問卷紀錄」按鈕)</p>";
            return;
        }
        if (assessmentsLoaded && allCustomerAssessments.length === 0) { // 如果已加載但沒有紀錄
            assessmentHistoryContent.innerHTML = "<p class='text-base py-2'>此客戶尚無問卷紀錄。</p>";
            return;
        }
        
        let html = `<div class="overflow-x-auto"><div class="min-w-[500px]">
            <div class="grid grid-cols-[2fr_1fr_1fr] gap-x-2 md:gap-x-3 py-2 border-b border-gray-300 font-semibold text-sm">
                <span>問卷名稱</span>
                <span class="text-center">填寫日期</span>
                <span class="text-center">檔案</span>
            </div>`;
        allCustomerAssessments.forEach(asm => {
            // asm.id 是 assessmentRecord 的 Firestore ID
            // asm.formTypeKey 是問卷類型，例如 'tab1', 'tab2'
            // asm.customerId 在 Firestore 中儲存的是客戶的 displayCustomerId

            // 從 currentEditingCustomerData 獲取用於連結的 displayCustomerId 和 name
            // 確保 currentEditingCustomerData 已被正確載入且包含所需資訊
            const customerDisplayIdForLink = currentEditingCustomerData ? currentEditingCustomerData.displayCustomerId : 'N/A';
            const customerNameForLink = currentEditingCustomerData ? currentEditingCustomerData.name : 'Unknown';

            html += `
                <div class="assessment-row grid grid-cols-[2fr_1fr_1fr] gap-x-2 md:gap-x-3 items-center py-2.5 border-b border-gray-100 text-sm">
                    <span class="truncate pr-1">${asm.formTypeName || asm.formTypeKey || 'N/A'}</span>
                    <span class="text-center text-gray-600">${formatFirestoreTimestampForDisplay(asm.submittedAt)}</span>
                    <span class="text-center">
                        <button 
                            class="action-button text-xs view-assessment-file-btn" 
                            data-record-id="${asm.id}" 
                            data-form-type="${asm.formTypeKey}"
                            title="在新視窗開啟問卷結果">查看檔案</button>
                    </span>
                </div>`;
        });

        html += `</div></div>`; // 閉合 overflow-x-auto 和 min-w-[500px] 的 div
        assessmentHistoryContent.innerHTML = html;

        assessmentHistoryContent.querySelectorAll('.view-assessment-file-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const recordId = this.dataset.recordId;
                const formType = this.dataset.formType;

                if (currentLoadedCustomerId && currentEditingCustomerData && currentEditingCustomerData.displayCustomerId && currentEditingCustomerData.name && recordId && formType) {
                    const customerFirestoreId = currentLoadedCustomerId;
                    const customerDisplayId = currentEditingCustomerData.displayCustomerId;
                    const customerName = currentEditingCustomerData.name;

                    // ✨ 修改：呼叫父視窗的 showPage 函數 ✨
                    const queryParams = `?recordId=<span class="math-inline">\{recordId\}&customerID\=</span>{customerFirestoreId}&displayID=<span class="math-inline">\{customerDisplayId\}&name\=</span>{encodeURIComponent(customerName)}&formType=${formType}&mode=view`;
                    if (window.parent && typeof window.parent.showPage === 'function') {
                        console.log("[customers.js] Calling parent.showPage for assessment view with params:", queryParams);
                        window.parent.showPage('assessment.html', window.parent.document.getElementById('menu-assessment'), queryParams);
                    } else {
                        console.error("[customers.js] Cannot find parent.showPage function for assessment view.");
                        alert("無法開啟問卷記錄，系統通訊錯誤。");
                    }
                } else {
                    alert("無法取得足夠資訊開啟問卷。請確保客戶資料已載入。");
                }
            });
        });       
    }

    // --- Event Listeners Setup ---
    if(searchButton) searchButton.addEventListener("click", handleSearchCustomer);
    [searchNameInput, searchPhoneInput, searchDisplayIdInput].forEach(input => { // 加入 displayId
        if(input) input.addEventListener("keypress", function(event) { if (event.key === "Enter") handleSearchCustomer(); });
    });
    if(clearSearchButton) clearSearchButton.addEventListener("click", clearSearchForm);

    if(createButton) createButton.addEventListener("click", handleCreateCustomer);
    if(clearAddCustomerButton) clearAddCustomerButton.addEventListener("click", clearAddCustomerForm);
    // 移除 addEmailInput 的事件監聽器，因為該欄位已從新增表單移除
    
    if(editCustomerButtonHeader) {
        editCustomerButtonHeader.addEventListener("click", () => {
            if (!currentLoadedCustomerId || !currentEditingCustomerData || currentEditingCustomerData.firestoreId !== currentLoadedCustomerId ) {
                 displayGeneralMessage(document.getElementById('edit-customer-message') || searchMessage, "無法載入客戶資料進行編輯，請重新查詢。", true); return;
            }
            toggleCustomerInfoEditMode(true);
        });
    }
    if(cancelEditCustomerButton) cancelEditCustomerButton.addEventListener("click", () => toggleCustomerInfoEditMode(false));
    if(saveCustomerChangesButton) saveCustomerChangesButton.addEventListener("click", handleSaveCustomerChanges);

    if(addAssessmentButton) {
            addAssessmentButton.addEventListener("click", () => {
                if (!currentLoadedCustomerId || !currentEditingCustomerData || !currentEditingCustomerData.displayCustomerId || !currentEditingCustomerData.name) {
                    displayGeneralMessage(searchMessage || addMessage, "請先查詢並完整載入客戶資料以新增問卷。", true);
                    return;
                }

                const customerFirestoreId = currentLoadedCustomerId;
                const displayCustId = currentEditingCustomerData.displayCustomerId;
                const custName = currentEditingCustomerData.name;

                // 構建符合需求的 URL
                const assessmentUrl = `index.html?page=assessment&customerID=${customerFirestoreId}&displayID=${displayCustId}&name=${encodeURIComponent(custName)}`;

                console.log("[customers.js] Opening new window for assessment with URL:", assessmentUrl);

                // 使用 window.open 在新視窗/分頁開啟
                const newWindow = window.open(assessmentUrl, '_blank');
                if (newWindow) {
                    newWindow.focus(); // 嘗試將焦點轉到新視窗
                } else {
                    // 如果瀏覽器阻止了彈出視窗
                    alert("無法開啟新視窗。請檢查您的瀏覽器是否封鎖了彈出式視窗，或手動複製以下連結開啟：\n" + assessmentUrl);
                    console.warn("[customers.js] New window was blocked by the browser or failed to open.");
                }
            });
        }

    if(gotoAssessmentRecordsButton) {
        gotoAssessmentRecordsButton.addEventListener("click", async () => {
            if (!assessmentRecordsSection) return;
            if (assessmentRecordsSection.classList.contains("hidden")) {
                await loadAssessmentHistoryLazy(); // 如果區塊是隱藏的，則加載資料
                assessmentRecordsSection.classList.remove("hidden");
            }
            assessmentRecordsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    if(showAddTreatmentBtn) {
        showAddTreatmentBtn.addEventListener("click", () => {
            if(addTreatmentFormContainer) {
                addTreatmentFormContainer.classList.toggle('hidden');
                if (!addTreatmentFormContainer.classList.contains('hidden')) {
                    populateTreatmentCategories();
                    if(addTreatmentFirstUseDateTimeInput) setDateTimeInputDefault(addTreatmentFirstUseDateTimeInput);
                    if(addTreatmentAmountInput) addTreatmentAmountInput.value = ''; // 清空金額
                    displayGeneralMessage(addTreatmentMessage, "", false);
                }
            }
        });
    }
    if(addTreatmentCategorySelect) addTreatmentCategorySelect.addEventListener('change', populateTreatmentNames);
    if(addTreatmentNameSelect) addTreatmentNameSelect.addEventListener('change', handleTreatmentNameChange);
    if(submitAddTreatmentButton) submitAddTreatmentButton.addEventListener('click', handleAddTreatmentPurchase);
    if(cancelAddTreatmentButton) {
        cancelAddTreatmentButton.addEventListener('click', () => {
            if(addTreatmentFormContainer) addTreatmentFormContainer.classList.add('hidden');
            displayGeneralMessage(addTreatmentMessage, "", false);
        });
    }
    
    // 療程歷史篩選器
    if(treatmentFilterPending) treatmentFilterPending.addEventListener('change', renderTreatmentHistory);
    if(treatmentFilterCompleted) treatmentFilterCompleted.addEventListener('change', renderTreatmentHistory);
    if(treatmentFilterRevoked) treatmentFilterRevoked.addEventListener('change', renderTreatmentHistory);
    
    // 預約歷史篩選器
    [appointmentFilterBooked, appointmentFilterCompleted, appointmentFilterCancelled].forEach(filter => {
        if (filter) filter.addEventListener('change', () => {
            const selRow = treatmentHistoryContent ? treatmentHistoryContent.querySelector('.treatment-row.selected') : null;
            renderAppointmentHistory(selRow ? selRow.dataset.treatmentId : null, !selRow);
        });
    });

    // 註銷療程相關
    if (confirmRevokeBtn) confirmRevokeBtn.addEventListener('click', handleRevokeTreatment);
    if (cancelRevokeBtn) cancelRevokeBtn.addEventListener('click', () => {
        if(revokeTreatmentModal) revokeTreatmentModal.classList.add('hidden');
        currentTreatmentPackageToRevokeId = null;
        if (confirmRevokeBtn) { confirmRevokeBtn.disabled = false; confirmRevokeBtn.textContent = "確認送出註銷"; }
        if (cancelRevokeBtn) cancelRevokeBtn.disabled = false;
    });
    
    // 點擊頁面其他地方關閉動態狀態選單
    document.addEventListener('click', function(event) {
        const dynMenu = document.getElementById('dynamic-status-menu');
        const actBtn = document.querySelector('.open-status-change-menu-btn.status-menu-active');
        if (dynMenu && (!dynMenu.contains(event.target) && (!actBtn || !actBtn.contains(event.target)))) {
            dynMenu.remove(); if(actBtn) actBtn.classList.remove('status-menu-active');
        }
    });
    
    // 確保舊的狀態選單被隱藏
    if (statusUpdateMenuOld) statusUpdateMenuOld.classList.add('hidden');


    // --- Message Listener for responses from parent window ---
    window.addEventListener('message', (event) => {
        if (event.origin !== window.parent.location.origin) {
            console.warn("[customers.js] Message from unknown origin ignored:", event.origin);
            return;
        }
        console.log("[customers.js] Received message from parent:", JSON.parse(JSON.stringify(event.data)));

        const data = event.data;
        const payload = data.payload; // 保持 payload 方便取用

        // 重設按鈕狀態的輔助函數
        function resetButtonStates(primaryBtn, primaryText, secondaryBtn = null, alsoEnableSecondary = true) {
            if (primaryBtn) { primaryBtn.disabled = false; primaryBtn.textContent = primaryText; }
            if (secondaryBtn && alsoEnableSecondary) { secondaryBtn.disabled = false; }
            else if (secondaryBtn) { secondaryBtn.disabled = false; } // 僅確保啟用
        }
        
        switch (data.type) {
            case 'SAVE_NEW_CUSTOMER_SUCCESS':
                displayGeneralMessage(addMessage, `客戶 ${data.displayId} (${data.customerName}) 資料已建立！`, false);
                setTimeout(async () => {
                    clearAddCustomerForm(); if (data.customerId) await loadCustomerDataIntoUI(data.customerId);
                    showUiSection(customerDataSection, true);
                }, 1500);
                resetButtonStates(createButton, "建立客戶資料");
                break;
            case 'SAVE_NEW_CUSTOMER_ERROR':
                displayGeneralMessage(addMessage, `建立錯誤: ${data.message}`, true);
                resetButtonStates(createButton, "建立客戶資料");
                break;

            case 'SAVE_CUSTOMER_CHANGES_SUCCESS':
                currentEditingCustomerData = data.updatedCustomerData;
                displayGeneralMessage(document.getElementById('edit-customer-message'), "客戶資料已更新！", false);
                setTimeout(() => toggleCustomerInfoEditMode(false), 1000);
                resetButtonStates(saveCustomerChangesButton, "儲存", cancelEditCustomerButton);
                break;
            case 'SAVE_CUSTOMER_CHANGES_ERROR':
                displayGeneralMessage(document.getElementById('edit-customer-message'), `更新失敗: ${data.message}`, true);
                resetButtonStates(saveCustomerChangesButton, "儲存", cancelEditCustomerButton);
                break;
            
            case 'ADD_TREATMENT_PURCHASE_SUCCESS':
                displayGeneralMessage(addTreatmentMessage, "療程購買及首次預約已成功新增！", false);
                if(addTreatmentFormContainer) addTreatmentFormContainer.classList.add('hidden');
                // 清空表單欄位
                if(addTreatmentCategorySelect) addTreatmentCategorySelect.value = "";
                if(addTreatmentNameSelect) populateTreatmentNames(); // 這會清空名稱並重設數量
                if(addTreatmentAmountInput) addTreatmentAmountInput.value = "";
                if(addTreatmentFirstUseDateTimeInput) setDateTimeInputDefault(addTreatmentFirstUseDateTimeInput);

                resetButtonStates(submitAddTreatmentButton, "確認購買", cancelAddTreatmentButton);
                if (currentLoadedCustomerId) {
                    loadCustomerDataIntoUI(currentLoadedCustomerId).then(() => {
                        const newPkgRow = treatmentHistoryContent.querySelector(`.treatment-row[data-treatment-id="${data.packageId}"]`);
                        if (newPkgRow) {
                             // 確保新購買的療程被選中並顯示其預約
                             if (treatmentHistoryContent.querySelector('.treatment-row.selected') !== newPkgRow) {
                                newPkgRow.click(); // 會觸發 renderTreatmentHistory 和 renderAppointmentHistory
                             } else {
                                // 如果已經是選中的（不太可能剛新增就選中，除非UI操作很快）
                                renderAppointmentHistory(data.packageId, false);
                             }
                        }
                    });
                }
                break;
            case 'ADD_TREATMENT_PURCHASE_ERROR':
                displayGeneralMessage(addTreatmentMessage, `新增失敗: ${data.message}`, true);
                resetButtonStates(submitAddTreatmentButton, "確認購買", cancelAddTreatmentButton);
                break;

            case 'ADD_INLINE_APPOINTMENT_SUCCESS':
                // 從 payload 中獲取 packageId，因為 data 可能沒有直接的 packageId
                const successPkgId = payload?.packageId || data.packageId;
                const formToRm = document.getElementById(`inline-form-${successPkgId}`);
                if (formToRm) formToRm.remove();
                
                displayGeneralMessage(addTreatmentMessage, "預約成功！", false); // 使用一個通用的提示區域
                setTimeout(() => displayGeneralMessage(addTreatmentMessage, "", false), 3000);

                if (currentLoadedCustomerId) {
                    loadCustomerDataIntoUI(currentLoadedCustomerId).then(() => {
                        const trRow = treatmentHistoryContent.querySelector(`.treatment-row[data-treatment-id="${successPkgId}"]`);
                        if (trRow) {
                            if (!trRow.classList.contains('selected')) trRow.click(); // 選中該療程
                            else renderAppointmentHistory(successPkgId, false); // 如果已選中，僅刷新預約
                        } else {
                            renderAppointmentHistory(null, true); // 如果找不到療程行，刷新所有預約
                        }
                        renderTreatmentHistory(); // 刷新療程列表（可能次數等有變動）
                    });
                }
                break;
            case 'ADD_INLINE_APPOINTMENT_ERROR':
                console.error("[customers.js] Matched ADD_INLINE_APPOINTMENT_ERROR. Payload:", data);
                
                let targetMessageElement = null; // 用於顯示錯誤訊息的目標 DOM 元素
                let submitBtnToReset = null;
                let cancelBtnToReset = null;
                const pkgIdFromError = data.payload?.packageId;

                if (pkgIdFromError) {
                    const inlineFormElement = document.getElementById(`inline-form-${pkgIdFromError}`);
                    if (inlineFormElement && inlineFormElement.classList.contains('inline-appointment-form') && !inlineFormElement.classList.contains('hidden')) {
                        // 找到了對應的、當前可見的行內預約表單
                        targetMessageElement = inlineFormElement.querySelector(".inline-appointment-message");
                        submitBtnToReset = inlineFormElement.querySelector('.submit-inline-appointment');
                        cancelBtnToReset = inlineFormElement.querySelector('.cancel-inline-appointment');

                        if (!targetMessageElement) {
                            console.warn(`[customers.js] Inline form (ID: inline-form-${pkgIdFromError}) is visible, but its .inline-appointment-message element is missing. Attempting to use a general fallback, but this might not be the correct UI location.`);
                            // 如果行內表單可見，但缺少訊息 P 標籤，這是一個 HTML 結構問題。
                            // 仍然嘗試回退，但理想情況下不應發生。
                            targetMessageElement = addTreatmentMessage; // 或設為 null 以觸發 alert
                        } else {
                            console.log("[customers.js] Found specific .inline-appointment-message element for error display within form:", inlineFormElement.id);
                        }
                    } else {
                        console.warn(`[customers.js] Could not find an active/visible inline form (ID: inline-form-${pkgIdFromError}) for error display. The form might have been removed or hidden. Using general fallback.`);
                        targetMessageElement = addTreatmentMessage; // 如果找不到活動的行內表單，則回退
                    }
                } else {
                     console.warn("[customers.js] No packageId in ADD_INLINE_APPOINTMENT_ERROR payload. Using general fallback message display (addTreatmentMessage).");
                     targetMessageElement = addTreatmentMessage; // 如果 payload 中沒有 packageId，也回退
                }
                
                // 顯示錯誤訊息
                if (targetMessageElement) {
                    // 如果回退到 addTreatmentMessage，且其容器是隱藏的，用戶可能看不到
                    if (targetMessageElement === addTreatmentMessage && addTreatmentFormContainer && addTreatmentFormContainer.classList.contains('hidden')) {
                        console.warn("[customers.js] Fallback error message area (addTreatmentMessage) is inside a hidden container. Error might not be visible to the user.");
                        // 在這種情況下，可以考慮強制顯示 addTreatmentFormContainer，或者使用 alert
                        // addTreatmentFormContainer.classList.remove('hidden'); // 可選：強制顯示包含 addTreatmentMessage 的容器
                        alert(`預約失敗 (請檢查主新增區塊的提示): ${data.message}`); // 或者直接 alert
                    }
                    displayGeneralMessage(targetMessageElement, `預約失敗: ${data.message}`, true);
                } else {
                    // 如果連 addTreatmentMessage 都沒找到（理論上不應該，除非 addTreatmentMessage 的 ID 也變了）
                    console.error("[customers.js] No message element found at all (neither specific inline nor fallback addTreatmentMessage). Alerting error.");
                    alert(`新增預約失敗: ${data.message}`); // 最終的 fallback
                }

                // 重設按鈕狀態 (如果找到了對應的按鈕)
                if (submitBtnToReset) {
                    submitBtnToReset.disabled = false;
                    submitBtnToReset.textContent = "確認預約";
                }
                if (cancelBtnToReset) {
                    cancelBtnToReset.disabled = false;
                }
                break;

            case 'REVOKE_TREATMENT_PACKAGE_SUCCESS':
                displayGeneralMessage(revokeModalMessage, "療程已成功註銷。", false);
                setTimeout(() => { if (revokeTreatmentModal) revokeTreatmentModal.classList.add('hidden'); }, 1500);
                currentTreatmentPackageToRevokeId = null;
                resetButtonStates(confirmRevokeBtn, "確認送出註銷", cancelRevokeBtn, true);
                if (currentLoadedCustomerId) loadCustomerDataIntoUI(currentLoadedCustomerId);
                break;
            case 'REVOKE_TREATMENT_PACKAGE_ERROR':
                displayGeneralMessage(revokeModalMessage, `註銷失敗: ${data.message}`, true);
                resetButtonStates(confirmRevokeBtn, "確認送出註銷", cancelRevokeBtn, true);
                break;

            case 'UPDATE_APPOINTMENT_STATUS_SUCCESS':
                const custIdReload = payload?.customerFirestoreId || data.customerFirestoreId;
                if (custIdReload) loadCustomerDataIntoUI(custIdReload);
                // 新的動態選單不需要重置按鈕，因為它在操作後會自動移除
                break;
            case 'UPDATE_APPOINTMENT_STATUS_ERROR':
                alert(`更新預約狀態失敗: ${data.message}`);
                // 新的動態選單不需要重置按鈕
                break;
            
            case 'UPDATE_TREATMENT_UNITS_SUCCESS':
                displayGeneralMessage(addTreatmentMessage, "療程數量已更新。", false); // 使用通用訊息區
                setTimeout(() => displayGeneralMessage(addTreatmentMessage, "", false), 2000);
                if (currentLoadedCustomerId) {
                     loadCustomerDataIntoUI(currentLoadedCustomerId).then(() => {
                        const pkgId = payload?.packageId;
                        if (pkgId) {
                            const trRow = treatmentHistoryContent.querySelector(`.treatment-row[data-treatment-id="${pkgId}"]`);
                             // 如果被編輯的療程仍然是選中狀態，刷新其預約列表
                             if (trRow && trRow.classList.contains('selected')) {
                                renderAppointmentHistory(pkgId, false);
                             }
                             // 編輯表單應該已經在 loadCustomerDataIntoUI 中被清除了，因為會重新 renderTreatmentHistory
                        }
                     });
                }
                break;
            case 'UPDATE_TREATMENT_UNITS_ERROR':
                 const pkgIdUnitErr = payload?.packageId;
                 let unitEditMsgEl = addTreatmentMessage; // 通用訊息區作為回退
                 const errFormUnits = document.querySelector(`.treatment-row[data-treatment-id="${pkgIdUnitErr}"] .inline-edit-treatment-units-active-form`);
                 if (errFormUnits) {
                     unitEditMsgEl = errFormUnits.querySelector('.inline-edit-units-message') || unitEditMsgEl;
                     resetButtonStates(errFormUnits.querySelector('.save-inline-edit-units'), "儲存", errFormUnits.querySelector('.cancel-inline-edit-units'), true);
                 }
                 displayGeneralMessage(unitEditMsgEl, `數量更新失敗: ${data.message}`, true);
                break;
            default: 
                console.log("[customers.js] Received unhandled message from parent:", data.type);
                break;
        }
    });
    
    // Initial UI state
    showUiSection(searchSection, true);
    if (statusUpdateMenuOld) statusUpdateMenuOld.classList.add('hidden'); // 確保舊選單隱藏
    console.log("[customers.js] initializePage() finished.");
}

// initializePage() 將由 auth-check.js 在驗證成功後呼叫