import { useState } from "react";
import { Button, MenuItem, TextField, Typography } from "@mui/material";
import { api } from "../../services/api";
import { cents } from "../../utils/formatters";
import FormDialog from "./FormDialog";

export default function ExpenseDialog({ group, members, expense, token, open, onClose, done }) {
  const [receipt, setReceipt] = useState(null);
  const [form, setForm] = useState(() => ({
    payer_id: expense?.payer_id || "",
    amount: expense ? expense.amount_cents / 100 : "",
    spent_on: expense?.spent_on || new Date().toISOString().slice(0, 10),
    category: expense?.category || "",
    comment: expense?.comment || "",
    split_type: expense?.split_type || "equal",
  }));

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const uploadReceipt = async () => {
    if (!receipt) return expense?.receipt_path || null;

    const formData = new FormData();
    formData.append("receipt", receipt);
    return (await api("/receipts", { token, method: "POST", formData })).url;
  };

  const save = async () => {
    const total = cents(form.amount);
    const shares = members.map((member, index) => ({
      user_id: member.user_id,
      ...(form.split_type === "shares" ? { units: 1 } : {}),
      ...(form.split_type === "exact"
        ? {
            amount_cents:
              Math.floor(total / members.length) + (index === 0 ? total % members.length : 0),
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
        receipt_url: await uploadReceipt(),
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
      <TextField label="Дата" type="date" InputLabelProps={{ shrink: true }} value={form.spent_on} onChange={updateField("spent_on")} />
      <TextField label="Категория" value={form.category} onChange={updateField("category")} />
      <TextField label="Комментарий" multiline minRows={2} value={form.comment} onChange={updateField("comment")} />
    </FormDialog>
  );
}
