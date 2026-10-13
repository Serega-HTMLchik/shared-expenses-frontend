import { Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, Typography } from "@mui/material";

export default function NotificationsDialog({ notifications, onClose, onReadAll }) {
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm"><DialogTitle>Уведомления</DialogTitle><DialogContent><List>{notifications.map((item) => <ListItem key={item.id} divider sx={{ opacity: item.read_at ? 0.55 : 1 }}><ListItemText primary={item.data?.title || "Уведомление"} secondary={item.data?.body} /></ListItem>)}{notifications.length === 0 && <Typography color="text.secondary">Уведомлений пока нет.</Typography>}</List></DialogContent><DialogActions><Button onClick={onReadAll}>Прочитать все</Button><Button onClick={onClose}>Закрыть</Button></DialogActions></Dialog>;
}
