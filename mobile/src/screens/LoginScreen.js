import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BrandHeader from '../components/BrandHeader';
import { login } from '../services/authService';
import { appConfig } from '../config/appConfig';
import { theme } from '../theme/theme';

export default function LoginScreen({ onLogin, isOnline }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing credentials', 'Please enter your email or phone and password.');
      return;
    }

    if (!isOnline) {
      Alert.alert('Offline mode', 'The login screen is available offline, but a first-time sign in needs internet access.');
      return;
    }

    setLoading(true);
    try {
      const session = await login({ email: email.trim(), password });
      await onLogin({ ...session, remember });
    } catch (error) {
      Alert.alert('Sign in failed', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[theme.colors.navyDeep, theme.colors.navy, '#00356F']} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <View style={styles.backgroundOrb} />
          <View style={styles.networkOne} />
          <View style={styles.networkTwo} />

          <View style={styles.brandArea}>
            <BrandHeader />
          </View>

          <View style={styles.formArea}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue to your dashboard</Text>

            {!isOnline && (
              <View style={styles.offlinePill}>
                <Text style={styles.offlineText}>Offline login view</Text>
              </View>
            )}

            <View style={styles.endpointBox}>
              <Text style={styles.endpointLabel}>API</Text>
              <Text style={styles.endpointValue} numberOfLines={1}>{appConfig.apiUrl}</Text>
            </View>

            {appConfig.isUsingLocalhostFallback && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  This build is still using localhost. Set `EXPO_PUBLIC_API_URL` to your computer IP for phone login.
                </Text>
              </View>
            )}

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email or Phone"
              placeholderTextColor="rgba(255,255,255,0.62)"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              returnKeyType="next"
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.62)"
              secureTextEntry
              style={styles.input}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            <View style={styles.row}>
              <Pressable style={styles.remember} onPress={() => setRemember((value) => !value)}>
                <View style={[styles.checkbox, remember && styles.checkboxActive]} />
                <Text style={styles.smallText}>Remember me</Text>
              </Pressable>
              <Pressable>
                <Text style={styles.goldLink}>Forgot Password?</Text>
              </Pressable>
            </View>

            <Pressable style={({ pressed }) => [styles.signIn, pressed && styles.pressed]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.signInText}>Sign In</Text>}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <View style={styles.socialButton}>
                <Text style={styles.googleText}>G</Text>
              </View>
              <View style={styles.socialButton}>
                <View style={styles.msGrid}>
                  <View style={[styles.msTile, { backgroundColor: '#F35325' }]} />
                  <View style={[styles.msTile, { backgroundColor: '#81BC06' }]} />
                  <View style={[styles.msTile, { backgroundColor: '#05A6F0' }]} />
                  <View style={[styles.msTile, { backgroundColor: '#FFBA08' }]} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? <Text style={styles.goldLink}>Sign Up</Text></Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  safe: {
    flex: 1
  },
  keyboard: {
    flex: 1,
    paddingHorizontal: 22
  },
  backgroundOrb: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 360,
    height: 240,
    borderRadius: 180,
    backgroundColor: 'rgba(35,123,255,0.12)'
  },
  networkOne: {
    position: 'absolute',
    top: 58,
    right: 26,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  networkTwo: {
    position: 'absolute',
    top: 92,
    left: 24,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(217,154,0,0.12)'
  },
  brandArea: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center'
  },
  formArea: {
    gap: 14
  },
  title: {
    color: theme.colors.white,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center'
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10
  },
  offlinePill: {
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(217,154,0,0.42)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(217,154,0,0.12)'
  },
  offlineText: {
    color: theme.colors.goldBright,
    fontSize: 11,
    fontWeight: '900'
  },
  endpointBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  endpointLabel: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 4
  },
  endpointValue: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '800'
  },
  warningBox: {
    borderWidth: 1,
    borderColor: 'rgba(217,154,0,0.32)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(217,154,0,0.10)'
  },
  warningText: {
    color: '#FFD772',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800'
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 9,
    paddingHorizontal: 16,
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.10)'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  checkbox: {
    width: 15,
    height: 15,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)'
  },
  checkboxActive: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold
  },
  smallText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '700'
  },
  goldLink: {
    color: theme.colors.goldBright,
    fontSize: 12,
    fontWeight: '900'
  },
  signIn: {
    height: 58,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.goldBright,
    marginTop: 14,
    shadowColor: theme.colors.gold,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }]
  },
  signInText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '900'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)'
  },
  dividerText: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 12,
    fontWeight: '700'
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 34,
    marginTop: 8
  },
  socialButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6
  },
  googleText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#4285F4'
  },
  msGrid: {
    width: 25,
    height: 25,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3
  },
  msTile: {
    width: 11,
    height: 11
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 34
  },
  footerText: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontWeight: '700'
  }
});
