import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import classNames from 'classnames';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { MedicineTimeSlot, TIME_SLOT_LABELS, MedicineRecord } from '@/types';
import { formatDate, sortTimeSlots, getCurrentTimeSlot, getStatusText } from '@/utils';
import TimeSlotCard from '@/components/TimeSlotCard';
import BigButton from '@/components/BigButton';
import styles from './index.module.scss';

const TodayPage: React.FC = () => {
  const {
    getRecordsByTimeSlot,
    getTodayRecords,
    getWeeklyStats,
    getTodayProgress,
    hasConsecutiveMissed,
    getConsecutiveMissedDetail,
    checkMissedStatus,
    checkAndTriggerReminders,
    catchUpMedicine,
    settings,
    speak
  } = useAppStore();

  const [, forceUpdate] = useState(0);
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timeSlots: MedicineTimeSlot[] = ['morning', 'noon', 'evening', 'night'];
  const sortedSlots = sortTimeSlots(timeSlots);
  const currentSlot = getCurrentTimeSlot();
  const todayDate = formatDate(new Date(), 'YYYY年MM月DD日 dddd');
  
  const weeklyStats = useMemo(() => getWeeklyStats(), [getWeeklyStats]);
  const todayProgress = useMemo(() => getTodayProgress(), [getTodayProgress]);
  const hasMissedAlert = useMemo(() => hasConsecutiveMissed(), [hasConsecutiveMissed]);
  const missedDetail = useMemo(() => getConsecutiveMissedDetail(), [getConsecutiveMissedDetail]);
  const todayRecords = useMemo(() => getTodayRecords(), [getTodayRecords]);

  const missedRecords = useMemo(
    () => todayRecords.filter(r => r.status === 'missed'),
    [todayRecords]
  );

  const pendingRecords = useMemo(
    () => todayRecords.filter(r => r.status === 'pending'),
    [todayRecords]
  );

  useEffect(() => {
    console.log('[TodayPage] 启动定时检查');
    runChecks();
    
    checkTimerRef.current = setInterval(() => {
      runChecks();
      forceUpdate(n => n + 1);
    }, 30000);

    return () => {
      if (checkTimerRef.current) {
        clearInterval(checkTimerRef.current);
        console.log('[TodayPage] 清理定时检查');
      }
    };
  }, []);

  const runChecks = () => {
    const state = useAppStore.getState();
    if (state.settings.reminder.enabled) {
      const missResult = state.checkMissedStatus();
      const remindResult = state.checkAndTriggerReminders();
      
      if (missResult.updated) {
        console.log('[TodayPage] 检测到漏服更新:', missResult.missedItems.length, '项');
        forceUpdate(n => n + 1);
      }
      if (remindResult.shouldTrigger) {
        console.log('[TodayPage] 触发提醒:', remindResult.triggers.length, '项');
        forceUpdate(n => n + 1);
      }
    }
  };

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
    const state = useAppStore.getState();
    const records = state.getTodayRecords();
    const pending = records.filter(r => r.status === 'pending');
    const missed = records.filter(r => r.status === 'missed');
    
    if (pending.length === 0 && missed.length === 0) {
      speak('今天的药都已经吃完了，真棒！');
      return;
    }

    let message = '';
    if (missed.length > 0) {
      message += `注意，有${missed.length}种药品漏服。`;
      missed.forEach(r => {
        message += `${TIME_SLOT_LABELS[r.timeSlot]}${r.scheduledTime}的${r.medicineName}，请尽快补服。`;
      });
    }
    if (pending.length > 0) {
      message += `还有${pending.length}种药需要服用。`;
      pending.forEach(r => {
        message += `${TIME_SLOT_LABELS[r.timeSlot]}${r.scheduledTime}，服用${r.medicineName}，${r.dosage}。`;
      });
    }
    
    speak(message);
  };

  const handleQuickTake = () => {
    const state = useAppStore.getState();
    const currentRecords = state.getRecordsByTimeSlot(currentSlot)
      .filter(r => r.status === 'pending');
    
    if (currentRecords.length === 0) {
      const pendingAll = state.getTodayRecords().filter(r => r.status === 'pending');
      if (pendingAll.length > 0) {
        Taro.showActionSheet({
          itemList: pendingAll.map(r => `${TIME_SLOT_LABELS[r.timeSlot]} ${r.medicineName}`),
          success: (res) => {
            const record = pendingAll[res.tapIndex];
            confirmTakeOne(record);
          }
        });
        return;
      }
      Taro.showToast({
        title: '没有待服的药品了',
        icon: 'success'
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
          Taro.showToast({ title: '服药成功', icon: 'success' });
          forceUpdate(n => n + 1);
        }
      }
    });
  };

  const confirmTakeOne = (record: MedicineRecord) => {
    Taro.showModal({
      title: '确认服药',
      content: `确定已服用${record.medicineName}（${record.dosage}）吗？`,
      confirmText: '已服用',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          useAppStore.getState().takeMedicine(record.id);
          speak(`已确认服用${record.medicineName}`);
          Taro.showToast({ title: '服药成功', icon: 'success' });
          forceUpdate(n => n + 1);
        }
      }
    });
  };

  const handleCatchUp = (record: MedicineRecord) => {
    Taro.showModal({
      title: '确认补服',
      content: `确定现在补服${record.medicineName}吗？\n原定时间：${TIME_SLOT_LABELS[record.timeSlot]} ${record.scheduledTime}`,
      confirmText: '立即补服',
      cancelText: '稍后再说',
      confirmColor: '#fa8c16',
      success: (res) => {
        if (res.confirm) {
          catchUpMedicine(record.id);
          speak(`已补服${record.medicineName}`);
          Taro.showToast({ title: '补服成功', icon: 'success' });
          forceUpdate(n => n + 1);
        }
      }
    });
  };

  const handleCatchUpAll = () => {
    if (missedRecords.length === 0) return;
    
    Taro.showModal({
      title: '批量补服',
      content: `确定要补服全部${missedRecords.length}种漏服药品吗？`,
      confirmText: '全部补服',
      cancelText: '选择补服',
      confirmColor: '#fa8c16',
      success: (res) => {
        if (res.confirm) {
          missedRecords.forEach(r => catchUpMedicine(r.id));
          speak(`已补服${missedRecords.length}种药品`);
          Taro.showToast({ title: '全部补服成功', icon: 'success' });
          forceUpdate(n => n + 1);
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
            {pendingRecords.length > 0 && (
              <Text style={{ fontSize: '26rpx', color: '#fa8c16', marginTop: '8rpx' }}>
                还有{pendingRecords.length}种待服用
              </Text>
            )}
          </View>
          <View
            className={classNames(
              styles.progressCircle,
              todayProgress.percentage === 100 && styles.allDone
            )}
          >
            <Text className={styles.progressValue}>{todayProgress.percentage}%</Text>
            {todayProgress.percentage === 100 && (
              <Text style={{ fontSize: '24rpx', color: '#fff' }}>完成</Text>
            )}
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {hasMissedAlert && (
          <View
            className={classNames(styles.alertBanner, styles.danger)}
            onClick={() => {
              Taro.showModal({
                title: '连续漏服详情',
                content: `已连续${missedDetail.consecutiveDays}天漏服\n漏服天数：${missedDetail.dates.join('、')}\n共漏服${missedDetail.totalMissed}次\n\n建议：请及时联系家属确认情况。`,
                showCancel: false,
                confirmText: '我知道了'
              });
            }}
          >
            <Text className={styles.alertIcon}>⚠️</Text>
            <View className={styles.alertContent}>
              <Text className={styles.alertTitle}>
                连续{missedDetail.consecutiveDays}天漏服警报！
              </Text>
              <Text className={styles.alertDesc}>
                共漏服{missedDetail.totalMissed}次，请尽快处理或联系家属
              </Text>
            </View>
          </View>
        )}

        {missedRecords.length > 0 && (
          <View className={styles.catchUpSection}>
            <View className={styles.catchUpHeader}>
              <Text className={styles.catchUpTitle}>
                <Text style={{ marginRight: '8rpx' }}>⏰</Text>
                漏服提醒（{missedRecords.length}种）
              </Text>
              <Button
                className={styles.catchUpAllBtn}
                onClick={handleCatchUpAll}
              >
                全部补服
              </Button>
            </View>
            <View className={styles.catchUpList}>
              {missedRecords.map(record => (
                <View key={record.id} className={styles.catchUpItem}>
                  <View
                    className={styles.catchUpColor}
                    style={{ backgroundColor: record.medicineColor }}
                  />
                  <View className={styles.catchUpInfo}>
                    <Text className={styles.catchUpName}>{record.medicineName}</Text>
                    <Text className={styles.catchUpTime}>
                      原定：{TIME_SLOT_LABELS[record.timeSlot]} {record.scheduledTime} · {record.dosage}
                    </Text>
                  </View>
                  <Button
                    className={styles.catchUpBtn}
                    onClick={() => handleCatchUp(record)}
                  >
                    补服
                  </Button>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.quickActions}>
          <Button
            className={classNames(styles.quickAction, styles.primary)}
            onClick={handleQuickTake}
          >
            ✅ 一键确认服药
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
          const hasPending = records.some(r => r.status === 'pending');
          
          return (
            <View
              key={slot}
              style={isCurrentSlot ? {
                transform: 'scale(1.01)',
                transition: 'transform 0.3s',
                marginBottom: '24rpx'
              } : { marginBottom: '24rpx' }}
            >
              <TimeSlotCard
                slot={slot}
                records={records}
                showActions={true}
                highlight={isCurrentSlot && hasPending}
                onTakeMedicine={(recordId) => {
                  const record = records.find(r => r.id === recordId);
                  if (record) confirmTakeOne(record);
                }}
                onCatchUp={(recordId) => {
                  const record = records.find(r => r.id === recordId);
                  if (record) handleCatchUp(record);
                }}
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
          <View className={styles.weeklySummary}>
            <View style={{ flex: 1, textAlign: 'center' }}>
              <Text style={{ fontSize: '40rpx', fontWeight: 'bold', color: '#00b42a' }}>
                {weeklyStats.filter(s => s.completionRate >= 80).length}
              </Text>
              <Text style={{ fontSize: '24rpx', color: '#86909c' }}>达标天数</Text>
            </View>
            <View style={{ flex: 1, textAlign: 'center' }}>
              <Text style={{ fontSize: '40rpx', fontWeight: 'bold', color: '#f53f3f' }}>
                {weeklyStats.reduce((sum, s) => sum + s.missedCount, 0)}
              </Text>
              <Text style={{ fontSize: '24rpx', color: '#86909c' }}>本周漏服</Text>
            </View>
            <View style={{ flex: 1, textAlign: 'center' }}>
              <Text style={{ fontSize: '40rpx', fontWeight: 'bold', color: '#165dff' }}>
                {Math.round(weeklyStats.reduce((sum, s) => sum + s.completionRate, 0) / 7)}%
              </Text>
              <Text style={{ fontSize: '24rpx', color: '#86909c' }}>周平均</Text>
            </View>
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

        {todayProgress.percentage === 100 && todayProgress.total > 0 && (
          <View style={{
            marginTop: '24rpx',
            padding: '32rpx',
            background: 'linear-gradient(135deg, #e8ffea 0%, #b8f2c0 100%)',
            borderRadius: '24rpx',
            textAlign: 'center'
          }}>
            <Text style={{ fontSize: '64rpx', marginBottom: '16rpx' }}>🎉</Text>
            <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#00681f', marginBottom: '8rpx' }}>
              太棒了！今天的药都吃完了
            </Text>
            <Text style={{ fontSize: '28rpx', color: '#00962d' }}>
              坚持服药，身体更健康
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default TodayPage;
