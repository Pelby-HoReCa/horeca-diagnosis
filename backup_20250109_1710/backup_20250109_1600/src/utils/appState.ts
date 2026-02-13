import AsyncStorage from '@react-native-async-storage/async-storage';

let isAppLaunched = false;

export const clearDataOnAppLaunch = async () => {
  if (!isAppLaunched) {
    console.log('ПЕРВЫЙ ЗАПУСК ПРИЛОЖЕНИЯ - ДАННЫЕ СОХРАНЯЮТСЯ ЛОКАЛЬНО');
    isAppLaunched = true;
    console.log('ОЧИСТКА ДАННЫХ ПРИ ЗАПУСКЕ ОТКЛЮЧЕНА');
  }
};
