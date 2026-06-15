import dayjs from 'dayjs';
import { MedicineTimeSlot, MedicineRecord, WeeklyStats, TIME_SLOT_LABELS } from '@/types';

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
