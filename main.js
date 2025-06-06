// main.js
console.log("%%%%%% MAIN.JS (Focus on Hamburger, URL Params, Login UI) %%%%%%");

document.addEventListener("DOMContentLoaded", () => {
    // DOM 元素獲取 (來自您 main.js v6)
    const contentFrame = document.getElementById("content-frame");
    const menuLinks = document.querySelectorAll(".menu-link"); // 這些是下拉選單中的連結
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    // const authButton = document.getElementById("auth-button"); // 原始 auth-button，現在由獨立按鈕和下拉按鈕取代
    // const authButtonText = document.getElementById("auth-button-text");

    const frameContainer = document.getElementById("frame-container");
    const pageFrameCache = {};

    // 新增的 DOM 元素 (根據 index.html v2)
    const headerRightOptions = document.getElementById('header-right-options'); // 包裹右側所有按鈕和選單的容器
    const hamburgerButton = document.getElementById('hamburger-button');
    const dropdownMenu = document.getElementById('dropdown-menu'); // 下拉選單容器
    const mainNavigationMenu = document.getElementById('main-navigation-menu'); // <nav> 元素，在下拉選單內

    const authButtonLogin = document.getElementById('auth-button-login'); // 獨立的登入按鈕
    const authButtonTextLogin = document.getElementById('auth-button-text-login'); // 登入按鈕文字 (如果您的 HTML 有這個)

    const authButtonDropdown = document.getElementById('auth-button-dropdown'); // 下拉選單中的登出按鈕
    const authButtonTextDropdown = document.getElementById('auth-button-text-dropdown'); // 下拉選單中登出按鈕的文字

    const menuCustomers = document.getElementById("menu-customers");
    const menuAssessment = document.getElementById("menu-assessment");
    const menuCalendar = document.getElementById("menu-calendar");

    function showPage(pagePath, linkEl, queryParams = '') {
        // (此函數保持您 main.js v6 的原樣)
        if (!frameContainer) {
            if (contentFrame) {
                 const targetSrc = new URL(pagePath + queryParams, window.location.href).href;
                 if (contentFrame.src !== targetSrc) {
                    contentFrame.src = targetSrc;
                 }
                 if (typeof updateActiveMenu === 'function' && linkEl) {
                    updateActiveMenu(linkEl);
                 }
            }
            return;
        }
        Object.values(pageFrameCache).forEach(f => f.style.display = 'none');
        const fullPagePathWithQuery = pagePath + queryParams;
        if (!pageFrameCache[pagePath]) {
            const newFrame = document.createElement('iframe');
            newFrame.src = new URL(fullPagePathWithQuery, window.location.href).href;
            newFrame.classList.add('dynamic-page-frame');
            newFrame.style.display = 'block';
            frameContainer.appendChild(newFrame);
            pageFrameCache[pagePath] = newFrame;
        } else {
            const frameToUpdate = pageFrameCache[pagePath];
            const currentFullSrc = new URL(frameToUpdate.src, window.location.href).href;
            const newFullSrc = new URL(fullPagePathWithQuery, window.location.href).href;
            if (currentFullSrc !== newFullSrc) {
                 frameToUpdate.src = newFullSrc;
            }
            frameToUpdate.style.display = 'block';
        }
        if (typeof updateActiveMenu === 'function' && linkEl) {
            updateActiveMenu(linkEl);
        }
    }
    window.showPage = showPage;

    // 下拉選單中的連結的點擊事件 (保持您 main.js v6 中對 menuLinks 的處理)
    // 注意：現在 menuLinks 是 #dropdown-menu 裡面的 a 標籤
    if (dropdownMenu) { // 確保 dropdownMenu 存在
        dropdownMenu.querySelectorAll(".menu-link").forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pagePath = link.dataset.src;
                if (pagePath) {
                    showPage(pagePath, link);
                }
                // 點擊後收起選單
                if (dropdownMenu.classList.contains('menu-open')) {
                    dropdownMenu.classList.remove('menu-open');
                    if (hamburgerButton) hamburgerButton.classList.remove('open');
                }
            });
        });
    }


    const firebaseConfig = {
        apiKey: "AIzaSyDB27Iggneh6tQqs7ldGghuvm8xVdyQPhs",
        authDomain: "wellbeing-369fb.firebaseapp.com",
        projectId: "wellbeing-369fb",
        storageBucket: "wellbeing-369fb.firebasestorage.app",
        messagingSenderId: "45684081814",
        appId: "1:45684081814:web:be1b3039e5b38f43d6eeb7"
    };

    let db, auth, functions, firestoreToolsNamespace, currentUserInfo = null;

    try {
        if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
            const app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth(); db = firebase.firestore(); functions = firebase.app().functions('us-central1');
            firestoreToolsNamespace = firebase.firestore;
            console.log("[main.js] Firebase Initialized.");
            window.firebaseApp = app; window.firebaseAuth = auth; window.firebaseDb = db;
            window.firebaseFirestoreNamespace = firestoreToolsNamespace; window.firebaseFunctions = functions;
            window.getCurrentUserRole = () => currentUserInfo?.role || null;

            const initialUrlParams = new URLSearchParams(window.location.search);
            const initialPageParam = initialUrlParams.get('page');
            let isAssessmentDirectLoad = false;

            if (initialPageParam === 'assessment') {
                isAssessmentDirectLoad = true;
                console.log("[main.js] 'page=assessment' detected by URL. Hiding header options.");
                if (headerRightOptions) { // headerRightOptions 是包含漢堡、選單和登入按鈕的整個右側容器
                    headerRightOptions.style.display = 'none';
                }
                // 載入 assessment.html 的邏輯
                const customerID = initialUrlParams.get('customerID') || '';
                const displayID = initialUrlParams.get('displayID') || '';
                const name = initialUrlParams.get('name') || '';
                const type = initialUrlParams.get('type') || '';
                const recordId = initialUrlParams.get('recordId') || '';
                const mode = initialUrlParams.get('mode') || '';
                let assessmentQueryParams = `?displayID=${displayID}&name=${encodeURIComponent(name)}`;
                if (customerID) assessmentQueryParams += `&customerID=${customerID}`;
                if (type) assessmentQueryParams += `&type=${type}`;
                if (recordId) assessmentQueryParams += `&recordId=${recordId}`;
                if (mode) assessmentQueryParams += `&mode=${mode}`;
                showPage('assessment.html', document.getElementById('menu-assessment'), assessmentQueryParams);
            }

            auth.onAuthStateChanged(async user => {
                const loginPromptPageName = "login-prompt.html";
                const defaultContentPage = menuCustomers?.dataset.src || "customers.html";

                if (isAssessmentDirectLoad) {
                    if (user) {
                        currentUserInfo = { uid: user.uid, displayName: user.displayName || user.email.split('@')[0], email: user.email, role: null };
                        try {
                             const userDoc = await db.collection("users").doc(user.uid).get();
                             if (userDoc.exists) currentUserInfo.role = userDoc.data().role || 'staff';
                        } catch(err) { console.error("Error fetching role (direct load):", err);}
                    } else { currentUserInfo = null; }
                    console.log("[main.js] Assessment direct load. Current user:", currentUserInfo ? currentUserInfo.displayName : "None");
                    return;
                }

                // --- 非直接載入 assessment.html 的 UI 更新邏輯 ---
                if (user) { // --- 使用者已登入 ---
                    currentUserInfo = { uid: user.uid, displayName: user.displayName || user.email.split('@')[0], email: user.email, role: null };
                    if (authButtonTextDropdown) authButtonTextDropdown.textContent = `登出 (${currentUserInfo.displayName})`;
                    if (authButtonLogin) authButtonLogin.style.display = 'none';
                    if (hamburgerButton) hamburgerButton.style.display = 'block'; // 在所有螢幕尺寸登入後都顯示漢堡 (CSS 會處理 md:hidden)
                    if (dropdownMenu) dropdownMenu.classList.remove('menu-open'); // 確保預設收合
                    if (hamburgerButton) hamburgerButton.classList.remove('open');

                    try {
                        const userDoc = await db.collection("users").doc(user.uid).get();
                        if (userDoc.exists) {
                            currentUserInfo.role = userDoc.data().role || 'staff';
                            console.log("[main.js] User authorized. Role:", currentUserInfo.role);
                            // 顯示下拉選單中的連結 (這些是在 #dropdown-menu > #main-navigation-menu 內的)
                            [menuCustomers, menuAssessment, menuCalendar].forEach(m => { if(m) m.style.display = "block";});

                            const activeFrame = Object.values(pageFrameCache).find(f => f.style.display !== 'none');
                            const currentFramePath = activeFrame ? new URL(activeFrame.src, window.location.href).pathname.split('/').pop() : "";
                            if (!activeFrame || currentFramePath === loginPromptPageName || currentFramePath === "" || currentFramePath === "blank") {
                                const defaultLink = Array.from(document.querySelectorAll("#main-navigation-menu .menu-link")).filter(l => l.dataset.src && l.style.display !== 'none')[0];
                                if (defaultLink) showPage(defaultLink.dataset.src, defaultLink);
                                else showPage(defaultContentPage, menuCustomers);
                            } else {
                                updateActiveMenu(Array.from(document.querySelectorAll("#main-navigation-menu .menu-link")).find(l => l.dataset.src === currentFramePath) || menuCustomers);
                            }
                        } else {
                            currentUserInfo.role = 'guest';
                            if (authButtonTextLogin) authButtonTextLogin.textContent = `Login (未授權)`;
                            if (authButtonLogin) authButtonLogin.style.display = 'flex';
                            [menuCustomers, menuAssessment, menuCalendar].forEach(m => { if(m) m.style.display = "none";});
                            if (hamburgerButton) hamburgerButton.style.display = 'none';
                            if (dropdownMenu) dropdownMenu.classList.remove('menu-open');
                            showPage(loginPromptPageName, null, `?uid=${user.uid}`);
                         }
                    } catch (error) {
                        console.error("[main.js] Error fetching user role:", error);
                        if (authButtonTextLogin) authButtonTextLogin.textContent = `Login (錯誤)`;
                        if (authButtonLogin) authButtonLogin.style.display = 'flex';
                        if (hamburgerButton) hamburgerButton.style.display = 'none';
                        showPage(loginPromptPageName, null);
                    }
                } else { // --- 使用者未登入 ---
                    currentUserInfo = null;
                    console.log("[main.js] User signed out / Not logged in.");
                    if (authButtonTextLogin) authButtonTextLogin.textContent = "Login"; // 更新獨立登入按鈕文字
                    if (authButtonLogin) authButtonLogin.style.display = 'flex'; // 顯示獨立登入按鈕
                    
                    [menuCustomers, menuAssessment, menuCalendar].forEach(m => { if(m) m.style.display = "none";});
                    if (hamburgerButton) {
                        hamburgerButton.style.display = 'none';
                        hamburgerButton.classList.remove('open');
                    }
                    if (dropdownMenu) dropdownMenu.classList.remove('menu-open');
                    
                    const activeFrame = Object.values(pageFrameCache).find(f => f.style.display !== 'none');
                    const currentFramePath = activeFrame ? new URL(activeFrame.src, window.location.href).pathname.split('/').pop() : "";
                    if (currentFramePath !== loginPromptPageName) { // 避免重複載入 login-prompt
                       showPage(loginPromptPageName, null);
                    }
                }
            });

            if (authButtonLogin) {
                authButtonLogin.addEventListener("click", () => {
                    if (!auth.currentUser) {
                        const provider = new firebase.auth.GoogleAuthProvider();
                        auth.signInWithPopup(provider).catch(err => {
                            if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                                console.error("Sign-in error from authButtonLogin:", err);
                                alert(`登入失敗: ${err.message}`);
                            }
                        });
                    }
                });
            }

            if (authButtonDropdown) {
                authButtonDropdown.addEventListener("click", () => {
                    if (auth.currentUser) {
                        auth.signOut().catch(err => {
                            console.error("Sign out error from authButtonDropdown:", err);
                            alert(`登出時發生錯誤: ${err.message}`);
                        });
                        if (dropdownMenu) dropdownMenu.classList.remove('menu-open');
                        if (hamburgerButton) hamburgerButton.classList.remove('open');
                    }
                });
            }
            
            // 初始頁面載入檢查
            if (!isAssessmentDirectLoad && !auth.currentUser ) {
                 const activeFrame = Object.values(pageFrameCache).find(f => f.style.display !== 'none');
                 const currentFramePath = activeFrame ? new URL(activeFrame.src, window.location.href).pathname.split('/').pop() : "";
                 if (!activeFrame || currentFramePath === 'blank' || currentFramePath === '') {
                    showPage("login-prompt.html", null);
                 }
            }

        } else { console.error("[main.js] Firebase SDK not loaded!"); alert("系統初始化失敗(SDK)。"); }
    } catch (e) { console.error("[main.js] Firebase init error:", e); alert("系統初始化失敗(INIT)。"); }

    function updateActiveMenu(targetLink) {
        // 注意：現在 menuLinks 是 #dropdown-menu 裡面的，所以選取範圍要對
        document.querySelectorAll("#dropdown-menu .menu-link").forEach(link => link.classList.remove("active"));
        if (targetLink) {
            targetLink.classList.add("active");
        }
    }
    window.updateActiveMenuFromChild = (id) => { const link = document.getElementById(id); if(link) updateActiveMenu(link);};
    
    async function checkRoomAvailabilityViaFunction(roomName, newApptStartISOString, durationMinutes) {
        // (複製您 v6 的完整 checkRoomAvailabilityViaFunction 邏輯)
        if (!functions) throw new Error("Firebase Functions not initialized.");
        const checkFunction = functions.httpsCallable('checkRoomAvailabilityFunction');
        try {
            const result = await checkFunction({ roomName, appointmentDateTime: newApptStartISOString, durationMinutes });
            return result.data;
        } catch (error) { throw new Error(`Cloud func checkRoomAvailability error: ${error.message}`); }
    }

    window.addEventListener('message', async (event) => {
        // (訊息來源驗證邏輯，同我上一版完整 main.js 的 isTrusted 判斷)
        let isTrusted = false;
        const activeVisibleIframe = Object.values(pageFrameCache).find(f => f.style.display !== 'none' && f.contentWindow === event.source);
        if (activeVisibleIframe && event.origin === window.location.origin) {
            isTrusted = true;
        } else if (event.origin === window.location.origin || (window.location.protocol === 'file:' && event.origin === 'null')) {
            isTrusted = true; // 處理彈出視窗或本地 file://
        }
        if (!isTrusted) {
            console.warn(`[main.js] Ignored untrusted message. Origin: ${event.origin}`);
            return;
        }

        const firestoreDbInstance = window.firebaseDb;
        const tools = window.firebaseFirestoreNamespace;
        if (!firestoreDbInstance || !tools) { 
            if(event.source && event.data?.type) event.source.postMessage({ type: `${event.data.type}_ERROR`, message: "主資料庫未就緒" }, event.origin);
            return; 
        }
        const payload = event.data.payload;
        const type = event.data.type;
        const source = event.source;
        const originForReply = event.origin;

        console.log(`[main.js] Processing message type: ${type}`);
        try {
            switch (type) {
                case 'SAVE_NEW_CUSTOMER':
                    // (複製您 v6 的 SAVE_NEW_CUSTOMER 邏輯，並確保 source.postMessage 使用 originForReply)
                    console.log("[main.js] Matched SAVE_NEW_CUSTOMER. Payload:", payload);
                    let birthDateForStore = null;
                    if (payload.birthDate) {
                        const parts = payload.birthDate.split("-");
                        if (parts.length === 3) {
                            birthDateForStore = tools.Timestamp.fromDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
                        }
                    }
                    const finalCustomerData = { ...payload, birthDate: birthDateForStore, createdAt: tools.FieldValue.serverTimestamp(), updatedAt: tools.FieldValue.serverTimestamp() };
                    const newCustomerRef = firestoreDbInstance.collection("customers").doc();
                    await newCustomerRef.set(finalCustomerData);
                    source.postMessage({ type: 'SAVE_NEW_CUSTOMER_SUCCESS', customerId: newCustomerRef.id, customerName: finalCustomerData.name, displayId: finalCustomerData.displayCustomerId }, originForReply);
                    break;

                case 'SAVE_CUSTOMER_CHANGES':
                    // (複製您 v6 的 SAVE_CUSTOMER_CHANGES 邏輯，並確保 source.postMessage 使用 originForReply)
                    console.log("[main.js] Matched SAVE_CUSTOMER_CHANGES. Payload:", payload);
                    const { firestoreId, lineUidAction, ...dataToUpdate } = payload;
                    dataToUpdate.updatedAt = tools.FieldValue.serverTimestamp();
                    if (dataToUpdate.birthDate) {
                        const parts = dataToUpdate.birthDate.split("-");
                        if (parts.length === 3) dataToUpdate.birthDate = tools.Timestamp.fromDate(new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2])));
                        else dataToUpdate.birthDate = null;
                    } else { dataToUpdate.birthDate = null; }
                    if (lineUidAction === 'unlink') dataToUpdate.lineUid = null;
                    await firestoreDbInstance.collection("customers").doc(firestoreId).update(dataToUpdate);
                    const updatedDoc = await firestoreDbInstance.collection("customers").doc(firestoreId).get();
                    source.postMessage({ type: 'SAVE_CUSTOMER_CHANGES_SUCCESS', updatedCustomerData: { firestoreId: updatedDoc.id, ...updatedDoc.data() } }, originForReply);
                    break;
                case 'ADD_TREATMENT_PURCHASE':
                    console.log(`[main.js] Matched ADD_TREATMENT_PURCHASE. Payload:`, JSON.parse(JSON.stringify(payload)));
                    const apptStartString = payload.firstAppointment.firstUseDateTime;
                    const apptDuration = payload.firstAppointment.durationMinutes;
                    const apptRoomRequest = payload.firstAppointment.room;
                    const apptNotes = payload.firstAppointment.notes;
                    const apptEditor = payload.firstAppointment.editorName;
                    const purchaseAmount = payload.amount;
                    const newApptStart = new Date(apptStartString);
                    const newApptEnd = new Date(newApptStart.getTime() + apptDuration * 60000);
                    let assignedRoom = null;
                    if (apptRoomRequest === "點滴室") {
                        const dripRoomNames = ["點滴室1", "點滴室2", "點滴室3"];
                        let foundAvailableDripRoom = false;
                        for (const drName of dripRoomNames) {
                            const availabilityResult = await checkRoomAvailabilityViaFunction(drName, newApptStart.toISOString(), apptDuration);
                            if (availabilityResult?.available) { assignedRoom = availabilityResult.assignedRoom; foundAvailableDripRoom = true; break; }
                        }
                        if (!foundAvailableDripRoom) throw new Error("該時段所有點滴室均已預約滿");
                    } else {
                        const availabilityResult = await checkRoomAvailabilityViaFunction(apptRoomRequest, newApptStart.toISOString(), apptDuration);
                        if (availabilityResult?.available) assignedRoom = availabilityResult.assignedRoom;
                        else throw new Error(`房間 "${apptRoomRequest}" 已被預約: ${availabilityResult?.reason || 'Unknown'}`);
                    }
                    const appointmentDataToWrite = {
                        appointmentDateTime: tools.Timestamp.fromDate(newApptStart), appointmentEndDateTime: tools.Timestamp.fromDate(newApptEnd),
                        durationMinutes: apptDuration, room: assignedRoom, status: "已預約", notes: apptNotes,
                        createdAt: tools.FieldValue.serverTimestamp(), createdBy: apptEditor,
                        statusModifiedAt: tools.FieldValue.serverTimestamp(), statusModifiedBy: apptEditor
                    };
                    const { customerId: custIdFirestore, customerDisplayId, customerName, treatmentCategory, treatmentName, purchasedUnits } = payload;
                    const newPkgRef = firestoreDbInstance.collection("customerTreatmentPackages").doc();
                    const firstApptRef = newPkgRef.collection("appointments").doc();
                    await firestoreDbInstance.runTransaction(async (transaction) => {
                        transaction.set(newPkgRef, {
                            customerId: custIdFirestore, customerDisplayId, customerName, treatmentCategory, treatmentName, purchasedUnits, amount: purchaseAmount,
                            purchaseDate: tools.FieldValue.serverTimestamp(), usedUnits: 1, status: purchasedUnits === 1 ? "completed" : "active",
                            createdAt: tools.FieldValue.serverTimestamp(), createdBy: payload.editorName,
                            updatedAt: tools.FieldValue.serverTimestamp(), updatedBy: payload.editorName, revokedInfo: null
                        });
                        transaction.set(firstApptRef, appointmentDataToWrite);
                    });
                    source.postMessage({ type: 'ADD_TREATMENT_PURCHASE_SUCCESS', packageId: newPkgRef.id, payload: payload }, originForReply);
                    break;
                case 'ADD_INLINE_APPOINTMENT':
                    console.log(`[main.js] Matched ADD_INLINE_APPOINTMENT. Payload:`, JSON.parse(JSON.stringify(payload)));
                    const { packageId: inlinePkgId, appointmentDateTime: inlineApptTimeStr, durationMinutes: inlineDuration, room: inlineRoomReq, notes: inlineNotes, editorName: inlineEditor, customerFirestoreId: inlineCustFirestoreIdFromPayload, customerDisplayId: inlineCustDisplayIdFromPayload, treatmentName: inlineTreatmentNameFromPayload, customerName: inlineCustomerNameFromPayload } = payload;
                    const inlineApptStart = new Date(inlineApptTimeStr);
                    const inlineApptEnd = new Date(inlineApptStart.getTime() + inlineDuration * 60000);
                    let inlineAssignedRoom = null;
                    if (inlineRoomReq === "點滴室") {
                        const dripRoomNames = ["點滴室1", "點滴室2", "點滴室3"];
                        let foundDrip = false;
                        for (const dr of dripRoomNames) {
                            const avail = await checkRoomAvailabilityViaFunction(dr, inlineApptStart.toISOString(), inlineDuration);
                            if (avail?.available) { inlineAssignedRoom = avail.assignedRoom; foundDrip = true; break; }
                        }
                        if (!foundDrip) throw new Error("該時段所有點滴室均已預約滿");
                    } else {
                        const avail = await checkRoomAvailabilityViaFunction(inlineRoomReq, inlineApptStart.toISOString(), inlineDuration);
                        if (avail?.available) inlineAssignedRoom = avail.assignedRoom;
                        else throw new Error(`房間 "${inlineRoomReq}" 已被預約: ${avail?.reason || 'Unknown'}`);
                    }
                    const inlineAppointmentData = {
                        appointmentDateTime: tools.Timestamp.fromDate(inlineApptStart), appointmentEndDateTime: tools.Timestamp.fromDate(inlineApptEnd),
                        durationMinutes: inlineDuration, room: inlineAssignedRoom, status: "已預約", notes: inlineNotes,
                        treatmentName: inlineTreatmentNameFromPayload, customerName: inlineCustomerNameFromPayload,
                        customerDisplayId: inlineCustDisplayIdFromPayload, customerId: inlineCustFirestoreIdFromPayload,
                        createdAt: tools.FieldValue.serverTimestamp(), createdBy: inlineEditor,
                        statusModifiedAt: tools.FieldValue.serverTimestamp(), statusModifiedBy: inlineEditor
                    };
                    const treatmentPkgRefInline = firestoreDbInstance.collection("customerTreatmentPackages").doc(inlinePkgId);
                    const newApptRefInline = treatmentPkgRefInline.collection("appointments").doc();
                    await firestoreDbInstance.runTransaction(async trx => {
                        const pkgSnap = await trx.get(treatmentPkgRefInline);
                        if (!pkgSnap.exists) throw new Error("療程套票不存在。");
                        const pkgData = pkgSnap.data();
                        if (pkgData.status === "revoked") throw new Error("此療程套票已被註銷。");
                        if (pkgData.usedUnits >= pkgData.purchasedUnits) throw new Error("此療程套票已無剩餘次數。");
                        trx.set(newApptRefInline, inlineAppointmentData);
                        trx.update(treatmentPkgRefInline, { usedUnits: tools.FieldValue.increment(1), updatedAt: tools.FieldValue.serverTimestamp(), updatedBy: inlineEditor });
                    });
                    source.postMessage({ type: 'ADD_INLINE_APPOINTMENT_SUCCESS', customerFirestoreId: inlineCustFirestoreIdFromPayload, packageId: inlinePkgId, payload: payload }, originForReply);
                    break;
                case 'REVOKE_TREATMENT_PACKAGE':
                    console.log("[main.js] Matched REVOKE_TREATMENT_PACKAGE. Payload:", payload);
                    const { packageIdToRevoke, editorName: revokeEditor, customerFirestoreId: revokeCustFirestoreIdPayload, revocationReason } = payload;
                    const revokePackageRef = firestoreDbInstance.collection("customerTreatmentPackages").doc(packageIdToRevoke);
                    try {
                        await firestoreDbInstance.runTransaction(async (transaction) => {
                            const appointmentsToCancelQuery = revokePackageRef.collection("appointments").where("status", "==", "已預約");
                            const appointmentsToCancelSnapshot = await transaction.get(appointmentsToCancelQuery);
                            transaction.update(revokePackageRef, {
                                status: "revoked",
                                revokedInfo: { revokedBy: revokeEditor, revokedAt: tools.FieldValue.serverTimestamp(), reason: revocationReason || null },
                                updatedAt: tools.FieldValue.serverTimestamp(), updatedBy: revokeEditor
                            });
                            appointmentsToCancelSnapshot.forEach(apptDoc => {
                                transaction.update(apptDoc.ref, {
                                    status: "已取消", statusModifiedAt: tools.FieldValue.serverTimestamp(), statusModifiedBy: revokeEditor,
                                    notes: (apptDoc.data().notes || "") + ` (因療程註銷${revocationReason ? ` (${revocationReason})` : ''}而自動取消)`
                                });
                            });
                        });
                        source.postMessage({ type: 'REVOKE_TREATMENT_PACKAGE_SUCCESS', customerFirestoreId: revokeCustFirestoreIdPayload, payload: payload }, originForReply);
                    } catch (error) {
                        source.postMessage({ type: 'REVOKE_TREATMENT_PACKAGE_ERROR', message: error.message || "註銷療程失敗", payload: payload }, originForReply);
                    }
                    break;
                case 'UPDATE_APPOINTMENT_STATUS':
                    console.log("[main.js] Matched UPDATE_APPOINTMENT_STATUS. Payload:", payload);
                    const { appointmentId, packageId: statusPkgId, newStatus, editorName: statusEditor, customerFirestoreId: statusCustFirestoreIdPayload } = payload;
                    const apptRefToUpdate = firestoreDbInstance.collection("customerTreatmentPackages").doc(statusPkgId).collection("appointments").doc(appointmentId);
                    const pkgRefForStatus = firestoreDbInstance.collection("customerTreatmentPackages").doc(statusPkgId);
                    await firestoreDbInstance.runTransaction(async (transaction) => {
                        const apptDoc = await transaction.get(apptRefToUpdate);
                        if (!apptDoc.exists) throw new Error("預約記錄不存在。");
                        const oldStatus = apptDoc.data().status;
                        let usedUnitsChange = 0;
                        if (newStatus === "已完成" && oldStatus !== "已完成") { if (oldStatus === "已取消" || oldStatus === "未到") usedUnitsChange = 1; }
                        else if (newStatus === "已取消" || newStatus === "未到") { if (oldStatus === "已完成" || oldStatus === "已預約") usedUnitsChange = -1; }
                        else if (newStatus === "已預約") { if (oldStatus === "已取消" || oldStatus === "未到") usedUnitsChange = 1; }
                        if (usedUnitsChange !== 0) {
                            const packageDoc = await transaction.get(pkgRefForStatus);
                            if (packageDoc.exists) {
                                const packageData = packageDoc.data(); let currentUsed = packageData.usedUnits || 0;
                                if ((currentUsed + usedUnitsChange) < 0) usedUnitsChange = -currentUsed;
                                if ((currentUsed + usedUnitsChange) > packageData.purchasedUnits) usedUnitsChange = packageData.purchasedUnits - currentUsed;
                                if (usedUnitsChange !== 0) transaction.update(pkgRefForStatus, { usedUnits: tools.FieldValue.increment(usedUnitsChange), updatedAt: tools.FieldValue.serverTimestamp(), updatedBy: statusEditor });
                            } else console.warn("[main.js] Package doc not found for status update:", statusPkgId);
                        }
                        transaction.update(apptRefToUpdate, { status: newStatus, statusModifiedAt: tools.FieldValue.serverTimestamp(), statusModifiedBy: statusEditor });
                    });
                    source.postMessage({ type: 'UPDATE_APPOINTMENT_STATUS_SUCCESS', customerFirestoreId: statusCustFirestoreIdPayload, payload: payload }, originForReply);
                    break;
                case 'UPDATE_TREATMENT_UNITS':
                    console.log("[main.js] Matched UPDATE_TREATMENT_UNITS. Payload:", payload);
                    const { packageId: pkgIdToUpdateUnits, newPurchasedUnits, editorName: unitsEditor, customerFirestoreId: unitsCustFirestoreIdPayload } = payload;
                    const pkgRefUnits = firestoreDbInstance.collection("customerTreatmentPackages").doc(pkgIdToUpdateUnits);
                    await firestoreDbInstance.runTransaction(async (transaction) => {
                        const pkgDoc = await transaction.get(pkgRefUnits);
                        if (!pkgDoc.exists) throw new Error("療程套票不存在。");
                        const currentData = pkgDoc.data();
                        if (newPurchasedUnits < currentData.usedUnits) throw new Error(`新購買數 (${newPurchasedUnits}) 不可少於已用數 (${currentData.usedUnits})。`);
                        transaction.update(pkgRefUnits, { purchasedUnits: newPurchasedUnits, updatedAt: tools.FieldValue.serverTimestamp(), updatedBy: unitsEditor });
                    });
                    source.postMessage({ type: 'UPDATE_TREATMENT_UNITS_SUCCESS', customerFirestoreId: unitsCustFirestoreIdPayload, payload: payload }, originForReply);
                    break;

                case 'GET_ASSESSMENT_RECORD':
                    console.log("[main.js] Matched GET_ASSESSMENT_RECORD. Payload:", payload);
                    try {
                        const recordId = payload.recordId;
                        if (!recordId) throw new Error("GET_ASSESSMENT_RECORD: recordId missing.");
                        const recordDoc = await firestoreDbInstance.collection("assessmentRecords").doc(recordId).get();
                        if (recordDoc.exists) {
                            source.postMessage({ type: 'GET_ASSESSMENT_RECORD_SUCCESS', payload: { recordId: recordDoc.id, ...recordDoc.data() } }, originForReply);
                        } else {
                            source.postMessage({ type: 'GET_ASSESSMENT_RECORD_ERROR', message: '問卷記錄不存在。', payload: payload }, originForReply);
                        }
                    } catch (error) {
                         console.error("[main.js] Error in GET_ASSESSMENT_RECORD:", error);
                         source.postMessage({ type: 'GET_ASSESSMENT_RECORD_ERROR', message: error.message, payload: payload }, originForReply);
                    }
                    break;

                case 'SUBMIT_ASSESSMENT':
                    console.log("[main.js] Matched SUBMIT_ASSESSMENT. Payload:", JSON.parse(JSON.stringify(payload)));
                    if (!payload.customerDisplayID) {
                        console.error("[main.js] SUBMIT_ASSESSMENT error: Missing customerDisplayID.");
                        source.postMessage({ type: 'SUBMIT_ASSESSMENT_ERROR', message: "提交失敗：缺少客戶 Display ID。", payload: payload }, originForReply);
                        return;
                    }
                    const assessmentDataToSave = {
                        customerId: payload.customerDisplayID,
                        customerDocId: payload.customerFirestoreID || null,
                        customerNameSnapshot: payload.customerName || null,
                        formTypeKey: payload.formType,
                        formTypeName: payload.formType,
                        formData: payload.formFields,
                        submittedAt: tools.FieldValue.serverTimestamp(),
                        submittedByDisplayName: getCurrentEditorName() || "系統",
                    };
                    try {
                        console.log("[main.js] DEBUG: Adding assessment:", assessmentDataToSave);
                        const newAssessmentRef = await firestoreDbInstance.collection("assessmentRecords").add(assessmentDataToSave);
                        console.log("[main.js] Assessment saved. Doc ID:", newAssessmentRef.id);
                        console.log("[main.js] DEBUG: Sending SUBMIT_ASSESSMENT_SUCCESS");
                        source.postMessage({ type: 'SUBMIT_ASSESSMENT_SUCCESS', assessmentId: newAssessmentRef.id, customerDisplayId: payload.customerDisplayID, payload: payload }, originForReply);
                    } catch (error) {
                        console.error("[main.js] Error saving assessment:", error);
                        console.log("[main.js] DEBUG: Sending SUBMIT_ASSESSMENT_ERROR");
                        source.postMessage({ type: 'SUBMIT_ASSESSMENT_ERROR', message: `儲存問卷失敗: ${error.message}`, payload: payload }, originForReply);
                    }
                    break;
                default: console.warn("[main.js] Unhandled message type:", type);
            }
        } catch (error) {
            console.error(`[main.js] Error processing message type ${type}. Error:`, error);
            if (source && type) {
                 source.postMessage({ type: `${type}_ERROR`, message: error.message || "處理訊息時未知錯誤", payload: payload }, originForReply);
            }
        }
    });


    // --- 漢堡選單控制邏輯 ---
    if (hamburgerButton && dropdownMenu) { // 確保元素都存在
        hamburgerButton.addEventListener('click', (event) => {
            event.stopPropagation(); // 防止點擊事件冒泡
            console.log("[main.js] Hamburger button clicked!");
            dropdownMenu.classList.toggle('menu-open'); // 切換下拉選單的顯示 class
            hamburgerButton.classList.toggle('open');   // 切換漢堡圖示的 'open' class (X 形狀)
        });

        // 點擊下拉選單中的項目 (選單連結或登出按鈕) 後，收回選單
        dropdownMenu.querySelectorAll('.menu-link, #auth-button-dropdown').forEach(item => {
            item.addEventListener('click', () => {
                console.log("[main.js] Dropdown item clicked, closing menu.");
                if (dropdownMenu.classList.contains('menu-open')) {
                    dropdownMenu.classList.remove('menu-open');
                    if(hamburgerButton) hamburgerButton.classList.remove('open');
                }
            });
        });

        // 點擊頁面其他地方 (失焦) 收回選單
        document.addEventListener('click', (event) => {
            if (dropdownMenu.classList.contains('menu-open') &&
                !dropdownMenu.contains(event.target) && // 點擊的不是下拉選單本身
                hamburgerButton && !hamburgerButton.contains(event.target)) { // 點擊的也不是漢堡按鈕
                console.log("[main.js] Click outside, closing menu.");
                dropdownMenu.classList.remove('menu-open');
                hamburgerButton.classList.remove('open');
            }
        });
    } else {
        console.warn("[main.js] Hamburger button or dropdown menu element not found! Menu functionality will be affected.");
    }

}); // End of DOMContentLoaded

function getCurrentEditorName() {
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        const user = window.firebaseAuth.currentUser;
        return user.displayName || user.email.split('@')[0] || "未知操作者";
    }
    return "系統預設";
}