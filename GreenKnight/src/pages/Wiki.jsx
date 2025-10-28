import { Typography, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function Wiki() {
  const { t } = useTranslation();

  return (
    <Stack spacing={1}>
      <Typography variant="h5">{t("wiki.title")}</Typography>
      <Typography variant="body1">{t("wiki.subtitle")}</Typography>
    </Stack>
  );
}
