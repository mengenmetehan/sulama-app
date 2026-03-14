import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default function MotorButton({ isOn, isLoading, isOnline, onPress }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Motor açıkken nabız animasyonu
  useEffect(() => {
    if (isOn) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOn]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Su Motoru</Text>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            styles.button,
            isOn ? styles.buttonOn : styles.buttonOff,
            !isOnline && styles.buttonDisabled,
          ]}
          onPress={onPress}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#FFF" />
          ) : (
            <>
              <Text style={styles.icon}>{isOn ? '💧' : '⏹️'}</Text>
              <Text style={styles.state}>{isOn ? 'ÇALIŞIYOR' : 'KAPALI'}</Text>
              <Text style={styles.hint}>
                {!isOnline ? 'Cihaz çevrimdışı' : isOn ? 'Kapatmak için dokun' : 'Açmak için dokun'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {!isOnline && (
        <Text style={styles.offlineWarning}>
          ⚠️ ESP32 bağlantısı yok
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  button: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonOn: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  buttonOff: {
    backgroundColor: '#2A2A2A',
    borderWidth: 3,
    borderColor: '#444',
  },
  buttonDisabled: {
    backgroundColor: '#1A1A1A',
    borderColor: '#333',
    opacity: 0.6,
  },
  icon: { fontSize: 40, marginBottom: 8 },
  state: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  hint: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'center' },
  offlineWarning: {
    color: colors.warning,
    fontSize: 12,
    marginTop: 12,
  },
});
