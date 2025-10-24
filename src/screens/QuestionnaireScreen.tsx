import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Фирменные цвета
const COLORS = {
  orange: '#E84411',
  blue: '#112677',
  gray: '#F0F0F0',
  white: '#FFFFFF',
  darkGray: '#666666',
};

interface QuestionnaireScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function QuestionnaireScreen({ onComplete, onSkip }: QuestionnaireScreenProps) {
  const [formData, setFormData] = useState({
    restaurantName: '',
    city: '',
    email: '',
    phone: '',
    ownerName: '',
    experience: '',
    staffCount: '',
    averageCheck: '',
    workingHours: '',
    cuisine: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // Проверяем обязательные поля
    if (!formData.restaurantName || !formData.email || !formData.phone) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните обязательные поля');
      return;
    }

    // Сохраняем данные анкеты
    console.log('Данные анкеты:', formData);
    Alert.alert('Успешно!', 'Анкета заполнена. Переходим к диагностике.');
    onComplete();
  };

  const handleSkip = () => {
    Alert.alert(
      'Пропустить анкетирование',
      'Вы уверены, что хотите пропустить заполнение анкеты?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Пропустить', onPress: onSkip }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Анкетирование</Text>
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
          <Text style={styles.label}>Email *</Text>
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
          <Text style={styles.label}>Телефон *</Text>
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
          <Text style={styles.label}>Имя владельца/управляющего</Text>
          <TextInput
            style={styles.input}
            value={formData.ownerName}
            onChangeText={(value) => handleInputChange('ownerName', value)}
            placeholder="Введите имя"
            placeholderTextColor={COLORS.darkGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Опыт работы в ресторанном бизнесе</Text>
          <TextInput
            style={styles.input}
            value={formData.experience}
            onChangeText={(value) => handleInputChange('experience', value)}
            placeholder="Например: 5 лет"
            placeholderTextColor={COLORS.darkGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Количество сотрудников</Text>
          <TextInput
            style={styles.input}
            value={formData.staffCount}
            onChangeText={(value) => handleInputChange('staffCount', value)}
            placeholder="Например: 15 человек"
            placeholderTextColor={COLORS.darkGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Средний чек</Text>
          <TextInput
            style={styles.input}
            value={formData.averageCheck}
            onChangeText={(value) => handleInputChange('averageCheck', value)}
            placeholder="Например: 1500 руб."
            placeholderTextColor={COLORS.darkGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Режим работы</Text>
          <TextInput
            style={styles.input}
            value={formData.workingHours}
            onChangeText={(value) => handleInputChange('workingHours', value)}
            placeholder="Например: 10:00 - 23:00"
            placeholderTextColor={COLORS.darkGray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Тип кухни</Text>
          <TextInput
            style={styles.input}
            value={formData.cuisine}
            onChangeText={(value) => handleInputChange('cuisine', value)}
            placeholder="Например: Европейская, Азиатская"
            placeholderTextColor={COLORS.darkGray}
          />
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryButtonText}>Начать диагностику</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleSkip}
        >
          <Text style={styles.secondaryButtonText}>Начать без анкетирования</Text>
        </TouchableOpacity>
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
    padding: 20,
    paddingTop: 60, // Отступ от островка iPhone
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.gray,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: COLORS.blue,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonsContainer: {
    padding: 20,
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
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
