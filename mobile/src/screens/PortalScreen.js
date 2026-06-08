import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import BrandHeader from '../components/BrandHeader';
import { appConfig } from '../config/appConfig';
import { theme } from '../theme/theme';

const buildSessionInjection = (session) => {
  const user = session?.user || {};
  const role = user.role || '';

  return `
    (function() {
      try {
        window.localStorage.setItem('userToken', ${JSON.stringify(session?.token || '')});
        window.localStorage.setItem('userId', ${JSON.stringify(user._id || '')});
        window.localStorage.setItem('userName', ${JSON.stringify(user.fullName || user.username || '')});
        window.localStorage.setItem('userEmail', ${JSON.stringify(user.email || '')});
        window.localStorage.setItem('userRole', ${JSON.stringify(role ? role.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '')});
        window.localStorage.setItem('userRoleRaw', ${JSON.stringify(role)});
        window.localStorage.setItem('userStatus', ${JSON.stringify(user.status || '')});
        window.localStorage.setItem('infoStatus', ${JSON.stringify(user.infoStatus || '')});
        window.localStorage.setItem('userDepartment', ${JSON.stringify(user.department || '')});
        window.__TRADETHIOPIA_MOBILE_APP__ = true;
      } catch (error) {}
      true;
    })();
  `;
};

export default function PortalScreen({ session, isOnline, onLogout }) {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const injectedJavaScriptBeforeContentLoaded = useMemo(() => buildSessionInjection(session), [session]);

  const askLogout = () => {
    Alert.alert('Log out', 'Do you want to sign out of the mobile app?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: onLogout }
    ]);
  };

  if (!isOnline) {
    return (
      <LinearGradient colors={[theme.colors.navyDeep, theme.colors.navy]} style={styles.offlineRoot}>
        <SafeAreaView style={styles.offlineSafe}>
          <BrandHeader compact />
          <View style={styles.offlineCard}>
            <Text style={styles.offlineTitle}>Portal needs internet</Text>
            <Text style={styles.offlineBody}>
              Your login screen is available offline. The working portal opens when your device is connected.
            </Text>
            <Pressable style={styles.outlineButton} onPress={onLogout}>
              <Text style={styles.outlineText}>Back to Login</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <BrandHeader compact />
        <Pressable style={styles.logoutButton} onPress={askLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.webWrap}>
        <WebView
          ref={webViewRef}
          source={{ uri: appConfig.portalUrl }}
          startInLoadingState
          sharedCookiesEnabled
          domStorageEnabled
          javaScriptEnabled
          injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
          injectedJavaScript={injectedJavaScriptBeforeContentLoaded}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator color={theme.colors.gold} size="large" />
              <Text style={styles.loaderText}>Opening sales portal...</Text>
            </View>
          )}
          onError={() => setLoading(false)}
          style={styles.webview}
        />
        {loading && (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator color={theme.colors.gold} size="large" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.page
  },
  header: {
    minHeight: 74,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.navy
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  logoutText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '900'
  },
  webWrap: {
    flex: 1,
    backgroundColor: theme.colors.page
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.page
  },
  loader: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.page
  },
  loaderText: {
    marginTop: 10,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,251,253,0.62)'
  },
  offlineRoot: {
    flex: 1
  },
  offlineSafe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 34
  },
  offlineCard: {
    marginTop: 60,
    borderRadius: 22,
    padding: 20,
    backgroundColor: theme.colors.white
  },
  offlineTitle: {
    color: theme.colors.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  offlineBody: {
    marginTop: 10,
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
  },
  outlineButton: {
    marginTop: 20,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gold
  },
  outlineText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '900'
  }
});
