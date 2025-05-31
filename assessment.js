// assessment.js

function initializePage() {
    console.log("Assessment page initialized after auth check.");

    const tabLinks = document.querySelectorAll(".tab-link");
    const tabContents = document.querySelectorAll(".tab-content");
    const clinicForm = document.getElementById("clinicForm");
    const basicInfoSection = document.getElementById("basicInfoSection");
    const assessmentCustomerIdSpan = document.getElementById("assessment-customer-id");
    const emailInputs = document.querySelectorAll('.lowercase-email'); // Assuming you add this class to email inputs

    // 自動將 Email 輸入轉為小寫
    if (emailInputs && emailInputs.length > 0) {
        emailInputs.forEach(input => {
            input.addEventListener('input', function() {
                this.value = this.value.toLowerCase();
            });
        });
    }

    // 檢查 URL 是否有 customerID 參數
    const urlParams = new URLSearchParams(window.location.search);
    const customerID = urlParams.get('customerID');

    if (customerID) {
        if (basicInfoSection) {
            basicInfoSection.classList.add("hidden"); 
        }
        if (assessmentCustomerIdSpan) {
            assessmentCustomerIdSpan.textContent = `(客戶ID: ${customerID})`;
        }
        if (clinicForm) { 
            let hiddenCustomerIdInput = clinicForm.querySelector('input[name="customerID"]');
            if (!hiddenCustomerIdInput) {
                hiddenCustomerIdInput = document.createElement('input');
                hiddenCustomerIdInput.type = 'hidden';
                hiddenCustomerIdInput.name = 'customerID';
                clinicForm.appendChild(hiddenCustomerIdInput);
            }
            hiddenCustomerIdInput.value = customerID;
        }
    } else {
        if (basicInfoSection) {
            basicInfoSection.classList.remove("hidden"); 
        }
         if (assessmentCustomerIdSpan) {
            assessmentCustomerIdSpan.textContent = ""; 
        }
    }

    // Tab 切換功能
    if (tabLinks.length > 0 && tabContents.length > 0) {
        tabLinks.forEach(link => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const tabId = link.dataset.tab;

                tabContents.forEach(content => content.classList.add("hidden"));
                tabLinks.forEach(l => l.classList.remove("active"));

                const targetContent = document.getElementById(tabId);
                if (targetContent) {
                    targetContent.classList.remove("hidden");
                }
                link.classList.add("active");
            });
        });

        // 預設顯示第一個 Tab
        const defaultTabLink = document.querySelector(".tab-link[data-tab='tab1']");
        const defaultTabContent = document.getElementById("tab1");
        if (defaultTabLink && defaultTabContent) {
            // Ensure all are hidden/inactive first, then activate default
            tabLinks.forEach(l => l.classList.remove("active"));
            tabContents.forEach(c => c.classList.add("hidden"));
            
            defaultTabLink.classList.add("active");
            defaultTabContent.classList.remove("hidden");
        }
    } else {
        console.warn("Tab links or contents not found, tab functionality disabled.");
    }

    // 表單提交處理
    if (clinicForm) {
        clinicForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const formData = new FormData(clinicForm);
            const data = {
                formType: document.querySelector(".tab-link.active")?.dataset.tab || 'unknown_tab',
                submittedAt: new Date().toISOString()
            };
            
            // Add customerID to data if present (either from URL or hidden field if URL param was not used to open)
            if (customerID) { 
                data.customerID = customerID;
            } else {
                const hiddenIdField = clinicForm.querySelector('input[name="customerID"]');
                if (hiddenIdField && hiddenIdField.value) {
                    data.customerID = hiddenIdField.value;
                }
            }


            formData.forEach((value, key) => {
                 // Handle checkbox groups that might have same name (e.g. for 'other' text linkage)
                 if (key.endsWith('[]')) { // Convention for array fields, though not strictly used in current HTML for simple checkboxes
                    const cleanKey = key.slice(0, -2);
                    if (!data[cleanKey]) {
                        data[cleanKey] = [];
                    }
                    data[cleanKey].push(value);
                } else if (data[key]) { 
                    // If key already exists, convert to array and push new value
                    if (!Array.isArray(data[key])) {
                        data[key] = [data[key]];
                    }
                    data[key].push(value);
                } else {
                    data[key] = value;
                }
            });
            
            // Special handling for "other" checkboxes with associated text fields
            // Assuming a convention: checkbox id="q1_13", text input near it (no specific name needed for text if grouped)
            // This part needs robust selector logic based on your HTML structure for "other" fields.
            // A more generic way: find all checked checkboxes that have an adjacent/sibling text input for "other" details.
            // For example, if your "other" checkbox is `id="q1_13"` and text input is `id="q1_13_text"`
            // Or if they share a common parent and can be identified.
            // The existing HTML uses a more direct approach for q1_13, let's refine based on actual usage if needed.

            // Simplified "other" handling for demo based on q1_13 structure:
            // This example assumes checkbox and text input for 'other' are not named in a way that FormData picks up relation.
            // We'd need to give them specific names or iterate differently.
            // The `q1_13` in the HTML has an input type=text directly after the checkbox, without a `name`.
            // This would require more specific DOM traversal to capture.
            // A better way is to name the "other" text fields e.g., name="q1_other_text"
            // and the checkbox e.g. name="q1_options[]" value="q1_other_checkbox"

            // Example for q1_13 (if the text input had a name like 'q1_other_text_value'):
            // const q1_13_checkbox = document.getElementById('q1_13');
            // const q1_13_text_input = clinicForm.querySelector('input[type="text"]'); // This is too generic.
            // Needs better selectors if you have multiple "other" text fields.
            
            // Assuming your current FormData processing handles named inputs correctly.
            // If "other" text needs special combination with checkbox values, that logic would go here.
            // For example, if a checkbox with value "other" is checked, append its associated text field's value.
            // Example: if checkbox `name="q1_options" value="other"` is checked, and text input `name="q1_other_detail"` exists:
            // if (data.q1_options && data.q1_options.includes("other") && data.q1_other_detail) {
            //    const otherIndex = data.q1_options.indexOf("other");
            //    data.q1_options[otherIndex] = `Other: ${data.q1_other_detail}`;
            //    delete data.q1_other_detail; // Clean up
            // }


            console.log("表單資料:", data);
            // alert("問卷已送出 (模擬)。請查看 console 獲取提交的資料。");
            // Instead of alert, show a success message on the page
            const submitButton = clinicForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton ? submitButton.textContent : "送出表單";
            if(submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "傳送中...";
            }

            // Simulate submission
            setTimeout(() => {
                if (window.parent && window.parent.document.getElementById('content-frame')) {
                    const parentFrame = window.parent.document.getElementById('content-frame');
                    // Navigate parent iframe back to customers page, or a thank you page
                    // If customerID is available, could go to that customer's detail page
                    if(data.customerID) {
                        parentFrame.src = new URL(`customers.html?submittedForm=true&customerID=${data.customerID}`, window.parent.location.href).href;
                         if (window.parent.updateActiveMenuFromChild) {
                             window.parent.updateActiveMenuFromChild("menu-customers");
                         }
                    } else {
                        parentFrame.src = new URL("customers.html?submittedForm=true", window.parent.location.href).href;
                         if (window.parent.updateActiveMenuFromChild) {
                             window.parent.updateActiveMenuFromChild("menu-customers");
                         }
                    }
                } else {
                    // Fallback if not in iframe or parent structure is different
                    alert("問卷已送出 (模擬)。資料已記錄在主控台。");
                     if(submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
                    }
                }
                // clinicForm.reset(); // Optionally reset the form
            }, 1500);

        });
    } else {
        console.warn("Clinic form not found, form submission disabled.");
    }
}

// initializePage() 將由 auth-check.js 在驗證成功後呼叫