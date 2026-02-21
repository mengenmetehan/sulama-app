import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { colors } from '../constants/colors';
import { formatDate, formatTime, getMoistureColor } from '../utils/formatters';
import api from '../services/api';
import LoadingView from '../components/LoadingView';

export default function SensorsScreen() {
  const [readings, setReadings] = useState([]);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSensors = async () => {
    try {
      const data = await api.getSensors(hours);
      setReadings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSensors();
  }, [hours]);

  if (loading) return <LoadingView message="Sensör verileri yükleniyor..." />;

  // Grafik için son 24 veri noktası
  const chartData = readings.slice(-24);
  const maxMoisture = Math.max(...chartData.map((r) => r.soilMoisture || 0), 100);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchSensors(); }}
          colors={[colors.primary]} />
      }
    >
      <Text style={styles.title}>📊 Sensör Verileri</Text>

      {/* Zaman Filtresi */}
      <View style={styles.filterRow}>
        {[6, 12, 24, 48].map((h) => (
          <TouchableOpacity
            key={h}
            style={[styles.filterBtn, hours === h && styles.filterBtnActive]}
            onPress={() => setHours(h)}
          >
            <Text style={[styles.filterText, hours === h && styles.filterTextActive]}>
              {h}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {readings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Henüz sensör verisi yok</Text>
          <Text style={styles.emptySubtext}>ESP32 bağlandığında veriler burada görünecek</Text>
        </View>
      ) : (
        <>
          {/* Nem Grafiği */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Toprak Nemi (%)</Text>
            <View style={styles.chartContainer}>
              {chartData.map((r, i) => {
                const height = ((r.soilMoisture || 0) / maxMoisture) * 100;
                return (
                  <View key={i} style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(height, 2)}%`,
                          backgroundColor: getMoistureColor(r.soilMoisture),
                        },
                      ]}
                    />
                    {i % 6 === 0 && (
                      <Text style={styles.barLabel}>{formatTime(r.recordedAt)}</Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Min / Max / Ort gösterge */}
            <View style={styles.statsRow}>
              <MiniStat
                label="Min"
                value={`%${Math.min(...readings.map((r) => r.soilMoisture || 0))}`}
                color={colors.danger}
              />
              <MiniStat
                label="Ort"
                value={`%${Math.round(
                  readings.reduce((sum, r) => sum + (r.soilMoisture || 0), 0) / readings.length
                )}`}
                color={colors.warning}
              />
              <MiniStat
                label="Max"
                value={`%${Math.max(...readings.map((r) => r.soilMoisture || 0))}`}
                color={colors.primary}
              />
            </View>
          </View>

          {/* Sıcaklık Grafiği */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sıcaklık (°C)</Text>
            <View style={styles.chartContainer}>
              {chartData.map((r, i) => {
                const temp = parseFloat(r.temperature) || 0;
                const maxTemp = Math.max(...chartData.map((d) => parseFloat(d.temperature) || 0), 50);
                const height = (temp / maxTemp) * 100;
                return (
                  <View key={i} style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(height, 2)}%`,
                          backgroundColor: colors.accent,
                        },
                      ]}
                    />
                    {i % 6 === 0 && (
                      <Text style={styles.barLabel}>{formatTime(r.recordedAt)}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Son Okumalar Tablosu */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Son Okumalar</Text>
            {readings.slice(-10).reverse().map((r, i) => (
              <View key={i} style={[styles.readingRow, i === 0 && styles.readingRowFirst]}>
                <Text style={styles.readingTime}>{formatDate(r.recordedAt)}</Text>
                <View style={styles.readingValues}>
                  <Text style={[styles.readingValue, { color: getMoistureColor(r.soilMoisture) }]}>
                    💧 %{r.soilMoisture ?? '--'}
                  </Text>
                  <Text style={[styles.readingValue, { color: colors.accent }]}>
                    🌡️ {r.temperature ?? '--'}°C
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniStatValue, { color }]}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 16 },

  // Filter
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  filterTextActive: { color: '#FFF', fontWeight: '600' },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 130,
    gap: 2,
  },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bar: { width: '80%', borderRadius: 3, minHeight: 2 },
  barLabel: { fontSize: 8, color: colors.textMuted, marginTop: 4 },

  // Mini stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  miniStat: { alignItems: 'center' },
  miniStatValue: { fontSize: 16, fontWeight: '700' },
  miniStatLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  // Readings
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  readingRowFirst: { borderTopWidth: 0 },
  readingTime: { fontSize: 12, color: colors.textMuted, flex: 1 },
  readingValues: { flexDirection: 'row', gap: 16 },
  readingValue: { fontSize: 13, fontWeight: '500' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 50, marginBottom: 12 },
  emptyText: { fontSize: 17, color: colors.textSecondary, fontWeight: '500' },
  emptySubtext: { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
});
