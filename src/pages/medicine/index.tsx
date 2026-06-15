import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Image } from '@tarojs/components';
import classNames from 'classnames';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { Medicine, TIME_SLOT_LABELS } from '@/types';
import MedicineCard from '@/components/MedicineCard';
import BigButton from '@/components/BigButton';
import styles from './index.module.scss';

type FilterType = 'all' | 'active' | 'inactive';

const MedicinePage: React.FC = () => {
  const { medicines, toggleMedicineActive, deleteMedicine, settings } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const activeMedicines = useMemo(() => medicines.filter(m => m.isActive), [medicines]);
  const inactiveMedicines = useMemo(() => medicines.filter(m => !m.isActive), [medicines]);

  const filteredMedicines = useMemo(() => {
    switch (filter) {
      case 'active':
        return activeMedicines;
      case 'inactive':
        return inactiveMedicines;
      default:
        return medicines;
    }
  }, [filter, medicines, activeMedicines, inactiveMedicines]);

  const handleAddMedicine = () => {
    Taro.showToast({
      title: '添加药品功能开发中',
      icon: 'none'
    });
  };

  const handleMedicineClick = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
  };

  const handleCloseDetail = () => {
    setSelectedMedicine(null);
  };

  const handleToggleActive = () => {
    if (selectedMedicine) {
      toggleMedicineActive(selectedMedicine.id);
      setSelectedMedicine({
        ...selectedMedicine,
        isActive: !selectedMedicine.isActive
      });
      Taro.showToast({
        title: selectedMedicine.isActive ? '已停用' : '已启用',
        icon: 'success'
      });
    }
  };

  const handleDelete = () => {
    if (selectedMedicine) {
      Taro.showModal({
        title: '确认删除',
        content: `确定要删除"${selectedMedicine.name}"吗？`,
        confirmText: '删除',
        cancelText: '取消',
        confirmColor: '#f53f3f',
        success: (res) => {
          if (res.confirm) {
            deleteMedicine(selectedMedicine.id);
            setSelectedMedicine(null);
            Taro.showToast({
              title: '删除成功',
              icon: 'success'
            });
          }
        }
      });
    }
  };

  const handleEdit = () => {
    Taro.showToast({
      title: '编辑功能开发中',
      icon: 'none'
    });
  };

  return (
    <ScrollView
      className={classNames(styles.medicinePage, settings.mode === 'highContrast' && 'high-contrast')}
      scrollY
      enhanced
      showScrollbar={false}
    >
      <View className={styles.statsRow}>
        <View className={classNames(styles.statCard, styles.active)}>
          <Text className={styles.statNumber}>{activeMedicines.length}</Text>
          <Text className={styles.statLabel}>正在服用</Text>
        </View>
        <View className={classNames(styles.statCard, styles.inactive)}>
          <Text className={styles.statNumber}>{inactiveMedicines.length}</Text>
          <Text className={styles.statLabel}>已停用</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statNumber}>{medicines.length}</Text>
          <Text className={styles.statLabel}>全部药品</Text>
        </View>
      </View>

      <Button
        className={styles.addButton}
        onClick={handleAddMedicine}
      >
        <Text className={styles.addButtonIcon}>+</Text>
        <Text>添加新药品</Text>
      </Button>

      <View className={styles.filterTabs}>
        <Button
          className={classNames(styles.filterTab, filter === 'all' && styles.active)}
          onClick={() => setFilter('all')}
        >
          全部 ({medicines.length})
        </Button>
        <Button
          className={classNames(styles.filterTab, filter === 'active' && styles.active)}
          onClick={() => setFilter('active')}
        >
          服用中 ({activeMedicines.length})
        </Button>
        <Button
          className={classNames(styles.filterTab, filter === 'inactive' && styles.active)}
          onClick={() => setFilter('inactive')}
        >
          已停用 ({inactiveMedicines.length})
        </Button>
      </View>

      {activeMedicines.length > 0 && (
        <>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              {filter === 'all' ? '正在服用' : filter === 'active' ? '药品列表' : '已停用药品'}
            </Text>
            <Text className={styles.sectionCount}>{filteredMedicines.length}种</Text>
          </View>

          <View className={styles.medicineList}>
            {filteredMedicines.length > 0 ? (
              filteredMedicines.map(medicine => (
                <MedicineCard
                  key={medicine.id}
                  medicine={medicine}
                  onClick={() => handleMedicineClick(medicine)}
                />
              ))
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>💊</Text>
                <Text className={styles.emptyText}>
                  {filter === 'active' ? '没有正在服用的药品' : 
                   filter === 'inactive' ? '没有已停用的药品' : '暂无药品'}
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {activeMedicines.length > 0 && (
        <View className={styles.colorLegend}>
          <Text className={styles.legendTitle}>药品颜色标识</Text>
          <View className={styles.legendItems}>
            {activeMedicines.map(medicine => (
              <View key={medicine.id} className={styles.legendItem}>
                <View
                  className={styles.legendColor}
                  style={{ backgroundColor: medicine.color }}
                />
                <Text className={styles.legendName}>{medicine.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {medicines.length === 0 && (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>💊</Text>
          <Text className={styles.emptyText}>还没有添加任何药品</Text>
          <Text style={{ fontSize: '28rpx', color: '#86909c', marginBottom: '32rpx' }}>
            点击上方按钮添加您需要服用的药品
          </Text>
          <BigButton
            text="添加第一种药品"
            onClick={handleAddMedicine}
            block
          />
        </View>
      )}

      {selectedMedicine && (
        <View className={styles.medicineDetail} onClick={handleCloseDetail}>
          <View className={styles.detailContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.detailHeader}>
              <Text className={styles.detailTitle}>药品详情</Text>
              <View className={styles.closeBtn} onClick={handleCloseDetail}>✕</View>
            </View>

            {selectedMedicine.image && (
              <Image
                className={styles.detailImage}
                src={selectedMedicine.image}
                mode="aspectFill"
              />
            )}

            <View className={styles.detailInfo}>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>药品名称</Text>
                <Text className={styles.detailValue}>{selectedMedicine.name}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>服用剂量</Text>
                <Text className={styles.detailValue}>{selectedMedicine.dosage}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>服用频次</Text>
                <Text className={styles.detailValue}>{selectedMedicine.frequency}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>服用时段</Text>
                <Text className={styles.detailValue}>
                  {selectedMedicine.timeSlots.map(slot => 
                    `${TIME_SLOT_LABELS[slot]} ${selectedMedicine.reminderTimes[slot]}`
                  ).join('、')}
                </Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>药品说明</Text>
                <Text className={styles.detailValue}>{selectedMedicine.description}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>当前状态</Text>
                <Text
                  className={styles.detailValue}
                  style={{ color: selectedMedicine.isActive ? '#00b42a' : '#86909c' }}
                >
                  {selectedMedicine.isActive ? '正在服用' : '已停用'}
                </Text>
              </View>
            </View>

            <View className={styles.detailActions}>
              <Button
                className={classNames(styles.detailActionBtn, styles.toggleBtn)}
                onClick={handleToggleActive}
              >
                {selectedMedicine.isActive ? '停用' : '启用'}
              </Button>
              <Button
                className={classNames(styles.detailActionBtn, styles.editBtn)}
                onClick={handleEdit}
              >
                编辑
              </Button>
              <Button
                className={classNames(styles.detailActionBtn, styles.deleteBtn)}
                onClick={handleDelete}
              >
                删除
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default MedicinePage;
