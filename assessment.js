// assessment.js

function initializePage() {
    console.log("[assessment.js] Initializing page (iframe mode)...");

    const tabLinks = document.querySelectorAll(".tab-link");
    const tabContents = document.querySelectorAll(".tab-content");
    const clinicForm = document.getElementById("clinicForm");
    const basicInfoSection = document.getElementById("basicInfoSection");
    const assessmentCustomerIdSpan = document.getElementById("assessment-customer-id");
    const tabContainer = document.getElementById("tabContainer");
    const editAssessmentButton = document.getElementById("edit-assessment-button");
    const submitAssessmentButton = document.getElementById("submit-assessment-button");
    const successToast = document.getElementById("assessment-success-toast"); // 新增：獲取懸浮提示框

    const urlParams = new URLSearchParams(window.location.search);
    const customerFirestoreIdFromUrl = urlParams.get('customerID');
    const displayIDFromUrl = urlParams.get('displayID');
    const customerNameFromUrl = urlParams.get('name'); // 已 URL 編碼
    let formTypeFromUrl = urlParams.get('type');
    const recordIdFromUrl = urlParams.get('recordId');
    const modeFromUrl = urlParams.get('mode');

    let isStrictViewMode = false;
    let currentLoadedRecordData = null;

    function setFormReadOnly(isReadOnly) {
        if (!clinicForm) return;
        const inputs = clinicForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                input.disabled = isReadOnly;
            } else {
                input.readOnly = isReadOnly;
                if (input.tagName.toLowerCase() === 'select') {
                    input.disabled = isReadOnly;
                }
            }
        });
        if (submitAssessmentButton) submitAssessmentButton.classList.toggle('hidden', isReadOnly);
        if (editAssessmentButton) editAssessmentButton.classList.toggle('hidden', !isReadOnly || !recordIdFromUrl);
    }

    function populateForm(formDataObject) {
        if (!formDataObject || !clinicForm) {
            console.warn("[assessment.js] populateForm: formDataObject is null or clinicForm not found.");
            return;
        }
        clinicForm.reset(); 
        for (const key in formDataObject) {
            if (Object.hasOwnProperty.call(formDataObject, key)) {
                const value = formDataObject[key];
                const elements = clinicForm.elements[key]; 
                if (elements) {
                    if (elements.type === 'radio') { 
                         Array.from(elements).forEach(radio => {
                            if (radio.value === value) radio.checked = true;
                        });
                    } else if (elements.type === 'checkbox' && !elements.length) { 
                        elements.checked = (elements.value === value || value === true || String(value).toLowerCase() === 'on');
                    } else if (elements.length && elements[0] && elements[0].type === 'checkbox') { 
                        const valuesArray = Array.isArray(value) ? value : [value];
                        Array.from(elements).forEach(cb => {
                            cb.checked = valuesArray.includes(cb.value);
                        });
                    } else if (elements.type === 'date') {
                        if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                            elements.value = value;
                        } else if (value && value.seconds && typeof value.toDate === 'function') { 
                            const d = value.toDate();
                            const pad = (n) => n.toString().padStart(2, "0");
                            elements.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                        } else { elements.value = ''; }
                    } else { 
                        elements.value = value;
                    }
                }
            }
        }
    }

    if (displayIDFromUrl) {
        if (assessmentCustomerIdSpan) {
            assessmentCustomerIdSpan.textContent = `客戶ID: ${displayIDFromUrl}${customerNameFromUrl ? ' ' + decodeURIComponent(customerNameFromUrl) : ''}`;
        }
        if (basicInfoSection) basicInfoSection.classList.add("hidden");
    } else {
        if (assessmentCustomerIdSpan) assessmentCustomerIdSpan.textContent = "(新問卷)";
        if (basicInfoSection) basicInfoSection.classList.add("hidden"); 
        console.warn("[assessment.js] displayIDFromUrl is missing. Customer context might be incomplete.");
    }

    if (modeFromUrl === 'view' && recordIdFromUrl) {
        console.log(`[assessment.js] Mode: View existing record (ID: ${recordIdFromUrl})`);
        isStrictViewMode = true;
        setFormReadOnly(true);
        if (tabContainer) tabContainer.classList.add("hidden");
        console.log(`[assessment.js] Requesting record ${recordIdFromUrl} from parent (iframe context)...`);
        if (window.parent && window.parent !== window) { 
            window.parent.postMessage({ type: 'GET_ASSESSMENT_RECORD', payload: { recordId: recordIdFromUrl }}, window.parent.location.origin);
        } else {
            console.error("[assessment.js] Not in an iframe or parent unavailable for GET_ASSESSMENT_RECORD.");
            alert("無法與主系統通訊以載入問卷資料。");
        }
    } else if (formTypeFromUrl) {
        console.log(`[assessment.js] Mode: New assessment of specific type (Type: ${formTypeFromUrl})`);
        if (tabContainer) tabContainer.classList.add("hidden");
        tabContents.forEach(content => content.classList.add("hidden"));
        const targetContent = document.getElementById(formTypeFromUrl);
        if (targetContent) {
            targetContent.classList.remove("hidden");
        } else {
            console.warn(`[assessment.js] Invalid formType '${formTypeFromUrl}' from URL. Showing default tab.`);
            if (tabLinks.length > 0 && tabLinks[0]) {
                 tabLinks[0].classList.add('active');
                 const defaultContent = document.getElementById(tabLinks[0].dataset.tab);
                 if (defaultContent) defaultContent.classList.remove('hidden');
            } else if (tabContents.length > 0) tabContents[0].classList.remove('hidden');
        }
        if (editAssessmentButton) editAssessmentButton.classList.add('hidden');
        if (submitAssessmentButton) submitAssessmentButton.classList.remove('hidden');
    } else {
        console.log("[assessment.js] Mode: New assessment, user selects tab.");
        if (tabContainer) tabContainer.classList.remove("hidden"); 
        if (tabLinks.length > 0) {
            tabLinks.forEach(link => {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    if (isStrictViewMode) return; 
                    tabContents.forEach(c => c.classList.add("hidden"));
                    tabLinks.forEach(l => l.classList.remove("active"));
                    document.getElementById(link.dataset.tab)?.classList.remove("hidden");
                    link.classList.add("active");
                });
            });
            if (tabLinks[0]) tabLinks[0].click();
        }
        if (editAssessmentButton) editAssessmentButton.classList.add('hidden');
        if (submitAssessmentButton) submitAssessmentButton.classList.remove('hidden');
    }

    if (editAssessmentButton) {
        editAssessmentButton.addEventListener("click", () => {
            isStrictViewMode = false;
            setFormReadOnly(false);
        });
    }

    if (clinicForm) {
        clinicForm.addEventListener("submit", (event) => {
            event.preventDefault();
            console.log("[assessment.js] Form submitted by user.");
            const formDataNative = new FormData(clinicForm);
            const dataForParent = { formFields: {} };

            let activeFormType = '';
            if (formTypeFromUrl && ((modeFromUrl === 'view' && currentLoadedRecordData) || (tabContainer && tabContainer.classList.contains('hidden')))) {
                activeFormType = (modeFromUrl === 'view' && currentLoadedRecordData?.formTypeKey) ? currentLoadedRecordData.formTypeKey : formTypeFromUrl;
            } else {
                activeFormType = document.querySelector(".tab-link.active")?.dataset.tab || tabContents[0]?.id || 'unknown_tab';
            }
            dataForParent.formType = activeFormType;
            console.log("[assessment.js] Determined activeFormType for submission:", activeFormType);

            if (customerFirestoreIdFromUrl) dataForParent.customerFirestoreID = customerFirestoreIdFromUrl;
            if (displayIDFromUrl) dataForParent.customerDisplayID = displayIDFromUrl;
            if (customerNameFromUrl) dataForParent.customerName = decodeURIComponent(customerNameFromUrl); 

            if (!dataForParent.customerDisplayID) {
                console.error("[assessment.js] CRITICAL: customerDisplayID is missing.");
                alert("錯誤：缺少客戶關鍵識別資訊，無法提交問卷。");
                if (submitAssessmentButton) { /* ... (重設按鈕) ... */ }
                return;
            }

            dataForParent.formFields = {};
            for (const [key, value] of formDataNative.entries()) {
                const element = clinicForm.elements[key];
                if (basicInfoSection && basicInfoSection.contains(element)) continue; 

                const allValuesForKey = formDataNative.getAll(key);
                if (allValuesForKey.length > 1) { 
                    dataForParent.formFields[key] = allValuesForKey;
                } else { 
                    if (element && element.type === 'checkbox') {
                        dataForParent.formFields[key] = element.checked ? (element.value !== 'on' ? element.value : true) : false;
                    } else if (element && element.type === 'radio') {
                        if (element.checked) dataForParent.formFields[key] = value;
                    } else {
                        dataForParent.formFields[key] = value;
                    }
                }
            }
            clinicForm.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                if (basicInfoSection && basicInfoSection.contains(cb)) return;
                const name = cb.name;
                if (name && !Object.prototype.hasOwnProperty.call(dataForParent.formFields, name)) {
                    const group = clinicForm.elements[name];
                    if (group && typeof group.length === 'number' && group[0] && group[0].type === 'checkbox') { 
                        dataForParent.formFields[name] = []; 
                    } else if (group && group.type === 'checkbox') { 
                        dataForParent.formFields[name] = false;
                    }
                }
            });

            console.log("[assessment.js] Final data for SUBMIT_ASSESSMENT:", JSON.parse(JSON.stringify(dataForParent)));
            if (submitAssessmentButton) { /* ... (按鈕狀態設定) ... */ }

            if (window.parent && window.parent !== window) {
                try {
                    window.parent.postMessage({ type: 'SUBMIT_ASSESSMENT', payload: dataForParent }, window.parent.location.origin);
                } catch (e) { console.error("[assessment.js] Error posting to parent:", e); alert("與主系統通訊失敗。"); /* ... (重設按鈕) ... */ }
            } else { console.error("[assessment.js] Not in iframe or parent unavailable."); alert("無法與主系統通訊。"); /* ... (重設按鈕) ... */ }
        });
    }

    window.addEventListener('message', (event) => {
        if (window.parent && event.source === window.parent && (event.origin === window.parent.location.origin || (window.location.protocol === 'file:' && event.origin === 'null'))) {
            console.log("[assessment.js] Message received from parent (iframe context):", JSON.parse(JSON.stringify(event.data)));
            console.log("[assessment.js] 收到父層訊息的 TYPE 是:", event.data.type);

            const btnTextSpan = submitAssessmentButton?.querySelector('span');
            const originalButtonText = submitAssessmentButton?.dataset.originalText || (btnTextSpan ? btnTextSpan.textContent : "送出表單");

            switch (event.data.type) {
                case 'SUBMIT_ASSESSMENT_SUCCESS':
                    // 移除 alert
                    // alert("問卷已成功送出！"); 
                    
                    // 顯示懸浮提示
                    if (successToast) {
                        // successToast.style.display = 'block'; // 直接顯示
                        successToast.classList.add('show'); // 使用 class 控制以觸發 transition
                    }

                    if (submitAssessmentButton) {
                        submitAssessmentButton.disabled = false; 
                        if(btnTextSpan) btnTextSpan.textContent = originalButtonText; 
                        else submitAssessmentButton.textContent = originalButtonText;
                        // 考慮成功後隱藏提交按鈕或禁用，防止重複提交
                        submitAssessmentButton.style.display = 'none';
                    }
                    if (clinicForm) {
                        // clinicForm.reset(); // 成功後不清空表單，讓使用者確認已填寫內容
                        setFormReadOnly(true); // 將表單設為唯讀
                    }
                    if (recordIdFromUrl && !isStrictViewMode) {
                        console.log("[assessment.js] New record created post-edit.");
                    }
                    // 考慮在顯示懸浮提示後，如果是在父層iframe中，可以通知父層關閉此iframe
                    // if (window.parent && window.parent !== window) {
                    //     // window.parent.postMessage({ type: 'CLOSE_ASSESSMENT_IFRAME' }, window.parent.location.origin);
                    // }
                    break;
                case 'SUBMIT_ASSESSMENT_ERROR':
                    alert(`問卷提交失敗: ${event.data.message}`);
                    if (submitAssessmentButton) {
                        submitAssessmentButton.disabled = false; 
                        if(btnTextSpan)btnTextSpan.textContent=originalButtonText; 
                        else submitAssessmentButton.textContent=originalButtonText;
                    }
                    break;
                case 'GET_ASSESSMENT_RECORD_SUCCESS':
                    console.log("[assessment.js] Received record for view:", event.data.payload);
                    currentLoadedRecordData = event.data.payload;
                    formTypeFromUrl = currentLoadedRecordData.formTypeKey || urlParams.get('type'); 
                    if (formTypeFromUrl) {
                        if (tabContainer) tabContainer.classList.add("hidden");
                        tabContents.forEach(c => c.classList.add("hidden"));
                        const targetContent = document.getElementById(formTypeFromUrl);
                        if (targetContent) targetContent.classList.remove("hidden");
                        else {
                            if (tabContents.length > 0) { tabContents[0].classList.remove("hidden"); formTypeFromUrl = tabContents[0].id; }
                        }
                    }
                    populateForm(currentLoadedRecordData.formData);
                    setFormReadOnly(true);
                    isStrictViewMode = true;
                    break;
                case 'GET_ASSESSMENT_RECORD_ERROR':
                    alert(`載入問卷資料失敗: ${event.data.message}`);
                    break;
                default:
                    console.warn("[assessment.js] Received unhandled message from parent:", event.data.type, "Full data:", event.data);
                    break;
            }
        } else {
             if (window.parent && event.source !== window.parent) {
                 // console.warn("[assessment.js] Ignored message: Source is not window.parent.");
             }
             if (window.parent && event.origin !== window.parent.location.origin && event.origin !== 'null') {
                 // console.warn("[assessment.js] Ignored message: Origin mismatch. Event origin:", event.origin, "Expected parent origin:", window.parent.location.origin);
             }
        }
    });

} 

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}