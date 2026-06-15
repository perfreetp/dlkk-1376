import dayjs from 'dayjs';
import Taro from '@tarojs/taro';
import { MedicineTimeSlot, MedicineRecord, WeeklyStats, TIME_SLOT_LABELS, Medicine, MedicineStatus } from '@/types';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatDate = (date: string | Date = new Date(), format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatTime = (time: string | Date = new Date(), format: string = 'HH:mm'): string => {
  return dayjs(time).format(format);
};

export const formatDateTime = (datetime: string | Date = new Date()): string => {
  return dayjs(datetime).format('YYYY-MM-DD HH:mm');
};

export const getTodayDate = (): string => {
  return formatDate(new Date());
};

export const getCurrentTimeSlot = (): MedicineTimeSlot => {
  const hour = dayjs().hour();
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 20) return 'evening';
  return 'night';
};

export const getTimeSlotLabel = (slot: MedicineTimeSlot): string => {
  return TIME_SLOT_LABELS[slot];
};

export const getTimeSlotOrder = (slot: MedicineTimeSlot): number => {
  const order: Record<MedicineTimeSlot, number> = {
    morning: 0,
    noon: 1,
    evening: 2,
    night: 3
  };
  return order[slot];
};

export const sortTimeSlots = (slots: MedicineTimeSlot[]): MedicineTimeSlot[] => {
  return [...slots].sort((a, b) => getTimeSlotOrder(a) - getTimeSlotOrder(b));
};

export const isTimePassed = (timeStr: string): boolean => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = dayjs();
  const target = dayjs().hour(hours).minute(minutes);
  return now.isAfter(target);
};

export const calculateWeeklyStats = (records: MedicineRecord[]): WeeklyStats[] => {
  const stats: WeeklyStats[] = [];
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  for (let i = 6; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const dayRecords = records.filter(r => r.date === dateStr);
    
    const totalCount = dayRecords.length;
    const takenCount = dayRecords.filter(r => r.status === 'taken').length;
    const missedCount = dayRecords.filter(r => r.status === 'missed').length;
    const completionRate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;
    
    stats.push({
      date: dateStr,
      dayName: dayNames[date.day()],
      totalCount,
      takenCount,
      missedCount,
      completionRate
    });
  }
  
  return stats;
};

export const calculateTodayProgress = (records: MedicineRecord[]): { total: number; taken: number; percentage: number } => {
  const today = getTodayDate();
  const todayRecords = records.filter(r => r.date === today);
  const total = todayRecords.length;
  const taken = todayRecords.filter(r => r.status === 'taken').length;
  const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;
  
  return { total, taken, percentage };
};

export const checkConsecutiveMissed = (records: MedicineRecord[], days: number = 3): boolean => {
  if (records.length === 0) return false;
  
  const dateMap = new Map<string, boolean>();
  
  records.forEach(record => {
    if (record.status === 'missed') {
      dateMap.set(record.date, true);
    }
  });
  
  let consecutiveCount = 0;
  for (let i = days - 1; i >= 0; i--) {
    const dateStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    if (dateMap.has(dateStr)) {
      consecutiveCount++;
    } else {
      consecutiveCount = 0;
    }
  }
  
  return consecutiveCount >= days;
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待服用',
    taken: '已服用',
    missed: '漏服',
    skipped: '已跳过'
  };
  return map[status] || status;
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    pending: '#ff7d00',
    taken: '#00b42a',
    missed: '#f53f3f',
    skipped: '#86909c'
  };
  return map[status] || '#86909c';
};

export const speakText = (text: string, volume: number = 1, speed: number = 1): void => {
  console.log('[Speak] 语音播报:', text, '音量:', volume, '语速:', speed);
  
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.volume = volume;
      utterance.rate = speed;
      utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
      console.log('[Speak] 语音播报已启动');
    } else {
      console.log('[Speak] 浏览器不支持语音合成');
    }
  } catch (error) {
    console.error('[Speak] 语音播报失败:', error);
  }
};

export const stopSpeak = (): void => {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      console.log('[Speak] 语音播报已停止');
    }
  } catch (error) {
    console.error('[Speak] 停止语音失败:', error);
  }
};

export const validatePhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

export const validateNumber = (value: string): boolean => {
  return /^\d+(\.\d+)?$/.test(value);
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn(...args);
    }
  };
};

// ============================================
// 本地存储封装（兼容H5和小程序）
// ============================================

const STORAGE_PREFIX = 'medicine_app_';

