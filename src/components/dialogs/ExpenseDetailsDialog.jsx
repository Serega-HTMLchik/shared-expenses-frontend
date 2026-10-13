import { Image, OpenInNew } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { money } from "../../utils/formatters";

const splitLabels = {
  equal: "Поровну",
  shares: "Долями",
  exact: "Точными суммами",
};

export default function ExpenseDetailsDialog({
  expense,
  currency,
  open,
  onClose,
}) {
  if (!expense) return null;

  const receiptIsImage = /\.(jpe?g|png|webp|gif)(?:\?.*)?$/i.test(
    expense.receipt_path || "",
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Детали расхода</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary">
                Категория
              </Typography>
            </Box>
            <Chip
              label={splitLabels[expense.split_type] || expense.split_type}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Stack>

          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="h6">
                {expense.category || "Расход"}
              </Typography>
            </Box>
          </Stack>
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 1, bgcolor: "rgba(91, 75, 219, 0.04)" }}
          >
            <Stack spacing={1.5} divider={<Divider flexItem />}>
              <DetailRow
                label="Сумма"
                value={money(expense.amount_cents, currency)}
                emphasized
              />
              <DetailRow
                label="Оплатил"
                value={expense.payer?.name || "Участник"}
              />
              <DetailRow label="Дата" value={formatDate(expense.spent_on)} />
            </Stack>
          </Paper>
          {expense.comment && (
            <DetailSection title="Комментарий">
              <Typography sx={{ whiteSpace: "pre-wrap" }}>
                {expense.comment}
              </Typography>
            </DetailSection>
          )}
          {expense.receipt_path && (
            <DetailSection title="Чек">
              {receiptIsImage ? (
                <Box
                  component="img"
                  src={expense.receipt_path}
                  alt={`Чек по расходу «${expense.category || "Расход"}»`}
                  sx={{
                    display: "block",
                    width: "100%",
                    maxHeight: 300,
                    borderRadius: 2,
                    objectFit: "contain",
                    bgcolor: "grey.100",
                  }}
                />
              ) : (
                <Button
                  component="a"
                  href={expense.receipt_path}
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<OpenInNew />}
                >
                  Открыть прикреплённый чек
                </Button>
              )}
            </DetailSection>
          )}
          {expense.shares?.length > 0 && (
            <DetailSection title="Доли">
              <Stack spacing={1}>
                {expense.shares.map((share) => (
                  <DetailRow
                    key={share.id}
                    label={share.user?.name || share.user?.email}
                    value={money(share.amount_cents, currency)}
                  />
                ))}
              </Stack>
            </DetailSection>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}

function DetailSection({ title, children }) {
  return (
    <Box>
      <Stack direction="row" spacing={0.5} sx={{ mb: 1, alignItems: "center" }}>
        {title === "Чек" && <Image fontSize="small" color="action" />}
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

function DetailRow({ label, value, emphasized = false }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography textAlign="right" fontWeight={emphasized ? 800 : undefined}>
        {value}
      </Typography>
    </Stack>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
