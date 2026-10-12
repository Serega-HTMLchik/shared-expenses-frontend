import { useEffect, useMemo, useState } from 'react'
import {
  Add, ArrowBack, Group, Logout, Paid, ReceiptLong, Send,
} from '@mui/icons-material'
import {
  Alert, AppBar, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Container, CssBaseline, Dialog, DialogActions, DialogContent, DialogTitle,
  Fab, Grid, IconButton, List, ListItem, ListItemAvatar, ListItemText,
  MenuItem, Paper, Stack, TextField, ThemeProvider, Toolbar, Typography, createTheme,
} from '@mui/material'
import './App.css'

const API = 'http://127.0.0.1:8000/api/v1'

async function api(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = response.status === 204 ? null : await response.json()
  if (!response.ok) throw new Error(data.message || 'Не удалось выполнить запрос')
  return data
}

const theme = createTheme({
  palette: { primary: { main: '#5b4bdb' }, secondary: { main: '#ec6a5c' }, background: { default: '#f6f7fb' } },
  typography: { fontFamily: 'Inter, system-ui, sans-serif', h4: { fontWeight: 800 }, h5: { fontWeight: 750 } },
  shape: { borderRadius: 16 },
})

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login'); const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', device_name: 'Web app' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(''); try { const result = await api(`/${mode}`, { method: 'POST', body: form }); onAuth(result) } catch (err) { setError(err.message) } finally { setLoading(false) } }
  return <Box className="auth-page"><Paper elevation={0} className="auth-card"><Stack spacing={3}><Box><Avatar className="brand-avatar"><Paid /></Avatar><Typography variant="h4">Делим вместе</Typography><Typography color="text.secondary">Учитывайте общие расходы без таблиц и путаницы.</Typography></Box>{error && <Alert severity="error">{error}</Alert>}<Box component="form" onSubmit={submit}><Stack spacing={2}>{mode === 'register' && <TextField label="Имя" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}<TextField label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><TextField label="Пароль" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />{mode === 'register' && <TextField label="Повторите пароль" type="password" required value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />}<Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? <CircularProgress size={24} color="inherit" /> : mode === 'login' ? 'Войти' : 'Создать аккаунт'}</Button></Stack></Box><Button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}</Button></Stack></Paper></Box>
}

