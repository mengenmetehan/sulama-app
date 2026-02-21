import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  Alert, Modal, TextInput, StyleSheet, RefreshControl,
} from 'react-native';
import { colors } from '../constants/colors';
import api from '../services/api';
import LoadingView from '../components/LoadingView';

export default function SchedulesScreen() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formHour, setFormHour] = useState('06');
  const [formMinute, setFormMinute] = useState('00');
  const [formDuration, setFormDuration] = useState('120');

  const fetchSchedules = async () => {
    try {
      const data = await api.getSchedules();
      setSchedules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);

  // Yeni zamanlayıcı modal'ı aç
  const openNewSchedule = () => {
    setEditingSchedule(null);
    setFormName('');
    setFormHour('06');
    setFormMinute('00');
    setFormDuration('120');
    setModalVisible(true);
  };

  // Düzenleme modal'ı aç
  const openEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setFormName(schedule.name);
    try {
      const parts = schedule.cronExpression.split(' ');
      setFormMinute(parts[1] || '00');
      setFormHour(parts[2] || '06');
    } catch {
      setFormHour('06');
      setFormMinute('00');
    }
    setFormDuration(String(schedule.durationMinutes));
    setModalVisible(true);
  };

  // Kaydet
  const saveSchedule = async () => {
    const hour = formHour.padStart(2, '0');
    const minute = formMinute.padStart(2, '0');
    const cronExpression = `0 ${minute} ${hour} * * ?`;
    const body = {
      name: formName || `Sulama ${hour}:${minute}`,
      cronExpression,
      durationMinutes: parseInt(formDuration) || 120,
      zone: 'ALL',
      enabled: true,
    };

    try {
      if (editingSchedule) {
        await api.updateSchedule(editingSchedule.id, body);
      } else {
        await api.createSchedule(body);
      }
      setModalVisible(false);
      fetchSchedules();
    } catch (e) {
      Alert.alert('Hata', 'Zamanlayıcı kaydedilemedi');
    }
  };

  // Toggle
  const toggleSchedule = async (id) => {
    try {
      await api.toggleSchedule(id);
      fetchSchedules();
    } catch (e) {
      Alert.alert('Hata', 'İşlem başarısız');
    }
  };

  // Sil
  const deleteSchedule = (id, name) => {
    Alert.alert('Zamanlayıcıyı Sil', `"${name}" silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteSchedule(id);
            fetchSchedules();
          } catch (e) {
            Alert.alert('Hata', 'Silinemedi');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingView message="Zamanlayıcılar yükleniyor..." />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchSchedules(); }}
          colors={[colors.primary]} />
      }
    >
      <Text style={styles.title}>⏰ Zamanlayıcılar</Text>
      <Text style={styles.subtitle}>Otomatik sulama programları</Text>

      {/* Yeni Ekle Butonu */}
      <TouchableOpacity style={styles.addButton} onPress={openNewSchedule}>
        <Text style={styles.addButtonText}>+ Yeni Zamanlayıcı Ekle</Text>
      </TouchableOpacity>

      {/* Liste */}
      {schedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⏰</Text>
          <Text style={styles.emptyText}>Henüz zamanlayıcı yok</Text>
          <Text style={styles.emptySubtext}>Yukarıdaki butona basarak ekleyin</Text>
        </View>
      ) : (
        schedules.map((schedule) => (
          <View
            key={schedule.id}
            style={[styles.scheduleCard, !schedule.enabled && styles.scheduleCardDisabled]}
          >
            <View style={styles.scheduleHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scheduleName, !schedule.enabled && styles.disabledText]}>
                  {schedule.name}
                </Text>
                <Text style={styles.scheduleTime}>{schedule.humanReadable}</Text>
                <Text style={styles.scheduleDuration}>
                  Süre: {schedule.durationMinutes} dakika • Bölge: {schedule.zone}
                </Text>
              </View>
              <Switch
                value={schedule.enabled}
                onValueChange={() => toggleSchedule(schedule.id)}
                trackColor={{ false: '#444', true: colors.primaryDark }}
                thumbColor={schedule.enabled ? colors.primary : '#888'}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => openEditSchedule(schedule)}
              >
                <Text style={styles.editText}>✏️ Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => deleteSchedule(schedule.id, schedule.name)}
              >
                <Text style={styles.deleteText}>🗑️ Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* ============ MODAL ============ */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSchedule ? 'Zamanlayıcı Düzenle' : 'Yeni Zamanlayıcı'}
            </Text>

            {/* İsim */}
            <Text style={styles.inputLabel}>İsim</Text>
            <TextInput
              style={styles.input}
              value={formName}
              onChangeText={setFormName}
              placeholder="Sabah Sulama"
              placeholderTextColor={colors.textMuted}
            />

            {/* Saat */}
            <Text style={styles.inputLabel}>Başlangıç Saati</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={formHour}
                onChangeText={(t) => setFormHour(t.replace(/[^0-9]/g, ''))}
                placeholder="06"
                keyboardType="number-pad"
                maxLength={2}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={formMinute}
                onChangeText={(t) => setFormMinute(t.replace(/[^0-9]/g, ''))}
                placeholder="00"
                keyboardType="number-pad"
                maxLength={2}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Süre */}
            <Text style={styles.inputLabel}>Süre (dakika)</Text>
            <TextInput
              style={styles.input}
              value={formDuration}
              onChangeText={(t) => setFormDuration(t.replace(/[^0-9]/g, ''))}
              placeholder="120"
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
            />

            {/* Kısa açıklama */}
            <Text style={styles.infoText}>
              Her gün saat {formHour.padStart(2, '0')}:{formMinute.padStart(2, '0')}'de başlayıp{' '}
              {formDuration || '?'} dakika sulama yapacak
            </Text>

            {/* Butonlar */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={saveSchedule}
              >
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },

  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  // Schedule card
  scheduleCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scheduleCardDisabled: { opacity: 0.5 },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center' },
  scheduleName: { fontSize: 17, fontWeight: '600', color: colors.text },
  disabledText: { color: colors.textMuted },
  scheduleTime: { fontSize: 15, color: colors.primary, marginTop: 4, fontWeight: '500' },
  scheduleDuration: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },

  actions: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    gap: 16,
  },
  actionBtn: { paddingVertical: 4 },
  editText: { color: colors.accent, fontSize: 14, fontWeight: '500' },
  deleteText: { color: colors.danger, fontSize: 14, fontWeight: '500' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 50, marginBottom: 12 },
  emptyText: { fontSize: 17, color: colors.textSecondary, fontWeight: '500' },
  emptySubtext: { fontSize: 13, color: colors.textMuted, marginTop: 6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 20 },
  inputLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeInput: { flex: 1, textAlign: 'center', fontSize: 28, fontWeight: '700', marginHorizontal: 4 },
  timeSeparator: { fontSize: 28, fontWeight: '700', color: colors.text, marginHorizontal: 4 },
  infoText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.cardBorder },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 15 },
  saveBtn: { backgroundColor: colors.primary },
  saveBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
});
