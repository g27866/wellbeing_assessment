document.addEventListener('DOMContentLoaded', function () {
    const tabContainer = document.getElementById('tabContainer');
    const clinicForm = document.getElementById('clinicForm');
    const tabContents = document.querySelectorAll('.tab-content');
    const tabLinks = document.querySelectorAll('.tab-link');
    let activeTabId = 'tab1'; // Default active tab

    // --- Tab Switching Logic ---
    tabContainer.addEventListener('click', function(event) {
        event.preventDefault();
        const clickedTab = event.target.closest('.tab-link');

        if (clickedTab && !clickedTab.classList.contains('active')) {
            // Update Links
            tabLinks.forEach(link => link.classList.remove('active'));
            clickedTab.classList.add('active');

            // Update Content
            tabContents.forEach(content => content.classList.add('hidden'));
            activeTabId = clickedTab.dataset.tab;
            document.getElementById(activeTabId).classList.remove('hidden');
        }
    });

    // --- Form Submission Logic ---
    clinicForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        const formData = {};
        const basicInfo = {};
        const activeTabData = {};

        // 1. Collect Basic Info
        const basicInfoSection = document.getElementById('basicInfoSection');
        const basicInputs = basicInfoSection.querySelectorAll('input, textarea');
        basicInputs.forEach(input => {
            if (input.name) {
                 if (input.type === 'radio') {
                    if (input.checked) basicInfo[input.name] = input.value;
                } else {
                    basicInfo[input.name] = input.value;
                }
            }
        });

        // 2. Collect Active Tab Info
        const activeTabContent = document.getElementById(activeTabId);
        const activeInputs = activeTabContent.querySelectorAll('input, textarea');

        activeInputs.forEach(input => {
            if (input.name) {
                if (input.type === 'checkbox') {
                    if (!activeTabData[input.name]) activeTabData[input.name] = [];
                    if (input.checked) activeTabData[input.name].push(input.value || input.id);
                } else if (input.type === 'radio') {
                    if (input.checked) activeTabData[input.name] = input.value;
                } else {
                   activeTabData[input.name] = input.value;
                }
            }
        });

        formData.basicInfo = basicInfo;
        formData.questionnaire = {
            tabId: activeTabId,
            title: tabContainer.querySelector(`[data-tab="${activeTabId}"] p`).textContent.trim(),
            data: activeTabData
        };

        // 3. "Send" Data (Log & Alert)
        console.log("Submitting Data:", JSON.stringify(formData, null, 2));
        alert(`表單已送出！\n客戶: ${basicInfo.name || 'N/A'}\n問卷: ${formData.questionnaire.title}\n(詳細資料請查看瀏覽器控制台)`);

        // 4. Clear Form
        clearForm();
    });

    // --- Form Clearing Function ---
    function clearForm() {
        clinicForm.reset(); // Resets most standard elements

        // Ensure all checkboxes and radios are visually and state-wise unchecked
        clinicForm.querySelectorAll('input[type="radio"], input[type="checkbox"]')
            .forEach(input => input.checked = false);

        // Reset to the first tab
         tabLinks.forEach(link => link.classList.remove('active'));
         tabContents.forEach(content => content.classList.add('hidden'));

         document.querySelector('[data-tab="tab1"]').classList.add('active');
         document.getElementById('tab1').classList.remove('hidden');
         activeTabId = 'tab1';
    }

    // --- Initialize: Ensure first tab is active on load ---
    // We need to set the initial state without 'clicking' to avoid potential issues
    tabLinks.forEach(link => link.classList.remove('active'));
    tabContents.forEach(content => content.classList.add('hidden'));
    document.querySelector('[data-tab="tab1"]').classList.add('active');
    document.getElementById('tab1').classList.remove('hidden');
    activeTabId = 'tab1';

});