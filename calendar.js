// calendar.js

// 此函數將由 auth-check.js 在驗證成功後呼叫
function initializePage() {
    console.log("[calendar.js] initializePage() called - 頁面初始化開始");

    // DOM 元素獲取
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const monthYearDisplay = document.getElementById('month-year');
    const calendarDaysContainer = document.getElementById('calendar-days');

    const afternoonSessionDiv = document.getElementById('afternoon-session');
    const eveningSessionDiv = document.getElementById('evening-session');
    const afternoonHoursSpan = document.getElementById('afternoon-hours');
    const eveningHoursSpan = document.getElementById('evening-hours');
    const noAppointmentsMessage = document.getElementById('no-appointments-message');

    const afternoonTimelineDiv = document.getElementById('afternoon-timeline');
    const eveningTimelineDiv = document.getElementById('evening-timeline');

    // 檢查重要元素是否存在
    if (!calendarDaysContainer || !monthYearDisplay || !afternoonTimelineDiv || !eveningTimelineDiv) {
        console.error("[calendar.js] 核心日曆或時間軸DOM元素未找到，功能可能異常！");
        // return; // 可以選擇在這裡中止，如果這些元素是絕對必要的
    }

    const roomCount = 5;
    const slotHeight = 24; // px, 每個30分鐘時間格的高度，應與CSS同步

    let currentDate = new Date();
    let selectedDate = null;    // YYYY-MM-DD string

    // --- 清除顯示 ---
    function clearAppointmentsDisplayAndTimeline() {
        console.log("[calendar.js] clearAppointmentsDisplayAndTimeline called");
        for (let i = 0; i < roomCount; i++) {
            const afternoonRoom = document.getElementById(`afternoon-room-${i}`);
            if (afternoonRoom) afternoonRoom.innerHTML = '';
            const eveningRoom = document.getElementById(`evening-room-${i}`);
            if (eveningRoom) eveningRoom.innerHTML = '';
        }
        if (afternoonTimelineDiv) afternoonTimelineDiv.innerHTML = '';
        if (eveningTimelineDiv) eveningTimelineDiv.innerHTML = '';

        if (afternoonSessionDiv) afternoonSessionDiv.classList.add('hidden');
        if (eveningSessionDiv) eveningSessionDiv.classList.add('hidden');
        if (noAppointmentsMessage) noAppointmentsMessage.classList.add('hidden');
    }

    // --- 時間軸產生 ---
    function generateTimelineLabels(timelineDiv, startHour, startMinute, endHour, endMinute, totalColumnHeight) {
        if (!timelineDiv) {
            console.error("[calendar.js] Timeline div not found for generating labels.");
            return;
        }
        timelineDiv.innerHTML = ''; // 清除舊標籤
        timelineDiv.style.minHeight = `${totalColumnHeight}px`; // 設定時間軸容器高度
        // console.log(`[calendar.js] Timeline ${timelineDiv.id} minHeight set to ${totalColumnHeight}px`);

        let currentHour = startHour;
        let currentMinute = startMinute;

        // 迴圈結束條件調整：確保包含起始於 endHour:endMinute 的最後一個 slot 的起始標籤
        // 例如，如果時段結束於 14:30，最後一個 slot 是 14:00-14:30，所以時間軸標籤應包含 14:00
        // 如果時段結束於 14:00，最後一個 slot 是 13:30-14:00，時間軸標籤應包含 13:30
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const timeLabel = document.createElement('div');
            timeLabel.textContent = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
            timelineDiv.appendChild(timeLabel);

            currentMinute += 30;
            if (currentMinute >= 60) {
                currentHour++;
                currentMinute -= 60;
            }
        }
    }

    // --- 日曆核心邏輯 ---
    function renderCalendar() {
        if (!calendarDaysContainer || !monthYearDisplay) {
            console.error("[calendar.js] 日曆核心DOM元素 (calendarDaysContainer 或 monthYearDisplay) 未找到!");
            return;
        }
        calendarDaysContainer.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        monthYearDisplay.textContent = `${year}年 ${month + 1}月`;

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();

        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day-cell', 'disabled');
            calendarDaysContainer.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day-cell');
            dayCell.textContent = day;
            const cellDate = new Date(year, month, day);
            const cellDateString = cellDate.toISOString().split('T')[0];
            dayCell.dataset.date = cellDateString;

            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayCell.classList.add('today');
            }
            if (selectedDate && cellDateString === selectedDate) {
                dayCell.classList.add('selected');
            }

            dayCell.addEventListener('click', function() {
                console.log(`[calendar.js] Date cell clicked: ${this.dataset.date}`);
                if (selectedDate) {
                    const prevSelected = calendarDaysContainer.querySelector(`.calendar-day-cell.selected`);
                    if (prevSelected) prevSelected.classList.remove('selected');
                }
                this.classList.add('selected');
                selectedDate = this.dataset.date;
                loadAppointmentsForDate(selectedDate);
            });
            calendarDaysContainer.appendChild(dayCell);
        }
        const totalCellsRendered = startDayOfWeek + daysInMonth;
        const remainingCellsToFillGrid = (7 - (totalCellsRendered % 7)) % 7;
        for (let i = 0; i < remainingCellsToFillGrid; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day-cell', 'disabled');
            calendarDaysContainer.appendChild(emptyCell);
        }
    }

    // --- 預約資料處理 ---
    async function loadAppointmentsForDate(dateString) {
        console.log(`[calendar.js] loadAppointmentsForDate called for: ${dateString}`);
        clearAppointmentsDisplayAndTimeline();
        const dateObj = new Date(dateString + "T00:00:00"); // 確保以本地時區解析日期部分
        const dayOfWeek = dateObj.getDay();
        console.log(`[calendar.js] Day of week: ${dayOfWeek} (0=Sun, 6=Sat)`);

        let afternoonConf = { show: false, name: "afternoon", startH: 11, startM: 0, endH: 14, endM: 30, label: "", timelineDiv: afternoonTimelineDiv, sessionDiv: afternoonSessionDiv, hoursSpan: afternoonHoursSpan, roomBaseId: "afternoon-room-" };
        let eveningConf = { show: false, name: "evening", startH: 16, startM: 30, endH: 21, endM: 0, label: "", timelineDiv: eveningTimelineDiv, sessionDiv: eveningSessionDiv, hoursSpan: eveningHoursSpan, roomBaseId: "evening-room-" };

        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Mon-Fri
            afternoonConf.show = true;
            eveningConf.show = true;
            console.log("[calendar.js] Weekday: Enabling Afternoon & Evening sessions.");
        } else if (dayOfWeek === 6) { // Sat
            afternoonConf.show = true;
            afternoonConf.startH = 12; afternoonConf.startM = 0;
            afternoonConf.endH = 18; afternoonConf.endM = 0;
            afternoonConf.label = "(12:00 - 18:00)";
            eveningConf.show = false;
            console.log("[calendar.js] Saturday: Enabling Afternoon session only.");
        } else { // Sun
            console.log("[calendar.js] Sunday: No sessions.");
        }
        
        let appointmentsFoundInTotal = false;

        // ---- 模擬資料 START ----
        console.log(`[calendar.js] Generating simulated data for date: ${dateString}, dayOfWeek: ${dayOfWeek}`);
        let appointments = []; 

        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays Mon-Fri
            if (afternoonConf.show) {
                appointments.push(
                    { customerid: "C001", customername: "王大明(午)", Treatment: "一般諮詢", datetime: `${dateString}T11:00:00`, room: 0, durationMinutes: 30 },
                    { customerid: "C002", customername: "陳小花(午)", Treatment: "肩部震波", datetime: `${dateString}T11:30:00`, room: 1, durationMinutes: 60 },
                    { customerid: "C003", customername: "李醫師(午)", Treatment: "皮膚保養", datetime: `${dateString}T13:00:00`, room: 0, durationMinutes: 45 }
                );
            }
            if (eveningConf.show) {
                appointments.push(
                    { customerid: "C004", customername: "張三豐(晚)", Treatment: "痠痛治療", datetime: `${dateString}T16:30:00`, room: 0, durationMinutes: 30 },
                    { customerid: "C005", customername: "趙敏(晚)", Treatment: "營養點滴", datetime: `${dateString}T17:45:00`, room: 3, durationMinutes: 75 },
                    { customerid: "C010", customername: "劉備(晚)", Treatment: "夜間諮詢", datetime: `${dateString}T20:00:00`, room: 0, durationMinutes: 30 }
                );
            }
        } else if (dayOfWeek === 6) { // Saturday
            if (afternoonConf.show) { 
                appointments.push(
                    { customerid: "C006", customername: "周六客(午)", Treatment: "周末諮詢", datetime: `${dateString}T12:30:00`, room: 0, durationMinutes: 60 },
                    { customerid: "C007", customername: "林美麗(午)", Treatment: "震波保養", datetime: `${dateString}T15:00:00`, room: 1, durationMinutes: 30 },
                    { customerid: "C009", customername: "張飛(午)", Treatment: "VIP點滴", datetime: `${dateString}T16:00:00`, room: 4, durationMinutes: 90 }
                );
            }
        }
        console.log(`[calendar.js] Simulated appointments generated:`, JSON.parse(JSON.stringify(appointments)));
        // ---- 模擬資料 END ----

        [afternoonConf, eveningConf].forEach(sessionConfig => {
            if (sessionConfig.show) {
                if (sessionConfig.sessionDiv) sessionConfig.sessionDiv.classList.remove('hidden');
                if (sessionConfig.hoursSpan) sessionConfig.hoursSpan.textContent = sessionConfig.label;

                const sessionTotalMinutes = (sessionConfig.endH * 60 + sessionConfig.endM) - (sessionConfig.startH * 60 + sessionConfig.startM);
                const sessionTotalSlots = Math.max(1, Math.ceil(sessionTotalMinutes / 30));
                const sessionTotalHeight = sessionTotalSlots * slotHeight;
                
                console.log(`[calendar.js] Config for ${sessionConfig.name}: TotalMinutes ${sessionTotalMinutes}, TotalSlots ${sessionTotalSlots}, TotalHeight ${sessionTotalHeight}`);

                if (sessionConfig.timelineDiv) {
                    generateTimelineLabels(sessionConfig.timelineDiv, sessionConfig.startH, sessionConfig.startM, sessionConfig.endH, sessionConfig.endM, sessionTotalHeight);
                }
                for (let i = 0; i < roomCount; i++) {
                    const roomElem = document.getElementById(`${sessionConfig.roomBaseId}${i}`);
                    if (roomElem) {
                        roomElem.style.minHeight = `${sessionTotalHeight}px`;
                        // console.log(`[calendar.js] Set minHeight for ${sessionConfig.roomBaseId}${i} to ${sessionTotalHeight}px`);
                    } else {
                        console.error(`[calendar.js] Room element ${sessionConfig.roomBaseId}${i} not found!`);
                    }
                }
            } else {
                if (sessionConfig.sessionDiv) sessionConfig.sessionDiv.classList.add('hidden');
            }
        });

        if (appointments.length > 0) {
            appointmentsFoundInTotal = true;
            appointments.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

            appointments.forEach(appt => {
                const apptTime = new Date(appt.datetime);
                const apptHour = apptTime.getHours();
                const apptMinute = apptTime.getMinutes();
                let currentSessionConfig = null; // Renamed from sessionConfig to avoid conflict
                let targetRoomDivIdBase = null;

                if (afternoonConf.show &&
                    (apptHour > afternoonConf.startH || (apptHour === afternoonConf.startH && apptMinute >= afternoonConf.startM)) &&
                    (apptHour < afternoonConf.endH || (apptHour === afternoonConf.endH && apptMinute < afternoonConf.endM))) {
                    currentSessionConfig = afternoonConf;
                } else if (eveningConf.show &&
                    (apptHour > eveningConf.startH || (apptHour === eveningConf.startH && apptMinute >= eveningConf.startM)) &&
                    (apptHour < eveningConf.endH || (apptHour === eveningConf.endH && apptMinute < eveningConf.endM))) {
                    currentSessionConfig = eveningConf;
                }

                if (currentSessionConfig && appt.room >= 0 && appt.room < roomCount) {
                    targetRoomDivIdBase = currentSessionConfig.roomBaseId;
                    const sessionStartTotalMinutes = currentSessionConfig.startH * 60 + currentSessionConfig.startM;
                    const apptStartTotalMinutes = apptHour * 60 + apptMinute;
                    const minutesFromSessionStart = apptStartTotalMinutes - sessionStartTotalMinutes;
                    
                    if (minutesFromSessionStart < 0) { // Appointment starts before session, skip
                        console.warn(`[calendar.js] Appointment ${appt.customername} starts before session ${currentSessionConfig.name}. Skipping.`);
                        return; 
                    }

                    const topPosition = (minutesFromSessionStart / 30) * slotHeight;
                    const durationMinutes = appt.durationMinutes || 30;
                    const appointmentBlockHeight = Math.max(slotHeight - 2, (durationMinutes / 30) * slotHeight - 2); // Ensure at least a decent height, minus 2 for padding/border

                    const targetRoomDiv = document.getElementById(`${targetRoomDivIdBase}${appt.room}`);
                    if (targetRoomDiv) {
                        const entryDiv = document.createElement('div');
                        entryDiv.classList.add('appointment-block');
                        entryDiv.style.top = `${topPosition}px`;
                        entryDiv.style.height = `${appointmentBlockHeight}px`;
                        
                        const timeStr = apptTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
                        entryDiv.innerHTML = `
                            <p class="font-semibold text-[9px] md:text-[10px]">${timeStr} ${appt.customername}</p>
                            <p class="text-gray-600 truncate text-[9px] md:text-[10px]">(${appt.Treatment})</p>
                        `;
                        targetRoomDiv.appendChild(entryDiv);
                        console.log(`[calendar.js] Appending appt for ${appt.customername} to ${targetRoomDivIdBase}${appt.room} at top: ${topPosition}px, height: ${appointmentBlockHeight}px`);
                    } else {
                        console.error(`[calendar.js] Target room DIV ${targetRoomDivIdBase}${appt.room} not found for appointment.`);
                    }
                } else {
                     console.log(`[calendar.js] Appointment for ${appt.customername} at ${appt.datetime} (Room ${appt.room}) is outside defined/active clinic hours or has invalid room.`);
                }
            });
        }

        if (!afternoonConf.show && !eveningConf.show) {
            if(noAppointmentsMessage) {
               noAppointmentsMessage.textContent = "此日期為休診日。";
               noAppointmentsMessage.classList.remove('hidden');
            }
            console.log("[calendar.js] No sessions active for this day.");
        } else if (!appointmentsFoundInTotal) {
            if(noAppointmentsMessage) {
                noAppointmentsMessage.textContent = "此日期查無已預約記錄。";
                noAppointmentsMessage.classList.remove('hidden');
            }
            console.log("[calendar.js] Sessions active, but no appointments found for this date.");
        } else { // Appointments found and rendered
            if(noAppointmentsMessage) noAppointmentsMessage.classList.add('hidden');
            console.log("[calendar.js] Appointments found and should be rendered.");
        }
    }

    // --- 事件監聽器設定 ---
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            selectedDate = null;
            renderCalendar();
            clearAppointmentsDisplayAndTimeline();
        });
    } else {
        console.error("[calendar.js] prevMonthBtn not found");
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            selectedDate = null;
            renderCalendar();
            clearAppointmentsDisplayAndTimeline();
        });
    } else {
        console.error("[calendar.js] nextMonthBtn not found");
    }

    // --- 初始化呼叫 ---
    console.log("[calendar.js] Initializing calendar render and loading today's appointments...");
    renderCalendar(); 
    
    const todayString = new Date().toISOString().split('T')[0];
    const todayCell = calendarDaysContainer ? calendarDaysContainer.querySelector(`.calendar-day-cell[data-date="${todayString}"]`) : null;
    if (todayCell) {
        console.log("[calendar.js] Simulating click on today's cell.");
        todayCell.click(); 
    } else {
        console.warn("[calendar.js] Today's cell not found on initial render, or calendarDaysContainer is null. No appointments loaded by default.");
        clearAppointmentsDisplayAndTimeline();
        if(noAppointmentsMessage) {
            noAppointmentsMessage.textContent = "請從左側日曆選擇日期以查看預約。";
            noAppointmentsMessage.classList.remove('hidden');
        }
    }
}