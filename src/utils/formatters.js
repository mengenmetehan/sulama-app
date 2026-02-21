import { colors } from '../constants/colors';

export function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month} ${hour}:${min}`;
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hour}:${min}`;
}

export function getMoistureColor(value) {
  if (value == null) return colors.textMuted;
  if (value < 30) return colors.danger;
  if (value < 60) return colors.warning;
  return colors.primary;
}

export function getSignalColor(rssi) {
  if (rssi == null) return colors.textMuted;
  if (rssi > -50) return colors.primary;
  if (rssi > -70) return colors.warning;
  return colors.danger;
}

export function getMoistureLabel(value) {
  if (value == null) return 'Bilinmiyor';
  if (value < 30) return 'Kuru - Sulama Gerekli!';
  if (value < 60) return 'Normal';
  return 'Nemli';
}
