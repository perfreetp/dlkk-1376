import { Medicine, MedicineRecord, HealthRecord, FamilyMember, AppSettings, WeeklyStats } from '@/types';
import { generateId, getTodayDate, formatTime, calculateWeeklyStats } from '@/utils';

const MEDICINE_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#dda0dd',
  '#98d8c8',
  '#f7dc6f'
];

export const mockMedicines: Medicine[] = [
  {
    id: generateId(),
    name: '阿司匹林肠溶片',
    dosage: '每次1片，100mg',
    frequency: '每日一次',
    color: MEDICINE_COLORS[0],
    image: 'https://picsum.photos/id/1/200/200',
    description: '用于预防心脑血管疾病，饭后服用',
    timeSlots: ['morning'],
    reminderTimes: {
      morning: '08:00',
      noon: '',
      evening: '',
      night: ''
    },
    createdAt: '2024-01-01',
    isActive: true
  },
  {
    id: generateId(),
    name: '二甲双胍片',
    dosage: '每次1片，500mg',
    frequency: '每日三次',
    color: MEDICINE_COLORS[1],
    image: 'https://picsum.photos/id/2/200/200',
    description: '用于治疗2型糖尿病，随餐服用',
    timeSlots: ['morning', 'noon', 'evening'],
    reminderTimes: {
      morning: '08:00',
      noon: '12:30',
      evening: '18:30',
      night: ''
    },
    createdAt: '2024-01-01',
    isActive: true
  },
  {
    id: generateId(),
    name: '氨氯地平片',
    dosage: '每次1片，5mg',
    frequency: '每日一次',
    color: MEDICINE_COLORS[2],
    image: 'https://picsum.photos/id/3/200/200',
    description: '用于治疗高血压，早晨服用效果更佳',
    timeSlots: ['morning'],
    reminderTimes: {
      morning: '07:30',
      noon: '',
      evening: '',
      night: ''
    },
    createdAt: '2024-01-05',
    isActive: true
  },
  {
    id: generateId(),
    name: '阿托伐他汀钙片',
    dosage: '每次1片，20mg',
    frequency: '每日一次',
    color: MEDICINE_COLORS[3],
    image: 'https://picsum.photos/id/6/200/200',
    description: '用于调节血脂，睡前服用',
    timeSlots: ['night'],
    reminderTimes: {
      morning: '',
      noon: '',
      evening: '',
      night: '21:30'
    },
    createdAt: '2024-01-10',
    isActive: true
  },
  {
    id: generateId(),
    name: '维生素D3',
    dosage: '每次1粒，1000IU',
    frequency: '每日一次',
    color: MEDICINE_COLORS[4],
    image: 'https://picsum.photos/id/8/200/200',
    description: '补充维生素D，促进钙吸收，饭后服用',
    timeSlots: ['noon'],
    reminderTimes: {
      morning: '',
      noon: '13:00',
      evening: '',
      night: ''
    },
    createdAt: '2024-01-15',
    isActive: true
  },
  {
    id: generateId(),
    name: '奥美拉唑肠溶胶囊',
    dosage: '每次1粒，20mg',
    frequency: '每日一次',
    color: MEDICINE_COLORS[5],
    image: 'https://picsum.photos/id/9/200/200',
    description: '用于抑制胃酸分泌，饭前半小时服用',
    timeSlots: ['morning'],
    reminderTimes: {
      morning: '07:00',
      noon: '',
      evening: '',
      night: ''
    },
    createdAt: '2024-02-01',
    isActive: false
  }
];

