import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Image, Input } from '@tarojs/components';
import classNames from 'classnames';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { Medicine, MedicineTimeSlot, TIME_SLOT_LABELS, TIME_SLOT_ICONS } from '@/types';
import MedicineCard from '@/components/MedicineCard';
import BigButton from '@/components/BigButton';
import { MEDICINE_COLORS } from '@/utils';
import styles from './index.module.scss';

type FilterType = 'all' | 'active' | 'inactive';
type FormMode = 'add' | 'edit' | null;

interface MedicineForm {
  name: string;
  dosage: string;
  frequency: string;
  color: string;
  image: string;
  description: string;
  timeSlots: MedicineTimeSlot[];
  reminderTimes: Record<MedicineTimeSlot, string>;
  isActive: boolean;
}

const emptyForm: MedicineForm = {
  name: '',
  dosage: '',
  frequency: '每日一次',
  color: MEDICINE_COLORS[0].value,
  image: '',
  description: '',
  timeSlots: [],
  reminderTimes: {
    morning: '08:00',
    noon: '12:30',
    evening: '18:30',
    night: '21:30'
  },
  isActive: true
};

const frequencyOptions = ['每日一次', '每日两次', '每日三次', '每日四次', '按需服用'];

const MedicinePage: React.FC = () => {
  const {
    medicines,
    globalReminderTimes,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    toggleMedicineActive,
    settings
  } = useAppStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formData, setFormData] = useState<MedicineForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const setFormField = <K extends keyof MedicineForm>(key: K, value: MedicineForm[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleAddMedicine = () => {
    setFormData({
      ...emptyForm,
      reminderTimes: { ...globalReminderTimes }
    });
    setFormMode('add');
    setEditingId(null);
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
      setSelectedMedicine(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
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
        content: `确定要删除"${selectedMedicine.name}"吗？相关的服药记录也会被删除。`,
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
    if (selectedMedicine) {
      setFormData({
        name: selectedMedicine.name,
        dosage: selectedMedicine.dosage,
        frequency: selectedMedicine.frequency,
        color: selectedMedicine.color,
        image: selectedMedicine.image || '',
        description: selectedMedicine.description,
        timeSlots: [...selectedMedicine.timeSlots],
        reminderTimes: { ...selectedMedicine.reminderTimes },
        isActive: selectedMedicine.isActive
      });
      setEditingId(selectedMedicine.id);
      setFormMode('edit');
      setSelectedMedicine(null);
    }
  };

  const handleTimeSlotToggle = (slot: MedicineTimeSlot) => {
    setFormData(prev => {
      const hasSlot = prev.timeSlots.includes(slot);
      const newSlots = hasSlot
        ? prev.timeSlots.filter(s => s !== slot)
        : [...prev.timeSlots, slot].sort((a, b) => {
            const order = { morning: 0, noon: 1, evening: 2, night: 3 };
            return order[a] - order[b];
          });
      return { ...prev, timeSlots: newSlots };
    });
  };

  const handleReminderTimeChange = (slot: MedicineTimeSlot) => {
    Taro.showActionSheet({
      itemList: ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', 
                 '11:30', '12:00', '12:30', '13:00', '13:30', '17:30', '18:00', '18:30', 
                 '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'],
      success: (res) => {
        const times = ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
                       '11:30', '12:00', '12:30', '13:00', '13:30', '17:30', '18:00', '18:30',
                       '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
        setFormData(prev => ({
          ...prev,
          reminderTimes: { ...prev.reminderTimes, [slot]: times[res.tapIndex] }
        }));
      }
    });
  };

  const handleColorChange = (color: string) => {
    setFormField('color', color);
  };

  const handleImageUpload = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        setFormField('image', res.tempFilePaths[0]);
        Taro.showToast({ title: '图片已添加', icon: 'success' });
      },
      fail: () => {
        const imageId = Math.floor(Math.random() * 100) + 1;
        setFormField('image', `https://picsum.photos/id/${imageId}/200/200`);
        Taro.showToast({ title: '已添加示例图片', icon: 'none' });
      }
    });
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return '请输入药品名称';
    if (!formData.dosage.trim()) return '请输入服用剂量';
    if (formData.timeSlots.length === 0) return '请选择至少一个服用时段';
    return null;
  };

  const handleFormSubmit = () => {
    const error = validateForm();
    if (error) {
      Taro.showToast({ title: error, icon: 'none' });
      return;
    }

    const medicineData = {
      name: formData.name.trim(),
      dosage: formData.dosage.trim(),
      frequency: formData.frequency,
      color: formData.color,
      image: formData.image,
      description: formData.description.trim(),
      timeSlots: formData.timeSlots,
      reminderTimes: formData.reminderTimes,
      isActive: formData.isActive
    };

    if (formMode === 'add') {
      addMedicine(medicineData);
      Taro.showToast({ title: '添加成功', icon: 'success' });
    } else if (formMode === 'edit' && editingId) {
      updateMedicine(editingId, medicineData);
      Taro.showToast({ title: '修改成功', icon: 'success' });
    }

    setFormMode(null);
    setEditingId(null);
    setFormData({ ...emptyForm });
  };

  const handleFormCancel = () => {
    if (formData.name || formData.dosage || formData.timeSlots.length > 0) {
      Taro.showModal({
        title: '确认取消',
        content: '确定要放弃当前的编辑内容吗？',
        confirmText: '放弃',
        cancelText: '继续编辑',
        success: (res) => {
          if (res.confirm) {
            setFormMode(null);
            setEditingId(null);
            setFormData({ ...emptyForm });
          }
        }
      });
    } else {
      setFormMode(null);
      setEditingId(null);
      setFormData({ ...emptyForm });
    }
  };

  const timeSlotList: MedicineTimeSlot[] = ['morning', 'noon', 'evening', 'night'];

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

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>
          {filter === 'all' ? '全部药品' : filter === 'active' ? '正在服用' : '已停用药品'}
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
            {medicines.length === 0 && (
              <>
                <Text style={{ fontSize: '28rpx', color: '#86909c', marginBottom: '32rpx' }}>
                  点击上方按钮添加您需要服用的药品
                </Text>
                <BigButton
                  text="添加第一种药品"
                  onClick={handleAddMedicine}
                  block
                />
              </>
            )}
          </View>
        )}
      </View>

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
              {selectedMedicine.description && (
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>药品说明</Text>
                  <Text className={styles.detailValue}>{selectedMedicine.description}</Text>
                </View>
              )}
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

      {formMode && (
        <View className={styles.medicineDetail} onClick={handleFormCancel}>
          <View className={styles.formContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.detailHeader}>
              <Text className={styles.detailTitle}>
                {formMode === 'add' ? '添加新药品' : '编辑药品'}
              </Text>
              <View className={styles.closeBtn} onClick={handleFormCancel}>✕</View>
            </View>

            <ScrollView scrollY enhanced showScrollbar={false} style={{ maxHeight: '80vh' }}>
              <View className={styles.formSection}>
                <Text className={styles.formSectionTitle}>📷 药品照片</Text>
                <View className={styles.imageUploader} onClick={handleImageUpload}>
                  {formData.image ? (
                    <Image src={formData.image} className={styles.uploadedImage} mode="aspectFill" />
                  ) : (
                    <View className={styles.imagePlaceholder}>
                      <Text style={{ fontSize: '64rpx', marginBottom: '16rpx' }}>📷</Text>
                      <Text style={{ fontSize: '28rpx', color: '#86909c' }}>点击添加照片</Text>
                    </View>
                  )}
                </View>
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formSectionTitle}>💊 药品信息</Text>
                
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>药品名称 <Text style={{ color: '#f53f3f' }}>*</Text></Text>
                  <Input
                    className={styles.formInput}
                    placeholder="例如：阿司匹林肠溶片"
                    value={formData.name}
                    onInput={(e) => setFormField('name', e.detail.value)}
                    maxlength={30}
                  />
                </View>

                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>服用剂量 <Text style={{ color: '#f53f3f' }}>*</Text></Text>
                  <Input
                    className={styles.formInput}
                    placeholder="例如：每次1片，100mg"
                    value={formData.dosage}
                    onInput={(e) => setFormField('dosage', e.detail.value)}
                    maxlength={50}
                  />
                </View>

                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>服用频次</Text>
                  <View className={styles.frequencyOptions}>
                    {frequencyOptions.map(opt => (
                      <Button
                        key={opt}
                        className={classNames(styles.frequencyBtn, formData.frequency === opt && styles.active)}
                        onClick={() => setFormField('frequency', opt)}
                      >
                        {opt}
                      </Button>
                    ))}
                  </View>
                </View>

                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>药品颜色</Text>
                  <View className={styles.colorOptions}>
                    {MEDICINE_COLORS.map(c => (
                      <View
                        key={c.value}
                        className={classNames(
                          styles.colorOption,
                          formData.color === c.value && styles.selected
                        )}
                        style={{ backgroundColor: c.value }}
                        onClick={() => handleColorChange(c.value)}
                      >
                        {formData.color === c.value && (
                          <Text style={{ color: '#fff', fontSize: '32rpx', fontWeight: 'bold' }}>✓</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>服用时段 <Text style={{ color: '#f53f3f' }}>*</Text></Text>
                  <View className={styles.timeSlotOptions}>
                    {timeSlotList.map(slot => (
                      <View key={slot} style={{ marginBottom: '24rpx' }}>
                        <View
                          className={classNames(
                            styles.timeSlotOption,
                            formData.timeSlots.includes(slot) && styles.active
                          )}
                          onClick={() => handleTimeSlotToggle(slot)}
                        >
                          <Text className={styles.timeSlotIcon}>{TIME_SLOT_ICONS[slot]}</Text>
                          <Text className={styles.timeSlotName}>{TIME_SLOT_LABELS[slot]}</Text>
                          <View className={classNames(styles.checkbox, formData.timeSlots.includes(slot) && styles.checked)}>
                            {formData.timeSlots.includes(slot) && '✓'}
                          </View>
                        </View>
                        {formData.timeSlots.includes(slot) && (
                          <Button
                            className={styles.timePickerBtn}
                            onClick={() => handleReminderTimeChange(slot)}
                          >
                            ⏰ 提醒时间：{formData.reminderTimes[slot]}
                          </Button>
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>药品说明</Text>
                  <Input
                    className={styles.formInput}
                    placeholder="例如：饭后服用、避免与...同服"
                    value={formData.description}
                    onInput={(e) => setFormField('description', e.detail.value)}
                    maxlength={100}
                  />
                </View>

                <View className={styles.formItem}>
                  <View className={styles.activeToggleRow}>
                    <Text className={styles.formLabel}>立即启用该药品</Text>
                    <View
                      className={classNames(styles.toggleSwitch, formData.isActive && styles.on)}
                      onClick={() => setFormField('isActive', !formData.isActive)}
                    >
                      <View className={styles.toggleCircle} />
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className={styles.formFooter}>
              <BigButton
                text={formMode === 'add' ? '✅ 保存药品' : '✅ 保存修改'}
                onClick={handleFormSubmit}
                type="primary"
                block
                size="large"
              />
              <View style={{ height: '16rpx' }} />
              <BigButton
                text="取消"
                onClick={handleFormCancel}
                variant="outline"
                block
              />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default MedicinePage;
