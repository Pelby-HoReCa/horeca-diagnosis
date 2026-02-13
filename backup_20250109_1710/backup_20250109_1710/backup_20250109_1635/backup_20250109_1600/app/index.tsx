import { Redirect } from 'expo-router';

// Минимальный маршрут для expo-router
// Все управление экранами происходит через AppWrapper в _layout.tsx
export default function Index() {
  return <Redirect href="/" />;
}

