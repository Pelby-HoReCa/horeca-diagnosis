import { Asset } from 'expo-asset';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface StatusBarProps {
  time?: string;
}

export default function StatusBar({ time = '16:09' }: StatusBarProps) {
  const [statusBarSvg, setStatusBarSvg] = useState<string>('');

  useEffect(() => {
    const loadStatusBar = async () => {
      try {
        const statusBarAsset = Asset.fromModule(require('../../assets/images/status-bar.svg'));
        await statusBarAsset.downloadAsync();
        if (statusBarAsset.localUri) {
          const response = await fetch(statusBarAsset.localUri);
          const fileContent = await response.text();
          setStatusBarSvg(fileContent);
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG статус-бара:', error);
      }
    };

    loadStatusBar();
  }, []);

  return (
    <View style={styles.container}>
      {statusBarSvg && (
        <SvgXml xml={statusBarSvg} width={320} height={45} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    width: '100%',
  },
});
