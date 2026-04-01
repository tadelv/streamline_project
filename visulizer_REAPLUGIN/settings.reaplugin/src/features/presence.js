export function formatDaysOfWeek(days) {
  if (!days || days.length === 0) {
    return 'Every day';
  }
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day) => dayNames[day - 1]).join(', ');
}

export function buildPresenceSchedulesHtml(schedules) {
  return schedules.map((schedule) => (
    '<div class="bg-[var(--profile-button-background-color)] rounded-lg p-4 flex items-center justify-between" data-schedule-id="' + schedule.id + '">' +
      '<div class="flex-grow">' +
        '<div class="text-[22px] font-semibold text-[var(--text-primary)]">' + schedule.time + ' - ' + formatDaysOfWeek(schedule.daysOfWeek) + '</div>' +
      '</div>' +
      '<div class="flex items-center gap-4">' +
        '<input type="checkbox" class="toggle toggle-md toggle-primary" ' + (schedule.enabled ? 'checked' : '') + ' onchange="handleScheduleToggle(\'' + schedule.id + '\', this.checked)">' +
        '<button class="settings-btn-danger" onclick="handleDeleteSchedule(\'' + schedule.id + '\')">Delete</button>' +
      '</div>' +
    '</div>'
  )).join('');
}

export function buildPresenceActiveHoursHtml(activeHours) {
  return activeHours.map((activeHour) => (
    '<div class="bg-[var(--profile-button-background-color)] rounded-lg p-4 flex items-center justify-between" data-active-hour-id="' + activeHour.id + '">' +
      '<div class="flex-grow">' +
        '<div class="text-[22px] font-semibold text-[var(--text-primary)]">' + activeHour.startTime + ' - ' + activeHour.endTime + ' ' + formatDaysOfWeek(activeHour.daysOfWeek) + '</div>' +
      '</div>' +
      '<div class="flex items-center gap-4">' +
        '<input type="checkbox" class="toggle toggle-md toggle-primary" ' + (activeHour.enabled ? 'checked' : '') + ' onchange="handleActiveHourToggle(\'' + activeHour.id + '\', this.checked)">' +
        '<button class="settings-btn-danger" onclick="handleDeleteActiveHour(\'' + activeHour.id + '\')">Delete</button>' +
      '</div>' +
    '</div>'
  )).join('');
}

export function renderPresenceScheduleModal() {
  return '<dialog id="add-schedule-modal" class="modal">' +
    '<div class="modal-box bg-[var(--box-color)] max-w-2xl">' +
      '<h3 class="font-bold text-[24px] text-[var(--text-primary)] mb-4">Add Schedule</h3>' +
      '<div class="space-y-4">' +
        '<div>' +
          '<label class="text-[20px] text-[var(--text-primary)] block mb-2">Wake Time</label>' +
          '<input type="time" id="schedule-time-input" class="settings-input-primary">' +
        '</div>' +
        '<div>' +
          '<label class="text-[20px] text-[var(--text-primary)] block mb-2">Days of Week</label>' +
          '<div class="flex gap-2 flex-wrap">' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="1" class="checkbox checkbox-primary mr-1"> Mon</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="2" class="checkbox checkbox-primary mr-1"> Tue</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="3" class="checkbox checkbox-primary mr-1"> Wed</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="4" class="checkbox checkbox-primary mr-1"> Thu</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="5" class="checkbox checkbox-primary mr-1"> Fri</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="6" class="checkbox checkbox-primary mr-1"> Sat</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="7" class="checkbox checkbox-primary mr-1"> Sun</label>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-action">' +
        '<button class="settings-btn-secondary" onclick="document.getElementById(\'add-schedule-modal\').close()">Cancel</button>' +
        '<button class="settings-btn-primary" onclick="handleSaveSchedule()">Save</button>' +
      '</div>' +
    '</div>' +
  '</dialog>';
}

