"use client";
import {
  ChartsProvider,
  generateChartsTheme,
  getTheme,
  TimeChart,
} from "@perses-dev/components";
import { ThemeProvider } from "@mui/material";

export default function Page() {
  const muiTheme = getTheme("light");
  const chartsTheme = generateChartsTheme(muiTheme, {});
  return (
    <ThemeProvider theme={muiTheme}>
      <ChartsProvider chartsTheme={chartsTheme}>
        <TimeChart
          height={200}
          data={[
            {
              name: "test",
              values: [
                [1673784000000, 1],
                [1673784060000, 2],
                [1673784120000, null],
                [1673784180000, null],
                [1673784240000, 4],
                [1673784300000, 1],
                [1673784360000, 2],
                [1673784420000, 3],
              ],
            },
          ]}
          seriesMapping={[
            {
              type: "line",
              id: "test",
              datasetIndex: 0,
              name: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
              connectNulls: false,
              color: "hsla(158782136,50%,50%,0.8)",
              sampling: "lttb",
              progressiveThreshold: 1000,
              symbolSize: 4,
              lineStyle: {
                width: 1.5,
                opacity: 0.8,
              },
              emphasis: {
                focus: "series",
                lineStyle: {
                  width: 2.5,
                  opacity: 1,
                },
              },
            },
          ]}
        />
      </ChartsProvider>
    </ThemeProvider>
  );
}
