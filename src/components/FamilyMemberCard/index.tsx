import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import classNames from 'classnames';
import Taro from '@tarojs/taro';
import { FamilyMember } from '@/types';
import styles from './index.module.scss';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onCall?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  className?: string;
}

const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  onCall,
  onEdit,
  onView,
  className = ''
}) => {
  const handleCall = () => {
    if (onCall) {
      onCall();
    } else {
      Taro.makePhoneCall({
        phoneNumber: member.phone.replace(/\*/g, '0')
      }).catch(err => {
        console.error('[FamilyMemberCard] 拨打电话失败:', err);
      });
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
  };

  const handleClick = () => {
    if (onView) {
      onView();
    }
  };

  return (
    <View
      className={classNames(
        styles.familyMemberCard,
        !member.isBound && styles.unbound,
        className
      )}
      onClick={handleClick}
    >
      {member.avatar ? (
        <Image
          className={styles.avatar}
          src={member.avatar}
          mode="aspectFill"
        />
      ) : (
        <View className={styles.avatar} />
      )}

      <View className={styles.memberInfo}>
        <Text className={styles.memberName}>{member.name}</Text>
        <Text className={styles.memberRelation}>{member.relation}</Text>
        <Text className={styles.memberPhone}>{member.phone}</Text>
        
        <View className={styles.permissionTags}>
          <Text className={classNames(styles.permissionTag, !member.canViewRecord && styles.disabled)}>
            {member.canViewRecord ? '查看记录' : '无法查看'}
          </Text>
          <Text className={classNames(styles.permissionTag, !member.canEditReminder && styles.disabled)}>
            {member.canEditReminder ? '修改提醒' : '无法修改'}
          </Text>
          <Text className={classNames(styles.permissionTag, !member.receiveAlert && styles.disabled)}>
            {member.receiveAlert ? '接收警报' : '不接收'}
          </Text>
        </View>
      </View>

      <View className={styles.actionButtons}>
        <Button
          className={classNames(styles.actionBtn, styles.callBtn)}
          onClick={handleCall}
          hoverStopPropagation
        >
          📞 联系
        </Button>
        {onEdit && (
          <Button
            className={classNames(styles.actionBtn, styles.editBtn)}
            onClick={handleEdit}
            hoverStopPropagation
          >
            设置
          </Button>
        )}
      </View>

      {member.isBound && (
        <View className={styles.boundBadge}>已绑定</View>
      )}
    </View>
  );
};

export default FamilyMemberCard;
