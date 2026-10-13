import { useState } from "react";
import { Alert, Box, Button, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { api } from "../../services/api";
import { cents } from "../../utils/formatters";
import FormDialog from "./FormDialog";

export default function ExpenseDialog({ group, members, expense, token, open, onClose, done }) {
  const [receipt, setReceipt] = useState(null);
  const [allocations, setAllocations] = useState(() => createAllocations(members, expense));
  const [form, setForm] = useState(() => createForm(expense));

  const resetForm = () => {
    setForm(createForm());
    setReceipt(null);
    setAllocations(createAllocations(members));
  };

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const updateAllocation = (userId, field) => (event) =>
    setAllocations({
      ...allocations,
      [userId]: { ...allocations[userId], [field]: event.target.value },
    });

  const total = cents(form.amount);
  const exactTotal = members.reduce(
    (sum, member) => sum + cents(allocations[member.user_id]?.amount),
    0,
  );
  const splitIsValid =
    form.split_type === "equal" ||
    (form.split_type === "shares" &&
      members.every((member) => Number.isInteger(Number(allocations[member.user_id]?.units)) && Number(allocations[member.user_id]?.units) > 0)) ||
    (form.split_type === "exact" &&
      members.every((member) => allocations[member.user_id]?.amount !== "") &&
      exactTotal === total);

  const uploadReceipt = async () => {
    if (!receipt) return expense?.receipt_path || null;

    const formData = new FormData();
    formData.append("receipt", receipt);
    return (await api("/receipts", { token, method: "POST", formData })).url;
  };

  const save = async () => {
    const shares = members.map((member) => ({
      user_id: member.user_id,
      ...(form.split_type === "shares" ? { units: Number(allocations[member.user_id].units) } : {}),
      ...(form.split_type === "exact"
        ? { amount_cents: cents(allocations[member.user_id].amount) }
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
        receipt_url: await uploadReceipt(),
        split_type: form.split_type,
        shares,
      },
    });
    resetForm();
    await done();
    onClose();
  };

  return (
    <FormDialog
      title={expense ? "Изменить расход" : "Новый расход"}
      open={open}
      onClose={onClose}
      onSubmit={save}
      disabled={!form.payer_id || !form.amount || !splitIsValid}
      submit={expense ? "Обновить" : "Добавить"}
    >
      <TextField select required label="Кто заплатил" value={form.payer_id} onChange={updateField("payer_id")}>
        {members.map((member) => (
          <MenuItem key={member.user_id} value={member.user_id}>
            {member.user?.name || member.user?.email}
          </MenuItem>
        ))}
      </TextField>
      <TextField label="Сумма" type="number" value={form.amount} onChange={updateField("amount")} />
      <Button component="label" variant="outlined">
        {receipt ? `Чек: ${receipt.name}` : "Прикрепить чек"}
        <input hidden type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => setReceipt(event.target.files?.[0] || null)} />
      </Button>
      {expense?.receipt_path && !receipt && (
        <Typography variant="body2" color="text.secondary">
          Чек уже прикреплён.
        </Typography>
      )}
      <TextField select label="Способ деления" value={form.split_type} onChange={updateField("split_type")}>
        <MenuItem value="equal">Поровну</MenuItem>
        <MenuItem value="shares">Долями</MenuItem>
        <MenuItem value="exact">Точными суммами</MenuItem>
      </TextField>
      {form.split_type !== "equal" && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {form.split_type === "shares" ? "Количество долей" : "Сумма для каждого участника"}
          </Typography>
          <Stack spacing={1} divider={<Divider flexItem />}>
            {members.map((member) => (
              <Stack key={member.user_id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography sx={{ flexGrow: 1 }}>
                  {member.user?.name || member.user?.email}
                </Typography>
                <TextField
                  size="small"
                  required
                  type="number"
                  label={form.split_type === "shares" ? "Долей" : "Сумма"}
                  inputProps={form.split_type === "shares" ? { min: 1, step: 1 } : { min: 0, step: 0.01 }}
                  value={form.split_type === "shares" ? allocations[member.user_id]?.units : allocations[member.user_id]?.amount}
                  onChange={updateAllocation(member.user_id, form.split_type === "shares" ? "units" : "amount")}
                />
              </Stack>
            ))}
          </Stack>
          {form.split_type === "exact" && form.amount && exactTotal !== total && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Распределено {exactTotal / 100}; необходимо {total / 100}.
            </Alert>
          )}
        </Box>
      )}
      <TextField label="Дата" type="date" InputLabelProps={{ shrink: true }} value={form.spent_on} onChange={updateField("spent_on")} />
      <TextField label="Категория" value={form.category} onChange={updateField("category")} />
      <TextField label="Комментарий" multiline minRows={2} value={form.comment} onChange={updateField("comment")} />
    </FormDialog>
  );
}

function createForm(expense) {
  return {
    payer_id: expense?.payer_id || "",
    amount: expense ? expense.amount_cents / 100 : "",
    spent_on: expense?.spent_on || new Date().toISOString().slice(0, 10),
    category: expense?.category || "",
    comment: expense?.comment || "",
    split_type: expense?.split_type || "equal",
  };
}

function createAllocations(members, expense) {
  const expenseShares = new Map((expense?.shares || []).map((share) => [share.user_id, share]));

  return Object.fromEntries(
    members.map((member) => {
      const share = expenseShares.get(member.user_id);
      return [
        member.user_id,
        {
          units: share?.units || 1,
          amount: share ? (share.amount_cents / 100).toFixed(2) : "",
        },
      ];
    }),
  );
}
