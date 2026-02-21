import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { colors } from '../constants/colors';
import { formatDate } from '../utils/formatters';
import api from '../services/api';
import LoadingView from '../components/LoadingView';

const SOURCE_LABELS = {
  MANUAL: { icon: '👆', text: 'Manuel' },
  SCHEDULE: { icon: '⏰', text: 'Zamanlayıcı' },
  AUTO: { icon: '🤖', text: 'Otomatik' },
};

export default function LogsScreen() {
  const [logs, setLogs] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const data = await api.getLogs(days);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [days]);

  if (loading) return <LoadingView message="Loglar yükleniyor..." />;

  // Logları güne göre grupla
  const groupedLogs = {};
  logs.forEach((log) => {
    const date = log.createdAt ? log.createdAt.split('T')[0] : 'Bilinmeyen';
    if (!groupedLogs[date]) groupedLogs[date] = [];
    groupedLogs[date].push(log);
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchLogs(); }}
          colors={[colors.primary]} />
      }
    >
      <Text style={styles.title}>📋 Motor Logları</Text>

      {/* Gün Filtresi */}
      <View style={styles.filterRow}>
        {[1, 3, 7, 14, 30].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.filterBtn, days === d && styles.filterBtnActive]}
            onPress={() => setDays(d)}
          >
            <Text style={[styles.filterText, days === d && styles.filterTextActive]}>
              {d === 1 ? 'Bugün' : `${d} gün`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Özet */}
      {logs.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{logs.length}</Text>
            <Text style={styles.summaryLabel}>Toplam İşlem</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {logs.filter((l) => l.action === 'ON').length}
            </Text>
            <Text style={styles.summaryLabel}>Açma</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {logs.filter((l) => l.source === 'SCHEDULE').length}
            </Text>
            <Text style={styles.summaryLabel}>Zamanlayıcı</Text>
          </View>
        </View>
      )}

      {/* Log Listesi */}
      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Bu dönemde log yok</Text>
        </View>
      ) : (
        Object.entries(groupedLogs).map(([date, dayLogs]) => (
          <View key={date}>
            <Text style={styles.dateHeader}>
              {formatDateHeader(date)}
            </Text>
            {dayLogs.map((log, i) => {
              const source = SOURCE_LABELS[log.source] || { icon: '❓', text: log.source };
              const isOn = log.action === 'ON';

              return (
                <View key={i} style={styles.logCard}>
                  <View style={styles.logRow}>
                    {/* Timeline dot */}
                    <View style={styles.timeline}>
                      <View style={[styles.logDot, {
                        backgroundColor: isOn ? colors.primary : colors.danger,
                      }]} />
                      {i < dayLogs.length - 1 && <View style={styles.logLine} />}
                    </View>

                    {/* Content */}
                    <View style={styles.logContent}>
                      <Text style={styles.logAction}>
                        Motor {isOn ? 'Açıldı' : 'Kapatıldı'}
                      </Text>
                      <Text style={styles.logSource}>
                        {source.icon} {source.text}
                      </Text>
                      <Text style={styles.logTime}>{formatDate(log.createdAt)}</Text>
                      {log.startedAt && log.stoppedAt && (
                        <Text style={styles.logDuration}>
                          Süre: {calculateDuration(log.startedAt, log.stoppedAt)}
                        </Text>
                      )}
                    </View>

                    {/* Su kullanımı */}
                    {log.waterUsedLiters && (
                      <View style={styles.waterBadge}>
                        <Text style={styles.waterValue}>{log.waterUsedLiters}L</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function formatDateHeader(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Bugün';
    if (d.toDateString() === yesterday.toDateString()) return 'Dün';

    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
                    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

function calculateDuration(start, end) {
  try {
    const ms = new Date(end) - new Date(start);
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}dk`;
  } catch {
    return '--';
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 16 },

  // Filter
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 13 },
  filterTextActive: { color: '#FFF', fontWeight: '600' },

  // Summary
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  summaryLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: colors.cardBorder, marginHorizontal: 8 },

  // Date header
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 10,
    paddingLeft: 4,
  },

  // Log card
  logCard: { marginBottom: 2 },
  logRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timeline: { alignItems: 'center', width: 30, paddingTop: 4 },
  logDot: { width: 12, height: 12, borderRadius: 6 },
  logLine: { width: 2, flex: 1, backgroundColor: colors.cardBorder, marginTop: 4 },
  logContent: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginLeft: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  logAction: { fontSize: 15, fontWeight: '600', color: colors.text },
  logSource: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  logTime: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  logDuration: { fontSize: 11, color: colors.accent, marginTop: 3 },
  waterBadge: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  waterValue: { color: colors.accent, fontSize: 13, fontWeight: '600' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 50, marginBottom: 12 },
  emptyText: { fontSize: 17, color: colors.textSecondary, fontWeight: '500' },
});
