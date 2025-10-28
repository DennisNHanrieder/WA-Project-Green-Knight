import { Typography, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <Stack spacing={1}>
      <Typography variant="h5">{t("dashboard.title")}</Typography>
      <Typography variant="body1">{t("dashboard.subtitle")}</Typography>
    </Stack>
  );
}
