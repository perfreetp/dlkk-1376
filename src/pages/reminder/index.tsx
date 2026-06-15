import React, { useState } from 'react';
import { View, Text, Button, ScrollView, Switch } from '@tarojs/components';
import classNames from 'classnames';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { AppMode } from '@/types';
import BigButton from '@/components/BigButton';
import styles from './index.module.scss';

const ReminderPage: React.FC = () => {
  const {
    settings,
    globalReminderTimes,
    updateReminderSettings,
    setAppMode,
    setFontSize,
    speak,
    updateGlobalReminderTime
  } = useAppStore();
  const [testVolume, setTestVolume] = useState(false);

  const handleToggleReminder = (enabled: boolean) => {
    updateReminderSettings({ enabled });
    Taro.showToast({
      title: enabled ? '提醒已开启' : '提醒已关闭',
      icon: 'success'
    });
  };

  const handleToggleVoice = (voiceEnabled: boolean) => {
    updateReminderSettings({ voiceEnabled });
    Taro.showToast({
      title: voiceEnabled ? '语音播报已开启' : '语音播报已关闭',
      icon: 'success'
    });
  };

  const handleVolumeChange = (delta: number) => {
    const newVolume = Math.max(0, Math.min(100, settings.reminder.volume + delta));
    updateReminderSettings({ volume: newVolume });
  };

  const handleSpeedChange = (speed: number) => {
    updateReminderSettings({ voiceSpeed: speed });
  };

  const handleModeChange = (mode: AppMode) => {
    setAppMode(mode);
    const modeNames: Record<AppMode, string> = {
      normal: '标准模式',
      highContrast: '高对比模式',
      simple: '简洁模式'
    };
    Taro.showToast({
      title: `已切换到${modeNames[mode]}`,
      icon: 'success'
    });
  };

  const handleFontSizeChange = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSize(size);
    const sizeNames = {
      normal: '标准字体',
      large: '大字体',
      xlarge: '超大字体'
    };
    Taro.showToast({
      title: `已切换到${sizeNames[size]}`,
      icon: 'success'
    });
  };

  const handleTestVoice = () => {
    setTestVolume(true);
    speak('这是语音测试，请调节音量到合适的大小。现在是' + settings.reminder.volume + '%音量。');
    setTimeout(() => setTestVolume(false), 3000);
  };

  const handleTimeChange = (slot: 'morning' | 'noon' | 'evening' | 'night') => {
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
        const slotNames = { morning: '早上', noon: '中午', evening: '晚上', night: '睡前' };
        Taro.showToast({
          title: `${slotNames[slot]}已设为${newTime}`,
          icon: 'success'
        });
      }
    });
  };

  const modeOptions = [
    {
      mode: 'normal' as AppMode,
      icon: '📱',
      name: '标准模式',
      desc: '完整功能，美观舒适'
    },
    {
      mode: 'highContrast' as AppMode,
      icon: '👁️',
      name: '高对比模式',
      desc: '黑底白字，更清晰易读'
    },
    {
      mode: 'simple' as AppMode,
      icon: '➖',
      name: '简洁模式',
      desc: '隐藏装饰，只留核心功能'
    }
  ];

  const timeSlots = [
    { slot: 'morning' as const, icon: '🌅', name: '早上' },
    { slot: 'noon' as const, icon: '☀️', name: '中午' },
    { slot: 'evening' as const, icon: '🌆', name: '晚上' },
    { slot: 'night' as const, icon: '🌙', name: '睡前' }
  ];

  return (
    <ScrollView
      className={classNames(styles.reminderPage, settings.mode === 'highContrast' && 'high-contrast')}
      scrollY
      enhanced
      showScrollbar={false}
    >
      <View className={styles.settingCard}>
        <View className={styles.settingHeader}>
          <Text className={styles.settingTitle}>提醒开关</Text>
        </View>
        <View className={styles.settingItem}>
          <View className={styles.itemLabel}>
            <Text className={styles.itemTitle}>服药提醒</Text>
            <Text className={styles.itemSubtitle}>到点自动提醒服药</Text>
          </View>
          <Switch
            checked={settings.reminder.enabled}
            onChange={(e) => handleToggleReminder(e.detail.value)}
            color="#ff7a45"
          />
        </View>
        <View className={styles.settingItem}>
          <View className={styles.itemLabel}>
            <Text className={styles.itemTitle}>语音播报</Text>
            <Text className={styles.itemSubtitle}>提醒时语音念出药品名称</Text>
          </View>
          <Switch
            checked={settings.reminder.voiceEnabled}
            onChange={(e) => handleToggleVoice(e.detail.value)}
            color="#ff7a45"
            disabled={!settings.reminder.enabled}
          />
        </View>
      </View>

      <View className={styles.sectionDivider} />

      <View className={styles.settingCard}>
        <View className={styles.settingHeader}>
          <Text className={styles.settingTitle}>语音设置</Text>
        </View>
        <Text className={styles.settingDesc}>调节语音播报的音量和语速</Text>
        
        <View className={styles.volumeControl}>
          <Text className={styles.volumeValue}>
            {settings.reminder.volume}
            <Text className={styles.volumeUnit}>%</Text>
          </Text>
          <View className={styles.volumeButtons}>
            <Button
              className={styles.volumeBtn}
              onClick={() => handleVolumeChange(-10)}
              disabled={settings.reminder.volume <= 0}
            >
              -
            </Button>
            <Button
              className={styles.volumeBtn}
              onClick={() => handleVolumeChange(10)}
              disabled={settings.reminder.volume >= 100}
            >
              +
            </Button>
          </View>
        </View>

        <View className={styles.settingItem} style={{ marginTop: '32rpx' }}>
          <Text className={styles.itemTitle}>播报语速</Text>
        </View>
        <View className={styles.speedControl}>
          {[0.6, 0.8, 1.0, 1.2].map(speed => (
            <Button
              key={speed}
              className={classNames(styles.speedBtn, settings.reminder.voiceSpeed === speed && styles.active)}
              onClick={() => handleSpeedChange(speed)}
            >
              {speed === 0.6 ? '慢速' : speed === 0.8 ? '较慢' : speed === 1.0 ? '正常' : '较快'}
            </Button>
          ))}
        </View>

        <View className={styles.testButton}>
          <BigButton
            text={testVolume ? '🔊 测试中...' : '🔊 测试语音'}
            onClick={handleTestVoice}
            type="info"
            disabled={testVolume}
          />
        </View>
      </View>

      <View className={styles.sectionDivider} />

      <View className={styles.settingCard}>
        <View className={styles.settingHeader}>
          <Text className={styles.settingTitle}>显示模式</Text>
        </View>
        <Text className={styles.settingDesc}>选择适合您的显示方式</Text>
        
        <View className={styles.modeSelector}>
          {modeOptions.map(option => (
            <View
              key={option.mode}
              className={classNames(styles.modeOption, settings.mode === option.mode && styles.active)}
              onClick={() => handleModeChange(option.mode)}
            >
              <Text className={styles.modeIcon}>{option.icon}</Text>
              <View className={styles.modeInfo}>
                <Text className={styles.modeName}>{option.name}</Text>
                <Text className={styles.modeDesc}>{option.desc}</Text>
              </View>
              <View className={styles.modeCheck}>
                {settings.mode === option.mode ? '✓' : ''}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.sectionDivider} />

      <View className={styles.settingCard}>
        <View className={styles.settingHeader}>
          <Text className={styles.settingTitle}>字体大小</Text>
        </View>
        <Text className={styles.settingDesc}>选择适合您的字体大小</Text>
        
        <View className={styles.fontSizeSelector}>
          {(['normal', 'large', 'xlarge'] as const).map(size => (
            <Button
              key={size}
              className={classNames(styles.fontSizeBtn, settings.fontSize === size && styles.active)}
              onClick={() => handleFontSizeChange(size)}
            >
              <Text className={classNames(styles.fontSizeText, size)}>
                {size === 'normal' ? 'A' : size === 'large' ? 'A' : 'A'}
              </Text>
              <Text className={styles.fontSizeLabel}>
                {size === 'normal' ? '标准' : size === 'large' ? '大' : '超大'}
              </Text>
            </Button>
          ))}
        </View>
      </View>

      <View className={styles.sectionDivider} />

      <View className={styles.settingCard}>
        <View className={styles.settingHeader}>
          <Text className={styles.settingTitle}>提醒时间</Text>
        </View>
        <Text className={styles.settingDesc}>设置各时段的提醒时间</Text>
        
        <View className={styles.timeSettings}>
          {timeSlots.map(item => (
            <View key={item.slot} className={styles.timeSlotSetting}>
              <Text className={styles.timeSlotIcon}>{item.icon}</Text>
              <Text className={styles.timeSlotName}>{item.name}</Text>
              <Button
                className={styles.timePicker}
                onClick={() => handleTimeChange(item.slot)}
              >
                ⏰ {globalReminderTimes[item.slot]}
              </Button>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.sectionDivider} />

      <View className={styles.settingCard}>
        <View className={styles.settingHeader}>
          <Text className={styles.settingTitle}>更多设置</Text>
        </View>
        <View className={styles.settingItem}>
          <View className={styles.itemLabel}>
            <Text className={styles.itemTitle}>重复提醒</Text>
            <Text className={styles.itemSubtitle}>未确认时重复提醒{settings.reminder.repeatCount}次</Text>
          </View>
          <Text className={styles.itemTitle} style={{ color: '#ff7a45' }}>
            {settings.reminder.intervalMinutes}分钟/次
          </Text>
        </View>
        <View className={styles.settingItem}>
          <View className={styles.itemLabel}>
            <Text className={styles.itemTitle}>提前提醒</Text>
            <Text className={styles.itemSubtitle}>提前{settings.reminder.preAlertMinutes}分钟提醒</Text>
          </View>
          <Text className={styles.itemTitle} style={{ color: '#00b42a' }}>
            已关闭
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ReminderPage;
