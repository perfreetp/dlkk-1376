import React, { useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import classNames from 'classnames';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { MedicineTimeSlot, TIME_SLOT_LABELS } from '@/types';
import { formatDate, sortTimeSlots, getCurrentTimeSlot } from '@/utils';
import TimeSlotCard from '@/components/TimeSlotCard';
import styles from './index.module.scss';

const TodayPage: React.FC = () => {
  const {
    getRecordsByTimeSlot,
    getWeeklyStats,
    getTodayProgress,
    hasConsecutiveMissed,
    settings,
    speak
  } = useAppStore();

  const timeSlots: MedicineTimeSlot[] = ['morning', 'noon', 'evening', 'night'];
  const sortedSlots = sortTimeSlots(timeSlots);
  const currentSlot = getCurrentTimeSlot();
  const todayDate = formatDate(new Date(), 'YYYY年MM月DD日 dddd');
  
  const weeklyStats = useMemo(() => getWeeklyStats(), [getWeeklyStats]);
  const todayProgress = useMemo(() => getTodayProgress(), [getTodayProgress]);
  const hasMissedAlert = useMemo(() => hasConsecutiveMissed(), [hasConsecutiveMissed]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 11) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const getBarClass = (rate: number) => {
    if (rate >= 80) return styles.high;
    if (rate >= 50) return styles.medium;
    return styles.low;
  };

  const handleSpeakAll = () => {
    const pendingRecords = sortedSlots
      .flatMap(slot => getRecordsByTimeSlot(slot))
      .filter(r => r.status === 'pending');
    
    if (pendingRecords.length === 0) {
      speak('今天的药都已经吃完了，真棒！');
      return;
    }

    const message = `今天需要服用${pendingRecords.length}种药。` + 
      pendingRecords.map(r => 
        `${TIME_SLOT_LABELS[r.timeSlot]}${r.scheduledTime}，服用${r.medicineName}，${r.dosage}`
      ).join('。');
    
    speak(message);
  };

  const handleQuickTake = () => {
    const currentRecords = getRecordsByTimeSlot(currentSlot)
      .filter(r => r.status === 'pending');
    
    if (currentRecords.length === 0) {
      Taro.showToast({
        title: '这个时段没有待服药品',
        icon: 'none'
      });
      return;
    }

    Taro.showModal({
      title: '确认服药',
      content: `确定要将${TIME_SLOT_LABELS[currentSlot]}的${currentRecords.length}种药全部标记为已服用吗？`,
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          currentRecords.forEach(r => {
            useAppStore.getState().takeMedicine(r.id);
          });
          speak(`已确认服用${currentRecords.length}种药品`);
        }
      }
    });
  };

  return (
    <ScrollView
      className={classNames(styles.todayPage, settings.mode === 'highContrast' && 'high-contrast')}
      scrollY
      enhanced
      showScrollbar={false}
    >
      <View className={styles.header}>
        <Text className={styles.greeting}>{getGreeting()}！</Text>
        <Text className={styles.dateInfo}>{todayDate}</Text>
        
        <View className={styles.progressCard}>
          <View className={styles.progressInfo}>
            <Text className={styles.progressLabel}>今日服药进度</Text>
            <View className={styles.progressNumbers}>
              <Text style={{ fontSize: '72rpx', fontWeight: 'bold' }}>{todayProgress.taken}</Text>
              <Text style={{ fontSize: '36rpx', opacity: 0.8 }}> / {todayProgress.total}</Text>
            </View>
          </View>
          <View className={styles.progressCircle}>
            <Text className={styles.progressValue}>{todayProgress.percentage}%</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {hasMissedAlert && (
          <View className={styles.alertBanner}>
            <Text className={styles.alertIcon}>⚠️</Text>
            <View className={styles.alertContent}>
              <Text className={styles.alertTitle}>连续漏服提醒</Text>
              <Text className={styles.alertDesc}>您已连续3天有漏服药品，请家属关注</Text>
            </View>
          </View>
        )}

        <View className={styles.quickActions}>
          <Button
            className={classNames(styles.quickAction, styles.primary)}
            onClick={handleQuickTake}
          >
            ✅ 一键确认
          </Button>
          <Button
            className={classNames(styles.quickAction, styles.success)}
            onClick={handleSpeakAll}
          >
            🔊 语音播报
          </Button>
        </View>

        <Text className={styles.sectionTitle}>今日服药安排</Text>
        
        {sortedSlots.map(slot => {
          const records = getRecordsByTimeSlot(slot);
          const isCurrentSlot = slot === currentSlot;
          
          return (
            <View key={slot} style={isCurrentSlot ? { transform: 'scale(1.02)', transition: 'transform 0.3s' } : {}}>
              <TimeSlotCard
                slot={slot}
                records={records}
                showActions={true}
              />
            </View>
          );
        })}

        <Text className={styles.sectionTitle}>一周服药情况</Text>
        
        <View className={styles.weeklyStats}>
          <Text className={styles.weeklyTitle}>近7天服药完成率</Text>
          <View className={styles.weeklyChart}>
            {weeklyStats.map((stat) => (
              <View key={stat.date} className={styles.weeklyBar}>
                <Text className={styles.barPercent}>{stat.completionRate}%</Text>
                <View className={styles.barWrapper}>
                  <View
                    className={classNames(styles.barFill, getBarClass(stat.completionRate))}
                    style={{ height: `${Math.max(stat.completionRate, 5)}%` }}
                  />
                </View>
                <Text className={styles.barDay}>{stat.dayName}</Text>
              </View>
            ))}
          </View>
        </View>

        {todayProgress.total === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>💊</Text>
            <Text className={styles.emptyText}>今天没有需要服用的药品</Text>
            <Text style={{ fontSize: '28rpx', color: '#86909c', marginTop: '16rpx' }}>
              请在"药盒清单"中添加药品
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default TodayPage;
