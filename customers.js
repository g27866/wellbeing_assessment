// customers.js

function initializePage() {
    console.log("[customers.js] initializePage() called - 頁面初始化開始");

    // 從父視窗獲取 Firebase 實例和輔助工具
    const db = window.parent.firebaseDb;
    if (!db) {
        console.error("[customers.js] Firestore instance (db) not found from parent window!");
        alert("系統錯誤：無法連接到資料庫，請重新整理或聯繫管理員。");
        return; // 如果沒有 db 實例，則無法繼續
    }
    const serverTimestamp = window.parent.firebase.firestore.FieldValue.serverTimestamp;
    const increment = window.parent.firebase.firestore.FieldValue.increment;
    const getCurrentEditorName = window.parent.getCurrentEditorName;


    // --- DOM Elements (與您提供的版本相同) ---
    const searchSection = document.getElementById("search-section");
    const searchNameInput = document.getElementById("search-name");
    const searchPhoneInput = document.getElementById("search-phone");
    // const searchEmailInput = document.getElementById("search-email"); // 根據新規則，Email搜尋已移除
    const searchButton = document.getElementById("search-button");
    const clearSearchButton = document.getElementById("clear-search-button");
    const searchMessage = document.getElementById("search-message");

    const addCustomerSection = document.getElementById("add-customer-section");
    const addNameInput = document.getElementById("add-name");
    const addMobileInput = document.getElementById("add-mobile");
    const addLocalTelInput = document.getElementById("add-localtel");
    const addEmailInput = document.getElementById("add-email"); // Email 欄位仍保留於表單中
    const addBirthInput = document.getElementById("add-birth");
    const createButton = document.getElementById("create-button");
    const clearAddCustomerButton = document.getElementById("clear-add-customer-button");
    const addMessage = document.getElementById("add-message");

    const customerDataSection = document.getElementById("customer-data-section");
    const customerDocIdHolder = document.getElementById("customer-id-holder"); // 將儲存 Firestore 的文檔 ID
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
    const addTreatmentFirstUseDateTimeInput = document.getElementById("add-treatment-first-use-datetime");
    const submitAddTreatmentButton = document.getElementById("submit-add-treatment");
    const cancelAddTreatmentButton = document.getElementById("cancel-add-treatment");
    const addTreatmentMessage = document.getElementById("add-treatment-message");

    const inlineAppointmentFormTemplate = document.getElementById("inline-appointment-form-template");

    const statusUpdateMenu = document.getElementById("status-update-menu");
    const statusMenuAppointmentIdInput = document.getElementById("status-menu-appointment-id");
    const statusMenuTreatmentIdInput = document.getElementById("status-menu-treatment-id"); // 這應為 packageId
    const statusMenuConfirmBtn = document.getElementById("status-menu-confirm-btn");
    const statusMenuCancelBtn = document.getElementById("status-menu-cancel-btn");

    const revokeTreatmentModal = document.getElementById("revoke-treatment-modal");
    const revokeConfirmInput = document.getElementById("revoke-confirm-input");
    const confirmRevokeBtn = document.getElementById("confirm-revoke-btn");
    const cancelRevokeBtn = document.getElementById("cancel-revoke-btn");
    const revokeModalMessage = document.getElementById("revoke-modal-message");
    let currentTreatmentPackageToRevokeId = null; // 修改變數名稱

    const LINE_ICON_URL = "https://g27866.github.io/wellbeing_assessment/line-icon.png";
    const LINE_ICON_GRAY_URL = "https://g27866.github.io/wellbeing_assessment/line-icon_gray.png";

    // 此結構用於填充下拉選單和獲取預設值，不直接寫入 Firestore，而是其內容被用於創建 Firestore 文件
    const treatmentDataStructure = [
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
        { category: "外泌體", name: "保養" , times: 1, room:"點滴室", durationMinutes: 60 }, // 預設點滴室，具體分配在JS中處理
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

    // 用於儲存從 Firestore 讀取的資料，替換 MOCK_CUSTOMER_DB
    let currentEditingCustomerData = null; // 儲存正在編輯的客戶的原始數據 (Firestore doc snapshot.data())
    let currentLoadedCustomerId = null; // 儲存當前載入客戶的 Firestore 文檔 ID
    let allCustomerTreatments = []; // 會從 customerTreatmentPackages 集合讀取
    let allCustomerAppointments = []; // 會從 appointments 子集合讀取
    let allCustomerAssessments = []; // 會從 assessmentRecords 集合讀取

    // --- Helper Functions (與您提供的版本相似，但需確保處理 Firestore Timestamp) ---
    function showUiSection(sectionToShow, keepSearchVisible = false) {
        if(addCustomerSection) addCustomerSection.classList.add("hidden");
        if(customerDataSection) customerDataSection.classList.add("hidden");
        if (revokeTreatmentModal) revokeTreatmentModal.classList.add("hidden");
        
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
        if(!inputElement) return;
        const now = new Date();
        const minutes = now.getMinutes();
        const roundedMinutes = Math.floor(minutes / 30) * 30; // 四捨五入到最近的30分鐘
        now.setMinutes(roundedMinutes);
        now.setSeconds(0);
        now.setMilliseconds(0);
        // 轉換為本地的 YYYY-MM-DDTHH:MM 格式
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
        inputElement.value = localISOTime;
    }

    function convertFirestoreTimestampToInputDate(timestamp) {
        if (!timestamp || typeof timestamp.toDate !== 'function') return '';
        try {
            return timestamp.toDate().toISOString().split('T')[0];
        } catch (e) {
            console.error("Error converting Firestore timestamp to input date string:", e, timestamp);
            return '';
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
            element.textContent = message;
            element.className = message ? (isError ? 'error-text mt-2 text-sm' : 'success-text mt-2 text-sm') : 'mt-2 text-sm';
        }
    }
    
    function handleEmailInputToLowercase(event) {
        if(event && event.target) {
            event.target.value = event.target.value.toLowerCase();
        }
    }

    // --- `displayCustomerId` 產生機制 ---
// customers.js (在 initializePage 內部或可訪問的作用域)

async function generateNewDisplayCustomerId() {
    // 獲取在 main.js 中初始化的 Firebase Functions 服務實例
    const functions = window.parent.firebaseFunctions; 
    if (!functions) {
        console.error("[customers.js] Firebase Functions instance not available from parent window.");
        throw new Error("無法初始化雲端函數服務，請確認 main.js 已正確設定。");
    }

    console.log("[customers.js] Calling Cloud Function 'generateDisplayCustomerId'...");
    try {
        // 獲取對您已部署的 Cloud Function 的引用
        const generateIdFunction = functions.httpsCallable('generateDisplayCustomerId');
        
        // 呼叫 Cloud Function (不需要傳遞 data，因為 UID 是從 context.auth 中獲取的)
        const result = await generateIdFunction(); 

        // Cloud Function 成功執行並返回結果
        if (result.data && result.data.displayCustomerId) {
            console.log("[customers.js] Successfully received displayCustomerId from Cloud Function:", result.data.displayCustomerId);
            return result.data.displayCustomerId;
        } else {
            // Cloud Function 返回的資料格式不符合預期
            console.error("[customers.js] Cloud Function did not return displayCustomerId correctly.", result.data);
            throw new Error("從雲端函數獲取客戶ID的格式不正確。");
        }
    } catch (error) {
        console.error("[customers.js] Error calling 'generateDisplayCustomerId' Cloud Function:", error);
        // 這裡可以根據 error.code 和 error.message 給使用者更具體的錯誤提示
        if (error.code === 'unauthenticated') {
            alert("錯誤：您需要登入才能執行此操作。");
        } else if (error.code === 'permission-denied') {
             alert("錯誤：您的帳號無權限執行此操作。請聯繫管理員。");
        } else if (error.code === 'not-found') {
             alert("錯誤：找不到指定的雲端函數 (generateDisplayCustomerId)。請確認函式已正確部署。");
        } else {
            alert(`產生客戶ID時發生雲端錯誤: ${error.message || '未知錯誤'}`);
        }
        throw error; // 將錯誤繼續拋出，讓調用者 (handleCreateCustomer) 知道出錯了
    }
}

    // --- 表單驗證 (與您提供的版本相似) ---
    function validateSearchInputs() {
        const name = searchNameInput ? searchNameInput.value.trim() : '';
        const phone = searchPhoneInput ? searchPhoneInput.value.trim() : '';
        // Email 搜尋已移除
        if (!name && !phone) {
            displayGeneralMessage(searchMessage, "請至少輸入姓名或電話進行查詢。", true);
            return false;
        }
        // 可以加入更細緻的長度或格式檢查
        displayGeneralMessage(searchMessage, "", false);
        return true;
    }

    function validateAddOrEditCustomerInputs(isEdit = false) {
        // ... (此函數的驗證邏輯與您之前提供的版本基本相同，確保欄位存在)
        // ... (姓名、性別、電話擇一、電話格式、Email格式等)
        const nameInput = isEdit ? document.getElementById('edit-customer-name') : addNameInput;
        const name = nameInput ? nameInput.value.trim() : '';
        const genderRadio = isEdit ? document.querySelector('input[name="edit-gender"]:checked') : document.querySelector('input[name="add-gender"]:checked');
        const gender = genderRadio ? genderRadio.value : null;
        const mobileInput = isEdit ? document.getElementById('edit-customer-mobile') : addMobileInput;
        const mobile = mobileInput ? mobileInput.value.trim() : '';
        const localTelInput = isEdit ? document.getElementById('edit-customer-localtel') : addLocalTelInput;
        const localTel = localTelInput ? localTelInput.value.trim() : '';
        const emailInput = isEdit ? document.getElementById('edit-customer-email') : addEmailInput;
        const email = emailInput ? emailInput.value.trim() : '';
        let errors = [];

        if (!name || name.length < 1) errors.push("姓名為必填。"); // 允許單字
        if (!gender) errors.push("性別為必填。");
        if (!mobile && !localTel) errors.push("行動電話或市內電話必須擇一填寫。");
        
        if (mobile && !/^(\+?\d{1,3}[-.\s]?)?(\(?\d{1,}\)?[-.\s]?)?[\d\s-]{7,15}$/.test(mobile) && !/^09\d{8}$/.test(mobile)) {
             errors.push("行動電話格式不符 ( 台灣手機請輸入09xxxxxxxx 或含國碼 )");
        } else if (mobile && mobile.startsWith("09") && mobile.length !== 10) {
            errors.push("台灣行動電話格式應為10碼");
        }
        
        if (localTel && !/^(\+?\d{1,3}[-.\s]?)?(\(?\d{1,}\)?[-.\s]?)?[\d\s-]{6,14}$/.test(localTel) && !/^0\d{1,3}[-]?\d{6,8}(#\d{1,6})?$/.test(localTel)) {
            errors.push("市內電話格式不符 ( 台灣市話請輸入含區碼，或含國碼 )");
        }
        
        if (email && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { // Email 可選，但填寫了就要符合格式
            errors.push("Email格式不符");
        }

        const messageElement = isEdit ? document.getElementById('edit-customer-message') : addMessage;
        if (errors.length > 0) {
            displayGeneralMessage(messageElement, errors.join(" "), true);
            return false;
        }
        if (messageElement) displayGeneralMessage(messageElement, "", false);
        return true;
    }


    // --- Firestore 操作函數 ---
    async function handleSearchCustomer() {
        if (!validateSearchInputs()) return;
        displayGeneralMessage(searchMessage, "資料查詢中...", false);
        const sNameVal = searchNameInput.value.trim();
        const sPhoneVal = searchPhoneInput.value.trim();
        let results = [];
        const uniqueResultIds = new Set();

        console.log(`[customers.js] Searching for Name: '${sNameVal}', Phone: '${sPhoneVal}'`);

        try {
            let phoneQueryMade = false;
            if (sPhoneVal) {
                // 1. 優先查 mobile
                const mobileQuery = db.collection("customers").where("mobile", "==", sPhoneVal);
                const mobileSnapshot = await mobileQuery.get();
                console.log(`[customers.js] Mobile search for '${sPhoneVal}' found ${mobileSnapshot.size} results.`);
                mobileSnapshot.forEach(doc => {
                    if (!uniqueResultIds.has(doc.id)) {
                        results.push({ firestoreId: doc.id, ...doc.data() });
                        uniqueResultIds.add(doc.id);
                    }
                });
                phoneQueryMade = true;

                // 2. 如果 mobile 沒找到，再查 localTel
                if (results.length === 0) {
                    const localTelQuery = db.collection("customers").where("localTel", "==", sPhoneVal);
                    const localTelSnapshot = await localTelQuery.get();
                    console.log(`[customers.js] LocalTel search for '${sPhoneVal}' found ${localTelSnapshot.size} results.`);
                    localTelSnapshot.forEach(doc => {
                        if (!uniqueResultIds.has(doc.id)) {
                            results.push({ firestoreId: doc.id, ...doc.data() });
                            uniqueResultIds.add(doc.id);
                        }
                    });
                }
            }

            if (sNameVal) {
                const nameQuery = db.collection("customers")
                                    .where("name_lowercase", ">=", sNameVal.toLowerCase())
                                    .where("name_lowercase", "<=", sNameVal.toLowerCase() + '\uf8ff');
                const nameSnapshot = await nameQuery.get();
                console.log(`[customers.js] Name search for '${sNameVal}' found ${nameSnapshot.size} results.`);
                
                if (phoneQueryMade && results.length > 0) { // 如果電話有結果，則用姓名篩選電話結果
                    const nameFilteredResults = [];
                    const nameSnapshotIds = new Set();
                    nameSnapshot.forEach(doc => nameSnapshotIds.add(doc.id));

                    results.forEach(r => {
                        if (nameSnapshotIds.has(r.firestoreId)) { // 取交集
                           if(r.name_lowercase && r.name_lowercase.includes(sNameVal.toLowerCase())){ // 再次確認包含
                                nameFilteredResults.push(r);
                           }
                        }
                    });
                    results = nameFilteredResults;
                     console.log(`[customers.js] Results after AND with name filter: ${results.length}`);
                } else if (!phoneQueryMade || results.length === 0) { // 如果沒有電話查詢，或電話無結果，則直接用姓名查詢結果
                    results = []; // 清空，因為之前的電話查詢是空的
                    uniqueResultIds.clear();
                    nameSnapshot.forEach(doc => {
                        if (!uniqueResultIds.has(doc.id)) {
                           results.push({ firestoreId: doc.id, ...doc.data() });
                           uniqueResultIds.add(doc.id);
                        }
                    });
                }
            }
            
            displayGeneralMessage(searchMessage, "", false);
            if (results.length === 1) {
                await loadCustomerDataIntoUI(results[0].firestoreId);
                showUiSection(customerDataSection, true);
            } else if (results.length > 1) {
                displayGeneralMessage(searchMessage, `找到 ${results.length} 筆符合的客戶，請調整查詢條件。 (列表顯示功能待實現)`, false);
                // TODO: 顯示 results 列表供使用者選擇
                 // 暫時清除詳細資料區
                if(addCustomerSection) addCustomerSection.classList.add("hidden");
                if(customerDataSection) customerDataSection.classList.add("hidden");
            } else {
                displayGeneralMessage(searchMessage, "查無客戶資料，您可以直接新增。", false);
                clearAddCustomerForm();
                if(addNameInput && sNameVal) addNameInput.value = sNameVal;
                if(addMobileInput && sPhoneVal) addMobileInput.value = sPhoneVal; 
                showUiSection(addCustomerSection, true);
                if(customerDataSection) customerDataSection.classList.add("hidden");
            }
        } catch (error) {
            console.error("[customers.js] 搜尋客戶錯誤:", error);
            displayGeneralMessage(searchMessage, `查詢錯誤: ${error.message}`, true);
        }
    }

    async function handleCreateCustomer() {
        if (!validateAddOrEditCustomerInputs(false)) return;
        displayGeneralMessage(addMessage, "資料建立中...", false);
        const editorName = getCurrentEditorName();

        try {
            const displayId = await generateNewDisplayCustomerId();
            if (!displayId) {
                displayGeneralMessage(addMessage, "產生客戶顯示ID失敗，請重試或聯繫管理員。", true);
                return;
            }

            const birthDateValue = addBirthInput.value;
            const newCustomerData = {
                displayCustomerId: displayId,
                name: addNameInput.value.trim(),
                name_lowercase: addNameInput.value.trim().toLowerCase(),
                gender: document.querySelector('input[name="add-gender"]:checked').value,
                mobile: addMobileInput.value.trim(),
                localTel: addLocalTelInput.value.trim(),
                email: addEmailInput.value.trim().toLowerCase(),
                birthDate: birthDateValue ? firebase.firestore.Timestamp.fromDate(new Date(birthDateValue)) : null,
                lineUid: null,
                createdAt: serverTimestamp(),
                createdBy: editorName,
                updatedAt: serverTimestamp(),
                updatedBy: editorName
            };

            const newCustomerRef = db.collection("customers").doc();
            await newCustomerRef.set(newCustomerData);
            
            displayGeneralMessage(addMessage, `客戶 ${displayId} (${newCustomerData.name}) 資料已成功建立！`, false);
            setTimeout(async () => {
                clearAddCustomerForm();
                await loadCustomerDataIntoUI(newCustomerRef.id);
                showUiSection(customerDataSection, true);
            }, 1500);

        } catch (error) {
            console.error("[customers.js] 建立客戶時發生錯誤:", error);
            displayGeneralMessage(addMessage, `建立錯誤: ${error.message}`, true);
        }
    }
    
    function clearSearchForm() {
        if(searchNameInput) searchNameInput.value = '';
        if(searchPhoneInput) searchPhoneInput.value = '';
        // if(searchEmailInput) searchEmailInput.value = ''; // Email 搜尋已移除
        displayGeneralMessage(searchMessage, '', false);
    }

    function clearAddCustomerForm() {
        if(addNameInput) addNameInput.value = '';
        const addGenderMale = document.getElementById('add-gender-male');
        if (addGenderMale) addGenderMale.checked = true; // 預設選男性或其他
        else { document.querySelectorAll('input[name="add-gender"]').forEach(r => r.checked = false); }

        if(addMobileInput) addMobileInput.value = '';
        if(addLocalTelInput) addLocalTelInput.value = '';
        if(addEmailInput) addEmailInput.value = '';
        if(addBirthInput) addBirthInput.value = '';
        displayGeneralMessage(addMessage, "", false);
    }

    async function loadCustomerDataIntoUI(docId) {
        if (!docId) {
            console.error("[customers.js] loadCustomerDataIntoUI: 無效的 docId");
            return;
        }
        currentLoadedCustomerId = docId; // 保存當前載入客戶的 Firestore ID
        console.log(`[customers.js] Loading data for customer Firestore doc ID: ${docId}`);
        if(customerDocIdHolder) customerDocIdHolder.value = docId;
        
        if(customerInfoContent) customerInfoContent.innerHTML = "<p class='text-base p-4'>載入客戶資料中...</p>";
        if(treatmentHistoryContent) treatmentHistoryContent.innerHTML = "<p class='text-base p-4'>載入療程紀錄中...</p>";
        if(appointmentHistoryContent) appointmentHistoryContent.innerHTML = "<p class='text-base p-4'>載入預約紀錄中...</p>";
        if(assessmentHistoryContent) assessmentHistoryContent.innerHTML = "<p class='text-base p-4'>載入問卷紀錄中...</p>";
        
        toggleCustomerInfoEditMode(false); 
        if(addTreatmentFormContainer) addTreatmentFormContainer.classList.add('hidden'); 

        try {
            const customerDoc = await db.collection("customers").doc(docId).get();
            if (!customerDoc.exists) {
                throw new Error(`客戶資料 (ID: ${docId}) 不存在。`);
            }
            const customerInfo = { firestoreId: customerDoc.id, ...customerDoc.data() };
            currentEditingCustomerData = JSON.parse(JSON.stringify(customerInfo)); // 保存一份原始數據用於編輯比較
            if(currentLineUidHolder) currentLineUidHolder.value = customerInfo.lineUid || ""; 
            renderCustomerInfo(customerInfo, false);

            // 載入療程套票
            const packagesSnapshot = await db.collection("customerTreatmentPackages")
                                            .where("customerId", "==", docId)
                                            .orderBy("purchaseDate", "desc")
                                            .get();
            allCustomerTreatments = [];
            packagesSnapshot.forEach(doc => {
                allCustomerTreatments.push({ id: doc.id, ...doc.data() });
            });
            renderTreatmentHistory();

            // 載入該客戶所有預約 (跨套票)
            allCustomerAppointments = [];
            for (const pkg of allCustomerTreatments) {
                const apptsSnapshot = await db.collection("customerTreatmentPackages").doc(pkg.id).collection("appointments").get();
                apptsSnapshot.forEach(apptDoc => {
                    allCustomerAppointments.push({
                        id: apptDoc.id,
                        packageId: pkg.id,
                        treatmentName: pkg.treatmentName, // 從套票中獲取療程名稱
                        ...apptDoc.data()
                    });
                });
            }
            renderAppointmentHistory(null, true); // 初始顯示該客戶所有預約

            // 載入問卷記錄
            const assessmentsSnapshot = await db.collection("assessmentRecords")
                                                 .where("customerId", "==", docId) // 假設問卷記錄中有 customerId (Firestore Doc ID)
                                                 .orderBy("submittedAt", "desc")
                                                 .get();
            allCustomerAssessments = [];
            assessmentsSnapshot.forEach(doc => {
                allCustomerAssessments.push({ id: doc.id, ...doc.data() });
            });
            renderAssessmentHistory();
            
        } catch (error) {
            console.error("[customers.js] 載入客戶完整資料失敗:", error);
            if(customerInfoContent) customerInfoContent.innerHTML = `<p class='error-text p-4'>載入客戶資料失敗: ${error.message}</p>`;
            if(treatmentHistoryContent) treatmentHistoryContent.innerHTML = "";
            if(appointmentHistoryContent) appointmentHistoryContent.innerHTML = "";
            if(assessmentHistoryContent) assessmentHistoryContent.innerHTML = "";
        }
    }

    function renderCustomerInfo(info, isEditing = false) {
        // ... (此函數的渲染邏輯與您之前提供的版本相似)
        // 注意：info.birthDate 會是 Firestore Timestamp，使用 convertFirestoreTimestampToInputDate 處理
        //       info.id 現在是 Firestore 自動產生的ID，顯示時使用 info.displayCustomerId
        if (!info) { 
            if(customerInfoContent) customerInfoContent.innerHTML = "<p class='error-text p-4'>無法載入客戶詳細資料。</p>";
            return;
        }
        const lineIconSrc = info.lineUid ? LINE_ICON_URL : LINE_ICON_GRAY_URL;
        const lineStatusText = info.lineUid ? '已綁定LINE' : '未綁定LINE';
        const customerDisplayIdText = info.displayCustomerId || 'N/A';
        const customerIdDisplayHtml = `<p class="customer-id-display text-xs text-gray-400">ID: ${customerDisplayIdText} (Ref: ${info.firestoreId})</p>`;
        const isLineInitiallyBound = !!info.lineUid; 

        if (isEditing) {
            if(customerInfoContent) customerInfoContent.innerHTML = `
                ${customerIdDisplayHtml}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-base items-baseline">
                    <div><input id="edit-customer-name" class="custom-form-input customer-info-field" value="${info.name || ''}" placeholder="客戶姓名"></div>
                    <div>
                        <div class="flex gap-x-3 capsule-radio-group">
                            <input type="radio" name="edit-gender" value="Male" id="edit-gender-male" class="custom-form-input" ${info.gender === 'Male' ? 'checked' : ''}>
                            <label for="edit-gender-male" class="capsule-radio-label">男 Male</label>
                            <input type="radio" name="edit-gender" value="Female" id="edit-gender-female" class="custom-form-input" ${info.gender === 'Female' ? 'checked' : ''}>
                            <label for="edit-gender-female" class="capsule-radio-label">女 Female</label>
                            <input type="radio" name="edit-gender" value="Other" id="edit-gender-other" class="custom-form-input" ${info.gender === 'Other' ? 'checked' : ''}>
                            <label for="edit-gender-other" class="capsule-radio-label">其他 Other</label>
                        </div>
                    </div>
                    <div><input id="edit-customer-mobile" class="custom-form-input customer-info-field" value="${info.mobile || ''}" placeholder="行動電話"></div>
                    <div><input id="edit-customer-localtel" class="custom-form-input customer-info-field" value="${info.localTel || ''}" placeholder="市內電話"></div>
                    <div><input id="edit-customer-email" class="custom-form-input customer-info-field lowercase-email" value="${info.email || ''}" placeholder="電子郵件" type="email"></div>
                    <div>
                        <label for="edit-customer-birth" class="form-label sr-only">出生日期</label>
                        <input type="date" id="edit-customer-birth" title="出生日期" class="custom-form-input customer-info-field" value="${convertFirestoreTimestampToInputDate(info.birthDate) || ''}">
                    </div>
                    <div>
                        <label class="form-label">LINE 狀態:</label>
                        <select id="edit-customer-line-status" class="custom-form-input customer-info-field" ${!isLineInitiallyBound ? 'disabled title="未綁定狀態不可於此更改"' : ''}>
                            <option value="linked" ${info.lineUid ? 'selected' : ''}>已綁定</option>
                            <option value="unlinked" ${!info.lineUid ? 'selected' : ''} ${!isLineInitiallyBound ? 'disabled' : ''}>解除綁定</option>
                        </select>
                         ${!isLineInitiallyBound ? `<span class="text-xs text-gray-400 ml-1">(未綁定LINE)</span>` : ''}
                    </div>
                </div>
                <p id="edit-customer-message" class="mt-2 text-sm"></p>`;
            const editEmailField = document.getElementById('edit-customer-email');
            if (editEmailField) {
                editEmailField.addEventListener('input', handleEmailInputToLowercase);
            }
        } else {
             if(customerInfoContent) customerInfoContent.innerHTML = `
                ${customerIdDisplayHtml}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-base items-baseline">
                    <div><span class="font-semibold inline-block min-w-[6.5em]">客戶姓名:</span> <span class="customer-info-field-ro">${info.name || 'N/A'}</span></div>
                    <div><span class="font-semibold inline-block min-w-[6.5em]">客戶性別:</span> <span class="customer-info-field-ro">${info.gender || 'N/A'}</span></div>
                    <div><span class="font-semibold inline-block min-w-[6.5em]">出生日期:</span> <span class="customer-info-field-ro">${convertFirestoreTimestampToInputDate(info.birthDate) || 'N/A'}</span></div>
                    <div><span class="font-semibold inline-block min-w-[6.5em]">行動電話:</span> <span class="customer-info-field-ro">${info.mobile || 'N/A'}</span></div>
                    <div><span class="font-semibold inline-block min-w-[6.5em]">市內電話:</span> <span class="customer-info-field-ro">${info.localTel || 'N/A'}</span></div>
                    <div></div> 
                    <div><span class="font-semibold inline-block min-w-[6.5em]">電子郵件:</span> <span class="customer-info-field-ro">${info.email || 'N/A'}</span></div>
                    <div class="flex items-baseline"> 
                      <span class="font-semibold inline-block min-w-[6.5em] shrink-0">LINE帳號:</span>
                      <span class="inline-flex items-center customer-info-field-ro">
                        ${lineStatusText} 
                        <img src="${lineIconSrc}" alt="Line Status" class="line-icon ml-1">
                      </span>
                    </div>
                </div>`;
        }
    }
    
    function toggleCustomerInfoEditMode(enableEditing) {
        // ... (此函數的邏輯與您之前提供的版本相似，確保 currentLoadedCustomerId 有值)
        const customerFirestoreId = currentLoadedCustomerId; // 使用保存的 Firestore ID
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
            // currentEditingCustomerData 應該已在 loadCustomerDataIntoUI 或上次儲存後更新
            if (!currentEditingCustomerData || currentEditingCustomerData.firestoreId !== customerFirestoreId) {
                 console.error("[customers.js] Mismatch or missing currentEditingCustomerData for edit. Re-fetch or error.");
                 displayGeneralMessage(editMsgElement || searchMessage, "編輯錯誤：客戶資料不一致。", true);
                 if(customerInfoActionsFooter) customerInfoActionsFooter.classList.add('hidden');
                 if(editCustomerButtonHeader) editCustomerButtonHeader.classList.remove('hidden');
                 return;
            }
            renderCustomerInfo(currentEditingCustomerData, true);
        } else {
            // 取消或儲存後，currentEditingCustomerData 應為最新狀態
            if (currentEditingCustomerData && currentEditingCustomerData.firestoreId === customerFirestoreId) {
                 renderCustomerInfo(currentEditingCustomerData, false); 
            } else if (customerFirestoreId) { // 如果 currentEditingCustomerData 不對，嘗試重新載入
                 console.warn("[customers.js] currentEditingCustomerData stale on cancel/save, attempting re-render from a fresh load (not implemented here, should use loadCustomerDataIntoUI).");
                 // 理想情況是 loadCustomerDataIntoUI(customerFirestoreId) 但這會觸發多次讀取。
                 // 簡單處理：如果 currentEditingCustomerData 丟失，顯示錯誤。
                 if (customerInfoContent) customerInfoContent.innerHTML = "<p class='error-text p-4'>顯示錯誤，請重新查詢客戶。</p>";
            }
            if (editMsgElement) displayGeneralMessage(editMsgElement, '', false); 
        }
    }

    async function handleSaveCustomerChanges() {
        if (!validateAddOrEditCustomerInputs(true)) return;
        const customerFirestoreId = currentLoadedCustomerId;
        if (!customerFirestoreId) {
            displayGeneralMessage(document.getElementById('edit-customer-message'), "錯誤：未指定客戶ID。", true);
            return;
        }
        const editorName = getCurrentEditorName();
        const editMsgElement = document.getElementById('edit-customer-message');
        const lineStatusSelect = document.getElementById('edit-customer-line-status');

        const birthDateValue = document.getElementById('edit-customer-birth').value;
        const updatedFields = { 
            name: document.getElementById('edit-customer-name').value.trim(),
            name_lowercase: document.getElementById('edit-customer-name').value.trim().toLowerCase(),
            gender: document.querySelector('input[name="edit-gender"]:checked')?.value,
            birthDate: birthDateValue ? firebase.firestore.Timestamp.fromDate(new Date(birthDateValue)) : null,
            mobile: document.getElementById('edit-customer-mobile').value.trim(),
            localTel: document.getElementById('edit-customer-localtel').value.trim(),
            email: document.getElementById('edit-customer-email').value.trim().toLowerCase(),
            updatedAt: serverTimestamp(),
            updatedBy: editorName
        };

        // LINE UID 處理: 只有在可編輯且選擇 "解除綁定" 時才設為 null
        // 綁定操作應由其他流程 (例如 LINE LIFF) 處理並更新 lineUid，此處不直接修改 lineUid 除非是解除
        if (lineStatusSelect && !lineStatusSelect.disabled && lineStatusSelect.value === "unlinked") {
            if (currentEditingCustomerData.lineUid !== null) { // 只有在原本有綁定時，解除綁定才算變更
                 updatedFields.lineUid = null;
            }
        }
        
        // 比較是否有實際變動 (不比較 updatedAt, updatedBy)
        let hasChanged = false;
        const fieldsToCompare = ['name', 'gender', 'birthDate', 'mobile', 'localTel', 'email', 'lineUid'];
        for (const key of fieldsToCompare) {
            let originalValue = currentEditingCustomerData[key];
            let updatedValue = updatedFields[key];

            if (key === 'birthDate') { // Timestamp 比較特殊
                const originalDateStr = originalValue ? convertFirestoreTimestampToInputDate(originalValue) : "";
                const updatedDateStr = updatedValue ? convertFirestoreTimestampToInputDate(updatedValue) : (birthDateValue || ""); // Use input value if timestamp is null
                if (originalDateStr !== updatedDateStr) {
                    hasChanged = true; break;
                }
            } else if (originalValue !== updatedValue) {
                 // 處理 null, undefined, "" 都視為相同 "空值" 的情況
                 const originalIsEmpty = originalValue === null || originalValue === undefined || originalValue === "";
                 const updatedIsEmpty = updatedValue === null || updatedValue === undefined || updatedValue === "";
                 if (!(originalIsEmpty && updatedIsEmpty)) { // 只有在不都是空值的情況下，不相等才算變更
                    hasChanged = true; break;
                 }
            }
        }


        if (!hasChanged) {
            displayGeneralMessage(editMsgElement, "資料未變動。", false);
             setTimeout(() => { 
                 toggleCustomerInfoEditMode(false);
            }, 1500);
            return;
        }

        if(saveCustomerChangesButton) {
            saveCustomerChangesButton.textContent = "儲存中...";
            saveCustomerChangesButton.disabled = true;
        }
        if(cancelEditCustomerButton) cancelEditCustomerButton.disabled = true;

        try {
            await db.collection("customers").doc(customerFirestoreId).update(updatedFields);
            
            // 更新本地 currentEditingCustomerData 以反映儲存的變更
            // 注意：serverTimestamp() 不會立即在客戶端解析，所以 updatedAt 會是特殊物件
            // 為了 UI 即時更新，可以手動模擬或重新讀取
            const tempUpdatedAt = new Date(); // 模擬客戶端時間
            currentEditingCustomerData = { 
                ...currentEditingCustomerData, 
                ...updatedFields, 
                updatedAt: { toDate: () => tempUpdatedAt } // 模擬 Timestamp 物件
            };
            // 如果 lineUid 被設為 null
            if (updatedFields.hasOwnProperty('lineUid') && updatedFields.lineUid === null) {
                currentEditingCustomerData.lineUid = null;
            }


            displayGeneralMessage(editMsgElement, "客戶資料已成功更新！", false);
            setTimeout(() => {
                toggleCustomerInfoEditMode(false); 
            }, 1000);
        } catch (error) {
            console.error("[customers.js] 更新客戶資料失敗:", error);
            displayGeneralMessage(editMsgElement, `更新失敗: ${error.message}`, true);
        } finally {
            if(saveCustomerChangesButton) {
                 saveCustomerChangesButton.textContent = "儲存"; 
                 saveCustomerChangesButton.disabled = false;
            }
            if(cancelEditCustomerButton) cancelEditCustomerButton.disabled = false;
        }
    }
    
    // --- 療程購買和預約相關函數 ---
    function populateTreatmentCategories() { /* ...與您版本相同... */ 
        if (!addTreatmentCategorySelect) return;
        const categories = [...new Set(treatmentDataStructure.map(item => item.category))];
        addTreatmentCategorySelect.innerHTML = '<option value="">請選擇類別</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            addTreatmentCategorySelect.appendChild(option);
        });
        populateTreatmentNames(); 
    }
    function populateTreatmentNames() { /* ...與您版本相同... */ 
        if (!addTreatmentCategorySelect || !addTreatmentNameSelect || !addTreatmentCountInput) return;
        const selectedCategory = addTreatmentCategorySelect.value;
        addTreatmentNameSelect.innerHTML = '<option value="">請選擇療程</option>';
        addTreatmentCountInput.value = ''; 
        if (selectedCategory) {
            treatmentDataStructure
                .filter(item => item.category === selectedCategory)
                .forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.name; 
                    option.textContent = item.name;
                    option.dataset.defaultTimes = item.times; 
                    addTreatmentNameSelect.appendChild(option);
                });
        }
         handleTreatmentNameChange();
    }
    function handleTreatmentNameChange() { /* ...與您版本相同... */ 
        if (!addTreatmentNameSelect || !addTreatmentCountInput) return;
        const selectedOption = addTreatmentNameSelect.options[addTreatmentNameSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.defaultTimes) {
            addTreatmentCountInput.value = selectedOption.dataset.defaultTimes;
        } else {
            addTreatmentCountInput.value = '1'; 
        }
    }
    
    async function handleAddTreatmentPurchase() {
        const customerFirestoreId = currentLoadedCustomerId;
        if (!customerFirestoreId) {
            displayGeneralMessage(addTreatmentMessage, "錯誤：未選擇客戶。", true);
            return;
        }
        const editorName = getCurrentEditorName();
        const customerData = currentEditingCustomerData; // 應包含 displayCustomerId 和 name

        const category = addTreatmentCategorySelect.value;
        const name = addTreatmentNameSelect.value;
        const purchasedUnits = parseInt(addTreatmentCountInput.value);
        const firstUseDateTimeStr = addTreatmentFirstUseDateTimeInput.value;

        if (!category || !name || !purchasedUnits || purchasedUnits <= 0 || !firstUseDateTimeStr) {
            displayGeneralMessage(addTreatmentMessage, "請填寫完整的療程類別、名稱、數量及首次預約日期。", true);
            return;
        }
        displayGeneralMessage(addTreatmentMessage, "處理中...", false);
        const firstUseDate = new Date(firstUseDateTimeStr);

        const treatmentDetails = treatmentDataStructure.find(t => t.name === name && t.category === category);
        if (!treatmentDetails) {
            displayGeneralMessage(addTreatmentMessage, "錯誤：找不到所選療程的詳細設定。", true);
            return;
        }
        const durationMinutes = treatmentDetails.durationMinutes || 30;
        let defaultRoom = treatmentDetails.room || "診療室";

        const newPackageRef = db.collection("customerTreatmentPackages").doc();
        const firstAppointmentRef = newPackageRef.collection("appointments").doc();

        try {
            // Firestore 交易開始
            await db.runTransaction(async (transaction) => {
                // 點滴室分配和衝突檢查邏輯 (極度簡化，真實系統中需要更複雜的實現)
                if (defaultRoom === "點滴室") {
                    console.warn("[customers.js] 點滴室動態分配及衝突檢查邏輯尚未完整實現，預設使用 '點滴室1'");
                    // 在真實情境中，這裡需要異步查詢可用點滴室 (可能需要在交易外預先檢查)
                    // const availableDripRoom = await findAvailableDripRoom(db, firstUseDate, durationMinutes /*, transaction (if reads are part of it) */);
                    // if (!availableDripRoom) throw new Error("目前所有點滴室在該時段均已預約滿，請選擇其他時間。");
                    // defaultRoom = availableDripRoom;
                    defaultRoom = "點滴室1"; // 暫時預設
                } else {
                    // 其他房間的衝突檢查 (也需要異步查詢)
                    // const isOccupied = await checkRoomOccupancy(db, defaultRoom, firstUseDate, durationMinutes);
                    // if (isOccupied) throw new Error(`${defaultRoom} 在該時段已被預約，請選擇其他時間。`);
                    console.warn(`[customers.js] ${defaultRoom} 的衝突檢查邏輯尚未完整實現。`);
                }

                // 1. 建立療程套票文件
                transaction.set(newPackageRef, {
                    customerId: customerFirestoreId, // Firestore doc ID
                    customerDisplayId: customerData.displayCustomerId || 'N/A',
                    customerName: customerData.name || 'N/A',
                    treatmentCategory: category,
                    treatmentName: name,
                    purchaseDate: serverTimestamp(),
                    purchasedUnits: purchasedUnits,
                    usedUnits: 1, // 首次預約即消耗一次
                    status: purchasedUnits === 1 ? "completed" : "active",
                    createdAt: serverTimestamp(),
                    createdBy: editorName,
                    updatedAt: serverTimestamp(),
                    updatedBy: editorName,
                    revokedInfo: null
                });

                // 2. 建立首次預約記錄
                transaction.set(firstAppointmentRef, {
                    appointmentDateTime: firebase.firestore.Timestamp.fromDate(firstUseDate),
                    durationMinutes: durationMinutes,
                    room: defaultRoom,
                    status: "已預約",
                    notes: "首次預約 (隨套票購買)",
                    createdAt: serverTimestamp(),
                    createdBy: editorName,
                    statusModifiedAt: serverTimestamp(),
                    statusModifiedBy: editorName
                });
            }); // Firestore 交易結束

            console.log("[customers.js] 療程購買及首次預約成功！ Package ID:", newPackageRef.id);
            displayGeneralMessage(addTreatmentMessage, "療程購買及首次預約已成功新增！", false);
            
            if(addTreatmentFormContainer) addTreatmentFormContainer.classList.add('hidden');
            // ... 清除表單欄位 ...
            
            await loadCustomerDataIntoUI(customerFirestoreId); // 重新載入客戶所有相關資料
            // 嘗試自動選中新購買的療程 (可選)
            const newPackageRow = treatmentHistoryContent.querySelector(`.treatment-row[data-treatment-id="${newPackageRef.id}"]`);
            if (newPackageRow) {
                newPackageRow.click(); // 觸發點擊以顯示其預約
            }


        } catch (error) {
            console.error("[customers.js] 新增療程購買及預約失敗:", error);
            displayGeneralMessage(addTreatmentMessage, `新增失敗: ${error.message}`, true);
        }
    }
    
    function renderTreatmentHistory() {
        // ... (此函數需修改為從 allCustomerTreatments 陣列渲染，並處理 Timestamp)
        // ... (篩選邏輯與之前類似)
        if (!treatmentHistoryContent || !allCustomerTreatments) return;
        const customerFirestoreId = currentLoadedCustomerId;
        if (!customerFirestoreId) {
             treatmentHistoryContent.innerHTML = "<p class='text-base py-2'>請先查詢並載入客戶資料。</p>"; return;
        }

        let treatmentsToRender = [...allCustomerTreatments]; // 使用已從 Firestore 載入的資料
        const isFilterPresent = treatmentFilterPending && treatmentFilterCompleted && treatmentFilterRevoked;
        
        if (isFilterPresent) {
            const showPending = treatmentFilterPending.checked;
            const showCompleted = treatmentFilterCompleted.checked;
            const showRevoked = treatmentFilterRevoked.checked;
            
            treatmentsToRender = treatmentsToRender.filter(t => {
                const remaining = (t.purchasedUnits || 0) - (t.usedUnits || 0);
                const isRevoked = t.status === "revoked";
                const isPending = !isRevoked && remaining > 0;
                const isCompleted = !isRevoked && remaining <= 0; // 等於0或小於0都算完成

                if (!showPending && !showCompleted && !showRevoked) return true; 
                return (showPending && isPending) || 
                       (showCompleted && isCompleted) || 
                       (showRevoked && isRevoked);
            });
        }
        
        const previouslySelectedTreatmentRow = treatmentHistoryContent.querySelector('.treatment-row.selected');
        const previouslySelectedPackageId = previouslySelectedTreatmentRow ? previouslySelectedTreatmentRow.dataset.treatmentId : null;

        treatmentHistoryContent.innerHTML = ""; 
        if (treatmentsToRender.length === 0) {
            treatmentHistoryContent.innerHTML = "<p class='text-base py-2'>沒有符合條件的購買紀錄。</p>";
            renderAppointmentHistory(null, true); // 清空或顯示所有客戶預約
            return;
        }
        // (渲染 HTML 的邏輯與 MOCK_DB 版本相似，但使用 formatFirestoreTimestampForDisplay 處理 purchaseDate 和 revokedAt)
        // 例如: formatFirestoreTimestampForDisplay(t.purchaseDate)
        // ... (渲染及事件綁定)
         let html = '';
        treatmentsToRender.forEach((pkg) => { // pkg 代表一個 treatment package
            const remaining = (pkg.purchasedUnits || 0) - (pkg.usedUnits || 0);
            const countsDisplay = `${pkg.purchasedUnits || 0} / ${pkg.usedUnits || 0} / ${remaining}`;
            const isSelectedClass = (pkg.id === previouslySelectedPackageId) ? 'selected' : '';
            let actionButtonsHtml = '';
            let revokeButtonHtml = '';

            if (pkg.status === "revoked") {
                const revokedInfo = pkg.revokedInfo ? `註銷者: ${pkg.revokedInfo.revokedBy}, 時間: ${formatFirestoreTimestampForDisplay(pkg.revokedInfo.revokedAt)}` : '註銷資訊未知';
                actionButtonsHtml = `<span class="text-red-500 font-semibold text-xs whitespace-nowrap" title="${revokedInfo}">已註銷</span>`;
            } else {
                if (isSelectedClass) { 
                    revokeButtonHtml = `<button class="action-button-secondary open-revoke-modal-btn text-xs whitespace-nowrap mr-1 border border-red-500 text-red-500 hover:bg-red-50" data-treatment-id="${pkg.id}" title="註銷此筆療程購買紀錄">&nbsp; 註銷 &nbsp;</button>`;
                }
                if (remaining > 0) {
                    actionButtonsHtml = `<button class="action-button add-inline-appointment-btn text-xs whitespace-nowrap" data-treatment-id="${pkg.id}" data-treatment-name="${pkg.treatmentName}" title="為此療程新增預約">新增預約</button>`;
                } else {
                    actionButtonsHtml = '<span class="text-gray-400 text-xs whitespace-nowrap">已用罄</span>'; 
                }
            }
            html += `
                <div class="treatment-row grid grid-cols-[auto_1fr_1fr_auto] md:grid-cols-4 gap-x-3 items-center py-2.5 border-b border-gray-100 text-sm hover:bg-teal-50 ${isSelectedClass}" data-treatment-id="${pkg.id}" data-status="${pkg.status || 'active'}">
                    <span class="truncate pr-1 col-span-1 min-w-[120px] md:min-w-0">${pkg.treatmentName} (${pkg.treatmentCategory})</span>
                    <span class="text-center text-gray-600 col-span-1">${formatFirestoreTimestampForDisplay(pkg.purchaseDate)}</span>
                    <span class="text-center text-gray-600 col-span-1">${countsDisplay}</span>
                    <span class="text-right h-full flex items-center justify-end col-span-1 space-x-1">
                        ${revokeButtonHtml}
                        ${actionButtonsHtml}
                    </span>
                </div>`;
        });
        treatmentHistoryContent.innerHTML = html;
        // 重新綁定事件 (與您 MOCK_DB 版本相同)
        attachTreatmentRowEventListeners();
        attachAddInlineAppointmentEventListeners();
        attachOpenRevokeModalEventListeners();

        if (!treatmentHistoryContent.querySelector('.treatment-row.selected')) {
            renderAppointmentHistory(null, true);
        }
    }
    
    // 將事件綁定提取為單獨函數，以便在重新渲染後調用
    function attachTreatmentRowEventListeners() {
        document.querySelectorAll('.treatment-row').forEach(row => {
            row.addEventListener('click', function(event) {
                if (event.target.closest('button')) return; // 如果點擊的是按鈕，則不處理行點擊

                const previouslySelected = treatmentHistoryContent.querySelector('.treatment-row.selected');
                const packageId = this.dataset.treatmentId;
                
                document.querySelectorAll('.inline-appointment-form:not(#inline-appointment-form-template)').forEach(form => form.remove());

                if (previouslySelected === this && !this.classList.contains('selected-by-button-action')) { 
                    this.classList.remove('selected');
                    renderAppointmentHistory(null, true); // 顯示客戶所有預約
                } else {
                    if (previouslySelected) previouslySelected.classList.remove('selected');
                    this.classList.add('selected');
                    renderAppointmentHistory(packageId, false); // 顯示此套票的預約
                }
                this.classList.remove('selected-by-button-action');
                renderTreatmentHistory(); // 重新渲染以更新註銷按鈕可見性
            });
        });
    }

    function attachAddInlineAppointmentEventListeners() {
        document.querySelectorAll('.add-inline-appointment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                const packageId = e.target.dataset.treatmentId; // treatment-id 實際上是 packageId
                const treatmentName = e.target.dataset.treatmentName;
                const targetRow = e.target.closest('.treatment-row');

                const previouslySelected = treatmentHistoryContent.querySelector('.treatment-row.selected');
                if (previouslySelected && previouslySelected !== targetRow) {
                    previouslySelected.classList.remove('selected');
                }
                if(targetRow) {
                    targetRow.classList.add('selected', 'selected-by-button-action');
                    renderAppointmentHistory(packageId, false); 
                    renderTreatmentHistory(); 
                }

                document.querySelectorAll('.inline-appointment-form:not(#inline-appointment-form-template)').forEach(form => form.remove());
                
                if (inlineAppointmentFormTemplate) {
                    const formClone = inlineAppointmentFormTemplate.cloneNode(true);
                    formClone.id = `inline-form-${packageId}`;
                    formClone.classList.remove('hidden');
                    if(formClone.querySelector('.inline-treatment-name')) formClone.querySelector('.inline-treatment-name').textContent = treatmentName;
                    if(formClone.querySelector('.inline-treatment-id-holder')) formClone.querySelector('.inline-treatment-id-holder').value = packageId; // 儲存 packageId
                    
                    const dateTimeInputForInline = formClone.querySelector('.inline-appointment-datetime');
                    setDateTimeInputDefault(dateTimeInputForInline);
                    
                    if(targetRow) targetRow.parentNode.insertBefore(formClone, targetRow.nextSibling); 
                    else if (treatmentHistoryContent) treatmentHistoryContent.appendChild(formClone);

                    formClone.querySelector('.submit-inline-appointment').addEventListener('click', () => submitInlineAppointment(formClone, packageId, treatmentName));
                    formClone.querySelector('.cancel-inline-appointment').addEventListener('click', () => {
                        formClone.remove();
                        if(targetRow) targetRow.classList.remove('selected-by-button-action');
                    });
                }
            });
        });
    }
    
    async function submitInlineAppointment(formClone, packageId, treatmentNameForDisplay) {
        const customerFirestoreId = currentLoadedCustomerId;
        const editorName = getCurrentEditorName();
        const datetimeInput = formClone.querySelector('.inline-appointment-datetime');
        const messageEl = formClone.querySelector('.inline-appointment-message');

        if (!datetimeInput || !datetimeInput.value) {
             displayGeneralMessage(messageEl, "請選擇預約時間。", true); return;
        }
        displayGeneralMessage(messageEl, "預約中...", false);
        const appointmentDateTime = new Date(datetimeInput.value);

        const packageRef = db.collection("customerTreatmentPackages").doc(packageId);
        const newAppointmentRef = packageRef.collection("appointments").doc(); // Firestore 自動產生 ID

        const treatmentDetails = treatmentDataStructure.find(t => t.name === treatmentNameForDisplay /* && t.category === ??? (需要 category 嗎?) */);
        const durationMinutes = treatmentDetails ? treatmentDetails.durationMinutes || 30 : 30;
        let room = treatmentDetails ? treatmentDetails.room || "診療室" : "診療室";

        try {
            await db.runTransaction(async (transaction) => {
                const packageDoc = await transaction.get(packageRef);
                if (!packageDoc.exists) throw new Error("療程套票不存在。");
                
                const packageData = packageDoc.data();
                if (packageData.usedUnits >= packageData.purchasedUnits) throw new Error("此療程套票已無剩餘次數。");
                if (packageData.status === 'revoked') throw new Error("此療程套票已被註銷，無法新增預約。");

                // --- 複雜的點滴室/房間衝突檢查邏輯 (極度簡化) ---
                if (room === "點滴室") {
                    console.warn("[customers.js] 點滴室動態分配及衝突檢查邏輯尚未完整實現於行內預約，預設使用 '點滴室1'");
                    room = "點滴室1";
                } else {
                    console.warn(`[customers.js] ${room} 的衝突檢查邏輯尚未完整實現於行內預約。`);
                }
                // --- 檢查邏輯結束 ---

                transaction.set(newAppointmentRef, {
                    appointmentDateTime: firebase.firestore.Timestamp.fromDate(appointmentDateTime),
                    durationMinutes: durationMinutes,
                    room: room,
                    status: "已預約",
                    notes: "行內表單新增預約",
                    createdAt: serverTimestamp(),
                    createdBy: editorName,
                    statusModifiedAt: serverTimestamp(),
                    statusModifiedBy: editorName
                });

                transaction.update(packageRef, {
                    usedUnits: increment(1), // 原子性增加
                    updatedAt: serverTimestamp(),
                    updatedBy: editorName
                    // 可選：如果 usedUnits + 1 === purchasedUnits，則更新 status 為 'completed'
                });
            });

            displayGeneralMessage(messageEl, "預約成功！", false);
            formClone.remove();
            await loadCustomerDataIntoUI(customerFirestoreId); // 重新載入以更新列表和計數
            
            // 保持選中狀態
            const currentSelectedTreatmentRow = treatmentHistoryContent.querySelector(`.treatment-row[data-treatment-id="${packageId}"]`);
            if(currentSelectedTreatmentRow) {
                 currentSelectedTreatmentRow.classList.add('selected');
                 currentSelectedTreatmentRow.classList.remove('selected-by-button-action'); // 清除按鈕操作標記
            }


        } catch (error) {
            console.error("[customers.js] 行內新增預約失敗:", error);
            displayGeneralMessage(messageEl, `預約失敗: ${error.message}`, true);
        }
    }

    function attachOpenRevokeModalEventListeners() {
         document.querySelectorAll('.open-revoke-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentTreatmentPackageToRevokeId = e.target.dataset.treatmentId; // 這是 packageId
                if (revokeConfirmInput) revokeConfirmInput.value = ''; 
                displayGeneralMessage(revokeModalMessage, '', false); 
                if (revokeTreatmentModal) revokeTreatmentModal.classList.remove('hidden');
            });
        });
    }
    
    async function handleRevokeTreatment() {
        // ... (此函數需修改為使用 currentTreatmentPackageToRevokeId，並在交易中更新套票和其下預約)
        if (!currentTreatmentPackageToRevokeId) return;
        if (!revokeConfirmInput || revokeConfirmInput.value !== "註銷") {
            displayGeneralMessage(revokeModalMessage, "輸入內容不符，紀錄未註銷。", true);
            return;
        }
        displayGeneralMessage(revokeModalMessage, "註銷處理中...", false); 
        const editorName = getCurrentEditorName();
        const customerFirestoreId = currentLoadedCustomerId;

        const packageRef = db.collection("customerTreatmentPackages").doc(currentTreatmentPackageToRevokeId);
        const appointmentsInPackageRef = packageRef.collection("appointments");

        try {
            await db.runTransaction(async (transaction) => {
                // 1. 更新套票狀態
                transaction.update(packageRef, {
                    status: "revoked",
                    // usedUnits: 0, // 根據您的需求，是否要重置已使用次數
                    revokedInfo: {
                        revokedBy: editorName,
                        revokedAt: serverTimestamp()
                    },
                    updatedAt: serverTimestamp(),
                    updatedBy: editorName
                });

                // 2. 查詢此套票下所有「已預約」的預約
                const bookedAppointmentsQuery = appointmentsInPackageRef.where("status", "==", "已預約");
                // 重要：交易中的讀取必須在寫入之前，或者使用 transaction.get()
                const bookedAppointmentsSnapshot = await transaction.get(bookedAppointmentsQuery); 

                bookedAppointmentsSnapshot.forEach(docSnapshot => {
                    transaction.update(docSnapshot.ref, {
                        status: "已取消", 
                        statusModifiedAt: serverTimestamp(),
                        statusModifiedBy: editorName,
                        notes: (docSnapshot.data().notes || "") + " (因療程套票註銷而自動取消)"
                    });
                });
            });
            
            displayGeneralMessage(revokeModalMessage, "療程已成功註銷。", false);
            if (revokeTreatmentModal) revokeTreatmentModal.classList.add('hidden');
            currentTreatmentPackageToRevokeId = null;
            await loadCustomerDataIntoUI(customerFirestoreId); // 重新載入資料

        } catch (error) {
            console.error("[customers.js] 註銷療程失敗:", error);
            displayGeneralMessage(revokeModalMessage, `註銷失敗: ${error.message}`, true);
        }
    }
    
    function renderAppointmentHistory(selectedPackageId = null, showAllForCustomer = false) {
        // ... (此函數需修改為從 allCustomerAppointments 陣列渲染，並處理 Timestamp)
        // ... (篩選邏輯與之前類似)
         if (!appointmentHistoryContent || !allCustomerAppointments) return;
        let appointmentsToDisplay = [];

        if (selectedPackageId) {
            appointmentsToDisplay = allCustomerAppointments.filter(appt => appt.packageId === selectedPackageId);
        } else if (showAllForCustomer) {
            appointmentsToDisplay = [...allCustomerAppointments];
        }
        // else (no package selected, not showing all for customer) -> show nothing or specific message

        const isApptFilterPresent = appointmentFilterBooked && appointmentFilterCompleted && appointmentFilterCancelled;
        if (isApptFilterPresent) {
            const selectedStatuses = [];
            if (appointmentFilterBooked.checked) selectedStatuses.push("已預約");
            if (appointmentFilterCompleted.checked) selectedStatuses.push("已完成");
            if (appointmentFilterCancelled.checked) selectedStatuses.push("已取消");
            // 如果沒有勾選任何篩選器，則顯示所有 (符合 packageId 或 showAllForCustomer 條件的)
            if (selectedStatuses.length > 0) {
                 appointmentsToDisplay = appointmentsToDisplay.filter(appt => selectedStatuses.includes(appt.status));
            } else if (!(appointmentFilterBooked.checked || appointmentFilterCompleted.checked || appointmentFilterCancelled.checked)) {
                // 如果所有篩選器都未勾選，可以選擇顯示全部或不顯示任何內容
                // 目前行為：如果一個都沒勾，則 selectedStatuses 為空，不會進一步過濾，等同於顯示全部 (符合 packageId / showAll)
            }
        }
        
        // 按預約時間排序 (新到舊)
        appointmentsToDisplay.sort((a,b) => (b.appointmentDateTime.seconds || 0) - (a.appointmentDateTime.seconds || 0));

        appointmentHistoryContent.innerHTML = ""; // 清空
        if (appointmentsToDisplay.length === 0) {
            if (showAllForCustomer || !selectedPackageId) { // 沒有選定特定套票，或就是要顯示全部
                 appointmentHistoryContent.innerHTML = "<p class='text-base py-2'>此客戶尚無符合條件的預約紀錄。</p>";
            } else { // 有選定特定套票，但該套票下無符合條件預約
                 appointmentHistoryContent.innerHTML = "<p class='text-base py-2'>此療程尚無符合條件的預約紀錄。</p>";
            }
            return;
        }
        // (渲染 HTML 的邏輯與 MOCK_DB 版本相似，但使用 formatFirestoreTimestampForDisplay 處理 appointmentDateTime 和 statusModifiedAt)
        // 例如: formatFirestoreTimestampForDisplay(a.appointmentDateTime)
        // ... (渲染及事件綁定)
         let html = '';
         appointmentsToDisplay.forEach(a => {
            const statusClassInfo = { "已預約": "text-green-600", "已完成": "text-blue-600", "已取消": "text-red-500", "未到": "text-orange-500" };
            const statusClass = statusClassInfo[a.status] || 'text-gray-600';
            const statusHoverTitle = a.statusModifiedBy && a.statusModifiedAt ? `修改者: ${a.statusModifiedBy}, 時間: ${formatFirestoreTimestampForDisplay(a.statusModifiedAt)}` : `狀態: ${a.status}`;
            
            html += `
                <div class="appointment-row grid grid-cols-[auto_1fr_1fr_auto] md:grid-cols-4 gap-x-3 items-center py-2.5 border-b border-gray-100 text-sm hover:bg-teal-50" data-appointment-id="${a.id}" data-package-id="${a.packageId}">
                    <span class="truncate pr-1 col-span-1 min-w-[120px] md:min-w-0">${a.treatmentName} (${a.room || '未指定'})</span>
                    <span class="text-center text-gray-600 col-span-1">${formatFirestoreTimestampForDisplay(a.appointmentDateTime)}</span>
                    <span class="${statusClass} text-center font-medium col-span-1" title="${statusHoverTitle}">${a.status}</span>
                    <span class="text-right h-full flex items-center justify-end col-span-1">
                        <button class="action-button open-status-menu-btn text-xs whitespace-nowrap" 
                                data-appointment-id="${a.id}" 
                                data-current-status="${a.status}" 
                                data-package-id="${a.packageId}" 
                                title="變更此預約狀態">變更狀態</button>
                    </span>
                </div>`;
         });
         appointmentHistoryContent.innerHTML = html;
         attachOpenStatusMenuEventListeners(); // 重新綁定狀態選單按鈕事件
    }
    
    function attachOpenStatusMenuEventListeners() {
        document.querySelectorAll('.open-status-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const appointmentId = e.target.dataset.appointmentId;
                const currentStatus = e.target.dataset.currentStatus;
                const packageId = e.target.dataset.packageId; // 從按鈕獲取 packageId
                
                if(statusMenuAppointmentIdInput) statusMenuAppointmentIdInput.value = appointmentId;
                if(statusMenuTreatmentIdInput) statusMenuTreatmentIdInput.value = packageId; // 儲存 packageId
                
                if(statusUpdateMenu) {
                    // ... (顯示狀態選單的邏輯與您 MOCK_DB 版本相同) ...
                    const radioToCheck = statusUpdateMenu.querySelector(`input[name="appointment_status_option"][value="${currentStatus}"]`);
                    if (radioToCheck) radioToCheck.checked = true;
                    else { statusUpdateMenu.querySelectorAll('input[name="appointment_status_option"]').forEach(r => r.checked = false); }
                    
                    const buttonRect = e.target.getBoundingClientRect();
                    const menuHeight = statusUpdateMenu.offsetHeight || 150; 
                    const spaceBelow = window.innerHeight - buttonRect.bottom;
                    const spaceAbove = buttonRect.top;

                    if (spaceBelow < menuHeight && spaceAbove > menuHeight + buttonRect.height) { 
                        statusUpdateMenu.style.top = `${buttonRect.top + window.scrollY - menuHeight - 5}px`;
                    } else { 
                        statusUpdateMenu.style.top = `${buttonRect.bottom + window.scrollY + 5}px`;
                    }
                    statusUpdateMenu.style.left = `${buttonRect.right + window.scrollX - statusUpdateMenu.offsetWidth}px`; 
                    statusUpdateMenu.classList.remove('hidden');
                }
            });
         });
    }

    async function handleUpdateAppointmentStatus() {
        // ... (此函數需修改為使用 packageId 和 appointmentId 更新 Firestore，並可能在交易中調整 usedUnits)
        if (!statusMenuAppointmentIdInput || !statusUpdateMenu || !statusMenuTreatmentIdInput) return;
        const appointmentId = statusMenuAppointmentIdInput.value;
        const packageId = statusMenuTreatmentIdInput.value; // 獲取 packageId
        const customerFirestoreId = currentLoadedCustomerId;
        const editorName = getCurrentEditorName();

        const selectedStatusRadio = statusUpdateMenu.querySelector('input[name="appointment_status_option"]:checked');
        if (!selectedStatusRadio) {
            console.warn("[customers.js] 請選擇一個狀態。"); return;
        }
        const newStatus = selectedStatusRadio.value;
        statusUpdateMenu.classList.add('hidden'); 

        const appointmentRef = db.collection("customerTreatmentPackages").doc(packageId)
                                 .collection("appointments").doc(appointmentId);
        const packageRef = db.collection("customerTreatmentPackages").doc(packageId);

        try {
            await db.runTransaction(async (transaction) => {
                const apptDoc = await transaction.get(appointmentRef);
                if (!apptDoc.exists) throw new Error("預約記錄不存在。");
                const oldStatus = apptDoc.data().status;

                transaction.update(appointmentRef, {
                    status: newStatus,
                    statusModifiedAt: serverTimestamp(),
                    statusModifiedBy: editorName
                });

                // 處理 usedUnits 的變化
                let usedUnitsChange = 0;
                if ((oldStatus === "已預約" || oldStatus === "未到") && newStatus === "已完成") {
                    usedUnitsChange = 0; // 假設預約時已扣點，完成時不再動點數。若預約不扣點，完成才扣，則為 +1
                } else if (oldStatus === "已完成" && (newStatus === "已取消" || newStatus === "未到")) {
                    usedUnitsChange = -1; // 從完成改為取消/未到，點數應歸還
                } else if (oldStatus === "已預約" && (newStatus === "已取消" || newStatus === "未到")) {
                    usedUnitsChange = -1; // 從已預約改為取消/未到，點數應歸還 (假設預約時就扣點)
                } else if ((oldStatus === "已取消" || oldStatus === "未到") && newStatus === "已預約") {
                     usedUnitsChange = 1; // 從取消/未到改回預約，重新扣點
                }
                 // 如果是從 取消/未到 改為 完成，則 usedUnitsChange 也是 +1 (假設預約不扣點，完成才扣)
                 // 這裡的 usedUnitsChange 邏輯需要根據您的業務規則嚴謹定義

                if (usedUnitsChange !== 0) {
                    const packageDoc = await transaction.get(packageRef);
                    if (packageDoc.exists) {
                        const currentUsedUnits = packageDoc.data().usedUnits || 0;
                        if (usedUnitsChange === -1 && currentUsedUnits <=0 ) {
                            //避免 usedUnits 變負數
                            console.warn("[customers.js] Attempted to decrement usedUnits below zero.");
                        } else {
                             transaction.update(packageRef, {
                                usedUnits: increment(usedUnitsChange),
                                updatedAt: serverTimestamp(),
                                updatedBy: editorName
                                // 可選：根據新的 usedUnits 更新 package status (active/completed)
                            });
                        }
                    }
                }
            });
            console.log("[customers.js] 預約狀態更新成功！");
            await loadCustomerDataIntoUI(customerFirestoreId); // 重新載入資料
        } catch (error) {
            console.error("[customers.js] 更新預約狀態失敗:", error);
            alert(`更新預約狀態失敗: ${error.message}`);
        }
    }

    function renderAssessmentHistory() {
        // ... (此函數需修改為從 allCustomerAssessments 陣列渲染，並處理 Timestamp)
        if (!assessmentHistoryContent || !allCustomerAssessments) return;
        const customerFirestoreId = currentLoadedCustomerId;
         if (!customerFirestoreId) {
             assessmentHistoryContent.innerHTML = "<p class='text-base py-2'>請先查詢並載入客戶資料。</p>"; return;
        }
        // 假設 allCustomerAssessments 已經在 loadCustomerDataIntoUI 中被正確填充
        // const assessmentsToRender = allCustomerAssessments.filter(asm => asm.customerId === customerFirestoreId); // 不再需要，因為 allCustomerAssessments 就是該客戶的

        if (allCustomerAssessments.length === 0) {
            assessmentHistoryContent.innerHTML = "<p class='text-base py-2'>此客戶尚無問卷紀錄。</p>";
            return;
        }
        
        // 已在 loadCustomerDataIntoUI 中排序
        // allCustomerAssessments.sort((a,b) => (b.submittedAt.seconds || 0) - (a.submittedAt.seconds || 0));

        // (渲染 HTML 的邏輯與 MOCK_DB 版本相似，但使用 formatFirestoreTimestampForDisplay 處理 submittedAt)
        // 例如: formatFirestoreTimestampForDisplay(asm.submittedAt)
        // ... (渲染及事件綁定)
        let html = `<div class="overflow-x-auto">
                        <div class="min-w-[500px]">
                            <div class="grid grid-cols-[2fr_1fr_1fr] gap-x-2 md:gap-x-3 py-2 border-b border-gray-300 font-semibold text-sm">
                                <span>問卷名稱</span>
                                <span class="text-center">填寫日期</span>
                                <span class="text-center">檔案</span>
                            </div>`;
        allCustomerAssessments.forEach(asm => {
            html += `
                <div class="assessment-row grid grid-cols-[2fr_1fr_1fr] gap-x-2 md:gap-x-3 items-center py-2.5 border-b border-gray-100 text-sm">
                    <span class="truncate pr-1">${asm.formTypeName || asm.formTypeKey || 'N/A'}</span>
                    <span class="text-center text-gray-600">${formatFirestoreTimestampForDisplay(asm.submittedAt)}</span>
                    <span class="text-center">
                        ${asm.fileLink ? `<a href="${asm.fileLink}" target="_blank" rel="noopener noreferrer" class="action-button text-xs" title="在新分頁開啟問卷檔案">查看檔案</a>` : '無檔案'}
                    </span>
                </div>`;
        });
        html += `</div></div>`;
        assessmentHistoryContent.innerHTML = html;
    }

    // --- Event Listeners Setup (大部分與您提供的版本相似) ---
    // 確保所有事件監聽器都在 DOM 元素確定存在後綁定
    if(searchButton) searchButton.addEventListener("click", handleSearchCustomer);
    if(searchNameInput) searchNameInput.addEventListener("keypress", function(event) { if (event.key === "Enter") handleSearchCustomer(); });
    if(searchPhoneInput) searchPhoneInput.addEventListener("keypress", function(event) { if (event.key === "Enter") handleSearchCustomer(); });
    // if(searchEmailInput) searchEmailInput.addEventListener("keypress", function(event) { if (event.key === "Enter") handleSearchCustomer(); }); // Email 搜尋已移除
    if(clearSearchButton) clearSearchButton.addEventListener("click", clearSearchForm);

    if(createButton) createButton.addEventListener("click", handleCreateCustomer);
    if(clearAddCustomerButton) clearAddCustomerButton.addEventListener("click", clearAddCustomerForm);

    // Email 輸入自動轉小寫 (保留於表單中)
    if(addEmailInput) addEmailInput.addEventListener('input', handleEmailInputToLowercase);
    
    if(editCustomerButtonHeader) {
        editCustomerButtonHeader.addEventListener("click", () => {
            const customerFirestoreId = currentLoadedCustomerId;
             if (!customerFirestoreId || !currentEditingCustomerData || currentEditingCustomerData.firestoreId !== customerFirestoreId ) { // 確保 currentEditingCustomerData 是當前客戶的
                 displayGeneralMessage(document.getElementById('edit-customer-message') || searchMessage, "無法載入客戶資料進行編輯，請重新查詢。", true);
                return;
            }
            toggleCustomerInfoEditMode(true);
        });
    }

    if(cancelEditCustomerButton) {
        cancelEditCustomerButton.addEventListener("click", () => {
            toggleCustomerInfoEditMode(false); 
        });
    }
    if(saveCustomerChangesButton) {
        saveCustomerChangesButton.addEventListener("click", handleSaveCustomerChanges);
    }

    if(addAssessmentButton) {
        addAssessmentButton.addEventListener("click", () => { 
            const customerFirestoreId = currentLoadedCustomerId;
            if (!customerFirestoreId) {
                displayGeneralMessage(searchMessage || addMessage, "請先查詢或建立客戶資料，才能新增問卷。", true); return;
            }
            const parentFrame = window.parent.document.getElementById('content-frame');
            const assessmentPageUrl = `assessment.html?customerID=${customerFirestoreId}`; // 傳遞 Firestore Doc ID
            const fullUrl = new URL(assessmentPageUrl, window.parent.location.href).href;

            if (parentFrame) { 
                parentFrame.src = fullUrl; 
                if (window.parent.updateActiveMenuFromChild) { 
                    window.parent.updateActiveMenuFromChild("menu-assessment");
                }
            } else { 
                window.location.href = assessmentPageUrl; 
            }
        });
    }
    if(gotoAssessmentRecordsButton) { /* ... 與您版本相同 ... */
        gotoAssessmentRecordsButton.addEventListener("click", () => {
            const assessmentSection = document.getElementById("assessment-records-section");
            if (assessmentSection) {
                assessmentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    if(showAddTreatmentBtn) { /* ... 與您版本相同，但確保 populateTreatmentCategories 被呼叫 ... */
        showAddTreatmentBtn.addEventListener("click", () => { 
            if(addTreatmentFormContainer) {
                addTreatmentFormContainer.classList.toggle('hidden');
                if (!addTreatmentFormContainer.classList.contains('hidden')) {
                    populateTreatmentCategories(); 
                    if(addTreatmentFirstUseDateTimeInput) setDateTimeInputDefault(addTreatmentFirstUseDateTimeInput);
                    displayGeneralMessage(addTreatmentMessage, "", false); 
                }
            }
        });
    }
    if(addTreatmentCategorySelect) addTreatmentCategorySelect.addEventListener('change', populateTreatmentNames);
    if(addTreatmentNameSelect) addTreatmentNameSelect.addEventListener('change', handleTreatmentNameChange); 
    if(submitAddTreatmentButton) submitAddTreatmentButton.addEventListener('click', handleAddTreatmentPurchase);
    if(cancelAddTreatmentButton) { /* ... 與您版本相同 ... */
        cancelAddTreatmentButton.addEventListener('click', () => { 
            if(addTreatmentFormContainer) addTreatmentFormContainer.classList.add('hidden');
            displayGeneralMessage(addTreatmentMessage, "", false); 
        });
    }
    
    // 療程和預約篩選器的事件監聽 (與您版本相似，確保在重新渲染時調用正確的 packageId)
    if(treatmentFilterPending) treatmentFilterPending.addEventListener('change', renderTreatmentHistory);
    if(treatmentFilterCompleted) treatmentFilterCompleted.addEventListener('change', renderTreatmentHistory);
    if(treatmentFilterRevoked) treatmentFilterRevoked.addEventListener('change', renderTreatmentHistory);
    
    const appointmentFilters = [appointmentFilterBooked, appointmentFilterCompleted, appointmentFilterCancelled];
    appointmentFilters.forEach(filter => {
        if (filter) {
            filter.addEventListener('change', () => {
                const selectedTreatmentRow = treatmentHistoryContent ? treatmentHistoryContent.querySelector('.treatment-row.selected') : null;
                const currentSelectedPackageId = selectedTreatmentRow ? selectedTreatmentRow.dataset.treatmentId : null; // dataset.treatmentId 存的是 packageId
                renderAppointmentHistory(currentSelectedPackageId, !currentSelectedPackageId);
            });
        }
    });

    if (confirmRevokeBtn) confirmRevokeBtn.addEventListener('click', handleRevokeTreatment);
    if (cancelRevokeBtn) cancelRevokeBtn.addEventListener('click', () => {
        if(revokeTreatmentModal) revokeTreatmentModal.classList.add('hidden');
        currentTreatmentPackageToRevokeId = null;
    });
    
    if(statusMenuConfirmBtn) statusMenuConfirmBtn.addEventListener("click", handleUpdateAppointmentStatus);
    if(statusMenuCancelBtn) statusMenuCancelBtn.addEventListener("click", () => {
        if(statusUpdateMenu) statusUpdateMenu.classList.add("hidden");
    });
    
    // 點擊選單外部時隱藏選單 (與您版本相同)
    document.addEventListener('click', function(event) { 
        if (statusUpdateMenu && !statusUpdateMenu.classList.contains('hidden')) {
            const isClickInsideMenu = statusUpdateMenu.contains(event.target);
            const isClickOnOpenButton = event.target.classList.contains('open-status-menu-btn') || (event.target.closest && event.target.closest('.open-status-menu-btn'));
            if (!isClickInsideMenu && !isClickOnOpenButton) {
                statusUpdateMenu.classList.add('hidden');
            }
        }
    });
    
    // Initial UI state
    showUiSection(searchSection, true); 
    console.log("[customers.js] initializePage() finished.");
}

// initializePage() 將由 auth-check.js 在驗證成功後呼叫