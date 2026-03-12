import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AnimatedPressable from '../components/AnimatedPressable';
import {
  PERSONAL_DATA_POLICY_BLOCKS,
  PERSONAL_DATA_POLICY_TITLE,
} from '../constants/personalDataConsent';

interface PersonalDataPolicyScreenProps {
  navigation: any;
  route?: any;
}

export default function PersonalDataPolicyScreen({ navigation, route }: PersonalDataPolicyScreenProps) {
  const handleAgree = useCallback(async () => {
    try {
      const registrationRaw = await AsyncStorage.getItem('registrationStep1');
      const registration = registrationRaw ? JSON.parse(registrationRaw) : {};
      await AsyncStorage.setItem(
        'registrationStep1',
        JSON.stringify({
          ...registration,
          consent: true,
        })
      );

      if (route?.params?.origin === 'editProfile') {
        await AsyncStorage.setItem('editProfileConsentAccepted', 'true');
      }
    } catch (error) {
      console.error('Ошибка сохранения согласия:', error);
    }

    if (route?.params?.origin === 'register1') {
      navigation.navigate('Register2');
      return;
    }

    navigation.goBack();
  }, [navigation, route?.params?.origin]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AnimatedPressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0A0D14" />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Согласие на обработку персональных данных</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{PERSONAL_DATA_POLICY_TITLE}</Text>

        {PERSONAL_DATA_POLICY_BLOCKS.map((block, index) => (
          <Text
            key={`${block.type}_${index}`}
            style={block.type === 'heading' ? styles.heading : styles.paragraph}
          >
            {block.text}
          </Text>
        ))}

        <View style={styles.actionContainer}>
          <AnimatedPressable style={styles.agreeButton} onPress={handleAgree}>
            <Text style={styles.agreeButtonText}>Согласен</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  header: {
    height: 88,
    paddingTop: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E4E9',
    backgroundColor: '#F6F8FA',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginRight: 36,
    fontSize: 14,
    lineHeight: 18,
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    color: '#0A0D14',
    fontFamily: 'Manrope-Bold',
    marginBottom: 16,
  },
  heading: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0A0D14',
    fontFamily: 'Manrope-SemiBold',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#31353F',
    fontFamily: 'Manrope-Regular',
    marginBottom: 10,
  },
  actionContainer: {
    marginTop: 8,
    paddingBottom: 8,
  },
  agreeButton: {
    backgroundColor: '#191BDF',
    height: 56,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeButtonText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Manrope',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