export const generateMockMedicineRecords = (): MedicineRecord[] => {
  const records: MedicineRecord[] = [];
  const today = getTodayDate();
  
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    
    mockMedicines.filter(m => m.isActive).forEach(medicine => {
      medicine.timeSlots.forEach(slot => {
        const scheduledTime = medicine.reminderTimes[slot];
        if (!scheduledTime) return;
        
        let status: 'pending' | 'taken' | 'missed' | 'skipped' = 'taken';
        let takenTime: string | undefined = undefined;
        
        if (dateStr === today) {
          const [hours] = scheduledTime.split(':').map(Number);
          const currentHour = new Date().getHours();
          if (currentHour < hours) {
            status = 'pending';
          } else if (Math.random() > 0.2) {
            status = 'taken';
            takenTime = formatTime(new Date(date.setHours(hours + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30))));
          } else {
            status = 'missed';
          }
        } else {
          const random = Math.random();
          if (random > 0.1) {
            status = 'taken';
            takenTime = formatTime(new Date(date.setHours(8 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 30))));
          } else if (random > 0.05) {
            status = 'missed';
          } else {
            status = 'skipped';
          }
        }
        
        records.push({
          id: generateId(),
          medicineId: medicine.id,
          medicineName: medicine.name,
          medicineColor: medicine.color,
          dosage: medicine.dosage,
          timeSlot: slot,
          scheduledTime,
          status,
          takenTime,
          date: dateStr,
          note: ''
        });
      });
    });
  }
  
  return records;
};

export const mockMedicineRecords = generateMockMedicineRecords();

export const mockHealthRecords: HealthRecord[] = [
  {
    id: generateId(),
    type: 'bloodPressure',
    value: 135,
    value2: 85,
    unit: 'mmHg',
    date: getTodayDate(),
    time: '08:00',
    note: '早晨空腹测量'
  },
  {
    id: generateId(),
    type: 'bloodSugar',
    value: 6.8,
    unit: 'mmol/L',
    date: getTodayDate(),
    time: '07:30',
    note: '空腹血糖'
  },
  {
    id: generateId(),
    type: 'heartRate',
    value: 72,
    unit: '次/分',
    date: getTodayDate(),
    time: '08:05',
    note: ''
  },
  {
    id: generateId(),
    type: 'weight',
    value: 68.5,
    unit: 'kg',
    date: getTodayDate(),
    time: '07:20',
    note: ''
  },
  {
    id: generateId(),
    type: 'bloodPressure',
    value: 130,
    value2: 82,
    unit: 'mmHg',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '08:10',
    note: ''
  },
  {
    id: generateId(),
    type: 'bloodSugar',
    value: 7.2,
    unit: 'mmol/L',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '07:40',
    note: '餐后2小时'
  },
  {
    id: generateId(),
    type: 'bloodPressure',
    value: 128,
    value2: 80,
    unit: 'mmHg',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    time: '07:50',
    note: ''
  },
  {
    id: generateId(),
    type: 'heartRate',
    value: 75,
    unit: '次/分',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    time: '08:00',
    note: ''
  }
];

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: generateId(),
    name: '张小明',
    relation: '儿子',
    phone: '138****8888',
    avatar: 'https://picsum.photos/id/64/200/200',
    canEditReminder: true,
    canViewRecord: true,
    receiveAlert: true,
    isBound: true
  },
  {
    id: generateId(),
    name: '李小红',
    relation: '女儿',
    phone: '139****9999',
    avatar: 'https://picsum.photos/id/91/200/200',
    canEditReminder: true,
    canViewRecord: true,
    receiveAlert: true,
    isBound: true
  },
  {
    id: generateId(),
    name: '张医生',
    relation: '家庭医生',
    phone: '137****7777',
    avatar: 'https://picsum.photos/id/177/200/200',
    canEditReminder: false,
    canViewRecord: true,
    receiveAlert: false,
    isBound: true
  }
];

export const mockAppSettings: AppSettings = {
  mode: 'normal',
  fontSize: 'large',
  reminder: {
    enabled: true,
    volume: 80,
    voiceEnabled: true,
    voiceSpeed: 0.8,
    repeatCount: 3,
    intervalMinutes: 5,
    preAlertMinutes: 0
  }
};

export const mockWeeklyStats: WeeklyStats[] = calculateWeeklyStats(mockMedicineRecords);

export const getMedicines = (): Medicine[] => {
  return mockMedicines;
};

export const getActiveMedicines = (): Medicine[] => {
  return mockMedicines.filter(m => m.isActive);
};

export const getMedicineRecords = (): MedicineRecord[] => {
  return mockMedicineRecords;
};

export const getHealthRecords = (): HealthRecord[] => {
  return mockHealthRecords;
};

export const getFamilyMembers = (): FamilyMember[] => {
  return mockFamilyMembers;
};

export const getAppSettings = (): AppSettings => {
  return mockAppSettings;
};

export const getWeeklyStats = (): WeeklyStats[] => {
  return mockWeeklyStats;
};
