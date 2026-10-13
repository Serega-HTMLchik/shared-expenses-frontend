import { useState } from "react";
import { MenuItem, TextField } from "@mui/material";
import { api } from "../../services/api";
import FormDialog from "./FormDialog";

export default function GroupDialog({ open, onClose, token, done }) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("RUB");

  const create = async () => {
    done(
      await api("/groups", {
        token,
        method: "POST",
        body: { name, currency },
      }),
    );
    onClose();
  };

  return (
    <FormDialog title="Новая группа" open={open} onClose={onClose} disabled={!name} onSubmit={create} submit="Создать">
      <TextField autoFocus label="Название" value={name} onChange={(event) => setName(event.target.value)} />
      <TextField select label="Валюта" value={currency} onChange={(event) => setCurrency(event.target.value)}>
        {["RUB", "USD", "EUR"].map((item) => (
          <MenuItem key={item} value={item}>
            {item}
          </MenuItem>
        ))}
      </TextField>
    </FormDialog>
  );
}
