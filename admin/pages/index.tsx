import React, { useEffect, useMemo, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://horeca-backend-6zl1.onrender.com';

type UserRow = {
  userId: string;
  createdAt: string;
  updatedAt: string;
};

const formatValue = (value: any) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.length ? value.map((v) => formatValue(v)).join(', ') : '—';
  return JSON.stringify(value);
};

const KeyValueGrid = ({ data }: { data: Record<string, any> }) => {
  const entries = Object.entries(data || {});
  if (!entries.length) {
    return <div style={styles.empty}>Данных нет</div>;
  }
  return (
    <div style={styles.profileGrid}>
      {entries.map(([key, value]) => (
        <div key={key} style={styles.profileItem}>
          <div style={styles.profileLabel}>{key}</div>
          <div style={styles.profileValue}>{formatValue(value)}</div>
        </div>
      ))}
    </div>
  );
};

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [authed, setAuthed] = useState(false);
  const [storedToken, setStoredToken] = useState<string>('');
  const [storedEmail, setStoredEmail] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem('pelby_admin_token') || '';
    const savedEmail = window.localStorage.getItem('pelby_admin_email') || '';
    if (token) {
      setStoredToken(token);
      setStoredEmail(savedEmail);
      setAuthed(true);
    }
  }, []);

  const authHeader = useMemo(() => {
    if (storedToken) return `Basic ${storedToken}`;
    if (!email || !password) return '';
    const token = btoa(`${email}:${password}`);
    return `Basic ${token}`;
  }, [email, password, storedToken]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) {
        setError('Ошибка авторизации или сервера');
        setAuthed(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setAuthed(true);
      const token = btoa(`${email}:${password}`);
      setStoredToken(token);
      setStoredEmail(email);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('pelby_admin_token', token);
        window.localStorage.setItem('pelby_admin_email', email);
      }
    } catch (e) {
      setError('Ошибка загрузки');
      setAuthed(false);
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

  useEffect(() => {
    if (authed && users.length === 0 && authHeader) {
      loadUsers();
    }
  }, [authed, authHeader, users.length]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.userId.toLowerCase().includes(q));
  }, [query, users]);

  const selectedSnapshot = selectedUser?.data || {};
  const parsedSnapshot = useMemo(() => {
    const parsed: Record<string, any> = {};
    Object.entries(selectedSnapshot || {}).forEach(([key, value]) => {
      if (typeof value === 'string') {
        try {
          parsed[key] = JSON.parse(value);
          return;
        } catch {
          parsed[key] = value;
          return;
        }
      }
      parsed[key] = value;
    });
    return parsed;
  }, [selectedSnapshot]);

  const extractListByKey = (pattern: string) =>
    Object.entries(parsedSnapshot)
      .filter(([key]) => key.includes(pattern))
      .flatMap(([, value]) => (Array.isArray(value) ? value : []));

  const registrationPayload =
    parsedSnapshot.registrationStep2 ||
    parsedSnapshot.registrationStep1 ||
    parsedSnapshot.registration ||
    {};

  const projects =
    registrationPayload.restaurants ||
    parsedSnapshot.restaurants ||
    parsedSnapshot.projects ||
    parsedSnapshot.venues ||
    [];

  const diagnosisHistory =
    parsedSnapshot.userDiagnosisHistory ||
    parsedSnapshot.diagnosisHistory ||
    parsedSnapshot.surveyHistory ||
    extractListByKey('diagnosis_history_') ||
    [];

  const tasks =
    parsedSnapshot.actionPlanTasks ||
    parsedSnapshot.tasks ||
    extractListByKey('actionPlanTasks') ||
    [];

  const profile =
    parsedSnapshot.profile ||
    parsedSnapshot.user ||
    parsedSnapshot.account ||
    parsedSnapshot.userProfile ||
    {};

  const totalUsers = users.length;
  const totalProjects = Array.isArray(projects) ? projects.length : 0;
  const totalDiagnoses = Array.isArray(diagnosisHistory) ? diagnosisHistory.length : 0;
  const totalTasks = Array.isArray(tasks) ? tasks.length : 0;

  const answerKeys = Object.keys(parsedSnapshot || {}).filter((key) =>
    key.includes('diagnosis_answers_')
  );
  const answersByBlock = answerKeys.map((key) => {
    const value = parsedSnapshot?.[key];
    return {
      key,
      count: Array.isArray(value) ? value.length : 0,
    };
  });

  const downloadJson = () => {
    try {
      const payload = JSON.stringify({ raw: selectedSnapshot, parsed: parsedSnapshot }, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pelby-user-${selectedUser?.userId || 'data'}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Ошибка при скачивании JSON');
    }
  };

  if (!authed) {
    return (
      <div style={styles.page}>
        <div style={styles.loginWrapper}>
          <div style={styles.loginCard}>
            <div style={styles.title}>Pelby Admin</div>
            <div style={styles.subtitle}>Доступ к данным пользователей</div>
            <div style={styles.loginTitle}>Вход в админ-панель</div>
            <div style={styles.loginSubtitle}>
              Введите логин и пароль администратора.
            </div>
            {error && <div style={styles.error}>{error}</div>}
            <div style={styles.loginForm}>
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
              <button
                style={styles.ghostButton}
                onClick={() => {
                  setAuthed(false);
                  setUsers([]);
                  setSelectedUser(null);
                  setError('');
                  setStoredToken('');
                  setStoredEmail('');
                  if (typeof window !== 'undefined') {
                    window.localStorage.removeItem('pelby_admin_token');
                    window.localStorage.removeItem('pelby_admin_email');
                  }
                }}
              >
                Сбросить токен
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Pelby Admin</div>
          <div style={styles.subtitle}>Доступ к данным пользователей</div>
        </div>
        <div style={styles.authInfo}>
          <div style={styles.authUser}>{storedEmail || email || 'admin'}</div>
          <button
            style={styles.ghostButton}
            onClick={() => {
              setAuthed(false);
              setUsers([]);
              setSelectedUser(null);
              setError('');
              setStoredToken('');
              setStoredEmail('');
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem('pelby_admin_token');
                window.localStorage.removeItem('pelby_admin_email');
              }
            }}
          >
            Выйти
          </button>
          <button
            style={styles.ghostButton}
            onClick={() => {
              setAuthed(false);
              setUsers([]);
              setSelectedUser(null);
              setError('');
              setStoredToken('');
              setStoredEmail('');
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem('pelby_admin_token');
                window.localStorage.removeItem('pelby_admin_email');
              }
            }}
          >
            Сбросить токен
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
                  <button style={styles.ghostButton} onClick={downloadJson}>
                    Скачать JSON
                  </button>
                </div>
                <KeyValueGrid data={{ userId: selectedUser.userId, ...profile }} />
              </div>

              <div style={styles.sectionGrid}>
                <div style={styles.sectionCard}>
                  <div style={styles.sectionTitle}>Проекты</div>
                  {Array.isArray(projects) && projects.length > 0 ? (
                    projects.map((p: any, idx: number) => (
                      <div key={p.id || p.name || idx} style={styles.projectCard}>
                        <div style={styles.projectHeader}>
                          <div style={styles.rowTitle}>{p.name || `Проект ${idx + 1}`}</div>
                          <div style={styles.tag}>{p.id || 'ID'}</div>
                        </div>
                        <KeyValueGrid data={p || {}} />
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
                      <div key={h.id || idx} style={styles.historyCard}>
                        <div style={styles.historyHeader}>
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
                        <KeyValueGrid data={h || {}} />
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

              <div style={styles.sectionGrid}>
                <div style={styles.sectionCard}>
                  <div style={styles.sectionTitle}>Ответы (по блокам)</div>
                  {answersByBlock.length === 0 && (
                    <div style={styles.empty}>Ответов не найдено</div>
                  )}
                  {answersByBlock.map((item) => (
                    <div key={item.key} style={styles.answerRow}>
                      <div style={styles.rowTitle}>{item.key.replace('diagnosis_answers_', '')}</div>
                      <div style={styles.tag}>{item.count} ответов</div>
                    </div>
                  ))}
                </div>
                <div style={styles.sectionCard}>
                  <div style={styles.sectionTitle}>Задачи</div>
                  {Array.isArray(tasks) && tasks.length > 0 ? (
                    tasks.slice(0, 12).map((task: any, idx: number) => (
                      <div key={task.id || idx} style={styles.taskRow}>
                        <div>
                          <div style={styles.rowTitle}>{task.title || 'Без названия'}</div>
                          <div style={styles.rowSub}>{task.description || task.blockId || '—'}</div>
                        </div>
                        <div style={styles.tag}>{task.blockId || 'Задача'}</div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.empty}>Задач нет</div>
                  )}
                </div>
              </div>
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
  authInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  authUser: { fontSize: 12, color: '#525866' },
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
  loginWrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loginCard: {
    background: '#fff',
    borderRadius: 16,
    padding: 28,
    border: '1px solid #E5E7EB',
    maxWidth: 520,
    width: '100%',
  },
  loginTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  loginSubtitle: { fontSize: 12, color: '#525866', marginBottom: 16 },
  loginForm: { display: 'flex', gap: 12, flexWrap: 'wrap' },
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
  profileItem: {
    background: '#F8FAFC',
    border: '1px solid #E5E7EB',
    borderRadius: 10,
    padding: 10,
  },
  profileLabel: { fontSize: 10, color: '#525866', marginBottom: 4 },
  profileValue: { fontSize: 13, fontWeight: 600 },
  projectCard: {
    border: '1px solid #EEF2F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    background: '#FBFCFE',
  },
  projectHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyCard: {
    border: '1px solid #EEF2F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    background: '#FBFCFE',
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  answerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #F0F2F4',
  },
  taskRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #F0F2F4',
  },
  error: {
    background: '#FFE4E6',
    color: '#9F1239',
    padding: '8px 12px',
    margin: '12px 24px',
    borderRadius: 8,
  },
};
