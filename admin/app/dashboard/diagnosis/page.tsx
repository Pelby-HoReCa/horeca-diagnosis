'use client';

import { useEffect, useState } from 'react';
import { getAllDiagnosis, Diagnosis } from '@/lib/api';
import Link from 'next/link';

export default function DiagnosisPage() {
  const [diagnosis, setDiagnosis] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDiagnosis = async () => {
      try {
        const response = await getAllDiagnosis();
        if (response.success) {
          setDiagnosis(response.diagnosis);
        } else {
          setError('Не удалось загрузить диагностики');
        }
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки диагностик');
      } finally {
        setLoading(false);
      }
    };

    loadDiagnosis();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка диагностик...</div>
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Диагностики</h1>
        <div className="text-sm text-gray-500">
          Всего: {diagnosis.length}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {diagnosis.map((diag) => (
            <li key={diag.id}>
              <Link
                href={`/dashboard/diagnosis/${diag.id}`}
                className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Диагностика #{diag.id.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Пользователь: {diag.userId}
                    </div>
                    <div className="text-sm text-gray-500">
                      Блоков: {diag.blocks?.length || 0} | Задач: {diag.tasks?.length || 0}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-orange">
                      {diag.efficiency.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(diag.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

