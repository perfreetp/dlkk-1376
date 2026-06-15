import React, { useMemo, useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import classNames from 'classnames';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { getStatusText } from '@/utils';
import FamilyMemberCard from '@/components/FamilyMemberCard';
import BigButton from '@/components/BigButton';
import styles from './index.module.scss';

const FamilyPage: React.FC = () => {
  const {
    familyMembers,
    getTodayRecords,
    getTodayProgress,
    hasConsecutiveMissed,
    settings
  } = useAppStore();

  const [showBindCode, setShowBindCode] = useState(false);

  const todayRecords = useMemo(() => getTodayRecords(), [getTodayRecords]);
  const todayProgress = useMemo(() => getTodayProgress(), [getTodayProgress]);
  const hasMissedAlert = useMemo(() => hasConsecutiveMissed(), [hasConsecutiveMissed]);

  const getStatusStyle = () => {
    if (hasMissedAlert) return styles.statusDanger;
    if (todayProgress.percentage < 50) return styles.statusWarning;
    return styles.statusGood;
  };

  const getStatusIcon = () => {
    if (hasMissedAlert) return '⚠️';
    if (todayProgress.percentage < 50) return '⏰';
    return '✅';
  };

  const getStatusTextDisplay = () => {
    if (hasMissedAlert) return '需关注';
    if (todayProgress.percentage === 100) return '全部完成';
    if (todayProgress.percentage >= 50) return '进行中';
    return '待服药';
  };

  const handleAddFamily = () => {
    Taro.showActionSheet({
      itemList: ['添加家属', '生成绑定二维码'],
      success: (res) => {
        if (res.tapIndex === 0) {
          Taro.showToast({
            title: '添加家属功能开发中',
            icon: 'none'
          });
        } else {
          setShowBindCode(true);
        }
      }
    });
  };

  const handleReminderEdit = () => {
    Taro.showModal({
      title: '修改提醒时间',
      content: '您确定要为老人修改提醒时间吗？',
      confirmText: '确定修改',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '请前往提醒设置页面修改',
            icon: 'none'
          });
        }
      }
    });
  };

  const handleContact = (memberName: string) => {
    Taro.showActionSheet({
      itemList: ['拨打电话', '发送消息'],
      success: (res) => {
        if (res.tapIndex === 0) {
          Taro.showToast({
            title: `正在拨打${memberName}的电话...`,
            icon: 'none'
          });
        } else {
          Taro.showToast({
            title: '消息功能开发中',
            icon: 'none'
          });
        }
      }
    });
  };

  const handleEmergency = () => {
    Taro.showModal({
      title: '紧急呼叫',
      content: '确定要呼叫紧急联系人吗？',
      confirmText: '立即呼叫',
      cancelText: '取消',
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm && familyMembers.length > 0) {
          Taro.makePhoneCall({
            phoneNumber: familyMembers[0].phone.replace(/\*/g, '0')
          }).catch(err => {
            console.error('[FamilyPage] 拨打电话失败:', err);
          });
        }
      }
    });
  };

  const handleViewHistory = () => {
    Taro.showToast({
      title: '历史记录功能开发中',
      icon: 'none'
    });
  };

  const mockAlerts = hasMissedAlert ? [
    {
      time: '今天 08:30',
      desc: '连续3天有漏服药品，请家属关注',
      action: '查看详情'
    },
    {
      time: '昨天 18:30',
      desc: '晚上用药漏服：二甲双胍片',
      action: '提醒老人补服'
    }
  ] : [
    {
      time: '今天 09:00',
      desc: '早上用药全部完成，真棒！',
      action: ''
    }
  ];

  return (
    <ScrollView
      className={classNames(styles.familyPage, settings.mode === 'highContrast' && 'high-contrast')}
      scrollY
      enhanced
      showScrollbar={false}
    >
      <Text className="page-title">家属协同</Text>

      <View className={classNames(styles.statusCard, getStatusStyle())}>
        <Text className={styles.statusTitle}>今日服药状态</Text>
        <View className={styles.statusContent}>
          <View className={styles.statusMain}>
            <Text className={styles.statusValue}>{todayProgress.percentage}%</Text>
            <Text className={styles.statusLabel}>{getStatusTextDisplay()} · {todayProgress.taken}/{todayProgress.total}</Text>
          </View>
          <Text className={styles.statusIcon}>{getStatusIcon()}</Text>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={classNames(styles.statNumber, styles.success)}>{todayProgress.taken}</Text>
          <Text className={styles.statText}>已服药</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classNames(styles.statNumber, styles.warning)}>{todayRecords.filter(r => r.status === 'pending').length}</Text>
          <Text className={styles.statText}>待服药</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classNames(styles.statNumber, styles.danger)}>{todayRecords.filter(r => r.status === 'missed').length}</Text>
          <Text className={styles.statText}>漏服</Text>
        </View>
      </View>

      <View className={styles.quickActions}>
        <View className={styles.quickAction} onClick={handleContact.bind(null, familyMembers[0]?.name || '')}>
          <Text className={styles.quickActionIcon}>📞</Text>
          <Text className={styles.quickActionText}>联系家属</Text>
        </View>
        <View className={styles.quickAction} onClick={handleEmergency}>
          <Text className={styles.quickActionIcon}>🚨</Text>
          <Text className={styles.quickActionText}>紧急呼叫</Text>
        </View>
        <View className={styles.quickAction} onClick={handleReminderEdit}>
          <Text className={styles.quickActionIcon}>⏰</Text>
          <Text className={styles.quickActionText}>修改提醒</Text>
        </View>
        <View className={styles.quickAction} onClick={handleViewHistory}>
          <Text className={styles.quickActionIcon}>📊</Text>
          <Text className={styles.quickActionText}>查看历史</Text>
        </View>
      </View>

      <View className={styles.alertSection}>
        <Text className={styles.alertTitle}>
          <Text className={styles.alertIcon}>🔔</Text>
          异常提醒
        </Text>
        {mockAlerts.map((alert, index) => (
          <View key={index} className={styles.alertItem}>
            <Text className={styles.alertTime}>{alert.time}</Text>
            <View className={styles.alertContent}>
              <Text className={styles.alertDesc}>{alert.desc}</Text>
              {alert.action && (
                <Text className={styles.alertAction}>{alert.action}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View className={styles.medicinePreview}>
        <View className={styles.previewHeader}>
          <Text className={styles.previewTitle}>今日服药明细</Text>
          <Text className={styles.previewTime}>实时更新</Text>
        </View>
        <View className={styles.previewList}>
          {todayRecords.slice(0, 5).map(record => (
            <View key={record.id} className={styles.previewItem}>
              <View
                className={styles.previewColor}
                style={{ backgroundColor: record.medicineColor }}
              />
              <View className={styles.previewInfo}>
                <Text className={styles.previewName}>{record.medicineName}</Text>
                <Text className={classNames(styles.previewStatus, styles[record.status])}>
                  {record.scheduledTime} · {getStatusText(record.status)}
                  {record.takenTime && ` · ${record.takenTime}服用`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.sectionHeader} style={{ marginTop: '32rpx' }}>
        <Text className={styles.sectionTitle}>家属成员</Text>
        <Button className={styles.addBtn} onClick={handleAddFamily}>
          + 添加
        </Button>
      </View>

      {familyMembers.length > 0 ? (
        <View className={styles.memberList}>
          {familyMembers.map(member => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              onCall={() => handleContact(member.name)}
            />
          ))}
        </View>
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
          <Text className={styles.emptyText}>还没有添加家属成员</Text>
          <BigButton
            text="添加第一位家属"
            onClick={handleAddFamily}
            type="info"
            block
          />
        </View>
      )}

      {showBindCode && (
        <View className={styles.bindSection}>
          <Text className={styles.bindTitle}>🔗 家属绑定</Text>
          <Text className={styles.bindDesc}>
            请让家属扫描二维码或输入绑定码完成绑定
          </Text>
          <View style={{ textAlign: 'center', padding: '32rpx', background: '#fff', borderRadius: '16rpx', marginBottom: '24rpx' }}>
            <Text style={{ fontSize: '48rpx', fontWeight: 'bold', letterSpacing: '8rpx', color: '#ff7a45' }}>
              8888 6666
            </Text>
          </View>
          <BigButton
            text="关闭"
            onClick={() => setShowBindCode(false)}
            variant="outline"
            block
          />
        </View>
      )}
    </ScrollView>
  );
};

export default FamilyPage;
