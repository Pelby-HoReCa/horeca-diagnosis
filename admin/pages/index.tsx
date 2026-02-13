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
        <div style={styles.list}>
          <div style={styles.listTitle}>Пользователи</div>
          {users.length === 0 && <div style={styles.empty}>Пока нет данных</div>}
          {users.map((u) => (
            <div key={u.userId} style={styles.row}>
              <div>
                <div style={styles.rowTitle}>{u.userId}</div>
                <div style={styles.rowSub}>Обновлено: {new Date(u.updatedAt).toLocaleString()}</div>
              </div>
              <button style={styles.smallButton} onClick={() => loadUserData(u.userId)}>
                Открыть
              </button>
            </div>
          ))}
        </div>

        <div style={styles.detail}>
          <div style={styles.listTitle}>Данные пользователя</div>
          {!selectedUser && <div style={styles.empty}>Выберите пользователя</div>}
          {selectedUser && (
            <pre style={styles.pre}>{JSON.stringify(selectedUser, null, 2)}</pre>
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
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    padding: 24,
  },
  list: {
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #E5E7EB',
  },
  detail: {
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #E5E7EB',
  },
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
  error: {
    background: '#FFE4E6',
    color: '#9F1239',
    padding: '8px 12px',
    margin: '12px 24px',
    borderRadius: 8,
  },
};
