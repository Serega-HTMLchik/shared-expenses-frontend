import { useState } from "react";
import { TextField } from "@mui/material";
import { api } from "../../services/api";
import { cents, money } from "../../utils/formatters";
import FormDialog from "./FormDialog";

export default function SettlementDialog({ group, transfer, token, onClose, done }) {
  const [amount, setAmount] = useState(transfer.amount_cents / 100);

  const save = async () => {
    await api(`/groups/${group.id}/settlements`, { token, method: "POST", body: { to_user_id: transfer.to_user_id, amount_cents: cents(amount) } });
    await done();
    onClose();
  };

  return <FormDialog title="Погасить задолженность" open onClose={onClose} onSubmit={save} disabled={!amount || cents(amount) > transfer.amount_cents} submit="Отправить на подтверждение"><TextField label="Сумма" type="number" value={amount} inputProps={{ min: 0.01, max: transfer.amount_cents / 100, step: 0.01 }} onChange={(event) => setAmount(event.target.value)} helperText={`Не более ${money(transfer.amount_cents, group.currency)}`} /></FormDialog>;
}
