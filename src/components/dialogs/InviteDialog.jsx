import { useState } from "react";
import { ContentCopy } from "@mui/icons-material";
import { Alert, Button, TextField, Typography } from "@mui/material";
import { api } from "../../services/api";
import FormDialog from "./FormDialog";

export default function InviteDialog({ group, token, open, onClose }) {
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(7);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const create = async () => {
    const data = await api(`/groups/${group.id}/invitations`, {
      token,
      method: "POST",
      body: { email: email || null, expires_in_days: Number(days) },
    });
    setCopied(false);
    setResult(data.accept_url);
  };

  const copyInvitationLink = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
  };

  return (
    <FormDialog title={`Пригласить в «${group?.name || ""}»`} open={open} onClose={onClose} submit="Создать приглашение" onSubmit={create}>
      <Typography variant="body2" color="text.secondary">
        Оставьте email пустым, чтобы создать общую ссылку.
      </Typography>
      <TextField label="Email (необязательно)" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <TextField label="Срок действия, дней" type="number" value={days} onChange={(event) => setDays(event.target.value)} />
      {result && (
        <Alert
          severity="success"
          action={(
            <Button
              color="inherit"
              size="small"
              startIcon={<ContentCopy />}
              onClick={copyInvitationLink}
            >
              {copied ? "Скопировано" : "Копировать"}
            </Button>
          )}
        >
          Приглашение создано
        </Alert>
      )}
    </FormDialog>
  );
}
