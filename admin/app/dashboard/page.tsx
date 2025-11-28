'use client';

import { useEffect, useState } from 'react';
import { getStats, Stats } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await getStats();
        if (response.success) {
          setStats(response.stats);
        } else {
          setError('Не удалось загрузить статистику');
        }
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки статистики');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка статистики...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Статистика</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-primary-blue">
                  {stats.totalUsers}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Всего пользователей
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-primary-orange">
                  {stats.totalDiagnosis}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Всего диагностик
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-green-600">
                  {stats.avgEfficiency.toFixed(1)}%
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Средняя эффективность
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Статистика по блокам
          </h2>
          <div className="space-y-4">
            {Object.entries(stats.blockStats).map(([blockId, blockStat]) => (
              <div key={blockId} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {blockId}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Завершено: {blockStat.count} раз
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {blockStat.avgEfficiency.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Средняя эффективность</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

