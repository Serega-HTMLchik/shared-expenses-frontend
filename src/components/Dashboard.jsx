import { useCallback, useEffect, useState } from "react";
import {
  Add,
  Delete,
  Edit,
  Group,
  Logout,
  Notifications,
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
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Fab,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { api } from "../services/api";
import { formatDate, money } from "../utils/formatters";
import AcceptInvite from "./dialogs/AcceptInvite";
import ExpenseDetailsDialog from "./dialogs/ExpenseDetailsDialog";
import ExpenseDialog from "./dialogs/ExpenseDialog";
import GroupDialog from "./dialogs/GroupDialog";
import InviteDialog from "./dialogs/InviteDialog";
import NotificationsDialog from "./dialogs/NotificationsDialog";
import SettlementDialog from "./dialogs/SettlementDialog";

export default function Dashboard({ session, logout }) {
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [allBalances, setAllBalances] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settlementTransfer, setSettlementTransfer] = useState(null);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await api("/groups", { token: session.token }));
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [session.token]);

  const openGroup = async (item) => {
    try {
      const detail = await api(`/groups/${item.id}`, { token: session.token });
      const balanceData = await api(`/groups/${item.id}/balances`, {
        token: session.token,
      });

      setGroup(detail);
      setExpenses(
        await api(`/groups/${item.id}/expenses`, { token: session.token }),
      );
      setBalances(balanceData);
      setSettlements(await api(`/groups/${item.id}/settlements`, { token: session.token }));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    queueMicrotask(loadGroups);
  }, [loadGroups]);

  const loadNotifications = useCallback(async () => setNotifications(await api("/notifications", { token: session.token })), [session.token]);
  useEffect(() => { queueMicrotask(loadNotifications); }, [loadNotifications]);

  const refresh = () => group && openGroup(group);

  const closeOrReopen = async () => {
    await api(`/groups/${group.id}/${group.closed_at ? "reopen" : "close"}`, {
      token: session.token,
      method: "POST",
    });
    refresh();
    loadGroups();
  };

  const deleteExpense = async (expenseId) => {
    if (group.closed_at) return;

    await api(`/groups/${group.id}/expenses/${expenseId}`, {
      token: session.token,
      method: "DELETE",
    });
    refresh();
  };

  const loadAllBalances = async () => {
    setAllBalances(await api("/debts", { token: session.token }));
  };

  return (
    <>
      <DashboardHeader user={session.user} logout={logout} unread={notifications.filter((item) => !item.read_at).length} onNotifications={() => setDialog("notifications")} />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <DashboardActions
          loadGroups={loadGroups}
          loadAllBalances={loadAllBalances}
          openGroupDialog={() => setDialog("group")}
        />
        {allBalances && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            onClose={() => setAllBalances(null)}
          >
            {allBalances.length === 0 ? "У вас нет непогашенных задолженностей." : allBalances.map((item, index) => <Box key={index}>{item.group_name}: {money(item.amount_cents, item.currency)}</Box>)}
          </Alert>
        )}
        <AcceptInvite token={session.token} accepted={loadGroups} />
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <GroupList groups={groups} group={group} onOpen={openGroup} />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <GroupDetails
              group={group}
              expenses={expenses}
              balances={balances}
              settlements={settlements}
              token={session.token}
              currentUserId={session.user.id}
              refresh={refresh}
              tab={tab}
              onTabChange={setTab}
              onInvite={() => setDialog("invite")}
              onCloseOrReopen={closeOrReopen}
              onCreateExpense={() => {
                setEditing(null);
                setDialog("expense");
              }}
              onEditExpense={(expense) => {
                setEditing(expense);
                setDialog("expense");
              }}
              onDeleteExpense={deleteExpense}
              onViewExpense={setViewing}
              onSettle={setSettlementTransfer}
            />
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
      {dialog === "expense" && (
        <ExpenseDialog
          group={group}
          members={group?.members || []}
          expense={editing}
          token={session.token}
          open
          onClose={() => setDialog("")}
          done={refresh}
        />
      )}
      <ExpenseDetailsDialog
        expense={viewing}
        currency={group?.currency}
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
      />
      {dialog === "notifications" && <NotificationsDialog notifications={notifications} onClose={() => setDialog("")} onRead={async (notificationId) => { await api(`/notifications/${notificationId}/read`, { token: session.token, method: "POST" }); await loadNotifications(); }} onReadAll={async () => { await api("/notifications/read-all", { token: session.token, method: "POST" }); await loadNotifications(); }} />}
      {settlementTransfer && <SettlementDialog group={group} transfer={settlementTransfer} token={session.token} onClose={() => setSettlementTransfer(null)} done={refresh} />}
    </>
  );
}

function DashboardHeader({ user, logout, unread, onNotifications }) {
  return (
    <AppBar color="inherit" position="sticky" elevation={0}>
      <Toolbar>
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexGrow: 1, alignItems: "center" }}
        >
          <Avatar className="mini-brand">
            <Paid />
          </Avatar>
          <Typography fontWeight={800}>Делим вместе</Typography>
        </Stack>
        <Typography sx={{ mr: 1 }}>{user.name}</Typography>
        <IconButton onClick={onNotifications}><Badge badgeContent={unread} color="secondary"><Notifications /></Badge></IconButton>
        <IconButton onClick={logout}>
          <Logout />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

