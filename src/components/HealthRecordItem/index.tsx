import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import { HealthRecord, HEALTH_TYPE_LABELS } from '@/types';
import styles from './index.module.scss';

interface HealthRecordItemProps {
  record: HealthRecord;
  isAbnormal?: boolean;
  onClick?: () => void;
  className?: string;
}

const HealthRecordItem: React.FC<HealthRecordItemProps> = ({
  record,
  isAbnormal = false,
  onClick,
  className = ''
}) => {
  const getTypeIcon = () => {
    const icons: Record<string, string> = {
      bloodPressure: '❤️',
      bloodSugar: '🩸',
      heartRate: '💓',
      weight: '⚖️'
    };
    return icons[record.type] || '📊';
  };

  const isBloodPressure = record.type === 'bloodPressure';

  return (
    <View
      className={classNames(
        styles.healthRecordItem,
        isAbnormal ? styles.abnormal : styles.normal,
        className
      )}
      onClick={onClick}
    >
      <View className={styles.recordLeft}>
        <View className={styles.typeIcon}>{getTypeIcon()}</View>
        <View className={styles.recordInfo}>
          <Text className={styles.recordType}>{HEALTH_TYPE_LABELS[record.type]}</Text>
          <Text className={styles.recordDateTime}>{record.date} {record.time}</Text>
          {record.note && (
            <Text className={styles.recordNote}>{record.note}</Text>
          )}
        </View>
      </View>

      <View className={styles.recordValue}>
        {isBloodPressure ? (
          <View className={styles.valueSecond}>
            <Text className={styles.valueSecondRow}>
              <Text className={styles.valueMain}>{record.value}</Text>
              <Text className={styles.valueUnit}> / {record.value2}</Text>
            </Text>
            <Text className={styles.valueLabel}>{record.unit}</Text>
          </View>
        ) : (
          <>
            <Text className={styles.valueMain}>{record.value}</Text>
            <Text className={styles.valueUnit}>{record.unit}</Text>
          </>
        )}
      </View>
    </View>
  );
};

export default HealthRecordItem;
