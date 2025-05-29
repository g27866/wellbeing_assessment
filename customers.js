document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const searchNameInput = document.getElementById("search-name");
    const searchPhoneInput = document.getElementById("search-phone");
    const searchEmailInput = document.getElementById("search-email");
    const searchButton = document.getElementById("search-button");
    const searchMessage = document.getElementById("search-message");

    const addCustomerSection = document.getElementById("add-customer-section");
    const addNameInput = document.getElementById("add-name");
    const addMobileInput = document.getElementById("add-mobile");
    const addLocalTelInput = document.getElementById("add-localtel");
    const addEmailInput = document.getElementById("add-email");
    const addBirthInput = document.getElementById("add-birth");
    const createButton = document.getElementById("create-button");
    const addMessage = document.getElementById("add-message");

    const customerDataSection = document.getElementById("customer-data-section");
    const customerIdHolder = document.getElementById("customer-id-holder");
    const customerInfoContent = document.getElementById("customer-info-content");
    const treatmentHistoryContent = document.getElementById("treatment-history-content");
    const appointmentHistoryContent = document.getElementById("appointment-history-content");

    const addTreatmentForm = document.getElementById("add-treatment-form");
    const addTreatmentNameInput = document.getElementById("add-treatment-name");
    const addTreatmentCountInput = document.getElementById("add-treatment-count");
    const addTreatmentDateInput = document.getElementById("add-treatment-date");
    const submitAddTreatmentButton = document.getElementById("submit-add-treatment");
    const cancelAddTreatmentButton = document.getElementById("cancel-add-treatment");

    const addAppointmentForm = document.getElementById("add-appointment-form");
    const appointmentTreatmentIdHolder = document.getElementById("appointment-treatment-id");
    const appointmentTreatmentNameHolder = document.getElementById("appointment-treatment-name");
    const addAppointmentDateTimeInput = document.getElementById("add-appointment-datetime");
    const submitAddAppointmentButton = document.getElementById("submit-add-appointment");
    const cancelAddAppointmentButton = document.getElementById("cancel-add-appointment");

    // --- API URLs (替換成您的 Firebase Function URLs) ---
    const SEARCH_CUSTOMER_API = "YOUR_SEARCH_CUSTOMER_FUNCTION_URL";
    const CREATE_CUSTOMER_API = "YOUR_CREATE_CUSTOMER_FUNCTION_URL";
    const GET_CUSTOMER_DETAILS_API = "YOUR_GET_CUSTOMER_DETAILS_FUNCTION_URL";
    const ADD_TREATMENT_API = "YOUR_ADD_TREATMENT_FUNCTION_URL";
    const ADD_APPOINTMENT_API = "YOUR_ADD_APPOINTMENT_FUNCTION_URL";
    const UPDATE_APPOINTMENT_STATUS_API = "YOUR_UPDATE_APPOINTMENT_STATUS_FUNCTION_URL";

    const LINE_ICON_URL = "https://g27866.github.io/wellbeing_assessment/line-icon.png";
    const LINE_ICON_GRAY_URL = "https://g27866.github.io/wellbeing_assessment/line-icon_gray.png";

    // --- Utility Functions ---
    function showSection(section) {
        addCustomerSection.classList.add("hidden");
        customerDataSection.classList.add("hidden");
        section.classList.remove("hidden");
    }

    function hideAllSections() {
         addCustomerSection.classList.add("hidden");
         customerDataSection.classList.add("hidden");
    }

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        // Firestore timestamp is { seconds: ..., nanoseconds: ... }
        const date = new Date(timestamp._seconds * 1000);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

     function formatDateTime(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp._seconds * 1000);
        return date.toLocaleString('sv-SE', { // Using sv-SE locale for YYYY-MM-DD HH:mm
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(' ', ' ');
    }


    // --- Core Functions ---

    async function searchCustomer() {
        const name = searchNameInput.value.trim();
        const phone = searchPhoneInput.value.trim();
        const email = searchEmailInput.value.trim();

        if (!name && !phone && !email) {
            searchMessage.textContent = "請至少輸入一個查詢條件。";
            return;
        }
        searchMessage.textContent = "查詢中...";

        try {
            // !!! Placeholder: Replace with actual API call !!!
            console.log("Searching with:", { name, phone, email });
            // const response = await fetch(SEARCH_CUSTOMER_API, { ... });
            // const results = await response.json();
            const results = []; // MOCK: Assume no results for now
            // const results = [{ id: "customer123", name: "王大明", ... }]; // MOCK: Assume found one

            if (results.length === 1) {
                searchMessage.textContent = "";
                await loadCustomerData(results[0].id);
                showSection(customerDataSection);
            } else if (results.length > 1) {
                searchMessage.textContent = "找到多筆資料，請提供更精確的查詢條件。";
                 hideAllSections();
            } else {
                searchMessage.textContent = "找不到客戶資料，您可以新增客戶。";
                showSection(addCustomerSection);
            }
        } catch (error) {
            searchMessage.textContent = "查詢時發生錯誤，請稍後再試。";
            console.error("Search Error:", error);
        }
    }

    async function createCustomer() {
        const name = addNameInput.value.trim();
        const mobile = addMobileInput.value.trim();
        const localTel = addLocalTelInput.value.trim();
        const email = addEmailInput.value.trim();
        const birth = addBirthInput.value.trim(); // YYYY-MM-DD

        if (!name || !mobile) {
            addMessage.textContent = "姓名和行動電話為必填欄位。";
            return;
        }
         addMessage.textContent = "建立中...";

        try {
            // !!! Placeholder: Replace with actual API call !!!
             console.log("Creating:", { name, mobile, localTel, email, birth });
            // const response = await fetch(CREATE_CUSTOMER_API, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ name, mobile, localTel, email, birth })
            // });
            // const newCustomer = await response.json();
            const newCustomer = { id: "newCust456" }; // MOCK

             if (newCustomer.id) {
                addMessage.textContent = "客戶建立成功！";
                clearAddForm();
                await loadCustomerData(newCustomer.id);
                showSection(customerDataSection);
             } else {
                 addMessage.textContent = "建立失敗，請稍後再試。";
             }
        } catch (error) {
            addMessage.textContent = "建立時發生錯誤。";
            console.error("Create Error:", error);
        }
    }

     function clearAddForm() {
        addNameInput.value = '';
        addMobileInput.value = '';
        addLocalTelInput.value = '';
        addEmailInput.value = '';
        addBirthInput.value = '';
    }


    async function loadCustomerData(customerId) {
        customerIdHolder.value = customerId;
        customerInfoContent.innerHTML = "載入中...";
        treatmentHistoryContent.innerHTML = "載入中...";
        appointmentHistoryContent.innerHTML = "載入中...";

        try {
             // !!! Placeholder: Replace with actual API call !!!
            // const response = await fetch(`${GET_CUSTOMER_DETAILS_API}?id=${customerId}`);
            // const data = await response.json();
            const data = MOCK_CUSTOMER_DETAILS; // MOCK

            // 顯示客戶資料
            displayCustomerInfo(data.info);
            // 顯示購買紀錄
            displayTreatmentHistory(data.treatments);
            // 顯示預約紀錄
            displayAppointmentHistory(data.appointments);

        } catch (error) {
            customerInfoContent.innerHTML = "<p class='text-red-500'>載入客戶資料失敗。</p>";
            console.error("Load Data Error:", error);
        }
    }

    function displayCustomerInfo(info) {
        const lineIcon = info.lineUid ? LINE_ICON_URL : LINE_ICON_GRAY_URL;
        customerInfoContent.innerHTML = `
            <div class="data-row"><span>姓名:</span> <span>${info.name || 'N/A'}</span></div>
            <div class="data-row"><span>行動電話:</span> <span>${info.mobile || 'N/A'}</span></div>
            <div class="data-row"><span>市內電話:</span> <span>${info.localTel || 'N/A'}</span></div>
            <div class="data-row"><span>Email:</span> <span>${info.email || 'N/A'}</span></div>
            <div class="data-row"><span>生日:</span> <span>${formatDate(info.birth)}</span></div>
            <div class="data-row">
                <span>LINE:</span>
                <span>${info.lineUid ? '已綁定' : '未綁定'} <img src="${lineIcon}" alt="Line Status" class="line-icon"></span>
            </div>
            <div class="mt-4">
                <button id="show-add-treatment-btn" class="action-button">新增購買療程</button>
            </div>
        `;
        document.getElementById("show-add-treatment-btn").addEventListener('click', () => {
             addTreatmentForm.style.display = 'block';
             addTreatmentDateInput.valueAsDate = new Date(); // Set default date
        });
    }

    function displayTreatmentHistory(treatments) {
        if (!treatments || treatments.length === 0) {
            treatmentHistoryContent.innerHTML = "<p>尚未有購買紀錄。</p>";
            return;
        }
        let html = '';
        treatments.forEach(t => {
            const remaining = t.purchases - t.uses;
            html += `
                <div class="data-row">
                    <span>${t.name}</span>
                    <span>${formatDate(t.purchaseDate)}</span>
                    <span>${t.purchases} / ${t.uses} / ${remaining}</span>
                    <span>
                        ${remaining > 0 ? `<button class="action-button add-appointment-btn" data-id="${t.id}" data-name="${t.name}">新增預約</button>` : ''}
                    </span>
                </div>`;
        });
        treatmentHistoryContent.innerHTML = html;

        // Add event listeners for new buttons
        document.querySelectorAll('.add-appointment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                appointmentTreatmentIdHolder.value = e.target.dataset.id;
                appointmentTreatmentNameHolder.value = e.target.dataset.name;
                addAppointmentForm.style.display = 'block';
            });
        });
    }

    function displayAppointmentHistory(appointments) {
         if (!appointments || appointments.length === 0) {
            appointmentHistoryContent.innerHTML = "<p>尚未有預約紀錄。</p>";
            return;
        }
         let html = '';
         appointments.forEach(a => {
            const statusClass = a.status === '已預約' ? 'text-green-600' : 'text-red-600';
            const buttonText = a.status === '已預約' ? '取消預約' : '重新預約';
            html += `
                <div class="data-row">
                    <span>${a.name}</span>
                    <span>${formatDateTime(a.datetime)}</span>
                    <span class="${statusClass}">${a.status}</span>
                    <span>
                        <button class="action-button update-status-btn" data-appt-id="${a.id}" data-treat-id="${a.treatmentId}">${buttonText}</button>
                    </span>
                </div>`;
         });
         appointmentHistoryContent.innerHTML = html;

        // Add event listeners for new buttons
         document.querySelectorAll('.update-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                 updateAppointmentStatus(e.target.dataset.treatId, e.target.dataset.apptId);
            });
         });
    }

    async function addTreatment() {
         const customerId = customerIdHolder.value;
         const name = addTreatmentNameInput.value.trim();
         const count = parseInt(addTreatmentCountInput.value);
         const date = addTreatmentDateInput.value;

         if (!name || !count || !date || count <= 0) {
             alert("請填寫完整的療程資訊。");
             return;
         }

        try {
            // !!! Placeholder: Replace with actual API call !!!
             console.log("Adding Treatment:", { customerId, name, count, date });
            // await fetch(ADD_TREATMENT_API, { ... });
            alert("新增成功！");
            addTreatmentForm.style.display = 'none';
            addTreatmentNameInput.value = '';
            addTreatmentCountInput.value = '';
            await loadCustomerData(customerId); // Refresh data
        } catch (error) {
             alert("新增失敗，請稍後再試。");
             console.error("Add Treatment Error:", error);
        }
    }

     async function addAppointment() {
         const customerId = customerIdHolder.value;
         const treatmentId = appointmentTreatmentIdHolder.value;
         const treatmentName = appointmentTreatmentNameHolder.value;
         const datetime = addAppointmentDateTimeInput.value;

         if (!datetime) {
            alert("請選擇預約時間。");
            return;
         }

         try {
            // !!! Placeholder: Replace with actual API call !!!
             console.log("Adding Appointment:", { customerId, treatmentId, treatmentName, datetime });
            // await fetch(ADD_APPOINTMENT_API, { ... });
            alert("預約成功！");
            addAppointmentForm.style.display = 'none';
            addAppointmentDateTimeInput.value = '';
            await loadCustomerData(customerId); // Refresh data
         } catch (error) {
             alert("預約失敗，請稍後再試。");
             console.error("Add Appointment Error:", error);
         }
     }

     async function updateAppointmentStatus(treatmentId, appointmentId) {
         const customerId = customerIdHolder.value;
          try {
            // !!! Placeholder: Replace with actual API call !!!
             console.log("Updating Status:", { customerId, treatmentId, appointmentId });
            // await fetch(UPDATE_APPOINTMENT_STATUS_API, { ... });
            alert("狀態更新成功！");
            await loadCustomerData(customerId); // Refresh data
         } catch (error) {
             alert("更新失敗，請稍後再試。");
             console.error("Update Status Error:", error);
         }
     }

    // --- MOCK Data (For Demo Only) ---
    const MOCK_CUSTOMER_DETAILS = {
        info: { id: "customer123", name: "王大明", mobile: "0912345678", localTel: "0212345678", email: "david@example.com", birth: { _seconds: 484617600 }, lineUid: "U12345" },
        treatments: [
            { id: "treat001", name: "受傷震波治療", purchaseDate: { _seconds: 1716940800 }, purchases: 10, uses: 3 },
            { id: "treat002", name: "美白淡斑", purchaseDate: { _seconds: 1714435200 }, purchases: 5, uses: 5 }
        ],
        appointments: [
            { id: "appt01", treatmentId: "treat001", name: "受傷震波治療", datetime: { _seconds: 1717056000 }, status: "已預約" },
            { id: "appt02", treatmentId: "treat001", name: "受傷震波治療", datetime: { _seconds: 1716451200 }, status: "已完成" } // Assuming you might have '已完成'
        ]
    };


    // --- Event Listeners ---
    searchButton.addEventListener("click", searchCustomer);
    createButton.addEventListener("click", createCustomer);
    submitAddTreatmentButton.addEventListener('click', addTreatment);
    cancelAddTreatmentButton.addEventListener('click', () => { addTreatmentForm.style.display = 'none'; });
    submitAddAppointmentButton.addEventListener('click', addAppointment);
    cancelAddAppointmentButton.addEventListener('click', () => { addAppointmentForm.style.display = 'none'; });

});