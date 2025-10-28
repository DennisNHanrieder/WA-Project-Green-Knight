import { Typography, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function MeinePflanzen() {
  const { t } = useTranslation();

  return (
    <Stack spacing={1}>
      <Typography variant="h5">{t("plants.title")}</Typography>
      <Typography variant="body1">{t("plants.subtitle")}</Typography>
    </Stack>
  );
}
