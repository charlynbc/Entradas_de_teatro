import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { getMyProfile } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const initialForm = {
  name: '',
  email: '',
  telefono: '',
  edad: '',
  bio: '',
  avatar: '',
};

export default function ProfileScreen({ navigation }) {
  const { updateProfile } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
        setForm({
          name: data?.name || '',
          email: data?.email || '',
          telefono: data?.telefono || '',
          edad: data?.edad ? String(data.edad) : '',
          bio: data?.bio || '',
          avatar: data?.avatar || '',
        });
      } catch (error) {
        Alert.alert('Error', error.message || 'No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') {
        alert('Necesitamos acceso a tu galería para cambiar la foto.');
      } else {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar la foto.');
      }
      return;
    }

    // Mostrar mensaje informativo sobre recorte
    if (Platform.OS !== 'web') {
      showToast('📸 Después de seleccionar, podrás recortar tu foto', 'info');
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Habilita el editor de recorte nativo
      aspect: [1, 1], // Formato cuadrado para foto de perfil
      quality: 0.8,
      base64: true,
      // Opciones adicionales para mejor UX
      allowsMultipleSelection: false,
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setTempAvatar(base64Img);
      setShowAvatarModal(true);
      showToast('✂️ Foto recortada lista para guardar', 'success');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara para tomar la foto.');
      return;
    }

    // Mostrar mensaje informativo sobre recorte
    if (Platform.OS !== 'web') {
      showToast('📸 Después de tomar la foto, podrás recortarla', 'info');
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, // Habilita el editor de recorte nativo
      aspect: [1, 1], // Formato cuadrado para foto de perfil
      quality: 0.8,
      base64: true,
      // Opciones para mejor calidad de foto
      exif: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setTempAvatar(base64Img);
      setShowAvatarModal(true);
      showToast('✂️ Foto recortada lista para guardar', 'success');
    }
  };

  const handleAvatarConfirm = () => {
    handleChange('avatar', tempAvatar);
    setShowAvatarModal(false);
    setTempAvatar(null);
  };

  const handleAvatarCancel = () => {
    setShowAvatarModal(false);
    setTempAvatar(null);
  };

  const removeAvatar = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Eliminar foto de perfil?')) {
        handleChange('avatar', '');
      }
    } else {
      Alert.alert(
        'Eliminar foto',
        '¿Estás seguro que querés eliminar tu foto de perfil?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => handleChange('avatar', '') },
        ]
      );
    }
  };

  const handleAvatarPress = () => {
    if (Platform.OS === 'web') {
      showToast('📸 Podrás recortar tu imagen después de seleccionarla', 'info');
      pickImage();
    } else {
      const options = [
        { text: 'Cancelar', style: 'cancel' },
        { text: '📸 Tomar Foto (con recorte)', onPress: takePhoto },
        { text: '🖼️ Elegir de Galería (con recorte)', onPress: pickImage },
      ];
      
      if (form.avatar) {
        options.push({ text: '🗑️ Eliminar Foto', style: 'destructive', onPress: removeAvatar });
      }
      
      Alert.alert(
        'Foto de Perfil', 
        '✂️ Podrás recortar tu imagen en formato cuadrado después de seleccionarla o tomarla', 
        options
      );
    }
  };

  const handleSave = async () => {
    const wantsPasswordChange = passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword;

    if (wantsPasswordChange) {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        Alert.alert('Campos incompletos', 'Para cambiar la contraseña completá todos los campos.');
        return;
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        Alert.alert('Las contraseñas no coinciden', 'Revisá los campos nueva y repetir contraseña.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        edad: form.edad ? Number(form.edad) : null,
      };

      if (wantsPasswordChange) {
        payload.passwordChange = {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        };
      }

      const updated = await updateProfile(payload);
      setProfile(updated);
      if (wantsPasswordChange) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'No pudimos guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.secondary} />
        </View>
      </ScreenContainer>
    );
  }

  const avatarSource = form.avatar?.length ? { uri: form.avatar } : null;

  return (
    <ScreenContainer>
      <SectionCard title="Mi perfil" subtitle={`ID fijo: ${profile?.id || 'desconocido'}`}>
        <View style={styles.avatarRow}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{(form.name || 'BT').slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.helper}>Tocá la foto para cambiarla o pegá una URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={colors.textSoft}
              value={form.avatar}
              onChangeText={(value) => handleChange('avatar', value)}
            />
          </View>
        </View>
        <Text style={styles.helper}>El ID no se puede modificar</Text>
        <View style={styles.readonlyBox}>
          <Text style={styles.readonlyText}>{profile?.id}</Text>
        </View>
      </SectionCard>

      <SectionCard title="Datos basicos">
        {['name', 'email', 'telefono', 'edad'].map((field) => (
          <TextInput
            key={field}
            style={styles.input}
            placeholder={field === 'name' ? 'Nombre completo' : field === 'email' ? 'email@bacoteatro.com' : field === 'telefono' ? '+598 ...' : 'Edad'}
            placeholderTextColor={colors.textSoft}
            value={form[field]}
            keyboardType={field === 'edad' ? 'numeric' : 'default'}
            onChangeText={(value) => handleChange(field, value)}
          />
        ))}
      </SectionCard>

      <SectionCard title="Bio" subtitle="Compartí un poco sobre vos">
        <TextInput
          style={[styles.input, styles.multiline]}
          multiline
          numberOfLines={4}
          placeholder="Actor invitado, responsable de boleteria, etc."
          placeholderTextColor={colors.textSoft}
          value={form.bio}
          onChangeText={(value) => handleChange('bio', value)}
        />
      </SectionCard>

      <SectionCard title="Seguridad" subtitle="Actualizá tu contraseña">
        <TextInput
          style={styles.input}
          placeholder="Contraseña actual"
          placeholderTextColor={colors.textSoft}
          secureTextEntry
          value={passwordForm.currentPassword}
          onChangeText={(value) => setPasswordForm((prev) => ({ ...prev, currentPassword: value }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Nueva contraseña"
          placeholderTextColor={colors.textSoft}
          secureTextEntry
          value={passwordForm.newPassword}
          onChangeText={(value) => setPasswordForm((prev) => ({ ...prev, newPassword: value }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Repetir nueva contraseña"
          placeholderTextColor={colors.textSoft}
          secureTextEntry
          value={passwordForm.confirmPassword}
          onChangeText={(value) => setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))}
        />
        <Text style={styles.helper}>Si dejás estos campos vacíos, tu contraseña permanece igual.</Text>
      </SectionCard>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.secondary, marginBottom: 12 }]} 
        onPress={() => navigation.navigate('Manual')}
      >
        <Ionicons name="book-outline" size={20} color={colors.secondary} style={{ marginRight: 8 }} />
        <Text style={[styles.buttonText, { color: colors.secondary }]}>Ver Manual de Usuario</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={styles.buttonText}>Guardar cambios</Text>
        )}
      </TouchableOpacity>

      {/* Modal estilo WhatsApp para preview de avatar */}
      <Modal
        visible={showAvatarModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleAvatarCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleAvatarCancel} style={styles.modalCloseButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Vista Previa</Text>
          </View>
          
          <View style={styles.modalContent}>
            {tempAvatar && (
              <>
                <Image source={{ uri: tempAvatar }} style={styles.previewImage} resizeMode="contain" />
                <View style={styles.cropInfoBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.cropInfoText}>✂️ Imagen recortada</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={handleAvatarCancel} style={styles.modalCancelButton}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAvatarConfirm} style={styles.modalConfirmButton}>
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.modalConfirmText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
  },
  cameraIconBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarInitial: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 18,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 12,
  },
  readonlyBox: {
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readonlyText: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
  },
  multiline: {
    textAlignVertical: 'top',
    minHeight: 120,
  },
  button: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 16,
  },
  // Estilos del modal estilo WhatsApp
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewImage: {
    width: width - 40,
    height: width - 40,
    borderRadius: 20,
  },
  cropInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  cropInfoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
