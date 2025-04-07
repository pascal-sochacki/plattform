"use client";
import React from "react";
import {
  ChartsProvider,
  generateChartsTheme,
  getTheme,
} from "@perses-dev/components";
import { ThemeProvider } from "@mui/material";
import { BrowserRouter, Router } from "react-router-dom";
import { useRouter } from "next/navigation";

function PersesChartWrapper({ children }: { children: React.ReactNode }) {
  const muiTheme = getTheme("light");
  const chartsTheme = generateChartsTheme(muiTheme, {});

  return (
    <HackRouter>
      <ThemeProvider theme={muiTheme}>
        <ChartsProvider chartsTheme={chartsTheme}>{children}</ChartsProvider>
      </ThemeProvider>
    </HackRouter>
  );
}

export default PersesChartWrapper;

function HackRouter({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <Router
      location={""}
      navigator={{
        createHref: (to) => {
          return "";
        },
        go: () => "",
        push(to, state, opts) {
          if (typeof to === "string") {
            router.push(to);
          } else {
            router.push(to.pathname!);
          }
        },
        replace(to, state, opts) {},
      }}
    >
      {children}
    </Router>
  );
}
