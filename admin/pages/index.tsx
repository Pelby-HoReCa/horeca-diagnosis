import React, { useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type UserRow = {
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [showJson, setShowJson] = useState(false);

  const authHeader = useMemo(() => {
    if (!email || !password) return '';
    const token = btoa(`${email}:${password}`);
    return `Basic ${token}`;
  }, [email, password]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) {
        setError('Ошибка авторизации или сервера');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      setError('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/admin/user/${userId}`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) {
        setError('Ошибка загрузки данных пользователя');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSelectedUser(data);
    } catch (e) {
      setError('Ошибка загрузки данных пользователя');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.userId.toLowerCase().includes(q));
  }, [query, users]);

  const selectedSnapshot = selectedUser?.data || {};
  const projects =
    selectedSnapshot.restaurants ||
    selectedSnapshot.projects ||
    selectedSnapshot.venues ||
    [];
  const diagnosisHistory =
    selectedSnapshot.userDiagnosisHistory ||
    selectedSnapshot.diagnosisHistory ||
    selectedSnapshot.surveyHistory ||
    [];
  const tasks =
    selectedSnapshot.actionPlanTasks ||
    selectedSnapshot.tasks ||
    [];
  const profile =
    selectedSnapshot.profile ||
    selectedSnapshot.user ||
    selectedSnapshot.account ||
    {};

  const totalUsers = users.length;
  const totalProjects = Array.isArray(projects) ? projects.length : 0;
  const totalDiagnoses = Array.isArray(diagnosisHistory) ? diagnosisHistory.length : 0;
  const totalTasks = Array.isArray(tasks) ? tasks.length : 0;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Pelby Admin</div>
          <div style={styles.subtitle}>Доступ к данным пользователей</div>
        </div>
        <div style={styles.authBox}>
          <input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button style={styles.button} onClick={loadUsers}>
            {loading ? 'Загрузка...' : 'Войти'}
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.content}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.listTitle}>Пользователи</div>
            <button style={styles.ghostButton} onClick={loadUsers}>
              Обновить
            </button>
          </div>
          <input
            style={styles.search}
            placeholder="Поиск по ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {filteredUsers.length === 0 && (
            <div style={styles.empty}>Пока нет данных</div>
          )}
          {filteredUsers.map((u) => (
            <button
              key={u.userId}
              style={{
                ...styles.userRow,
                ...(selectedUser?.userId === u.userId ? styles.userRowActive : {}),
              }}
              onClick={() => loadUserData(u.userId)}
            >
              <div style={styles.rowTitle}>{u.userId}</div>
              <div style={styles.rowSub}>Обновлено: {new Date(u.updatedAt).toLocaleString()}</div>
            </button>
          ))}
        </div>

        <div style={styles.main}>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Всего пользователей</div>
              <div style={styles.statValue}>{totalUsers}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Проектов у пользователя</div>
              <div style={styles.statValue}>{selectedUser ? totalProjects : '-'}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Диагностик</div>
              <div style={styles.statValue}>{selectedUser ? totalDiagnoses : '-'}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Задач</div>
              <div style={styles.statValue}>{selectedUser ? totalTasks : '-'}</div>
            </div>
          </div>

          {!selectedUser && (
            <div style={styles.emptyCard}>Выберите пользователя в списке слева</div>
          )}

          {selectedUser && (
            <>
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <div style={styles.sectionTitle}>Профиль пользователя</div>
                    <div style={styles.sectionSub}>Последнее обновление: {new Date(selectedUser.updatedAt).toLocaleString()}</div>
                  </div>
                  <button
                    style={styles.ghostButton}
                    onClick={() => setShowJson((prev) => !prev)}
                  >
                    {showJson ? 'Скрыть JSON' : 'Показать JSON'}
                  </button>
                </div>
                <div style={styles.profileGrid}>
                  <div>
                    <div style={styles.profileLabel}>User ID</div>
                    <div style={styles.profileValue}>{selectedUser.userId}</div>
                  </div>
                  <div>
                    <div style={styles.profileLabel}>Имя</div>
                    <div style={styles.profileValue}>{profile.name || profile.fullName || '—'}</div>
                  </div>
                  <div>
                    <div style={styles.profileLabel}>Email</div>
                    <div style={styles.profileValue}>{profile.email || '—'}</div>
                  </div>
                  <div>
                    <div style={styles.profileLabel}>Телефон</div>
                    <div style={styles.profileValue}>{profile.phone || '—'}</div>
                  </div>
                  <div>
                    <div style={styles.profileLabel}>Город</div>
                    <div style={styles.profileValue}>{profile.city || '—'}</div>
                  </div>
                </div>
              </div>

              <div style={styles.sectionGrid}>
                <div style={styles.sectionCard}>
                  <div style={styles.sectionTitle}>Проекты</div>
                  {Array.isArray(projects) && projects.length > 0 ? (
                    projects.map((p: any) => (
                      <div key={p.id || p.name} style={styles.projectRow}>
                        <div>
                          <div style={styles.rowTitle}>{p.name || 'Без названия'}</div>
                          <div style={styles.rowSub}>{p.address || p.city || '—'}</div>
                        </div>
                        <div style={styles.tag}>{p.id || 'ID'}</div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.empty}>Проекты не найдены</div>
                  )}
                </div>

                <div style={styles.sectionCard}>
                  <div style={styles.sectionTitle}>История диагностик</div>
                  {Array.isArray(diagnosisHistory) && diagnosisHistory.length > 0 ? (
                    diagnosisHistory.slice(0, 8).map((h: any, idx: number) => (
                      <div key={h.id || idx} style={styles.historyRow}>
                        <div>
                          <div style={styles.rowTitle}>
                            {typeof h.efficiency === 'number' ? `${h.efficiency}%` : '—'}
                          </div>
                          <div style={styles.rowSub}>
                            {h.createdAt ? new Date(h.createdAt).toLocaleString() : 'Дата не указана'}
                          </div>
                        </div>
                        <div style={styles.tag}>{h.venueId || 'Проект'}</div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.empty}>История пустая</div>
                  )}
                </div>
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.sectionTitle}>Статистика (черновая)</div>
                <div style={styles.statsInline}>
                  <div style={styles.statInlineItem}>
                    <div style={styles.statInlineLabel}>Ответов</div>
                    <div style={styles.statInlineValue}>
                      {selectedSnapshot?.diagnosis_answers_count || selectedSnapshot?.answersCount || '—'}
                    </div>
                  </div>
                  <div style={styles.statInlineItem}>
                    <div style={styles.statInlineLabel}>Слабых блоков</div>
                    <div style={styles.statInlineValue}>
                      {selectedSnapshot?.weakBlocksCount || '—'}
                    </div>
                  </div>
                  <div style={styles.statInlineItem}>
                    <div style={styles.statInlineLabel}>Эффективность</div>
                    <div style={styles.statInlineValue}>
                      {selectedSnapshot?.dashboardCurrentResult ?? '—'}
                    </div>
                  </div>
                </div>
              </div>

              {showJson && (
                <div style={styles.sectionCard}>
                  <div style={styles.sectionTitle}>Полные данные (JSON)</div>
                  <pre style={styles.pre}>{JSON.stringify(selectedUser, null, 2)}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#F6F8FA',
    color: '#0A0D14',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    background: '#ffffff',
    borderBottom: '1px solid #E5E7EB',
  },
  title: { fontSize: 20, fontWeight: 600 },
  subtitle: { fontSize: 12, color: '#525866' },
  authBox: { display: 'flex', gap: 8 },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #D0D5DD',
    minWidth: 180,
  },
  button: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#1F4FFF',
    color: '#fff',
    cursor: 'pointer',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: 24,
    padding: 24,
  },
  sidebar: {
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #E5E7EB',
    height: 'calc(100vh - 140px)',
    overflow: 'auto',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  search: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    marginBottom: 12,
  },
  userRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #F0F2F4',
    background: '#fff',
    width: '100%',
    marginBottom: 8,
    cursor: 'pointer',
  },
  userRowActive: {
    borderColor: '#1F4FFF',
    boxShadow: '0 0 0 2px rgba(31,79,255,0.12)',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
  },
  statCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 14,
    border: '1px solid #E5E7EB',
  },
  statLabel: { fontSize: 11, color: '#525866', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: 700 },
  sectionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  sectionCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #E5E7EB',
  },
  emptyCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    border: '1px dashed #D5DAE1',
    color: '#525866',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 8 },
  sectionSub: { fontSize: 11, color: '#525866' },
  listTitle: { fontSize: 14, fontWeight: 600, marginBottom: 12 },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #F0F2F4',
  },
  rowTitle: { fontSize: 13, fontWeight: 600 },
  rowSub: { fontSize: 11, color: '#525866' },
  smallButton: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #D0D5DD',
    background: '#fff',
    cursor: 'pointer',
  },
  pre: {
    fontSize: 11,
    background: '#0B1020',
    color: '#CFE1FF',
    padding: 12,
    borderRadius: 8,
    maxHeight: '70vh',
    overflow: 'auto',
  },
  empty: { color: '#525866', fontSize: 12 },
  ghostButton: {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #D0D5DD',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12,
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
  },
  profileLabel: { fontSize: 10, color: '#525866', marginBottom: 4 },
  profileValue: { fontSize: 13, fontWeight: 600 },
  projectRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #F0F2F4',
  },
  historyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #F0F2F4',
  },
  tag: {
    background: '#EEF2FF',
    color: '#374151',
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 10,
  },
  statsInline: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
  },
  statInlineItem: {
    background: '#F8FAFC',
    border: '1px solid #E5E7EB',
    borderRadius: 10,
    padding: 12,
  },
  statInlineLabel: { fontSize: 10, color: '#525866', marginBottom: 6 },
  statInlineValue: { fontSize: 14, fontWeight: 700 },
  error: {
    background: '#FFE4E6',
    color: '#9F1239',
    padding: '8px 12px',
    margin: '12px 24px',
    borderRadius: 8,
  },
};
