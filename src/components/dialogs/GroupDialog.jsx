import { useState } from "react";
import { MenuItem, TextField } from "@mui/material";
import { api } from "../../services/api";
import FormDialog from "./FormDialog";

export default function GroupDialog({ open, onClose, token, done }) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("RUB");
  const [reminderAfterDays, setReminderAfterDays] = useState(7);
  const hasValidReminderPeriod = Number.isInteger(Number(reminderAfterDays))
    && Number(reminderAfterDays) >= 1
    && Number(reminderAfterDays) <= 365;

  const create = async () => {
    done(
      await api("/groups", {
        token,
        method: "POST",
        body: { name, currency, reminder_after_days: Number(reminderAfterDays) },
      }),
    );
    onClose();
  };

  return (
    <FormDialog title="Новая группа" open={open} onClose={onClose} disabled={!name || !hasValidReminderPeriod} onSubmit={create} submit="Создать">
      <TextField autoFocus label="Название" value={name} onChange={(event) => setName(event.target.value)} />
      <TextField select label="Валюта" value={currency} onChange={(event) => setCurrency(event.target.value)}>
        {["RUB", "USD", "EUR"].map((item) => (
          <MenuItem key={item} value={item}>
            {item}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        required
        label="Срок погашения, дней"
        type="number"
        value={reminderAfterDays}
        inputProps={{ min: 1, max: 365, step: 1 }}
        helperText="После этого срока должнику будет отправлено напоминание раз в неделю."
        onChange={(event) => setReminderAfterDays(event.target.value)}
      />
    </FormDialog>
  );
}
