"use client";
import React from "react";
import {
  ChartsProvider,
  generateChartsTheme,
  getTheme,
} from "@perses-dev/components";
import { ThemeProvider } from "@mui/material";
import { BrowserRouter } from "react-router-dom";

function PersesChartWrapper({ children }: { children: React.ReactNode }) {
  const muiTheme = getTheme("light");
  const chartsTheme = generateChartsTheme(muiTheme, {});
  console.log(chartsTheme);

  return (
    <BrowserRouter>
      <ThemeProvider theme={muiTheme}>
        <ChartsProvider chartsTheme={chartsTheme}>{children}</ChartsProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default PersesChartWrapper;
