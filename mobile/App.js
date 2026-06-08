import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import PortalScreen from './src/screens/PortalScreen';
import { getStoredSession, storeSession, clearStoredSession } from './src/storage/sessionStorage';
import { theme } from './src/theme/theme';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    const restore = async () => {
      const cachedSession = await getStoredSession();
      setSession(cachedSession);
      setBooting(false);
    };

    restore();
    return unsubscribe;
  }, []);

  const handleLogin = async (nextSession) => {
    await storeSession(nextSession);
    setSession(nextSession);
  };

  const handleLogout = async () => {
    await clearStoredSession();
    setSession(null);
  };

  const appContent = useMemo(() => {
    if (booting) {
      return (
        <View style={styles.boot}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
        </View>
      );
    }

    if (!session) {
      return <LoginScreen onLogin={handleLogin} isOnline={isOnline} />;
    }

    return <PortalScreen session={session} isOnline={isOnline} onLogout={handleLogout} />;
  }, [booting, session, isOnline]);

  return (
    <>
      <StatusBar style={session ? 'dark' : 'light'} />
      {appContent}
    </>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.navy
  }
});
