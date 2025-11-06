import AsyncStorage from '@react-native-async-storage/async-storage';

let isAppLaunched = false;

export const clearDataOnAppLaunch = async () => {
  if (!isAppLaunched) {
    console.log('ПЕРВЫЙ ЗАПУСК ПРИЛОЖЕНИЯ - ОЧИЩАЕМ ВСЕ ДАННЫЕ');
    await AsyncStorage.removeItem('diagnosisBlocks');
    await AsyncStorage.removeItem('actionPlanTasks');
    await AsyncStorage.removeItem('dashboardPreviousResult');
    await AsyncStorage.removeItem('dashboardCurrentResult');
    await AsyncStorage.removeItem('dashboardAllBlocksCompleted');
    isAppLaunched = true;
    console.log('ДАННЫЕ ОЧИЩЕНЫ ПРИ ЗАПУСКЕ ПРИЛОЖЕНИЯ');
  }
};

