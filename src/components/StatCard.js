import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default function StatCard({ icon, label, value, color, subtitle }) {
  return (
    <View style={[styles.card, { borderLeftColor: color || colors.primary }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: color || colors.primary }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  icon: { fontSize: 22, marginBottom: 6 },
  value: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  label: { fontSize: 12, color: colors.textSecondary },
  subtitle: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
