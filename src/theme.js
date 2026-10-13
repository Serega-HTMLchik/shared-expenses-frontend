import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    primary: { main: "#5b4bdb" },
    secondary: { main: "#ec6a5c" },
    background: { default: "#f6f7fb" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    h4: { fontWeight: 800 },
    h5: { fontWeight: 750 },
  },
});
