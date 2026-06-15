import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classNames from 'classnames';
import { MedicineRecord, MedicineTimeSlot, TIME_SLOT_ICONS, TIME_SLOT_LABELS } from '@/types';
import { useAppStore } from '@/store';
import styles from './index.module.scss';

interface TimeSlotCardProps {
  slot: MedicineTimeSlot;
  records: MedicineRecord[];
  showActions?: boolean;
  highlight?: boolean;
  className?: string;
  onTakeMedicine?: (recordId: string) => void;
  onCatchUp?: (recordId: string) => void;
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  slot,
  records,
  showActions = true,
  highlight = false,
  className = '',
  onTakeMedicine,
  onCatchUp
}) => {
  const { takeMedicine, speak } = useAppStore();

  const missedCount = records.filter(r => r.status === 'missed').length;
  const pendingCount = records.filter(r => r.status === 'pending').length;
  const totalCount = records.length;

  const getStatusSummary = () => {
    if (totalCount === 0) return null;
    if (missedCount > 0) return { text: `${missedCount}项漏服`, class: styles.hasMissed };
    if (pendingCount > 0) return { text: `${pendingCount}项待服`, class: styles.somePending };
    return { text: '全部完成', class: styles.allDone };
  };

  const statusSummary = getStatusSummary();

  const handleTake = (recordId: string, medicineName: string, dosage: string) => {
    if (onTakeMedicine) {
      onTakeMedicine(recordId);
    } else {
      takeMedicine(recordId);
      speak(`已确认服用${medicineName}，${dosage}`);
    }
  };

  const handleSpeak = (medicineName: string, dosage: string, time: string) => {
    speak(`请服用${medicineName}，${dosage}，服药时间${time}`);
  };

  const handleCatchUp = (recordId: string) => {
    if (onCatchUp) {
      onCatchUp(recordId);
    } else {
      takeMedicine(recordId);
      speak('已补服药品');
    }
  };

  const getTimeRange = () => {
    const ranges: Record<MedicineTimeSlot, string> = {
      morning: '06:00 - 11:00',
      noon: '11:00 - 14:00',
      evening: '14:00 - 20:00',
      night: '20:00 - 24:00'
    };
    return ranges[slot];
  };

  return (
    <View className={classNames(styles.timeSlotCard, className, highlight && styles.highlightCard)}>
      <View className={styles.cardHeader}>
        <View className={styles.timeInfo}>
          <Text className={styles.timeIcon}>{TIME_SLOT_ICONS[slot]}</Text>
          <View>
            <Text className={styles.timeLabel}>{TIME_SLOT_LABELS[slot]}</Text>
            <Text className={styles.timeRange}>{getTimeRange()}</Text>
          </View>
        </View>
        {statusSummary && (
          <View className={classNames(styles.statusSummary, statusSummary.class)}>
            {statusSummary.text}
          </View>
        )}
      </View>

      <View className={styles.medicineList}>
        {records.length === 0 ? (
          <View className={styles.emptyState}>
            这个时段没有需要服用的药品
          </View>
        ) : (
          records.map(record => (
            <View key={record.id} className={styles.medicineItem}>
              <View className={styles.itemColorBar} style={{ backgroundColor: record.medicineColor }} />
              <View className={styles.itemContent}>
                <Text className={styles.itemName}>{record.medicineName}</Text>
                <Text className={styles.itemDosage}>{record.dosage} · {record.scheduledTime}</Text>
              </View>
              
              {showActions && (
                <View className={styles.itemActions}>
                  {record.status === 'pending' && (
                    <>
                      <Button
                        className={classNames(styles.actionButton, styles.takeButton)}
                        onClick={() => handleTake(record.id, record.medicineName, record.dosage)}
                      >
                        已服药
                      </Button>
                      <Button
                        className={classNames(styles.actionButton, styles.speakButton)}
                        onClick={() => handleSpeak(record.medicineName, record.dosage, record.scheduledTime)}
                      >
                        🔊 播报
                      </Button>
                    </>
                  )}
                  {record.status === 'taken' && (
                    <View className={styles.takenBadge}>
                      ✅ 已服 {record.takenTime}
                    </View>
                  )}
                  {record.status === 'missed' && (
                    <View style={{ display: 'flex', flexDirection: 'column', gap: '8rpx', alignItems: 'flex-end' }}>
                      <View className={styles.missedBadge}>
                        ⚠️ 漏服
                      </View>
                      <Button
                        className={styles.catchUpButton}
                        onClick={() => handleCatchUp(record.id)}
                      >
                        立即补服
                      </Button>
                    </View>
                  )}
                  {record.status === 'skipped' && (
                    <View className={styles.missedBadge}>
                      ⏭️ 已跳过
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default TimeSlotCard;
