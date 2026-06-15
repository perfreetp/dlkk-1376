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
  stopSpeak
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
  isSpeaking: boolean;
  
  // Medicine actions
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt'>) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  toggleMedicineActive: (id: string) => void;
  
  // Medicine record actions
  updateRecordStatus: (recordId: string, status: MedicineStatus) => void;
  takeMedicine: (recordId: string) => void;
  skipMedicine: (recordId: string) => void;
  markMissed: (recordId: string) => void;
  getTodayRecords: () => MedicineRecord[];
  getRecordsByTimeSlot: (slot: MedicineTimeSlot) => MedicineRecord[];
  
  // Health record actions
  addHealthRecord: (record: Omit<HealthRecord, 'id'>) => void;
  updateHealthRecord: (id: string, updates: Partial<HealthRecord>) => void;
  deleteHealthRecord: (id: string) => void;
  getHealthRecordsByType: (type: HealthRecordType) => HealthRecord[];
  
  // Family actions
  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteFamilyMember: (id: string) => void;
  
  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateReminderSettings: (updates: Partial<AppSettings['reminder']>) => void;
  setAppMode: (mode: AppSettings['mode']) => void;
  setFontSize: (size: AppSettings['fontSize']) => void;
  
  // Voice actions
  speak: (text: string) => void;
  stopSpeaking: () => void;
  
  // Computed
  getWeeklyStats: () => WeeklyStats[];
  getTodayProgress: () => { total: number; taken: number; percentage: number };
  hasConsecutiveMissed: () => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  medicines: [...mockMedicines],
  medicineRecords: [...mockMedicineRecords],
  healthRecords: [...mockHealthRecords],
  familyMembers: [...mockFamilyMembers],
  settings: { ...mockAppSettings },
  isSpeaking: false,

  addMedicine: (medicine) => {
    const newMedicine: Medicine = {
      ...medicine,
      id: generateId(),
      createdAt: getTodayDate()
    };
    set(state => ({
      medicines: [...state.medicines, newMedicine]
    }));
    console.log('[Store] 添加药品:', newMedicine.name);
  },

  updateMedicine: (id, updates) => {
    set(state => ({
      medicines: state.medicines.map(m =>
        m.id === id ? { ...m, ...updates } : m
      )
    }));
    console.log('[Store] 更新药品:', id);
  },

  deleteMedicine: (id) => {
    set(state => ({
      medicines: state.medicines.filter(m => m.id !== id)
    }));
    console.log('[Store] 删除药品:', id);
  },

  toggleMedicineActive: (id) => {
    set(state => ({
      medicines: state.medicines.map(m =>
        m.id === id ? { ...m, isActive: !m.isActive } : m
      )
    }));
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

  getTodayRecords: () => {
    const today = getTodayDate();
    return get().medicineRecords.filter(r => r.date === today);
  },

  getRecordsByTimeSlot: (slot) => {
    const today = getTodayDate();
    return get().medicineRecords.filter(r => r.date === today && r.timeSlot === slot);
  },

  addHealthRecord: (record) => {
    const newRecord: HealthRecord = {
      ...record,
      id: generateId()
    };
    set(state => ({
      healthRecords: [newRecord, ...state.healthRecords]
    }));
    console.log('[Store] 添加健康记录:', newRecord.type, newRecord.value);
  },

  updateHealthRecord: (id, updates) => {
    set(state => ({
      healthRecords: state.healthRecords.map(r =>
        r.id === id ? { ...r, ...updates } : r
      )
    }));
  },

  deleteHealthRecord: (id) => {
    set(state => ({
      healthRecords: state.healthRecords.filter(r => r.id !== id)
    }));
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
    console.log('[Store] 添加家属:', newMember.name);
  },

  updateFamilyMember: (id, updates) => {
    set(state => ({
      familyMembers: state.familyMembers.map(m =>
        m.id === id ? { ...m, ...updates } : m
      )
    }));
  },

  deleteFamilyMember: (id) => {
    set(state => ({
      familyMembers: state.familyMembers.filter(m => m.id !== id)
    }));
  },

  updateSettings: (updates) => {
    set(state => ({
      settings: { ...state.settings, ...updates }
    }));
    console.log('[Store] 更新设置:', updates);
  },

  updateReminderSettings: (updates) => {
    set(state => ({
      settings: {
        ...state.settings,
        reminder: { ...state.settings.reminder, ...updates }
      }
    }));
  },

  setAppMode: (mode) => {
    get().updateSettings({ mode });
  },

  setFontSize: (fontSize) => {
    get().updateSettings({ fontSize });
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

  getWeeklyStats: () => {
    return calculateWeeklyStats(get().medicineRecords);
  },

  getTodayProgress: () => {
    return calculateTodayProgress(get().medicineRecords);
  },

  hasConsecutiveMissed: () => {
    return checkConsecutiveMissed(get().medicineRecords, 3);
  }
}));
