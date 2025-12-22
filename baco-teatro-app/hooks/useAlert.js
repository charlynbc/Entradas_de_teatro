import { Alert, Platform } from 'react-native';

/**
 * Hook para mostrar alertas compatibles con web y mobile
 * En web usa alert() y window.confirm()
 * En mobile usa Alert.alert()
 */
export function useAlert() {
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const showConfirm = async (title, message) => {
    if (Platform.OS === 'web') {
      return window.confirm(`${title}\n\n${message}`);
    } else {
      return new Promise((resolve) => {
        Alert.alert(title, message, [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Confirmar', onPress: () => resolve(true) },
        ]);
      });
    }
  };

  const showConfirmWithCancel = async (title, message, confirmText = 'Confirmar') => {
    if (Platform.OS === 'web') {
      return window.confirm(`${title}\n\n${message}`);
    } else {
      return new Promise((resolve) => {
        Alert.alert(title, message, [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
        ]);
      });
    }
  };

  return { showAlert, showConfirm, showConfirmWithCancel };
}
