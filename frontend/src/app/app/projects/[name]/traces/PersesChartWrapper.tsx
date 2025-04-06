"use client";
import React from "react";
import {
  ChartsProvider,
  generateChartsTheme,
  getTheme,
} from "@perses-dev/components";
import { ThemeProvider } from "@mui/material";

function PersesChartWrapper({ children }: { children: React.ReactNode }) {
  const muiTheme = getTheme("light");
  const chartsTheme = generateChartsTheme(muiTheme, {});

  return (
    <ThemeProvider theme={muiTheme}>
      <ChartsProvider chartsTheme={chartsTheme}>{children}</ChartsProvider>
    </ThemeProvider>
  );
}

export default PersesChartWrapper;