function DashboardActions({ loadGroups, loadAllBalances, openGroupDialog }) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={4}
      sx={{
        mb: 3,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Typography variant="h4">Совместные расходы</Typography>
        <Typography color="text.secondary">
          Группы, расходы и расчёты
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={loadAllBalances}>
          Все балансы
        </Button>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadGroups}>
          Обновить
        </Button>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openGroupDialog}
        >
          Группа
        </Button>
      </Stack>
    </Stack>
  );
}

function GroupList({ groups, group, onOpen }) {
  return (
    <Paper className="panel" elevation={0}>
      <Stack direction="row" sx={{ p: 2, justifyContent: "space-between" }}>
        <Typography variant="h6">Мои группы</Typography>
        <Chip label={groups.length} size="small" />
      </Stack>
      <List>
        {groups.map((item) => (
          <ListItem
            key={item.id}
            className={`group-item ${group?.id === item.id ? "active" : ""}`}
            onClick={() => onOpen(item)}
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
            <ListItemText primary={item.name} secondary={item.currency} />
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
  );
}

function GroupDetails({
  group,
  expenses,
  balances,
  settlements,
  token,
  currentUserId,
  refresh,
  tab,
  onTabChange,
  onInvite,
  onCloseOrReopen,
  onCreateExpense,
  onEditExpense,
  onDeleteExpense,
  onViewExpense,
  onSettle,
}) {
  return (
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
            spacing={1}
            sx={{ justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="h5">{group.name}</Typography>
              <Typography color="text.secondary">
                {group.currency} · {group.members?.length || 0} участников
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Пригласить">
                <IconButton onClick={onInvite}>
                  <PersonAdd />
                </IconButton>
              </Tooltip>
              <Button
                color={group.closed_at ? "primary" : "secondary"}
                variant="outlined"
                onClick={onCloseOrReopen}
              >
                {group.closed_at ? "Открыть" : "Закрыть"}
              </Button>
            </Stack>
          </Stack>
          <Tabs
            value={tab}
            onChange={(_, value) => onTabChange(value)}
            sx={{ mt: 2, mb: 2 }}
          >
            <Tab label="Расходы" />
            <Tab label="Балансы" />
            <Tab label="Участники" />
          </Tabs>
          {tab === 0 && (
            <ExpensesTab
              group={group}
              expenses={expenses}
              onCreate={onCreateExpense}
              onEdit={onEditExpense}
              onDelete={onDeleteExpense}
              onView={onViewExpense}
            />
          )}
          {tab === 1 && (
            <BalancesTab group={group} balances={balances} currency={group.currency} members={group.members} settlements={settlements} token={token} currentUserId={currentUserId} refresh={refresh} onSettle={onSettle} />
          )}
          {tab === 2 && <MembersTab members={group.members} />}
        </>
      )}
    </Paper>
  );
}

function ExpensesTab({ group, expenses, onCreate, onEdit, onDelete, onView }) {
  return (
    <>
      <Button
        disabled={Boolean(group.closed_at)}
        variant="contained"
        size="small"
        startIcon={<Add />}
        onClick={onCreate}
      >
        Расход
      </Button>
      <List>
        {expenses.map((item) => (
          <ListItem
            key={item.id}
            divider
            sx={{ cursor: "pointer", pr: 14 }}
            onClick={() => onView(item)}
            secondaryAction={
              <Stack direction="row">
                <IconButton
                  disabled={Boolean(group.closed_at)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  color="error"
                  disabled={Boolean(group.closed_at)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(item.id);
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
              secondary={`${item.payer?.name || "Участник"} · ${formatDate(item.spent_on)}`}
            />
            <Typography fontWeight={800} sx={{ flexShrink: 0, mr: 1 }}>
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
  );
}

function BalancesTab({ balances, currency, members, settlements, token, currentUserId, refresh, onSettle }) {
  if (!balances) return <CircularProgress />;

  const person = (id) => {
    const user = members.find((member) => member.user_id === id)?.user;
    return user ? `${user.name} (${user.email})` : `Участник #${id}`;
  };
  const confirm = async (settlement) => {
    await api(`/settlements/${settlement.id}/confirm`, { token, method: "POST" });
    refresh();
  };

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography color="text.secondary">Рекомендуемые переводы</Typography>
          <Typography variant="h5">
            {balances.suggested_transfers?.length || 0}
          </Typography>
        </CardContent>
      </Card>
      {balances.suggested_transfers?.map((item, index) => {
        return <Alert key={index} icon={<Send />} action={item.from_user_id === currentUserId ? <Button size="small" onClick={() => onSettle(item)}>Погасить</Button> : null}>{person(item.from_user_id)} → {person(item.to_user_id)}: {money(item.amount_cents, currency)}</Alert>;
      }) || null}
      {settlements.filter((item) => item.status === "pending").map((item) => <Alert key={`pending-${item.id}`} severity="warning" action={item.to_user_id === currentUserId ? <Button size="small" onClick={() => confirm(item)}>Подтвердить</Button> : null}>Ожидает подтверждения: {item.from_user?.name} → {item.to_user?.name}, {money(item.amount_cents, currency)}</Alert>)}
      {!balances.suggested_transfers?.length && (
        <Alert severity="success">Все рассчитались.</Alert>
      )}
    </Stack>
  );
}

function MembersTab({ members }) {
  return (
    <List>
      {members?.map((item) => (
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
  );
}
