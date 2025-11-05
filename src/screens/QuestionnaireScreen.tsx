import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
};

interface QuestionnaireScreenProps {
  route: any;
  navigation: any;
}

export default function QuestionnaireScreen({ route, navigation }: QuestionnaireScreenProps) {
  const [formData, setFormData] = useState({
    restaurantName: '',
    fullName: '',
    position: '',
    phone: '',
    email: '',
    telegram: '',
    outletsCount: '',
    city: '',
    address: '',
    workFormat: '',
    socialLink: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Проверяем обязательные поля
    const requiredFields = ['restaurantName', 'fullName', 'position', 'phone', 'email', 'telegram', 'outletsCount', 'city', 'address', 'workFormat'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      console.log('Не заполнены обязательные поля:', missingFields);
      return;
    }

    // Сохраняем данные анкеты
    console.log('Данные анкеты:', formData);
    await AsyncStorage.setItem('questionnaireData', JSON.stringify(formData));
    await AsyncStorage.setItem('questionnaireCompleted', 'true');
    
    // Переходим к первому блоку диагностики
    navigation.navigate('BlockQuestions', { 
      blockId: 'economy', 
      blockTitle: 'Экономика' 
    });
  };

  const handleSkip = async () => {
    // Сохраняем статус пропуска анкетирования
    await AsyncStorage.setItem('questionnaireCompleted', 'true');
    
    // Переходим к первому блоку диагностики без заполнения анкеты
    navigation.navigate('BlockQuestions', { 
      blockId: 'economy', 
      blockTitle: 'Экономика' 
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Расскажите о себе!</Text>
        <Text style={styles.subtitle}>Расскажите о вашем ресторане</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Название ресторана *</Text>
          <TextInput
            style={styles.input}
            value={formData.restaurantName}
            onChangeText={(value) => handleInputChange('restaurantName', value)}
            placeholder="Введите название ресторана"
            placeholderTextColor={COLORS.darkGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ФИО *</Text>
          <TextInput
            style={styles.input}
            value={formData.fullName}
            onChangeText={(value) => handleInputChange('fullName', value)}
            placeholder="Введите ФИО"
            placeholderTextColor={COLORS.darkGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Должность *</Text>
          <TextInput
            style={styles.input}
            value={formData.position}
            onChangeText={(value) => handleInputChange('position', value)}
            placeholder="Введите должность"
            placeholderTextColor={COLORS.darkGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Номер телефона *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            placeholder="+7 (999) 123-45-67"
            placeholderTextColor={COLORS.darkGray}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Почта *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="example@email.com"
            placeholderTextColor={COLORS.darkGray}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Телеграм *</Text>
          <TextInput
            style={styles.input}
            value={formData.telegram}
            onChangeText={(value) => handleInputChange('telegram', value)}
            placeholder="@username"
            placeholderTextColor={COLORS.darkGray}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Количество точек *</Text>
          <TextInput
            style={styles.input}
            value={formData.outletsCount}
            onChangeText={(value) => handleInputChange('outletsCount', value)}
            placeholder="Например: 3"
            placeholderTextColor={COLORS.darkGray}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Город *</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
            placeholder="Введите город"
            placeholderTextColor={COLORS.darkGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Адрес (улица/дом) *</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            placeholder="Введите адрес"
            placeholderTextColor={COLORS.darkGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Формат работы *</Text>
          <TextInput
            style={styles.input}
            value={formData.workFormat}
            onChangeText={(value) => handleInputChange('workFormat', value)}
            placeholder="Кафе, ресторан, кофейня и пр."
            placeholderTextColor={COLORS.darkGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ссылка на профиль в социальной сети</Text>
          <TextInput
            style={styles.input}
            value={formData.socialLink}
            onChangeText={(value) => handleInputChange('socialLink', value)}
            placeholder="https://instagram.com/username"
            placeholderTextColor={COLORS.darkGray}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <AnimatedPressable
          style={[styles.button, styles.primaryButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryButtonText}>Подтвердить</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.button, styles.secondaryButton]}
          onPress={handleSkip}
        >
          <Text style={styles.secondaryButtonText}>Пропустить анкетирование</Text>
        </AnimatedPressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.gray,
    padding: 12,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  form: {
    padding: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.gray,
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    color: COLORS.blue,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonsContainer: {
    padding: 12,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.orange,
    shadowColor: COLORS.orange,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
  },
});
