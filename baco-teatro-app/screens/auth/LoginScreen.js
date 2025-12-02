import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Platform, 
  Animated, 
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import DailyQuote from '../../components/DailyQuote';

const { width, height } = Dimensions.get('window');

const KeyboardDismissWrapper = ({ children }) => {
  if (Platform.OS === 'web') {
    return <View style={{ flex: 1 }}>{children}</View>;
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  );
};

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuth();
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const spotlightLeftAnim = useRef(new Animated.Value(0)).current;
  const spotlightRightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Secuencia de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(spotlightLeftAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(spotlightLeftAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          })
        ])
      ).start(),
      Animated.loop(
        Animated.sequence([
          Animated.timing(spotlightRightAnim, {
            toValue: 1,
            duration: 2500,
            delay: 500,
            useNativeDriver: true,
          }),
          Animated.timing(spotlightRightAnim, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          })
        ])
      ).start(),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!cedula || !password) {
      showWarning('Ingresá tu cédula y contraseña para entrar');
      return;
    }
    try {
      await login({ cedula, password });
    } catch (error) {
      showError(error.message || 'Credenciales inválidas. Intentá de nuevo.');
    }
  };

  const handleGuest = () => {
    navigation.navigate('GuestHome');
  };

  const spotlightLeftStyle = {
    opacity: spotlightLeftAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.6]
    }),
    transform: [{ rotate: '15deg' }]
  };

  const spotlightRightStyle = {
    opacity: spotlightRightAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.6]
    }),
    transform: [{ rotate: '-15deg' }]
  };

  return (
    <KeyboardDismissWrapper>
      <View style={styles.container}>
        <LinearGradient colors={['#000000', '#1a0505', '#2d0a0f']} style={styles.background} />
        
        {/* Luces del escenario */}
        <View style={styles.stageLightsContainer}>
          <Animated.View style={[styles.spotlight, styles.spotlightLeft, spotlightLeftStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
              style={styles.spotlightGradient}
            />
          </Animated.View>
          <Animated.View style={[styles.spotlight, styles.spotlightRight, spotlightRightStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
              style={styles.spotlightGradient}
            />
          </Animated.View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, zIndex: 10 }}
        >
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            alwaysBounceVertical={true}
            keyboardShouldPersistTaps="handled"
          >
          <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🎭</Text>
              <Text style={styles.logoText}>BACO</Text>
              <Text style={styles.logoSubtext}>TEATRO</Text>
            </View>
            <DailyQuote style={styles.quoteContainer} />
            <Text style={styles.welcomeText}>Bienvenido a la función</Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.formContainer, 
              { 
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim
              }
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TU CÉDULA</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Ej: 48376669"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="numeric"
                  value={cedula}
                  onChangeText={setCedula}
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleSubmit} 
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.secondary, colors.secondaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>INGRESAR</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleGuest} style={styles.guestButton}>
              <Text style={styles.guestButtonText}>Entrar como Invitado</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Sistema de Gestión de Entradas</Text>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>
          </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        <Toast 
          visible={toast.visible} 
          message={toast.message} 
          type={toast.type}
          onHide={hideToast}
        />
      </View>
    </KeyboardDismissWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  stageLightsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'none', // Para que no interfiera con toques
  },
  spotlight: {
    width: width * 0.6,
    height: height,
    position: 'absolute',
    top: -100,
  },
  spotlightLeft: {
    left: -width * 0.1,
  },
  spotlightRight: {
    right: -width * 0.1,
  },
  spotlightGradient: {
    flex: 1,
    borderRadius: 100,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: 10,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 8,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif', // Fuente elegante
  },
  logoSubtext: {
    fontSize: 14,
    color: colors.secondary,
    letterSpacing: 6,
    fontWeight: '600',
    marginTop: -5,
  },
  quoteContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 20,
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: 'rgba(20, 10, 15, 0.85)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,
    elevation: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 50,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  loginButton: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  guestButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 10,
  },
  guestButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 25,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  versionText: {
    color: 'rgba(255,255,255,0.1)',
    fontSize: 10,
    marginTop: 4,
  },
});
