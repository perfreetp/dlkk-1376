import React, { useMemo, useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import classNames from 'classnames';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { MedicineTimeSlot, TIME_SLOT_LABELS } from '@/types';
import { getStatusText, formatDate } from '@/utils';
import FamilyMemberCard from '@/components/FamilyMemberCard';
import BigButton from '@/components/BigButton';
import styles from './index.module.scss';

const FamilyPage: React.FC = () => {
  const {
    familyMembers,
    globalReminderTimes,
    getTodayRecords,
    getTodayProgress,
    hasConsecutiveMissed,
    getConsecutiveMissedDetail,
    updateGlobalReminderTime,
    settings
  } = useAppStore();

  const [showBindCode, setShowBindCode] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<MedicineTimeSlot | null>(null);

  const todayRecords = useMemo(() => getTodayRecords(), [getTodayRecords]);
  const todayProgress = useMemo(() => getTodayProgress(), [getTodayProgress]);
  const hasMissedAlert = useMemo(() => hasConsecutiveMissed(), [hasConsecutiveMissed]);
  const missedDetail = useMemo(() => getConsecutiveMissedDetail(), [getConsecutiveMissedDetail]);

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

  const alerts = useMemo(() => {
    const list: { time: string; desc: string; action: string; type: string }[] = [];
    
    if (missedDetail.consecutiveDays >= 3) {
      list.push({
        time: '刚刚',
        desc: `⚠️ 连续${missedDetail.consecutiveDays}天有漏服药品，共漏服${missedDetail.totalMissed}次，请家属关注！`,
        action: '查看漏服详情',
        type: 'danger'
      });
    }

    const todayMissed = todayRecords.filter(r => r.status === 'missed');
    todayMissed.forEach(r => {
      list.push({
        time: `今天 ${r.scheduledTime}`,
        desc: `漏服药品：${r.medicineName}（${r.dosage}）`,
        action: '提醒补服',
        type: 'warning'
      });
    });

    const todayTaken = todayRecords.filter(r => r.status === 'taken');
    if (todayTaken.length > 0 && todayMissed.length === 0 && missedDetail.consecutiveDays === 0) {
      list.push({
        time: '今天',
        desc: `已完成${todayTaken.length}次服药，老人状态良好！`,
        action: '',
        type: 'success'
      });
    }

    if (todayProgress.percentage === 100) {
      list.push({
        time: '刚刚',
        desc: '🎉 今天的所有药品都已服用完毕！',
        action: '',
        type: 'success'
      });
    }

    if (list.length === 0) {
      list.push({
        time: '今天',
        desc: '暂无异常情况',
        action: '',
        type: 'info'
      });
    }

    return list;
  }, [todayRecords, missedDetail, todayProgress]);

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
    setShowReminderModal(true);
  };

  const handleEditSlotTime = (slot: MedicineTimeSlot) => {
    setEditingSlot(slot);
    const timeOptions = slot === 'morning'
      ? ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00']
      : slot === 'noon'
      ? ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00']
      : slot === 'evening'
      ? ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
      : ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
    
    Taro.showActionSheet({
      itemList: timeOptions,
      success: (res) => {
        const newTime = timeOptions[res.tapIndex];
        updateGlobalReminderTime(slot, newTime);
        Taro.showToast({
          title: `${TIME_SLOT_LABELS[slot]}已改为${newTime}`,
          icon: 'success'
        });
        setEditingSlot(null);
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

  const handleAlertClick = (alert: { type: string; desc: string }) => {
    if (alert.type === 'danger') {
      const dates = missedDetail.dates.join('、');
      Taro.showModal({
        title: '连续漏服详情',
        content: `漏服日期：${dates}\n总计漏服：${missedDetail.totalMissed}次\n\n建议：请联系老人确认情况，必要时调整提醒时间或协助服药。`,
        showCancel: false,
        confirmText: '我知道了'
      });
    } else if (alert.action === '提醒补服') {
      Taro.showToast({
        title: '已发送补服提醒',
        icon: 'success'
      });
    }
  };

  const timeSlotList: MedicineTimeSlot[] = ['morning', 'noon', 'evening', 'night'];
  const timeSlotIcons: Record<MedicineTimeSlot, string> = {
    morning: '🌅',
    noon: '☀️',
    evening: '🌆',
    night: '🌙'
  };

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
            <Text className={styles.statusLabel}>
              {getStatusTextDisplay()} · {todayProgress.taken}/{todayProgress.total}
            </Text>
          </View>
          <Text className={styles.statusIcon}>{getStatusIcon()}</Text>
        </View>
        {hasMissedAlert && (
          <View className={styles.missedDetailBar}>
            <Text style={{ fontSize: '28rpx', color: '#fff', fontWeight: 'bold' }}>
              ⚠️ 连续{missedDetail.consecutiveDays}天漏服，共{missedDetail.totalMissed}次
            </Text>
          </View>
        )}
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={classNames(styles.statNumber, styles.success)}>{todayProgress.taken}</Text>
          <Text className={styles.statText}>已服药</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classNames(styles.statNumber, styles.warning)}>
            {todayRecords.filter(r => r.status === 'pending').length}
          </Text>
          <Text className={styles.statText}>待服药</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classNames(styles.statNumber, styles.danger)}>
            {todayRecords.filter(r => r.status === 'missed').length}
          </Text>
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
        {alerts.map((alert, index) => (
          <View
            key={index}
            className={classNames(
              styles.alertItem,
              alert.type === 'danger' && styles.alertDanger,
              alert.type === 'warning' && styles.alertWarning,
              alert.type === 'success' && styles.alertSuccess
            )}
            onClick={() => handleAlertClick(alert)}
          >
            <Text className={styles.alertTime}>{alert.time}</Text>
            <View className={styles.alertContent}>
              <Text className={styles.alertDesc}>{alert.desc}</Text>
              {alert.action && (
                <Text className={styles.alertAction}>{alert.action} →</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View className={styles.medicinePreview}>
        <View className={styles.previewHeader}>
          <Text className={styles.previewTitle}>今日服药明细</Text>
          <Text className={styles.previewTime}>{formatDate()} 实时更新</Text>
        </View>
        <View className={styles.previewList}>
          {todayRecords.length > 0 ? (
            todayRecords.map(record => (
              <View key={record.id} className={styles.previewItem}>
                <View
                  className={styles.previewColor}
                  style={{ backgroundColor: record.medicineColor }}
                />
                <View className={styles.previewInfo}>
                  <Text className={styles.previewName}>{record.medicineName}</Text>
                  <Text className={classNames(styles.previewStatus, styles[record.status])}>
                    {TIME_SLOT_LABELS[record.timeSlot]} {record.scheduledTime} · {getStatusText(record.status)}
                    {record.takenTime && ` · ${record.takenTime}服用`}
                  </Text>
                </View>
                {record.status === 'missed' && (
                  <Button
                    className={styles.catchUpBtn}
                    onClick={() => {
                      Taro.showToast({ title: '已发送补服提醒', icon: 'success' });
                    }}
                  >
                    提醒
                  </Button>
                )}
              </View>
            ))
          ) : (
            <View style={{ padding: '32rpx', textAlign: 'center' }}>
              <Text style={{ color: '#86909c', fontSize: '28rpx' }}>暂无服药记录</Text>
            </View>
          )}
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

      {showReminderModal && (
        <View className={styles.medicineDetail} onClick={() => setShowReminderModal(false)}>
          <View className={styles.detailContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.detailHeader}>
              <Text className={styles.detailTitle}>
                ⏰ 修改提醒时间
              </Text>
              <View className={styles.closeBtn} onClick={() => setShowReminderModal(false)}>✕</View>
            </View>
            
            <View style={{ padding: '24rpx 32rpx' }}>
              <Text style={{ fontSize: '28rpx', color: '#86909c', marginBottom: '32rpx' }}>
                以下是老人当前的服药提醒时间，点击即可为老人远程修改
              </Text>

              {timeSlotList.map(slot => (
                <View key={slot} className={styles.timeSlotEditRow}>
                  <Text className={styles.timeSlotEditIcon}>{timeSlotIcons[slot]}</Text>
                  <View className={styles.timeSlotEditInfo}>
                    <Text className={styles.timeSlotEditName}>{TIME_SLOT_LABELS[slot]}</Text>
                    <Text className={styles.timeSlotEditTime}>{globalReminderTimes[slot]}</Text>
                  </View>
                  <Button
                    className={classNames(styles.timeSlotEditBtn, editingSlot === slot && styles.loading)}
                    onClick={() => handleEditSlotTime(slot)}
                  >
                    {editingSlot === slot ? '修改中...' : '修改'}
                  </Button>
                </View>
              ))}

              <View style={{
                marginTop: '32rpx',
                padding: '24rpx',
                background: '#fff7e6',
                borderRadius: '16rpx'
              }}>
                <Text style={{ fontSize: '26rpx', color: '#fa8c16' }}>
                  💡 提示：修改时间后，老人的提醒会立即生效。请确保选择老人适合的服药时间。
                </Text>
              </View>
            </View>

            <View style={{ padding: '32rpx' }}>
              <BigButton
                text="完成修改"
                onClick={() => setShowReminderModal(false)}
                type="primary"
                block
                size="large"
              />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default FamilyPage;
