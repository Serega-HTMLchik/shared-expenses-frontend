import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { api } from "../../services/api";

export default function AcceptInvite({ token, accepted = () => {} }) {
  const inviteToken = window.location.pathname.match(/^\/invitations\/([^/]+)$/)?.[1];
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(Boolean(inviteToken));

  useEffect(() => {
    if (inviteToken) {
      api(`/invitations/${inviteToken}`)
        .then(setInvite)
        .catch((requestError) => setError(requestError.message));
    }
  }, [inviteToken]);

  const decline = () => {
    window.history.replaceState({}, "", "/");
    setOpen(false);
  };

  const accept = async () => {
    try {
      await api(`/invitations/${inviteToken}/accept`, { token, method: "POST" });
      accepted();
      decline();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (!inviteToken) return null;

  return (
    <Dialog open={open} onClose={decline} fullWidth maxWidth="xs">
      <DialogTitle>Приглашение в группу</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {invite ? (
            <>
              <Typography variant="h6">{invite.group.name}</Typography>
              <Typography color="text.secondary">Валюта группы: {invite.group.currency}</Typography>
              <Typography variant="body2" color="text.secondary">
                Приглашение действительно до {new Date(invite.expires_at).toLocaleDateString("ru-RU")}.
              </Typography>
            </>
          ) : (
            !error && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <CircularProgress size={28} />
              </Box>
            )
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={decline}>Отклонить</Button>
        <Button variant="contained" disabled={!invite} onClick={accept}>
          Принять
        </Button>
      </DialogActions>
    </Dialog>
  );
}
