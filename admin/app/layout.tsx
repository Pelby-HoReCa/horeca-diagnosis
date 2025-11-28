import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Horeca Diagnosis - Админ-панель',
  description: 'Панель администратора для управления пользователями и диагностиками',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

