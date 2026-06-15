import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Input } from '@tarojs/components';
import classNames from 'classnames';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { HealthRecordType, HEALTH_TYPE_LABELS, HEALTH_TYPE_UNITS } from '@/types';
import { getTodayDate, formatTime } from '@/utils';
import HealthRecordItem from '@/components/HealthRecordItem';
import BigButton from '@/components/BigButton';
import styles from './index.module.scss';

const HealthPage: React.FC = () => {
  const { healthRecords, addHealthRecord, getHealthRecordsByType, settings } = useAppStore();
  const [selectedType, setSelectedType] = useState<HealthRecordType>('bloodPressure');
  const [filterType, setFilterType] = useState<HealthRecordType | 'all'>('all');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [note, setNote] = useState('');

  const typeOptions = [
    { type: 'bloodPressure' as HealthRecordType, icon: '❤️', label: '血压' },
    { type: 'bloodSugar' as HealthRecordType, icon: '🩸', label: '血糖' },
    { type: 'heartRate' as HealthRecordType, icon: '💓', label: '心率' },
    { type: 'weight' as HealthRecordType, icon: '⚖️', label: '体重' }
  ];

  const latestRecords = useMemo(() => {
    return {
      bloodPressure: getHealthRecordsByType('bloodPressure')[0],
      bloodSugar: getHealthRecordsByType('bloodSugar')[0],
      heartRate: getHealthRecordsByType('heartRate')[0],
      weight: getHealthRecordsByType('weight')[0]
    };
  }, [getHealthRecordsByType]);

  const filteredRecords = useMemo(() => {
    if (filterType === 'all') {
      return [...healthRecords].sort((a, b) => 
        new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
      ).slice(0, 10);
    }
    return getHealthRecordsByType(filterType).slice(0, 10);
  }, [filterType, healthRecords, getHealthRecordsByType]);

  const trendData = useMemo(() => {
    const records = getHealthRecordsByType(selectedType).slice(0, 7).reverse();
    const maxValues: Record<HealthRecordType, number> = {
      bloodPressure: 180,
      bloodSugar: 15,
      heartRate: 120,
      weight: 100
    };
    const max = maxValues[selectedType];
    
    return records.map(record => ({
      value: record.value,
      value2: record.value2,
      unit: record.unit,
      day: record.date.slice(5),
      percentage: Math.min((record.value / max) * 100, 100),
      isAbnormal: checkAbnormal(selectedType, record.value, record.value2)
    }));
  }, [selectedType, getHealthRecordsByType]);

  function checkAbnormal(type: HealthRecordType, value: number, value2?: number): boolean {
    switch (type) {
      case 'bloodPressure':
        return value > 140 || (value2 !== undefined && value2 > 90);
      case 'bloodSugar':
        return value > 7.0 || value < 3.9;
      case 'heartRate':
        return value > 100 || value < 60;
      case 'weight':
        return false;
      default:
        return false;
    }
  }

  function getStatusClass(value: number, type: HealthRecordType, value2?: number): string {
    if (checkAbnormal(type, value, value2)) return styles.high;
    return styles.normal;
  }

  const handleAddRecord = () => {
    const num1 = parseFloat(value1);
    const num2 = value2 ? parseFloat(value2) : undefined;
    
    if (isNaN(num1)) {
      Taro.showToast({
        title: '请输入有效数值',
        icon: 'none'
      });
      return;
    }

    if (selectedType === 'bloodPressure' && (isNaN(num2!) || num2 === undefined)) {
      Taro.showToast({
        title: '请输入舒张压',
        icon: 'none'
      });
      return;
    }

    addHealthRecord({
      type: selectedType,
      value: num1,
      value2: num2,
      unit: HEALTH_TYPE_UNITS[selectedType],
      date: getTodayDate(),
      time: formatTime(new Date()),
      note: note || undefined
    });

    setValue1('');
    setValue2('');
    setNote('');

    Taro.showToast({
      title: '记录已保存',
      icon: 'success'
    });
  };

  const getValueDisplay = (type: HealthRecordType) => {
    const record = latestRecords[type];
    if (!record) return { value: '--', unit: HEALTH_TYPE_UNITS[type], class: '' };
    
    if (type === 'bloodPressure' && record.value2) {
      return {
        value: `${record.value}/${record.value2}`,
        unit: record.unit,
        class: getStatusClass(record.value, type, record.value2)
      };
    }
    return {
      value: record.value.toString(),
      unit: record.unit,
      class: getStatusClass(record.value, type)
    };
  };

  return (
    <ScrollView
      className={classNames(styles.healthPage, settings.mode === 'highContrast' && 'high-contrast')}
      scrollY
      enhanced
      showScrollbar={false}
    >
      <Text className="page-title">健康记录</Text>

      <View className={styles.summaryCards}>
        {typeOptions.slice(0, 4).map(option => {
          const display = getValueDisplay(option.type);
          return (
            <View key={option.type} className={styles.summaryCard}>
              <Text className={styles.summaryIcon}>{option.icon}</Text>
              <Text className={classNames(styles.summaryValue, display.class)}>{display.value}</Text>
              <Text className={styles.summaryUnit}>{display.unit}</Text>
              <Text className={styles.summaryLabel}>{option.label}</Text>
            </View>
          );
        })}
      </View>

      <View className={styles.quickRecord}>
        <Text className={styles.quickRecordTitle}>快速记录</Text>
        
        <View className={styles.recordTypeButtons}>
          {typeOptions.map(option => (
            <Button
              key={option.type}
              className={classNames(styles.typeBtn, selectedType === option.type && styles.active)}
              onClick={() => setSelectedType(option.type)}
            >
              <Text className={styles.typeIcon}>{option.icon}</Text>
              <Text className={styles.typeLabel}>{option.label}</Text>
            </Button>
          ))}
        </View>

        <View className={styles.inputRow}>
          {selectedType === 'bloodPressure' ? (
            <>
              <View className={styles.inputGroup}>
                <Text className={styles.inputLabel}>收缩压</Text>
                <Input
                  className={styles.inputField}
                  type="digit"
                  placeholder="--"
                  value={value1}
                  onInput={(e) => setValue1(e.detail.value)}
                />
                <Text className={styles.inputUnit}>mmHg</Text>
              </View>
              <View className={styles.inputGroup}>
                <Text className={styles.inputLabel}>舒张压</Text>
                <Input
                  className={styles.inputField}
                  type="digit"
                  placeholder="--"
                  value={value2}
                  onInput={(e) => setValue2(e.detail.value)}
                />
                <Text className={styles.inputUnit}>mmHg</Text>
              </View>
            </>
          ) : (
            <View className={styles.inputGroup}>
              <Text className={styles.inputLabel}>{HEALTH_TYPE_LABELS[selectedType]}</Text>
              <Input
                className={styles.inputField}
                type="digit"
                placeholder="请输入数值"
                value={value1}
                onInput={(e) => setValue1(e.detail.value)}
              />
              <Text className={styles.inputUnit}>{HEALTH_TYPE_UNITS[selectedType]}</Text>
            </View>
          )}
        </View>

        <Input
          className={styles.noteInput}
          placeholder="添加备注（可选）"
          value={note}
          onInput={(e) => setNote(e.detail.value)}
          maxlength={50}
        />

        <BigButton
          text="保存记录"
          onClick={handleAddRecord}
          type="success"
          size="large"
          block
        />
      </View>

      <View className={styles.trendChart}>
        <Text className={styles.trendTitle}>
          {HEALTH_TYPE_LABELS[selectedType]}趋势（近7天）
        </Text>
        {trendData.length > 0 ? (
          <View className={styles.chartContainer}>
            {trendData.map((item, index) => (
              <View key={index} className={styles.chartBar}>
                <Text className={styles.barValue}>{item.value}</Text>
                <View className={styles.barWrapper}>
                  <View
                    className={classNames(
                      styles.barFill,
                      item.isAbnormal ? styles.high : styles.normal
                    )}
                    style={{ height: `${item.percentage}%` }}
                  />
                </View>
                <Text className={styles.barDay}>{item.day}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyState} style={{ background: 'transparent', boxShadow: 'none' }}>
            <Text className={styles.emptyIcon}>📊</Text>
            <Text className={styles.emptyText}>暂无记录数据</Text>
          </View>
        )}
      </View>

      <View className={styles.historySection}>
        <Text className={styles.historyTitle}>历史记录</Text>
        
        <View className={styles.filterTabs}>
          <Button
            className={classNames(styles.filterTab, filterType === 'all' && styles.active)}
            onClick={() => setFilterType('all')}
          >
            全部
          </Button>
          {typeOptions.map(option => (
            <Button
              key={option.type}
              className={classNames(styles.filterTab, filterType === option.type && styles.active)}
              onClick={() => setFilterType(option.type)}
            >
              {option.label}
            </Button>
          ))}
        </View>

        {filteredRecords.length > 0 ? (
          filteredRecords.map(record => (
            <HealthRecordItem
              key={record.id}
              record={record}
              isAbnormal={checkAbnormal(record.type, record.value, record.value2)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📝</Text>
            <Text className={styles.emptyText}>还没有记录</Text>
            <Text style={{ fontSize: '28rpx', color: '#86909c' }}>
              点击上方记录您的健康数据
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default HealthPage;
