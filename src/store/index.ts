import { create } from 'zustand';
import {
  Medicine,
  MedicineRecord,
  HealthRecord,
  FamilyMember,
  AppSettings,
  WeeklyStats,
  MedicineTimeSlot,
  MedicineStatus,
  HealthRecordType
} from '@/types';
import {
  generateId,
  getTodayDate,
  formatTime,
  calculateWeeklyStats,
  calculateTodayProgress,
  checkConsecutiveMissed,
  speakText,
  stopSpeak,
  setStorage,
  getStorage,
  STORAGE_KEYS,
  getGlobalReminderTimes,
  setGlobalReminderTimes,
  updateGlobalReminderTime,
  generateTodayRecords,
  checkAndUpdateMissed,
  checkReminderTriggers,
  ReminderTrigger,
  ConsecutiveMissedDetail,
  getConsecutiveMissedDetail
} from '@/utils';
import {
  mockMedicines,
  mockMedicineRecords,
  mockHealthRecords,
  mockFamilyMembers,
  mockAppSettings
} from '@/data/mock';

interface AppState {
  medicines: Medicine[];
  medicineRecords: MedicineRecord[];
  healthRecords: HealthRecord[];
  familyMembers: FamilyMember[];
  settings: AppSettings;
  globalReminderTimes: Record<MedicineTimeSlot, string>;
  lastTriggeredReminders: Record<string, boolean>;
  isSpeaking: boolean;
  isInitialized: boolean;

  init: () => void;
  persistAll: () => void;

  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt'>) => Medicine;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  toggleMedicineActive: (id: string) => void;

  updateRecordStatus: (recordId: string, status: MedicineStatus) => void;
  takeMedicine: (recordId: string) => void;
  skipMedicine: (recordId: string) => void;
  markMissed: (recordId: string) => void;
  catchUpMedicine: (recordId: string) => void;
  getTodayRecords: () => MedicineRecord[];
  getRecordsByTimeSlot: (slot: MedicineTimeSlot) => MedicineRecord[];
  refreshTodayRecords: () => void;

  addHealthRecord: (record: Omit<HealthRecord, 'id'>) => HealthRecord;
  updateHealthRecord: (id: string, updates: Partial<HealthRecord>) => void;
  deleteHealthRecord: (id: string) => void;
  getHealthRecordsByType: (type: HealthRecordType) => HealthRecord[];

  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => FamilyMember;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteFamilyMember: (id: string) => void;

  updateSettings: (updates: Partial<AppSettings>) => void;
  updateReminderSettings: (updates: Partial<AppSettings['reminder']>) => void;
  setAppMode: (mode: AppSettings['mode']) => void;
  setFontSize: (size: AppSettings['fontSize']) => void;

  updateGlobalReminderTime: (slot: MedicineTimeSlot, time: string) => void;
  updateAllGlobalReminderTimes: (times: Record<MedicineTimeSlot, string>) => void;

  speak: (text: string) => void;
  stopSpeaking: () => void;

  checkMissedStatus: () => { updated: boolean; missedItems: MedicineRecord[] };
  checkAndTriggerReminders: () => { shouldTrigger: boolean; triggers: ReminderTrigger[] };

  getWeeklyStats: () => WeeklyStats[];
  getTodayProgress: () => { total: number; taken: number; percentage: number };
  hasConsecutiveMissed: () => boolean;
  getConsecutiveMissedDetail: () => ConsecutiveMissedDetail;
}