function GroupDialog({ open, onClose, onCreated, token }) { const [name, setName] = useState(''); const [currency, setCurrency] = useState('RUB'); const [error, setError] = useState(''); const save = async () => { try { const group = await api('/groups', { token, method: 'POST', body: { name, currency } }); onCreated(group); setName(''); onClose() } catch (err) { setError(err.message) } }; return <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"><DialogTitle>Новая группа</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{error && <Alert severity="error">{error}</Alert>}<TextField autoFocus label="Название" placeholder="Поездка в Сочи" value={name} onChange={(e) => setName(e.target.value)} /><TextField select label="Валюта" value={currency} onChange={(e) => setCurrency(e.target.value)}><MenuItem value="RUB">RUB — ₽</MenuItem><MenuItem value="USD">USD — $</MenuItem><MenuItem value="EUR">EUR — €</MenuItem></TextField></Stack></DialogContent><DialogActions><Button onClick={onClose}>Отмена</Button><Button onClick={save} variant="contained" disabled={!name}>Создать</Button></DialogActions></Dialog> }

function Dashboard({ session, onLogout }) {
  const [groups, setGroups] = useState([]); const [selected, setSelected] = useState(null); const [balances, setBalances] = useState(null); const [loading, setLoading] = useState(true); const [open, setOpen] = useState(false); const [error, setError] = useState('')
  const loadGroups = async () => { setLoading(true); try { setGroups(await api('/groups', { token: session.token })) } catch (err) { setError(err.message) } finally { setLoading(false) } }
  // Initial load intentionally runs once for the authenticated session.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadGroups() }, [])
  const selectGroup = async (group) => { setSelected(group); setBalances(null); try { setBalances(await api(`/groups/${group.id}/balances`, { token: session.token })) } catch (err) { setError(err.message) } }
  const total = useMemo(() => Object.values(balances?.balances || {}).reduce((sum, value) => sum + Math.abs(value), 0), [balances])
  return <><AppBar position="sticky" elevation={0} color="inherit"><Toolbar><Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}><Avatar className="mini-brand"><Paid /></Avatar><Typography variant="h6" fontWeight={800}>Делим вместе</Typography></Stack><Typography variant="body2" sx={{ mr: 1 }}>{session.user.name}</Typography><IconButton onClick={onLogout} title="Выйти"><Logout /></IconButton></Toolbar></AppBar><Container maxWidth="lg" sx={{ py: 4 }}><Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ mb: 4 }}><Box><Typography variant="h4">Ваши расходы</Typography><Typography color="text.secondary">Все группы и взаиморасчёты в одном месте</Typography></Box><Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Создать группу</Button></Stack>{error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}<Grid container spacing={3}><Grid size={{ xs: 12, md: 5 }}><Paper className="panel" elevation={0}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, pb: 1 }}><Typography variant="h6">Мои группы</Typography><Chip size="small" label={groups.length} /></Stack><List disablePadding>{loading ? <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box> : groups.length === 0 ? <Box className="empty"><Group color="disabled" sx={{ fontSize: 48 }} /><Typography>Групп пока нет</Typography><Typography variant="body2" color="text.secondary">Создайте первую группу для совместных расходов.</Typography></Box> : groups.map((group) => <ListItem key={group.id} className={`group-item ${selected?.id === group.id ? 'active' : ''}`} onClick={() => selectGroup(group)} secondaryAction={<Typography fontWeight={700}>{group.currency}</Typography>}><ListItemAvatar><Avatar sx={{ bgcolor: 'primary.light' }}><Group /></Avatar></ListItemAvatar><ListItemText primary={group.name} secondary={group.closed_at ? 'Закрыта' : 'Активна'} /></ListItem>)}</List></Paper></Grid><Grid size={{ xs: 12, md: 7 }}><Paper className="panel detail" elevation={0}>{!selected ? <Box className="empty"><ReceiptLong color="disabled" sx={{ fontSize: 56 }} /><Typography variant="h6">Выберите группу</Typography><Typography color="text.secondary">Здесь появятся баланс и рекомендуемые переводы.</Typography></Box> : <Stack spacing={3}><Box><Button startIcon={<ArrowBack />} size="small" onClick={() => { setSelected(null); setBalances(null) }}>Все группы</Button><Typography variant="h5" sx={{ mt: 1 }}>{selected.name}</Typography><Typography color="text.secondary">Баланс в валюте {selected.currency}</Typography></Box><Card variant="outlined"><CardContent><Typography color="text.secondary" variant="body2">Оборот расчётов</Typography><Typography variant="h4">{(total / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} {selected.currency}</Typography></CardContent></Card><Box><Typography variant="h6" sx={{ mb: 1 }}>Рекомендуемые переводы</Typography>{balances === null ? <CircularProgress size={28} /> : balances.suggested_transfers?.length ? <Stack spacing={1}>{balances.suggested_transfers.map((transfer, index) => <Paper key={index} variant="outlined" sx={{ p: 1.5 }}><Stack direction="row" justifyContent="space-between"><Typography>Участник #{transfer.from_user_id} <Send fontSize="small" sx={{ verticalAlign: 'middle' }} /> Участник #{transfer.to_user_id}</Typography><Typography fontWeight={800}>{(transfer.amount_cents / 100).toFixed(2)}</Typography></Stack></Paper>)}</Stack> : <Alert severity="success">Все рассчитались — переводов нет.</Alert>}</Box></Stack>}</Paper></Grid></Grid></Container><Fab color="secondary" aria-label="Создать группу" sx={{ display: { md: 'none' }, position: 'fixed', right: 20, bottom: 20 }} onClick={() => setOpen(true)}><Add /></Fab><GroupDialog open={open} onClose={() => setOpen(false)} token={session.token} onCreated={(group) => { setGroups((items) => [...items, group]); selectGroup(group) }} /></> }

function App() { const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem('shared-expenses-session')) } catch { return null } }); const auth = (value) => { localStorage.setItem('shared-expenses-session', JSON.stringify(value)); setSession(value) }; const logout = async () => { try { await api('/logout', { token: session.token, method: 'POST' }) } catch { /* The local session must be removed even when the backend is unavailable. */ } localStorage.removeItem('shared-expenses-session'); setSession(null) }; return <ThemeProvider theme={theme}><CssBaseline />{session ? <Dashboard session={session} onLogout={logout} /> : <Auth onAuth={auth} />}</ThemeProvider> }

export default App
