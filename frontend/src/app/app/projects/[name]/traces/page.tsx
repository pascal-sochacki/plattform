"use client";
import { TracingGanttChart } from "@perses-dev/panels-plugin";
import {
  ChartsProvider,
  generateChartsTheme,
  getTheme,
  SnackbarProvider,
} from "@perses-dev/components";
import {
  DataQueriesProvider,
  dynamicImportPluginLoader,
  type PluginModuleResource,
  PluginRegistry,
  TimeRangeProvider,
} from "@perses-dev/plugin-system";
import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DatasourceStoreProvider,
  VariableProvider,
} from "@perses-dev/dashboards";
import prometheusResource from "@perses-dev/prometheus-plugin/plugin.json";
import panelsResource from "@perses-dev/panels-plugin/plugin.json";
import {
  type DashboardResource,
  type GlobalDatasourceResource,
  type DatasourceResource,
} from "@perses-dev/core";
import { type DatasourceApi } from "@perses-dev/dashboards";

const fakeDatasource: GlobalDatasourceResource = {
  kind: "GlobalDatasource",
  metadata: { name: "hello" },
  spec: {
    default: true,
    plugin: {
      kind: "PrometheusDatasource",
      spec: {
        directUrl: "https://prometheus.demo.do.prometheus.io",
      },
    },
  },
};

class DatasourceApiImpl implements DatasourceApi {
  getDatasource(): Promise<DatasourceResource | undefined> {
    return Promise.resolve(undefined);
  }

  getGlobalDatasource(): Promise<GlobalDatasourceResource | undefined> {
    return Promise.resolve(fakeDatasource);
  }

  listDatasources(): Promise<DatasourceResource[]> {
    return Promise.resolve([]);
  }

  listGlobalDatasources(): Promise<GlobalDatasourceResource[]> {
    return Promise.resolve([fakeDatasource]);
  }

  buildProxyUrl(): string {
    return "/prometheus";
  }
}

export default function Page() {
  const muiTheme = getTheme("light");
  const chartsTheme = generateChartsTheme(muiTheme, {});
  const pluginLoader = dynamicImportPluginLoader([
    {
      resource: prometheusResource as PluginModuleResource,
      importPlugin: () => import("@perses-dev/prometheus-plugin"),
    },
    {
      resource: panelsResource as PluginModuleResource,
      importPlugin: () => import("@perses-dev/panels-plugin"),
    },
  ]);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 0,
      },
    },
  });
  const fakeDatasourceApi = new DatasourceApiImpl();
  const fakeDashboard = {
    kind: "Dashboard",
    metadata: {},
    spec: {},
  } as DashboardResource;
  return (
    <ThemeProvider theme={muiTheme}>
      <ChartsProvider chartsTheme={chartsTheme}>
        <SnackbarProvider
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          variant="default"
          content=""
        >
          <PluginRegistry
            pluginLoader={pluginLoader}
            defaultPluginKinds={{
              Panel: "TimeSeriesChart",
              TimeSeriesQuery: "PrometheusTimeSeriesQuery",
            }}
          >
            <QueryClientProvider client={queryClient}>
              <TimeRangeProvider
                refreshInterval="0s"
                timeRange={{ pastDuration: "30m" }}
              >
                <VariableProvider>
                  <DatasourceStoreProvider
                    dashboardResource={fakeDashboard}
                    datasourceApi={fakeDatasourceApi}
                  >
                    <DataQueriesProvider
                      definitions={[
                        {
                          kind: "PrometheusTimeSeriesQuery",
                          spec: { query: `up{job="prometheus"}` },
                        },
                      ]}
                    >
                      <TracingGanttChart.PanelComponent
                        contentDimensions={{
                          width: 1200,
                          height: 400,
                        }}
                        spec={{}}
                      />
                    </DataQueriesProvider>
                  </DatasourceStoreProvider>
                </VariableProvider>
              </TimeRangeProvider>
            </QueryClientProvider>
          </PluginRegistry>
        </SnackbarProvider>
      </ChartsProvider>
    </ThemeProvider>
  );
}
