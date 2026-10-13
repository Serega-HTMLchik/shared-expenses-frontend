import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Typography } from "@mui/material";
import { money } from "../../utils/formatters";

export default function ExpenseDetailsDialog({ expense, currency, open, onClose }) {
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
          <DetailRow label="Сумма" value={money(expense.amount_cents, currency)} emphasized />
          <DetailRow label="Оплатил" value={expense.payer?.name || "Участник"} />
          <DetailRow label="Дата" value={expense.spent_on} />
          <DetailRow label="Способ деления" value={expense.split_type} />
          {expense.comment && (
            <Box>
              <Typography variant="overline" color="text.secondary">
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
                <DetailRow
                  key={share.id}
                  label={share.user?.name || share.user?.email}
                  value={money(share.amount_cents, currency)}
                />
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

function DetailRow({ label, value, emphasized = false }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={emphasized ? 800 : undefined}>{value}</Typography>
    </Stack>
  );
}
