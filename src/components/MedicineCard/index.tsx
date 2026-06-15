import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classNames from 'classnames';
import { Medicine, MedicineRecord } from '@/types';
import { getTimeSlotLabel, getStatusText } from '@/utils';
import styles from './index.module.scss';

interface MedicineCardProps {
  medicine: Medicine | MedicineRecord;
  status?: 'pending' | 'taken' | 'missed' | 'skipped';
  showStatus?: boolean;
  size?: 'normal' | 'large';
  onClick?: () => void;
  className?: string;
}

const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  status,
  showStatus = false,
  size = 'normal',
  onClick,
  className = ''
}) => {
  const isRecord = 'medicineId' in medicine;
  const medicineName = isRecord ? medicine.medicineName : medicine.name;
  const medicineColor = isRecord ? medicine.medicineColor : medicine.color;
  const medicineDosage = medicine.dosage;
  const isInactive = 'isActive' in medicine && !medicine.isActive;
  const currentStatus = status || (isRecord ? medicine.status : undefined);

  const getTimeSlots = () => {
    if (isRecord) {
      return [{ slot: medicine.timeSlot, time: medicine.scheduledTime }];
    }
    return medicine.timeSlots.map(slot => ({
      slot,
      time: medicine.reminderTimes[slot]
    }));
  };

  const getStatusClass = () => {
    if (!currentStatus) return '';
    const statusMap: Record<string, string> = {
      taken: styles.statusTaken,
      pending: styles.statusPending,
      missed: styles.statusMissed,
      skipped: styles.statusSkipped
    };
    return statusMap[currentStatus] || '';
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <View
      className={classNames(
        styles.medicineCard,
        size === 'large' && styles.large,
        isInactive && styles.inactive,
        className
      )}
      onClick={handleClick}
    >
      <View className={styles.colorIndicator} style={{ backgroundColor: medicineColor }} />
      
      {'image' in medicine && medicine.image && (
        <Image
          className={styles.medicineImage}
          src={medicine.image}
          mode="aspectFill"
        />
      )}

      <View className={styles.medicineInfo}>
        <Text className={styles.medicineName}>{medicineName}</Text>
        <Text className={styles.medicineDosage}>{medicineDosage}</Text>
        <View className={styles.medicineTime}>
          {getTimeSlots().map((item, index) => (
            <Text key={index} className={styles.timeSlotTag}>
              {getTimeSlotLabel(item.slot)} {item.time}
            </Text>
          ))}
        </View>
      </View>

      {showStatus && currentStatus && (
        <View className={classNames(styles.statusBadge, getStatusClass())}>
          {getStatusText(currentStatus)}
        </View>
      )}

      {onClick && <Text className={styles.chevron}>{'>'}</Text>}
    </View>
  );
};

export default MedicineCard;
