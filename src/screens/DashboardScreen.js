import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, Alert, StyleSheet,
} from 'react-native';
import { colors } from '../constants/colors';
import { getMoistureColor, getSignalColor, getMoistureLabel } from '../utils/formatters';
import api from '../services/api';
import MotorButton from '../components/MotorButton';
import StatCard from '../components/StatCard';
import LoadingView from '../components/LoadingView';

export default function DashboardScreen() {
  const [status, setStatus] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [motorLoading, setMotorLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statusData, dashData] = await Promise.all([
        api.getStatus(),
        api.getDashboard(),
      ]);
      setStatus(statusData);
      setDashboard(dashData);
    } catch (e) {
      setError('Sunucuya bağlanılamadı');
      console.error('Veri çekme hatası:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleMotor = () => {
    const newState = !status?.motorRunning;
    const message = newState
      ? 'Su motoru açılsın mı?'
      : 'Su motoru kapatılsın mı?';

    Alert.alert('Motor Kontrol', message, [
      { text: 'İptal', style: 'cancel' },
      {
        text: newState ? 'Aç' : 'Kapat',
        style: newState ? 'default' : 'destructive',
        onPress: async () => {
          setMotorLoading(true);
          try {
            if (newState) {
              await api.motorOn();
            } else {
              await api.motorOff();
            }
            setTimeout(fetchData, 1500);
          } catch (e) {
            Alert.alert('Hata', 'Motor komutu gönderilemedi.\nSunucu bağlantısını kontrol edin.');
          } finally {
            setMotorLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingView message="Sulama sistemi yükleniyor..." />;

  const isOnline = status?.deviceOnline;
  const isMotorOn = status?.motorRunning;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <Text style={styles.title}>🌱 Sulama Kontrol</Text>

      {/* Hata mesajı */}
      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Text style={styles.errorSubtext}>Aşağı çekerek yenileyin</Text>
        </View>
      )}

      {/* Cihaz durumu badge */}
      <View style={[styles.statusBar, { borderColor: isOnline ? colors.primary : colors.danger }]}>
        <View style={[styles.dot, { backgroundColor: isOnline ? colors.primary : colors.danger }]} />
        <Text style={styles.statusText}>
          ESP32: {isOnline ? 'Bağlı' : 'Bağlantı Yok'}
        </Text>
      </View>

      {/* Motor Butonu */}
      <MotorButton
        isOn={isMotorOn}
        isLoading={motorLoading}
        isOnline={isOnline}
        onPress={toggleMotor}
      />

      {/* Sensör Kartları */}
      <View style={styles.row}>
        <StatCard
          icon="💧"
          label="Toprak Nemi"
          value={`%${status?.soilMoisture ?? '--'}`}
          color={getMoistureColor(status?.soilMoisture)}
          subtitle={getMoistureLabel(status?.soilMoisture)}
        />
        <View style={{ width: 12 }} />
        <StatCard
          icon="🌡️"
          label="Sıcaklık"
          value={`${status?.temperature ?? '--'}°C`}
          color={colors.accent}
        />
      </View>

      <View style={styles.row}>
        <StatCard
          icon="🚿"
          label="Bugün Kullanılan"
          value={`${dashboard?.todayWaterUsedLiters ?? 0} L`}
          color={colors.primary}
        />
        <View style={{ width: 12 }} />
        <StatCard
          icon="⏱️"
          label="Motor Çalışma"
          value={`${dashboard?.totalMotorRunMinutesToday ?? 0} dk`}
          color={colors.warning}
        />
      </View>

      <View style={styles.row}>
        <StatCard
          icon="📶"
          label="WiFi Sinyal"
          value={`${status?.wifiRssi ?? '--'} dBm`}
          color={getSignalColor(status?.wifiRssi)}
        />
        <View style={{ width: 12 }} />
        <StatCard
          icon="⏰"
          label="Aktif Program"
          value={`${dashboard?.activeScheduleCount ?? 0}`}
          color={colors.accent}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 16 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { color: colors.textSecondary, fontSize: 13 },
  row: { flexDirection: 'row', marginBottom: 12 },
  errorCard: {
    backgroundColor: 'rgba(244,67,54,0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  errorSubtext: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
