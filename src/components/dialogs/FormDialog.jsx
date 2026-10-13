import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";

export default function FormDialog({
  title,
  open,
  onClose,
  children,
  onSubmit,
  submit = "Сохранить",
  disabled = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {children}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" disabled={disabled} onClick={onSubmit}>
          {submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