export const setStorage = <T>(key: string, value: T): void => {
  const fullKey = STORAGE_PREFIX + key;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(fullKey, JSON.stringify(value));
    } else {
      Taro.setStorageSync(fullKey, JSON.stringify(value));
    }
    console.log('[Storage] 保存成功:', fullKey);
  } catch (error) {
    console.error('[Storage] 保存失败:', fullKey, error);
  }
};

export const getStorage = <T>(key: string, defaultValue: T): T => {
  const fullKey = STORAGE_PREFIX + key;
  try {
    let raw: string | null = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      raw = window.localStorage.getItem(fullKey);
    } else {
      raw = Taro.getStorageSync(fullKey) || null;
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      console.log('[Storage] 读取成功:', fullKey);
      return parsed as T;
    }
  } catch (error) {
    console.error('[Storage] 读取失败:', fullKey, error);
  }
  return defaultValue;
};

export const removeStorage = (key: string): void => {
  const fullKey = STORAGE_PREFIX + key;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(fullKey);
    } else {
      Taro.removeStorageSync(fullKey);
    }
    console.log('[Storage] 删除成功:', fullKey);
  } catch (error) {
    console.error('[Storage] 删除失败:', fullKey, error);
  }
};

export const STORAGE_KEYS = {
  MEDICINES: 'medicines',
  MEDICINE_RECORDS: 'medicine_records',
  HEALTH_RECORDS: 'health_records',
  FAMILY_MEMBERS: 'family_members',
  SETTINGS: 'settings',
  GLOBAL_REMINDER_TIMES: 'global_reminder_times',
  LAST_TRIGGERED_REMINDERS: 'last_triggered_reminders'
};

// ============================================
// 全局提醒时间管理
// ============================================

export const DEFAULT_GLOBAL_TIMES: Record<MedicineTimeSlot, string> = {
  morning: '08:00',
  noon: '12:30',
  evening: '18:30',
  night: '21:30'
};

export const getGlobalReminderTimes = (): Record<MedicineTimeSlot, string> => {
  return getStorage<Record<MedicineTimeSlot, string>>(
    STORAGE_KEYS.GLOBAL_REMINDER_TIMES,
    DEFAULT_GLOBAL_TIMES
  );
};

export const setGlobalReminderTimes = (times: Record<MedicineTimeSlot, string>): void => {
  setStorage(STORAGE_KEYS.GLOBAL_REMINDER_TIMES, times);
};

export const updateGlobalReminderTime = (slot: MedicineTimeSlot, time: string): Record<MedicineTimeSlot, string> => {
  const times = getGlobalReminderTimes();
  times[slot] = time;
  setGlobalReminderTimes(times);
  return times;
};

// ============================================
// 生成今日用药记录（根据药品列表）
// ============================================

export const generateTodayRecords = (
  medicines: Medicine[],
  globalTimes: Record<MedicineTimeSlot, string>,
  existingRecords: MedicineRecord[]
): MedicineRecord[] => {
  const today = getTodayDate();
  const todayRecords = existingRecords.filter(r => r.date === today);
  const newRecords: MedicineRecord[] = [...todayRecords];

  medicines.filter(m => m.isActive).forEach(medicine => {
    medicine.timeSlots.forEach(slot => {
      const exists = todayRecords.find(
        r => r.medicineId === medicine.id && r.timeSlot === slot
      );
      if (!exists) {
        const reminderTime = medicine.reminderTimes[slot] || globalTimes[slot];
        const [hours, minutes] = reminderTime.split(':').map(Number);
        const now = dayjs();
        const targetTime = dayjs().hour(hours).minute(minutes);
        const isPast = now.isAfter(targetTime);
        const graceMinutes = 30;
        const isGracePeriod = now.isAfter(targetTime) && 
                            now.isBefore(targetTime.add(graceMinutes, 'minute'));
        
        let status: MedicineStatus = 'pending';
        let takenTime: string | undefined = undefined;
        
        if (isPast && !isGracePeriod) {
          status = 'missed';
        }

        newRecords.push({
          id: generateId(),
          medicineId: medicine.id,
          medicineName: medicine.name,
          medicineColor: medicine.color,
          dosage: medicine.dosage,
          timeSlot: slot,
          scheduledTime: reminderTime,
          status,
          takenTime,
          date: today,
          note: ''
        });
      }
    });
  });

  return newRecords;
};

// ============================================
// 检查并更新漏服状态
// ============================================

