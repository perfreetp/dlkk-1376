export type MedicineTimeSlot = 'morning' | 'noon' | 'evening' | 'night';

export type MedicineStatus = 'pending' | 'taken' | 'missed' | 'skipped';

export type HealthRecordType = 'bloodPressure' | 'bloodSugar' | 'heartRate' | 'weight';

export type AppMode = 'normal' | 'highContrast' | 'simple';

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  color: string;
  image?: string;
  description: string;
  timeSlots: MedicineTimeSlot[];
  reminderTimes: Record<MedicineTimeSlot, string>;
  createdAt: string;
  isActive: boolean;
}

export interface MedicineRecord {
  id: string;
  medicineId: string;
  medicineName: string;
  medicineColor: string;
  dosage: string;
  timeSlot: MedicineTimeSlot;
  scheduledTime: string;
  status: MedicineStatus;
  takenTime?: string;
  date: string;
  note?: string;
}

export interface HealthRecord {
  id: string;
  type: HealthRecordType;
  value: number;
  value2?: number;
  unit: string;
  date: string;
  time: string;
  note?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  phone: string;
  avatar?: string;
  canEditReminder: boolean;
  canViewRecord: boolean;
  receiveAlert: boolean;
  isBound: boolean;
}

export interface ReminderSetting {
  enabled: boolean;
  volume: number;
  voiceEnabled: boolean;
  voiceSpeed: number;
  repeatCount: number;
  intervalMinutes: number;
  preAlertMinutes: number;
}

export interface AppSettings {
  mode: AppMode;
  fontSize: 'normal' | 'large' | 'xlarge';
  reminder: ReminderSetting;
}

export interface WeeklyStats {
  date: string;
  dayName: string;
  totalCount: number;
  takenCount: number;
  missedCount: number;
  completionRate: number;
}

export const TIME_SLOT_LABELS: Record<MedicineTimeSlot, string> = {
  morning: '早上',
  noon: '中午',
  evening: '晚上',
  night: '睡前'
};

export const TIME_SLOT_ICONS: Record<MedicineTimeSlot, string> = {
  morning: '🌅',
  noon: '☀️',
  evening: '🌆',
  night: '🌙'
};

export const HEALTH_TYPE_LABELS: Record<HealthRecordType, string> = {
  bloodPressure: '血压',
  bloodSugar: '血糖',
  heartRate: '心率',
  weight: '体重'
};

export const HEALTH_TYPE_UNITS: Record<HealthRecordType, string> = {
  bloodPressure: 'mmHg',
  bloodSugar: 'mmol/L',
  heartRate: '次/分',
  weight: 'kg'
};
