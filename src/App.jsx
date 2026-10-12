import { useCallback, useEffect, useState } from "react";
import {
  Add,
  Delete,
  Edit,
  Group,
  Logout,
  Paid,
  PersonAdd,
  ReceiptLong,
  Refresh,
  Send,
} from "@mui/icons-material";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import "./App.css";

const API = "http://127.0.0.1:8000/api/v1";
const theme = createTheme({
  palette: {
    primary: { main: "#5b4bdb" },
    secondary: { main: "#ec6a5c" },
    background: { default: "#f6f7fb" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    h4: { fontWeight: 800 },
    h5: { fontWeight: 750 },
  },
});

async function api(path, { token, method = "GET", body, formData } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !formData ? { "Content-Type": "application/json" } : {}),
    },
    body: formData || (body ? JSON.stringify(body) : undefined),
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok)
    throw new Error(data.message || "Не удалось выполнить запрос");
  return data;
}
const cents = (value) => Math.round(Number(value || 0) * 100);
const money = (value, currency = "") =>
  `${(Number(value || 0) / 100).toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ${currency}`;

function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    device_name: "Web app",
  });
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try {
      onAuth(await api(`/${mode}`, { method: "POST", body: form }));
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <Box className="auth-page">
      <Paper elevation={0} className="auth-card">
        <Stack spacing={3}>
          <Box>
            <Avatar className="brand-avatar">
              <Paid />
            </Avatar>
            <Typography variant="h4">Делим вместе</Typography>
            <Typography color="text.secondary">
              Совместные расходы без путаницы.
            </Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              {mode === "register" && (
                <TextField
                  label="Имя"
                  required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              )}
              <TextField
                label="Email"
                type="email"
                required
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <TextField
                label="Пароль"
                type="password"
                required
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {mode === "register" && (
                <TextField
                  label="Повторите пароль"
                  type="password"
                  required
                  onChange={(e) =>
                    setForm({ ...form, password_confirmation: e.target.value })
                  }
                />
              )}
              <Button type="submit" variant="contained" size="large">
                {mode === "login" ? "Войти" : "Создать аккаунт"}
              </Button>
            </Stack>
          </Box>
          <Button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

function FormDialog({
  title,
  open,
  onClose,
  children,
  onSubmit,
  submit = "Сохранить",
  disabled = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {children}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" disabled={disabled} onClick={onSubmit}>
          {submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function GroupDialog({ open, onClose, token, done }) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("RUB");
  return (
    <FormDialog
      title="Новая группа"
      open={open}
      onClose={onClose}
      disabled={!name}
      onSubmit={async () => {
        done(
          await api("/groups", {
            token,
            method: "POST",
            body: { name, currency },
          }),
        );
        onClose();
      }}
      submit="Создать"
    >
      <TextField
        autoFocus
        label="Название"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        select
        label="Валюта"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
      >
        {["RUB", "USD", "EUR"].map((item) => (
          <MenuItem key={item} value={item}>
            {item}
          </MenuItem>
        ))}
      </TextField>
    </FormDialog>
  );
}

function InviteDialog({ group, token, open, onClose }) {
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(7);
  const [result, setResult] = useState("");
  return (
    <FormDialog
      title={`Пригласить в «${group?.name || ""}»`}
      open={open}
      onClose={onClose}
      submit="Создать приглашение"
      onSubmit={async () => {
        const data = await api(`/groups/${group.id}/invitations`, {
          token,
          method: "POST",
          body: { email: email || null, expires_in_days: Number(days) },
        });
        setResult(data.accept_url);
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Оставьте email пустым, чтобы создать общую ссылку.
      </Typography>
      <TextField
        label="Email (необязательно)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Срок действия, дней"
        type="number"
        value={days}
        onChange={(e) => setDays(e.target.value)}
      />
      {result && <Alert severity="success">Ссылка: {result}</Alert>}
    </FormDialog>
  );
}

function ExpenseDialog({
  group,
  members,
  expense,
  token,
  open,
  onClose,
  done,
}) {
  const [receipt, setReceipt] = useState(null);
  const [form, setForm] = useState(() => ({
    payer_id: expense?.payer_id || "",
    amount: expense ? expense.amount_cents / 100 : "",
    spent_on: expense?.spent_on || new Date().toISOString().slice(0, 10),
    category: expense?.category || "",
    comment: expense?.comment || "",
    split_type: expense?.split_type || "equal",
  }));
  const save = async () => {
    let receiptUrl = expense?.receipt_path || null;
    if (receipt) {
      const formData = new FormData();
      formData.append("receipt", receipt);
      receiptUrl = (await api("/receipts", { token, method: "POST", formData })).url;
    }
    const total = cents(form.amount);
    const shares = members.map((member, index) => ({
      user_id: member.user_id,
      ...(form.split_type === "shares" ? { units: 1 } : {}),
      ...(form.split_type === "exact"
        ? {
            amount_cents:
              Math.floor(total / members.length) +
              (index === 0 ? total % members.length : 0),
          }
        : {}),
    }));
    const path = `/groups/${group.id}/expenses${expense ? `/${expense.id}` : ""}`;
    await api(path, {
      token,
      method: expense ? "PUT" : "POST",
      body: {
        payer_id: Number(form.payer_id),
        amount_cents: total,
        spent_on: form.spent_on,
        category: form.category || null,
        comment: form.comment || null,
        receipt_url: receiptUrl,
        split_type: form.split_type,
        shares,
      },
    });
    done();
    onClose();
  };
  return (
    <FormDialog
      title={expense ? "Изменить расход" : "Новый расход"}
      open={open}
      onClose={onClose}
      onSubmit={save}
      disabled={!form.payer_id || !form.amount}
      submit={expense ? "Обновить" : "Добавить"}
    >
      <TextField
        select
        required
        label="Кто заплатил"
        value={form.payer_id}
        onChange={(e) => setForm({ ...form, payer_id: e.target.value })}
      >
        {members.map((m) => (
          <MenuItem key={m.user_id} value={m.user_id}>
            {m.user?.name || m.user?.email}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Сумма"
        type="number"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />
      <Button component="label" variant="outlined">
        {receipt ? `Чек: ${receipt.name}` : "Прикрепить чек"}
        <input
          hidden
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={(event) => setReceipt(event.target.files?.[0] || null)}
        />
      </Button>
      {expense?.receipt_path && !receipt && (
        <Typography variant="body2" color="text.secondary">
          Чек уже прикреплён.
        </Typography>
      )}
      <TextField
        select
        label="Способ деления"
        value={form.split_type}
        onChange={(e) => setForm({ ...form, split_type: e.target.value })}
      >
        <MenuItem value="equal">Поровну</MenuItem>
        <MenuItem value="shares">Долями</MenuItem>
        <MenuItem value="exact">Точными суммами</MenuItem>
      </TextField>
      <TextField
        label="Дата"
        type="date"
        InputLabelProps={{ shrink: true }}
        value={form.spent_on}
        onChange={(e) => setForm({ ...form, spent_on: e.target.value })}
      />
      <TextField
        label="Категория"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />
      <TextField
        label="Комментарий"
        multiline
        minRows={2}
        value={form.comment}
        onChange={(e) => setForm({ ...form, comment: e.target.value })}
      />
    </FormDialog>
  );
}

function AcceptInvite({ token, accepted = () => {} }) {
  const inviteToken = window.location.pathname.match(
    /^\/invitations\/([^/]+)$/,
  )?.[1];
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(Boolean(inviteToken));
  useEffect(() => {
    if (inviteToken)
      api(`/invitations/${inviteToken}`)
        .then(setInvite)
        .catch((e) => setError(e.message));
  }, [inviteToken]);
  const decline = () => {
    window.history.replaceState({}, "", "/");
    setOpen(false);
  };
  const accept = async () => {
    try {
      await api(`/invitations/${inviteToken}/accept`, {
        token,
        method: "POST",
      });
      accepted();
      decline();
    } catch (e) {
      setError(e.message);
    }
  };
  if (!inviteToken) return null;
  return (
    <Dialog open={open} onClose={decline} fullWidth maxWidth="xs">
      <DialogTitle>Приглашение в группу</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {invite ? (
            <>
              <Typography variant="h6">{invite.group.name}</Typography>
              <Typography color="text.secondary">
                Валюта группы: {invite.group.currency}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Приглашение действительно до{" "}
                {new Date(invite.expires_at).toLocaleDateString("ru-RU")}.
              </Typography>
            </>
          ) : (
            !error && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <CircularProgress size={28} />
              </Box>
            )
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={decline}>Отклонить</Button>
        <Button variant="contained" disabled={!invite} onClick={accept}>
          Принять
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ExpenseDetailsDialog({ expense, currency, open, onClose }) {
  if (!expense) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Детали расхода</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Категория
            </Typography>
            <Typography variant="h6">{expense.category || "Расход"}</Typography>
          </Box>
          <Divider />
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography color="text.secondary">Сумма</Typography>
            <Typography fontWeight={800}>
              {money(expense.amount_cents, currency)}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography color="text.secondary">Оплатил</Typography>
            <Typography>{expense.payer?.name || "Участник"}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography color="text.secondary">Дата</Typography>
            <Typography>{expense.spent_on}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography color="text.secondary">Способ деления</Typography>
            <Typography>{expense.split_type}</Typography>
          </Stack>
          {expense.comment && (
            <Box>
              <Typography variant="overline" color="text.secondary" spacing={2}>
                Комментарий
              </Typography>
              <Typography>{expense.comment}</Typography>
            </Box>
          )}
          {expense.shares?.length > 0 && (
            <Box>
              <Typography variant="overline" color="text.secondary">
                Доли
              </Typography>
              {expense.shares.map((share) => (
                <Stack
                  key={share.id}
                  direction="row"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Typography>
                    {share.user?.name || share.user?.email}
                  </Typography>
                  <Typography>{money(share.amount_cents, currency)}</Typography>
                </Stack>
              ))}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}

function Dashboard({ session, logout }) {
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [allBalances, setAllBalances] = useState(null);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const loadGroups = useCallback(async () => {
    try {
      setGroups(await api("/groups", { token: session.token }));
    } catch (e) {
      setError(e.message);
    }
  }, [session.token]);
  const openGroup = async (item) => {
    try {
      const detail = await api(`/groups/${item.id}`, { token: session.token });
      const participants = new Map(
        detail.members.map((member) => [
          member.user_id,
          `${member.user.name} (${member.user.email})`,
        ]),
      );
      const balanceData = await api(`/groups/${item.id}/balances`, {
        token: session.token,
      });
      balanceData.suggested_transfers = balanceData.suggested_transfers.map(
        (transfer) => ({
          ...transfer,
          from_user_id:
            participants.get(transfer.from_user_id) || transfer.from_user_id,
          to_user_id:
            participants.get(transfer.to_user_id) || transfer.to_user_id,
        }),
      );
      setGroup(detail);
      setExpenses(
        await api(`/groups/${item.id}/expenses`, { token: session.token }),
      );
      setBalances(balanceData);
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    queueMicrotask(loadGroups);
  }, [loadGroups]);
  const refresh = () => group && openGroup(group);
  const closeOrReopen = async () => {
    await api(`/groups/${group.id}/${group.closed_at ? "reopen" : "close"}`, {
      token: session.token,
      method: "POST",
    });
    refresh();
    loadGroups();
  };
  return (
    <>
      <AppBar color="inherit" position="sticky" elevation={0}>
        <Toolbar>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexGrow: 1 }}
          >
            <Avatar className="mini-brand">
              <Paid />
            </Avatar>
            <Typography fontWeight={800}>Делим вместе</Typography>
          </Stack>
          <Typography sx={{ mr: 1 }}>{session.user.name}</Typography>
          <IconButton onClick={logout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4">Совместные расходы</Typography>
            <Typography color="text.secondary">
              Группы, расходы и расчёты
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={async () =>
                setAllBalances(await api("/balances", { token: session.token }))
              }
            >
              Все балансы
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadGroups}
            >
              Обновить
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDialog("group")}
            >
              Группа
            </Button>
          </Stack>
        </Stack>
        {allBalances && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            onClose={() => setAllBalances(null)}
          >
            Групп с балансами: {allBalances.length}
          </Alert>
        )}
        <AcceptInvite token={session.token} />
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper className="panel" elevation={0}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ p: 2 }}
              >
                <Typography variant="h6">Мои группы</Typography>
                <Chip label={groups.length} size="small" />
              </Stack>
              <List>
                {groups.map((item) => (
                  <ListItem
                    key={item.id}
                    className={`group-item ${group?.id === item.id ? "active" : ""}`}
                    onClick={() => openGroup(item)}
                    secondaryAction={
                      <Chip
                        size="small"
                        label={item.closed_at ? "Закрыта" : item.currency}
                      />
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <Group />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.name}
                      secondary={item.currency}
                    />
                  </ListItem>
                ))}
                {groups.length === 0 && (
                  <Box className="empty">
                    <Group color="disabled" sx={{ fontSize: 50 }} />
                    <Typography>Нет групп</Typography>
                  </Box>
                )}
              </List>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper className="panel detail" elevation={0}>
              {!group ? (
                <Box className="empty">
                  <ReceiptLong color="disabled" sx={{ fontSize: 55 }} />
                  <Typography variant="h6">Выберите группу</Typography>
                </Box>
              ) : (
                <>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box>
                      <Typography variant="h5">{group.name}</Typography>
                      <Typography color="text.secondary">
                        {group.currency} · {group.members?.length || 0}{" "}
                        участников
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Пригласить">
                        <IconButton onClick={() => setDialog("invite")}>
                          <PersonAdd />
                        </IconButton>
                      </Tooltip>
                      <Button
                        color={group.closed_at ? "primary" : "secondary"}
                        variant="outlined"
                        onClick={closeOrReopen}
                      >
                        {group.closed_at ? "Открыть" : "Закрыть"}
                      </Button>
                    </Stack>
                  </Stack>
                  <Tabs
                    value={tab}
                    onChange={(_, value) => setTab(value)}
                    sx={{ mt: 2, mb: 2 }}
                  >
                    <Tab label="Расходы" />
                    <Tab label="Балансы" />
                    <Tab label="Участники" />
                  </Tabs>
                  {tab === 0 && (
                    <>
                      <Button
                        disabled={Boolean(group.closed_at)}
                        variant="contained"
                        size="small"
                        startIcon={<Add />}
                        onClick={() => {
                          setEditing(null);
                          setDialog("expense");
                        }}
                      >
                        Расход
                      </Button>
                      <List>
                        {expenses.map((item) => (
                          <ListItem
                            key={item.id}
                            divider
                            sx={{ cursor: "pointer" }}
                            onClick={() => setViewing(item)}
                            secondaryAction={
                              <Stack direction="row">
                                <IconButton
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setEditing(item);
                                    setDialog("expense");
                                  }}
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                  color="error"
                                  onClick={async (event) => {
                                    event.stopPropagation();
                                    await api(
                                      `/groups/${group.id}/expenses/${item.id}`,
                                      {
                                        token: session.token,
                                        method: "DELETE",
                                      },
                                    );
                                    refresh();
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Stack>
                            }
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: "secondary.light" }}>
                                <ReceiptLong />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={item.category || "Расход"}
                              secondary={`${item.payer?.name || "Участник"} · ${item.spent_on}`}
                            />
                            <Typography fontWeight={800}>
                              {money(item.amount_cents, group.currency)}
                            </Typography>
                          </ListItem>
                        ))}
                        {expenses.length === 0 && (
                          <Box className="empty">
                            <Typography>Расходов пока нет</Typography>
                          </Box>
                        )}
                      </List>
                    </>
                  )}
                  {tab === 1 && (
                    <Stack spacing={2}>
                      {balances ? (
                        <>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography color="text.secondary">
                                Рекомендуемые переводы
                              </Typography>
                              <Typography variant="h5">
                                {balances.suggested_transfers?.length || 0}
                              </Typography>
                            </CardContent>
                          </Card>
                          {balances.suggested_transfers?.map((item, index) => (
                            <Alert key={index} icon={<Send />}>
                              Участник #{item.from_user_id} → Участник #
                              {item.to_user_id}:{" "}
                              {money(item.amount_cents, group.currency)}
                            </Alert>
                          )) || null}
                          {!balances.suggested_transfers?.length && (
                            <Alert severity="success">Все рассчитались.</Alert>
                          )}
                        </>
                      ) : (
                        <CircularProgress />
                      )}
                    </Stack>
                  )}
                  {tab === 2 && (
                    <List>
                      {group.members?.map((item) => (
                        <ListItem key={item.user_id}>
                          <ListItemAvatar>
                            <Avatar>{(item.user?.name || "?")[0]}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={item.user?.name}
                            secondary={item.user?.email}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Fab
        color="secondary"
        sx={{
          display: { md: "none" },
          position: "fixed",
          right: 20,
          bottom: 20,
        }}
        onClick={() => setDialog("group")}
      >
        <Add />
      </Fab>
      <GroupDialog
        token={session.token}
        open={dialog === "group"}
        onClose={() => setDialog("")}
        done={(item) => {
          loadGroups();
          openGroup(item);
        }}
      />
      <InviteDialog
        group={group}
        token={session.token}
        open={dialog === "invite"}
        onClose={() => setDialog("")}
      />
      <ExpenseDialog
        group={group}
        members={group?.members || []}
        expense={editing}
        token={session.token}
        open={dialog === "expense"}
        onClose={() => setDialog("")}
        done={refresh}
      />
      <ExpenseDetailsDialog
        expense={viewing}
        currency={group?.currency}
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
      />
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shared-expenses-session"));
    } catch {
      return null;
    }
  });
  const auth = (data) => {
    localStorage.setItem("shared-expenses-session", JSON.stringify(data));
    setSession(data);
  };
  const logout = async () => {
    try {
      await api("/logout", { token: session.token, method: "POST" });
    } catch {
      /* Remove local token regardless of server availability. */
    }
    localStorage.removeItem("shared-expenses-session");
    setSession(null);
  };
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {session ? (
        <Dashboard session={session} logout={logout} />
      ) : (
        <Auth onAuth={auth} />
      )}
    </ThemeProvider>
  );
}