export const checkAndUpdateMissed = (
  records: MedicineRecord[],
  graceMinutes: number = 30
): { updated: boolean; records: MedicineRecord[]; missedItems: MedicineRecord[] } => {
  let updated = false;
  const missedItems: MedicineRecord[] = [];
  const now = dayjs();

  const newRecords = records.map(record => {
    if (record.status === 'pending' && record.date === getTodayDate()) {
      const [hours, minutes] = record.scheduledTime.split(':').map(Number);
      const targetTime = dayjs().hour(hours).minute(minutes);
      const graceEndTime = targetTime.add(graceMinutes, 'minute');
      
      if (now.isAfter(graceEndTime)) {
        updated = true;
        missedItems.push({ ...record, status: 'missed' });
        return { ...record, status: 'missed' as MedicineStatus };
      }
    }
    return record;
  });

  return { updated, records: newRecords, missedItems };
};

// ============================================
// 检查需要触发提醒的记录
// ============================================

export interface ReminderTrigger {
  recordId: string;
  medicineName: string;
  dosage: string;
  timeSlot: MedicineTimeSlot;
  scheduledTime: string;
  speakText: string;
}

export const checkReminderTriggers = (
  records: MedicineRecord[],
  lastTriggered: Record<string, boolean>,
  windowMinutes: number = 5
): { shouldTrigger: boolean; triggers: ReminderTrigger[]; newLastTriggered: Record<string, boolean> } => {
  const triggers: ReminderTrigger[] = [];
  const newLastTriggered: Record<string, boolean> = { ...lastTriggered };
  const now = dayjs();

  records.forEach(record => {
    if (record.status === 'pending' && record.date === getTodayDate()) {
      const [hours, minutes] = record.scheduledTime.split(':').map(Number);
      const targetTime = dayjs().hour(hours).minute(minutes);
      const windowStart = targetTime.subtract(windowMinutes, 'minute');
      const windowEnd = targetTime.add(windowMinutes, 'minute');
      
      const isInWindow = now.isAfter(windowStart) && now.isBefore(windowEnd);
      const alreadyTriggered = lastTriggered[record.id];

      if (isInWindow && !alreadyTriggered) {
        triggers.push({
          recordId: record.id,
          medicineName: record.medicineName,
          dosage: record.dosage,
          timeSlot: record.timeSlot,
          scheduledTime: record.scheduledTime,
          speakText: `提醒您，现在是${record.scheduledTime}，请服用${record.medicineName}，${record.dosage}`
        });
        newLastTriggered[record.id] = true;
      }
    }
  });

  return {
    shouldTrigger: triggers.length > 0,
    triggers,
    newLastTriggered
  };
};

// ============================================
// 药品颜色列表
// ============================================

export const MEDICINE_COLORS = [
  { name: '红色', value: '#ff6b6b' },
  { name: '青色', value: '#4ecdc4' },
  { name: '蓝色', value: '#45b7d1' },
  { name: '绿色', value: '#96ceb4' },
  { name: '黄色', value: '#ffeaa7' },
  { name: '紫色', value: '#dda0dd' },
  { name: '薄荷', value: '#98d8c8' },
  { name: '金色', value: '#f7dc6f' }
];

// ============================================
// 获取连续漏服详情（用于家属端警报）
// ============================================

export interface ConsecutiveMissedDetail {
  consecutiveDays: number;
  dates: string[];
  totalMissed: number;
  recentMissed: MedicineRecord[];
}

export const getConsecutiveMissedDetail = (
  records: MedicineRecord[],
  maxDays: number = 7
): ConsecutiveMissedDetail => {
  const today = getTodayDate();
  const missedDateMap = new Map<string, MedicineRecord[]>();
  
  records.forEach(record => {
    if (record.status === 'missed') {
      if (!missedDateMap.has(record.date)) {
        missedDateMap.set(record.date, []);
      }
      missedDateMap.get(record.date)!.push(record);
    }
  });

  let consecutiveDays = 0;
  const dates: string[] = [];
  let totalMissed = 0;
  const recentMissed: MedicineRecord[] = [];

  for (let i = 0; i < maxDays; i++) {
    const dateStr = dayjs(today).subtract(i, 'day').format('YYYY-MM-DD');
    const dayMissed = missedDateMap.get(dateStr) || [];
    
    if (dayMissed.length > 0) {
      consecutiveDays++;
      dates.push(dateStr);
      totalMissed += dayMissed.length;
      if (i <= 2) {
        recentMissed.push(...dayMissed);
      }
    } else if (i > 0) {
      break;
    }
  }

  return {
    consecutiveDays,
    dates,
    totalMissed,
    recentMissed
  };
};