const initialState: Omit<AppState, 'init' | 'persistAll' | keyof { [K in keyof AppState as AppState[K] extends Function ? K : never]: AppState[K] }> = {
  medicines: [],
  medicineRecords: [],
  healthRecords: [],
  familyMembers: [],
  settings: mockAppSettings,
  globalReminderTimes: {
    morning: '08:00',
    noon: '12:30',
    evening: '18:30',
    night: '21:30'
  },
  lastTriggeredReminders: {},
  isSpeaking: false,
  isInitialized: false
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  init: () => {
    const { isInitialized, refreshTodayRecords, checkMissedStatus } = get();
    if (isInitialized) return;

    console.log('[Store] 初始化应用状态...');

    const storedMedicines = getStorage<Medicine[]>(STORAGE_KEYS.MEDICINES, []);
    const storedRecords = getStorage<MedicineRecord[]>(STORAGE_KEYS.MEDICINE_RECORDS, []);
    const storedHealth = getStorage<HealthRecord[]>(STORAGE_KEYS.HEALTH_RECORDS, []);
    const storedFamily = getStorage<FamilyMember[]>(STORAGE_KEYS.FAMILY_MEMBERS, []);
    const storedSettings = getStorage<AppSettings | null>(STORAGE_KEYS.SETTINGS, null);
    const storedGlobalTimes = getStorage<Record<MedicineTimeSlot, string> | null>(
      STORAGE_KEYS.GLOBAL_REMINDER_TIMES,
      null
    );
    const storedLastTriggered = getStorage<Record<string, boolean>>(
      STORAGE_KEYS.LAST_TRIGGERED_REMINDERS,
      {}
    );

    const today = getTodayDate();
    const hasTodayTriggered = Object.keys(storedLastTriggered).some(key => key.includes(today));
    const clearedLastTriggered = hasTodayTriggered ? storedLastTriggered : {};

    const hasStoredData = storedMedicines.length > 0 || storedRecords.length > 0;
    const finalMedicines = hasStoredData ? storedMedicines : mockMedicines;
    const finalRecords = hasStoredData ? storedRecords : mockMedicineRecords;
    const finalHealth = storedHealth.length > 0 ? storedHealth : mockHealthRecords;
    const finalFamily = storedFamily.length > 0 ? storedFamily : mockFamilyMembers;
    const finalSettings = storedSettings || mockAppSettings;
    const finalGlobalTimes = storedGlobalTimes || getGlobalReminderTimes();

    set({
      medicines: finalMedicines,
      medicineRecords: finalRecords,
      healthRecords: finalHealth,
      familyMembers: finalFamily,
      settings: finalSettings,
      globalReminderTimes: finalGlobalTimes,
      lastTriggeredReminders: clearedLastTriggered,
      isInitialized: true
    });

    console.log('[Store] 初始化完成', {
      medicines: finalMedicines.length,
      records: finalRecords.length,
      health: finalHealth.length,
      family: finalFamily.length
    });

    setTimeout(() => {
      refreshTodayRecords();
      setTimeout(() => {
        const result = checkMissedStatus();
        if (result.updated) {
          console.log('[Store] 初始化时检测到漏服:', result.missedItems.length, '项');
        }
      }, 100);
    }, 50);
  },

  persistAll: () => {
    const {
      medicines,
      medicineRecords,
      healthRecords,
      familyMembers,
      settings,
      globalReminderTimes,
      lastTriggeredReminders
    } = get();

    setStorage(STORAGE_KEYS.MEDICINES, medicines);
    setStorage(STORAGE_KEYS.MEDICINE_RECORDS, medicineRecords);
    setStorage(STORAGE_KEYS.HEALTH_RECORDS, healthRecords);
    setStorage(STORAGE_KEYS.FAMILY_MEMBERS, familyMembers);
    setStorage(STORAGE_KEYS.SETTINGS, settings);
    setStorage(STORAGE_KEYS.GLOBAL_REMINDER_TIMES, globalReminderTimes);
    setStorage(STORAGE_KEYS.LAST_TRIGGERED_REMINDERS, lastTriggeredReminders);

    console.log('[Store] 所有状态已持久化');
  },

  addMedicine: (medicine) => {
    const newMedicine: Medicine = {
      ...medicine,
      id: generateId(),
      createdAt: getTodayDate()
    };
    set(state => ({
      medicines: [...state.medicines, newMedicine]
    }));
    get().persistAll();
    setTimeout(() => get().refreshTodayRecords(), 50);
    console.log('[Store] 添加药品:', newMedicine.name);
    return newMedicine;
  },

  updateMedicine: (id, updates) => {
    set(state => ({
      medicines: state.medicines.map(m =>
        m.id === id ? { ...m, ...updates } : m
      )
    }));
    get().persistAll();
    setTimeout(() => get().refreshTodayRecords(), 50);
    console.log('[Store] 更新药品:', id);
  },

  deleteMedicine: (id) => {
    const medicine = get().medicines.find(m => m.id === id);
    set(state => ({
      medicines: state.medicines.filter(m => m.id !== id),
      medicineRecords: state.medicineRecords.filter(r => r.medicineId !== id)
    }));
    get().persistAll();
    console.log('[Store] 删除药品:', medicine?.name || id);
  },

  toggleMedicineActive: (id) => {
    set(state => ({
      medicines: state.medicines.map(m =>
        m.id === id ? { ...m, isActive: !m.isActive } : m
      )
    }));
    get().persistAll();
    setTimeout(() => get().refreshTodayRecords(), 50);
  },

  updateRecordStatus: (recordId, status) => {
    const updates: Partial<MedicineRecord> = { status };
    if (status === 'taken') {
      updates.takenTime = formatTime(new Date());
    }
    set(state => ({
      medicineRecords: state.medicineRecords.map(r =>
        r.id === recordId ? { ...r, ...updates } : r
      )
    }));
    get().persistAll();
    console.log('[Store] 更新服药记录:', recordId, '状态:', status);
  },

  takeMedicine: (recordId) => {
    get().updateRecordStatus(recordId, 'taken');
  },

  skipMedicine: (recordId) => {
    get().updateRecordStatus(recordId, 'skipped');
  },

  markMissed: (recordId) => {
    get().updateRecordStatus(recordId, 'missed');
  },

  catchUpMedicine: (recordId) => {
    get().updateRecordStatus(recordId, 'taken');
  },

  getTodayRecords: () => {
    const today = getTodayDate();
    return get().medicineRecords.filter(r => r.date === today);
  },

  getRecordsByTimeSlot: (slot) => {
    const today = getTodayDate();
    return get().medicineRecords.filter(r => r.date === today && r.timeSlot === slot);
  },

  refreshTodayRecords: () => {
    const { medicines, medicineRecords, globalReminderTimes } = get();
    const today = getTodayDate();
    const recordsExceptToday = medicineRecords.filter(r => r.date !== today);
    const todayRecords = generateTodayRecords(medicines, globalReminderTimes, medicineRecords);
    
    set({
      medicineRecords: [...recordsExceptToday, ...todayRecords]
    });
    get().persistAll();
    console.log('[Store] 今日记录已刷新:', todayRecords.length, '条');
  },

  addHealthRecord: (record) => {
    const newRecord: HealthRecord = {
      ...record,
      id: generateId()
    };
    set(state => ({
      healthRecords: [newRecord, ...state.healthRecords]
    }));
    get().persistAll();
    console.log('[Store] 添加健康记录:', newRecord.type, newRecord.value);
    return newRecord;
  },

  updateHealthRecord: (id, updates) => {
    set(state => ({
      healthRecords: state.healthRecords.map(r =>
        r.id === id ? { ...r, ...updates } : r
      )
    }));
    get().persistAll();
  },

  deleteHealthRecord: (id) => {
    set(state => ({
      healthRecords: state.healthRecords.filter(r => r.id !== id)
    }));
    get().persistAll();
  },

  getHealthRecordsByType: (type) => {
    return get().healthRecords
      .filter(r => r.type === type)
      .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
  },

  addFamilyMember: (member) => {
    const newMember: FamilyMember = {
      ...member,
      id: generateId()
    };
    set(state => ({
      familyMembers: [...state.familyMembers, newMember]
    }));
    get().persistAll();
    console.log('[Store] 添加家属:', newMember.name);
    return newMember;
  },

  updateFamilyMember: (id, updates) => {
    set(state => ({
      familyMembers: state.familyMembers.map(m =>
        m.id === id ? { ...m, ...updates } : m
      )
    }));
    get().persistAll();
  },

  deleteFamilyMember: (id) => {
    set(state => ({
      familyMembers: state.familyMembers.filter(m => m.id !== id)
    }));
    get().persistAll();
  },

  updateSettings: (updates) => {
    set(state => ({
      settings: { ...state.settings, ...updates }
    }));
    get().persistAll();
    console.log('[Store] 更新设置:', updates);
  },

  updateReminderSettings: (updates) => {
    set(state => ({
      settings: {
        ...state.settings,
        reminder: { ...state.settings.reminder, ...updates }
      }
    }));
    get().persistAll();
  },

  setAppMode: (mode) => {
    get().updateSettings({ mode });
  },

  setFontSize: (fontSize) => {
    get().updateSettings({ fontSize });
  },

  updateGlobalReminderTime: (slot, time) => {
    const newTimes = updateGlobalReminderTime(slot, time);
    set({ globalReminderTimes: newTimes });
    
    set(state => ({
      medicines: state.medicines.map(m => ({
        ...m,
        reminderTimes: {
          ...m.reminderTimes,
          [slot]: m.timeSlots.includes(slot) ? time : m.reminderTimes[slot]
        }
      })),
      medicineRecords: state.medicineRecords.map(r =>
        r.timeSlot === slot && r.date === getTodayDate()
          ? { ...r, scheduledTime: time }
          : r
      )
    }));
    get().persistAll();
    console.log('[Store] 更新全局提醒时间:', slot, '->', time);
  },

  updateAllGlobalReminderTimes: (times) => {
    setGlobalReminderTimes(times);
    set({ globalReminderTimes: times });
    
    set(state => ({
      medicines: state.medicines.map(m => {
        const newReminderTimes = { ...m.reminderTimes };
        m.timeSlots.forEach(slot => {
          newReminderTimes[slot] = times[slot];
        });
        return { ...m, reminderTimes: newReminderTimes };
      }),
      medicineRecords: state.medicineRecords.map(r =>
        r.date === getTodayDate()
          ? { ...r, scheduledTime: times[r.timeSlot] }
          : r
      )
    }));
    get().persistAll();
    console.log('[Store] 更新所有全局提醒时间:', times);
  },

  speak: (text) => {
    const { settings } = get();
    set({ isSpeaking: true });
    speakText(
      text,
      settings.reminder.volume / 100,
      settings.reminder.voiceSpeed
    );
    setTimeout(() => set({ isSpeaking: false }), 3000);
  },

  stopSpeaking: () => {
    stopSpeak();
    set({ isSpeaking: false });
  },

  checkMissedStatus: () => {
    const { medicineRecords, settings } = get();
    const graceMinutes = settings.reminder.preAlertMinutes > 0 
      ? settings.reminder.preAlertMinutes 
      : 30;
    const result = checkAndUpdateMissed(medicineRecords, graceMinutes);
    
    if (result.updated) {
      set({ medicineRecords: result.records });
      get().persistAll();
    }
    return result;
  },

  checkAndTriggerReminders: () => {
    const { medicineRecords, lastTriggeredReminders, settings, speak } = get();
    const result = checkReminderTriggers(
      medicineRecords,
      lastTriggeredReminders,
      settings.reminder.preAlertMinutes > 0 ? settings.reminder.preAlertMinutes : 5
    );

    if (result.shouldTrigger) {
      set({ lastTriggeredReminders: result.newLastTriggered });
      get().persistAll();

      if (settings.reminder.voiceEnabled) {
        const message = result.triggers
          .map(t => t.speakText)
          .join('。');
        speak(message);
      }
    }
    return result;
  },

  getWeeklyStats: () => {
    return calculateWeeklyStats(get().medicineRecords);
  },

  getTodayProgress: () => {
    return calculateTodayProgress(get().medicineRecords);
  },

  hasConsecutiveMissed: () => {
    return checkConsecutiveMissed(get().medicineRecords, 3);
  },

  getConsecutiveMissedDetail: () => {
    return getConsecutiveMissedDetail(get().medicineRecords, 7);
  }
}));
