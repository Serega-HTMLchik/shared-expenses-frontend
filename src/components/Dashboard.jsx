import { useCallback, useEffect, useState } from "react";
import {
  Add,
  Delete,
  Edit,
  ExpandMore,
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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { subscribeToChanges } from "../services/realtime";
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
  const [groupBalanceData, setGroupBalanceData] = useState([]);
  const [allBalances, setAllBalances] = useState(null);
  const [allSettlements, setAllSettlements] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settlementTransfer, setSettlementTransfer] = useState(null);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const section = location.pathname === "/balances" ? "balances" : "groups";

  const loadGroups = useCallback(async () => {
    try {
      const [groupData, balanceData] = await Promise.all([
        api("/groups", { token: session.token }),
        api("/balances", { token: session.token }),
      ]);

      setGroups(groupData);
      setGroupBalanceData(balanceData);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [session.token]);

  const openGroup = useCallback(
    async (item, updateUrl = true) => {
      try {
        const detail = await api(`/groups/${item.id}`, {
          token: session.token,
        });
        const balanceData = await api(`/groups/${item.id}/balances`, {
          token: session.token,
        });

        setGroup(detail);
        setExpenses(
          await api(`/groups/${item.id}/expenses`, { token: session.token }),
        );
        setBalances(balanceData);
        setSettlements(
          await api(`/groups/${item.id}/settlements`, { token: session.token }),
        );
        if (updateUrl) {
          navigate(`/groups/${item.id}`);
        }
      } catch (requestError) {
        setError(requestError.message);
      }
    },
    [navigate, session.token],
  );

  useEffect(() => {
    queueMicrotask(loadGroups);
  }, [loadGroups]);

  const loadNotifications = useCallback(
    async () =>
      setNotifications(await api("/notifications", { token: session.token })),
    [session.token],
  );
  useEffect(() => {
    queueMicrotask(loadNotifications);
  }, [loadNotifications]);

  const refresh = useCallback(() => {
    if (group) {
      return openGroup(group, false);
    }

    return Promise.resolve();
  }, [group, openGroup]);

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

  const loadAllBalances = useCallback(async () => {
    const [debts, history] = await Promise.all([
      api("/debts", { token: session.token }),
      api("/settlements", { token: session.token }),
    ]);
    setAllBalances(debts);
    setAllSettlements(history);
  }, [session.token]);

  useEffect(
    () =>
      subscribeToChanges({
        token: session.token,
        userId: session.user.id,
        onChange: () =>
          window.dispatchEvent(new Event("shared-expenses:changed")),
      }),
    [session.token, session.user.id],
  );

  useEffect(() => {
    const refreshFromServer = async () => {
      await Promise.all([loadGroups(), loadNotifications()]);

      if (group) {
        await openGroup(group, false);
      }

      if (section === "balances") {
        await loadAllBalances();
      }
    };

    window.addEventListener("shared-expenses:changed", refreshFromServer);

    return () => {
      window.removeEventListener("shared-expenses:changed", refreshFromServer);
    };
  }, [
    group,
    loadAllBalances,
    loadGroups,
    loadNotifications,
    openGroup,
    section,
  ]);

  return (
    <>
      <DashboardHeader
        user={session.user}
        logout={logout}
        unread={notifications.filter((item) => !item.read_at).length}
        onHome={() => navigate("/")}
        onNotifications={() => setDialog("notifications")}
      />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {section === "balances" ? (
          <BalancesOverview
            debts={allBalances || []}
            settlements={allSettlements}
            onBack={() => navigate("/")}
          />
        ) : (
          <>
            <DashboardActions
              loadGroups={loadGroups}
              loadAllBalances={async () => {
                await loadAllBalances();
                navigate("/balances");
              }}
              openGroupDialog={() => setDialog("group")}
            />
            <AcceptInvite token={session.token} accepted={loadGroups} />
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <GroupList
                  groups={groups}
                  group={group}
                  balanceData={groupBalanceData}
                  currentUserId={session.user.id}
                  onOpen={openGroup}
                />
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
          </>
        )}
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
      {dialog === "notifications" && (
        <NotificationsDialog
          notifications={notifications}
          onClose={() => setDialog("")}
          onRead={async (notificationId) => {
            await api(`/notifications/${notificationId}/read`, {
              token: session.token,
              method: "POST",
            });
            await loadNotifications();
          }}
          onReadAll={async () => {
            await api("/notifications/read-all", {
              token: session.token,
              method: "POST",
            });
            await loadNotifications();
          }}
        />
      )}
      {settlementTransfer && (
        <SettlementDialog
          group={group}
          transfer={settlementTransfer}
          token={session.token}
          onClose={() => setSettlementTransfer(null)}
          done={refresh}
        />
      )}
    </>
  );
}

function DashboardHeader({ user, logout, unread, onHome, onNotifications }) {
  return (
    <AppBar color="inherit" position="sticky" elevation={0}>
      <Toolbar>
        <ButtonBase onClick={onHome} sx={{ borderRadius: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Avatar className="mini-brand">
              <Paid />
            </Avatar>
            <Typography fontWeight={800}>Делим вместе</Typography>
          </Stack>
        </ButtonBase>
        <Box sx={{ flexGrow: 1 }} />
        <Typography sx={{ mr: 1 }}>{user.name}</Typography>
        <IconButton onClick={onNotifications}>
          <Badge badgeContent={unread} color="secondary">
            <Notifications />
          </Badge>
        </IconButton>
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

function BalancesOverview({ debts, settlements, onBack }) {
  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Box>
          <Typography variant="h4">Балансы</Typography>
          <Typography color="text.secondary">
            Все текущие задолженности и погашения
          </Typography>
        </Box>
        <Button onClick={onBack}>К группам</Button>
      </Stack>
      <Paper className="panel" elevation={0} sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Текущие задолженности
        </Typography>
        <List>
          {debts.map((item, index) => (
            <ListItem key={`${item.currency}-${index}`} divider>
              <ListItemText
                primary={`${item.group_name} · ${item.currency}`}
                secondary={`${item.from_user?.name || "Участник"} → ${item.to_user?.name || "Участник"} (${item.to_user?.email || ""})`}
              />
              <Typography fontWeight={800}>
                {money(item.amount_cents, item.currency)}
              </Typography>
            </ListItem>
          ))}
          {debts.length === 0 && (
            <Typography color="text.secondary">
              Непогашенных задолженностей нет.
            </Typography>
          )}
        </List>
      </Paper>
      <Paper className="panel" elevation={0} sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Все транзакции
        </Typography>
        <List>
          {settlements.map((item) => (
            <ListItem key={item.id} divider>
              <ListItemText
                primary={`${item.from_user?.name || "Участник"} → ${item.to_user?.name || "Участник"}`}
                secondary={`${item.group?.name || "Группа"} · ${item.status === "confirmed" ? "Подтверждено" : "Ожидает подтверждения"}`}
              />
              <Typography fontWeight={800}>
                {money(item.amount_cents, item.group?.currency)}
              </Typography>
            </ListItem>
          ))}
          {settlements.length === 0 && (
            <Typography color="text.secondary">Транзакций пока нет.</Typography>
          )}
        </List>
      </Paper>
    </Stack>
  );
}

function GroupList({ groups, group, balanceData, currentUserId, onOpen }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const balancesByGroup = Object.fromEntries(
    balanceData.map((item) => [
      item.group_id,
      item.balances[currentUserId] || 0,
    ]),
  );
  const filteredGroups = groups.filter((item) => {
    if (statusFilter === "open" && item.closed_at) {
      return false;
    }

    if (statusFilter === "closed" && !item.closed_at) {
      return false;
    }

    if (balanceFilter === "owe" && balancesByGroup[item.id] >= 0) {
      return false;
    }

    if (balanceFilter === "owed" && balancesByGroup[item.id] <= 0) {
      return false;
    }

    return true;
  });
  const sortedGroups = [...filteredGroups].sort((left, right) => {
    if (sort === "name") {
      return left.name.localeCompare(right.name, "ru");
    }

    const difference = new Date(right.created_at).getTime() - new Date(left.created_at).getTime();

    return sort === "oldest" ? -difference : difference;
  });

  return (
    <Paper className="panel" elevation={0}>
      <Stack direction="row" sx={{ p: 2, justifyContent: "space-between" }}>
        <Typography variant="h6">Мои группы</Typography>
        <Chip label={groups.length} size="small" />
      </Stack>
      <Stack spacing={1.5} sx={{ px: 2, pb: 1.5 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="group-sort-label">Сортировка</InputLabel>
          <Select
            label="Сортировка"
            labelId="group-sort-label"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <MenuItem value="newest">Сначала новые</MenuItem>
            <MenuItem value="oldest">Сначала старые</MenuItem>
            <MenuItem value="name">По названию</MenuItem>
          </Select>
        </FormControl>
        <Box>
          <Typography color="text.secondary" variant="caption">
            Статус
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={statusFilter}
            onChange={(_, value) => value && setStatusFilter(value)}
          >
            <ToggleButton
              sx={{
                fontSize: "10px",
              }}
              value="all"
            >
              Все
            </ToggleButton>
            <ToggleButton
              sx={{
                fontSize: "10px",
              }}
              value="open"
            >
              Открытые
            </ToggleButton>
            <ToggleButton
              sx={{
                fontSize: "10px",
              }}
              value="closed"
            >
              Закрытые
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box>
          <Typography color="text.secondary" variant="caption">
            Баланс
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={balanceFilter}
            onChange={(_, value) => value && setBalanceFilter(value)}
          >
            <ToggleButton
              sx={{
                fontSize: "10px",
              }}
              value="all"
            >
              Любой
            </ToggleButton>
            <ToggleButton
              sx={{
                fontSize: "10px",
              }}
              value="owe"
            >
              Я должен
            </ToggleButton>
            <ToggleButton
              sx={{
                fontSize: "10px",
              }}
              value="owed"
            >
              Мне должны
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Stack>
      <List>
        {sortedGroups.map((item) => (
          <ListItem
            key={item.id}
            className={`group-item ${group?.id === item.id ? "active" : ""}`}
            onClick={() => onOpen(item)}
            sx={{ gap: 1, py: 1.25 }}
          >
            <ListItemAvatar>
              <Avatar>
                <Group />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={item.name}
              secondary={item.currency}
              primaryTypographyProps={{ noWrap: true }}
              secondaryTypographyProps={{ noWrap: true }}
              sx={{ minWidth: 0 }}
            />
            <Chip
              size="small"
              label={item.closed_at ? "Закрыта" : item.currency}
              sx={{ flexShrink: 0 }}
            />
          </ListItem>
        ))}
        {sortedGroups.length === 0 && (
          <Box className="empty">
            <Group color="disabled" sx={{ fontSize: 50 }} />
            <Typography>
              {groups.length === 0
                ? "Нет групп"
                : "Нет групп по выбранному фильтру"}
            </Typography>
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
              {group.owner_id === currentUserId && (
                <Button
                  color={group.closed_at ? "primary" : "secondary"}
                  variant="outlined"
                  onClick={onCloseOrReopen}
                >
                  {group.closed_at ? "Открыть" : "Закрыть"}
                </Button>
              )}
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
            <BalancesTab
              group={group}
              balances={balances}
              currency={group.currency}
              members={group.members}
              settlements={settlements}
              token={token}
              currentUserId={currentUserId}
              refresh={refresh}
              onSettle={onSettle}
            />
          )}
          {tab === 2 && <MembersTab members={group.members} />}
        </>
      )}
    </Paper>
  );
}

function ExpensesTab({ group, expenses, onCreate, onEdit, onDelete, onView }) {
  const expensesByMonth = Object.values(
    expenses.reduce((months, expense) => {
      const monthKey = String(expense.spent_on).slice(0, 7);

      if (!months[monthKey]) {
        months[monthKey] = [];
      }

      months[monthKey].push(expense);

      return months;
    }, {}),
  ).sort((left, right) => String(right[0].spent_on).localeCompare(String(left[0].spent_on)));

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
      <Stack spacing={1} sx={{ mt: 1 }}>
        {expensesByMonth.map((monthExpenses) => (
          <Accordion
            key={monthExpenses[0].spent_on.slice(0, 7)}
            defaultExpanded
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight={700} sx={{ flexGrow: 1 }}>
                {formatMonth(monthExpenses[0].spent_on)}
              </Typography>
              <Chip label={monthExpenses.length} size="small" sx={{ mr: 1 }} />
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List disablePadding>
                {monthExpenses.map((item) => (
                  <ExpenseListItem
                    key={item.id}
                    group={group}
                    item={item}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onView={onView}
                  />
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
        {expenses.length === 0 && (
          <Box className="empty">
            <Typography>Расходов пока нет</Typography>
          </Box>
        )}
      </Stack>
    </>
  );
}

function ExpenseListItem({ group, item, onDelete, onEdit, onView }) {
  return (
    <ListItem
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
  );
}

function formatMonth(value) {
  const date = new Date(`${String(value).slice(0, 7)}-01T12:00:00`);

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function BalancesTab({
  balances,
  currency,
  members,
  settlements,
  token,
  currentUserId,
  refresh,
  onSettle,
}) {
  if (!balances) return <CircularProgress />;

  const person = (id) => {
    const user = members.find((member) => member.user_id === id)?.user;
    return user ? `${user.name} (${user.email})` : `Участник #${id}`;
  };
  const confirm = async (settlement) => {
    await api(`/settlements/${settlement.id}/confirm`, {
      token,
      method: "POST",
    });
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
        return (
          <Alert
            key={index}
            icon={<Send />}
            action={
              item.from_user_id === currentUserId ? (
                <Button size="small" onClick={() => onSettle(item)}>
                  Погасить
                </Button>
              ) : null
            }
          >
            {person(item.from_user_id)} → {person(item.to_user_id)}:{" "}
            {money(item.amount_cents, currency)}
          </Alert>
        );
      }) || null}
      {settlements
        .filter((item) => item.status === "pending")
        .map((item) => (
          <Alert
            key={`pending-${item.id}`}
            severity="warning"
            action={
              item.to_user_id === currentUserId ? (
                <Button size="small" onClick={() => confirm(item)}>
                  Подтвердить
                </Button>
              ) : null
            }
          >
            Ожидает подтверждения: {item.from_user?.name} → {item.to_user?.name}
            , {money(item.amount_cents, currency)}
          </Alert>
        ))}
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