export function renderPresenceActiveHourModal() {
  return '<dialog id="add-active-hour-modal" class="modal">' +
    '<div class="modal-box bg-[var(--box-color)] max-w-2xl">' +
      '<h3 class="font-bold text-[24px] text-[var(--text-primary)] mb-4">Add Active Hours</h3>' +
      '<div class="space-y-4">' +
        '<div>' +
          '<label class="text-[20px] text-[var(--text-primary)] block mb-2">Start Time</label>' +
          '<input type="time" id="active-hour-start-input" class="settings-input-primary">' +
        '</div>' +
        '<div>' +
          '<label class="text-[20px] text-[var(--text-primary)] block mb-2">End Time</label>' +
          '<input type="time" id="active-hour-end-input" class="settings-input-primary">' +
        '</div>' +
        '<div>' +
          '<label class="text-[20px] text-[var(--text-primary)] block mb-2">Days of Week</label>' +
          '<div class="flex gap-2 flex-wrap">' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="1" class="checkbox checkbox-primary mr-1"> Mon</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="2" class="checkbox checkbox-primary mr-1"> Tue</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="3" class="checkbox checkbox-primary mr-1"> Wed</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="4" class="checkbox checkbox-primary mr-1"> Thu</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="5" class="checkbox checkbox-primary mr-1"> Fri</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="6" class="checkbox checkbox-primary mr-1"> Sat</label>' +
            '<label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="7" class="checkbox checkbox-primary mr-1"> Sun</label>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-action">' +
        '<button class="settings-btn-secondary" onclick="document.getElementById(\'add-active-hour-modal\').close()">Cancel</button>' +
        '<button class="settings-btn-primary" onclick="handleSaveActiveHour()">Save</button>' +
      '</div>' +
    '</div>' +
  '</dialog>';
}

export function renderPresenceSection({ presenceSettings = {}, activeHours = [] }) {
  const schedules = Array.isArray(presenceSettings.schedules) ? presenceSettings.schedules : [];
  const schedulesHtml = buildPresenceSchedulesHtml(schedules);
  const activeHoursHtml = buildPresenceActiveHoursHtml(activeHours);

  return [
    '                <div class="space-y-6 px-[60px] py-[80px]">',
    '                    <div>',
    '                        <h2 class="text-[28px] font-bold text-[var(--text-primary)] mb-4">Presence Detection</h2>',
    '                        <p class="text-[var(--text-primary)] text-[20px] mb-6 opacity-75">Automatically manage machine sleep/wake based on user presence and schedules.</p>',
    '                    </div>',
    '                    <div class="bg-[var(--box-color)] rounded-lg p-6">',
    '                        <div class="flex items-center justify-between mb-6">',
    '                            <div>',
    '                                <label class="text-[24px] font-semibold text-[var(--text-primary)]">Enable Presence Detection</label>',
    '                                <p class="text-[18px] text-[var(--text-primary)] opacity-75 mt-1">Track user presence to automatically sleep the machine</p>',
    '                            </div>',
    '                            <input type="checkbox" id="presence-enabled-toggle" class="toggle toggle-lg toggle-primary" ' + (presenceSettings.userPresenceEnabled ? 'checked' : '') + ' onchange="handlePresenceToggle(this.checked)">',
    '                        </div>',
    '                        <div class="mt-6">',
    '                            <label class="text-[22px] font-semibold text-[var(--text-primary)] block mb-3">Sleep Timeout (minutes)</label>',
    '                            <input type="number" id="sleep-timeout-input" class="settings-input-primary" value="' + (presenceSettings.sleepTimeoutMinutes || 30) + '" min="1" max="120" onchange="handleSleepTimeoutChange(this.value)">',
    '                            <p class="text-[18px] text-[var(--text-primary)] opacity-75 mt-2">Minutes of inactivity before auto-sleep</p>',
    '                        </div>',
    '                    </div>',
    '                    <div class="bg-[var(--box-color)] rounded-lg p-6">',
    '                        <div class="flex items-center justify-between mb-4">',
    '                            <h3 class="text-[24px] font-semibold text-[var(--text-primary)]">Wake Schedules</h3>',
    '                            <button class="settings-btn-primary" onclick="handleAddSchedule()">Add Schedule</button>',
    '                        </div>',
    '                        <div class="space-y-3">',
    schedules.length > 0 ? schedulesHtml : '                            <p class="text-[var(--text-primary)] opacity-75 text-[18px]">No schedules configured</p>',
    '                        </div>',
    '                    </div>',
    '                    <div class="bg-[var(--box-color)] rounded-lg p-6">',
    '                        <div class="flex items-center justify-between mb-4">',
    '                            <div>',
    '                                <h3 class="text-[24px] font-semibold text-[var(--text-primary)]">Active Hours</h3>',
    '                                <p class="text-[18px] text-[var(--text-primary)] opacity-75 mt-1">Machine stays awake during these time windows</p>',
    '                            </div>',
    '                            <button class="settings-btn-primary" onclick="handleAddActiveHour()">Add Active Hours</button>',
    '                        </div>',
    '                        <div class="space-y-3">',
    activeHours.length > 0 ? activeHoursHtml : '                            <p class="text-[var(--text-primary)] opacity-75 text-[18px]">No active hours configured</p>',
    '                        </div>',
    '                    </div>',
    renderPresenceScheduleModal(),
    renderPresenceActiveHourModal(),
    '                </div>',
  ].join('\n');
}
