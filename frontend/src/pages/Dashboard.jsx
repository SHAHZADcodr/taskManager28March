import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { s } from '../styles';

const EMPTY_FORM = { title: '', description: '', priority: 'medium', status: 'pending', due_date: '' };
const PRIORITY_COLOR = { low: '#D1FAE5', medium: '#FEF3C7', high: '#FEE2E2' };

export default function Dashboard() {
  const { user, logout }  = useAuth();
  const navigate           = useNavigate();

  const [tasks,   setTasks]   = useState([]);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [editId,  setEditId]  = useState(null);
  const [filter,  setFilter]  = useState({ status: '', priority: '' });
  const [toast,   setToast]   = useState({ msg: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchTasks(); }, [filter]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status)   params.set('status',   filter.status);
      if (filter.priority) params.set('priority', filter.priority);
      const res = await api.get(`/tasks?${params}`);
      setTasks(res.data.tasks);
    } catch {
      showToast('Could not load tasks.', 'error');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/tasks/${editId}`, form);
        showToast('Task updated!');
      } else {
        await api.post('/tasks', form);
        showToast('Task created!');
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      fetchTasks();
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
               || err.response?.data?.error
               || 'Operation failed.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setEditId(task.id);
    setForm({
      title:       task.title,
      description: task.description || '',
      priority:    task.priority,
      status:      task.status,
      due_date:    task.due_date ? task.due_date.split('T')[0] : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      showToast('Task deleted.');
      fetchTasks();
    } catch {
      showToast('Delete failed.', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ margin: 0 }}>{user?.name}'s tasks</h2>
          <span style={{ fontSize: 12, background: '#E0E7FF', color: '#3730A3', padding: '2px 10px', borderRadius: 12 }}>
            {user?.role}
          </span>
        </div>
        <button onClick={handleLogout} style={{ ...s.btnSm, background: '#6B7280' }}>
          Logout
        </button>
      </div>

      {/* ── Toast notification ──────────────────────────────── */}
      {toast.msg && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16,
          background: toast.type === 'error' ? '#FEE2E2' : '#DCFCE7',
          color:      toast.type === 'error' ? '#991B1B' : '#166534',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Create / Edit form ──────────────────────────────── */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 16px' }}>{editId ? '✏️  Edit task' : '➕  New task'}</h3>

        <form onSubmit={handleSubmit} style={s.form}>
          <input
            name="title" value={form.title} onChange={handleChange}
            required placeholder="Task title *" style={s.input}
          />
          <textarea
            name="description" value={form.description} onChange={handleChange}
            placeholder="Description (optional)" rows={3}
            style={{ ...s.input, resize: 'vertical' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={s.label}>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} style={s.input}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} style={s.input}>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Due date</label>
              <input type="date" name="due_date" value={form.due_date} onChange={handleChange} style={s.input}/>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={loading} style={s.btn}>
              {loading ? 'Saving…' : editId ? 'Update task' : 'Create task'}
            </button>
            {editId && (
              <button type="button"
                onClick={() => { setEditId(null); setForm(EMPTY_FORM); }}
                style={{ ...s.btn, background: '#6B7280' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          style={{ ...s.input, width: 'auto' }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filter.priority}
          onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}
          style={{ ...s.input, width: 'auto' }}
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* ── Task list ───────────────────────────────────────── */}
      <h3 style={{ margin: '0 0 12px' }}>Tasks ({tasks.length})</h3>
      {tasks.length === 0 && (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px 0' }}>
          No tasks yet — create one above!
        </p>
      )}
      {tasks.map(task => (
        <div key={task.id} style={{
          border: '1px solid #E5E7EB',
          borderRadius: 10,
          padding: 16,
          marginBottom: 10,
          background: PRIORITY_COLOR[task.priority] || '#fff',
          borderLeft: `4px solid ${task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F59E0B' : '#10B981'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 15 }}>{task.title}</strong>
              {task.description && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>{task.description}</p>
              )}
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '2px 8px', borderRadius: 10 }}>
                  {task.status.replace('_', ' ')}
                </span>
                <span style={{ background: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: 10 }}>
                  {task.priority}
                </span>
                {task.due_date && (
                  <span style={{ color: '#9CA3AF' }}>
                    Due: {task.due_date.split('T')[0]}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
              <button onClick={() => handleEdit(task)}   style={s.btnSm}>Edit</button>
              <button onClick={() => handleDelete(task.id)}
                style={{ ...s.btnSm, background: '#EF4444' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}