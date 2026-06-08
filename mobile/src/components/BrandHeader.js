import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

export default function BrandHeader({ compact = false }) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <Image source={require('../../assets/tradethiopia-logo.png')} style={[styles.logo, compact && styles.logoCompact]} resizeMode="contain" />
      <View style={styles.textWrap}>
        <Text style={[styles.brand, compact && styles.brandCompact]}>TradeEthiopia</Text>
        <Text style={[styles.group, compact && styles.groupCompact]}>GROUP</Text>
        <View style={styles.goldLine} />
        <Text style={[styles.tagline, compact && styles.taglineCompact]}>Connecting Markets, Empowering Business</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  compact: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10
  },
  logo: {
    width: 104,
    height: 104
  },
  logoCompact: {
    width: 46,
    height: 46
  },
  textWrap: {
    alignItems: 'center'
  },
  brand: {
    color: theme.colors.white,
    fontSize: 30,
    lineHeight: 31,
    fontWeight: '900',
    fontFamily: 'serif'
  },
  brandCompact: {
    fontSize: 18,
    lineHeight: 18
  },
  group: {
    color: theme.colors.white,
    fontSize: 20,
    lineHeight: 21,
    fontWeight: '900',
    fontFamily: 'serif',
    letterSpacing: 0
  },
  groupCompact: {
    fontSize: 12,
    lineHeight: 13
  },
  goldLine: {
    width: 190,
    height: 1,
    backgroundColor: theme.colors.gold,
    marginTop: 4,
    marginBottom: 5
  },
  tagline: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: '800'
  },
  taglineCompact: {
    fontSize: 7
  }
});
