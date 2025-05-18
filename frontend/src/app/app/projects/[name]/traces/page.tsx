"use client";
import { SnackbarProvider } from "@perses-dev/components";
import {
  DataQueriesProvider,
  dynamicImportPluginLoader,
  PluginRegistry,
  TimeRangeProvider,
} from "@perses-dev/plugin-system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DatasourceStoreProvider,
  Panel,
  VariableProvider,
} from "@perses-dev/dashboards";
import {
  type DashboardResource,
  type GlobalDatasourceResource,
  type DatasourceResource,
  type DatasourceSelector,
} from "@perses-dev/core";
import { type DatasourceApi } from "@perses-dev/dashboards";
import PersesChartWrapper from "../_components/PersesChartWrapper";
import * as prometheusPlugin from "@perses-dev/prometheus-plugin";
import * as tracingGanttChartPlugin from "@perses-dev/tracing-gantt-chart-plugin";
import * as timeseriesChartPlugin from "@perses-dev/timeseries-chart-plugin";

const fakeDatasource: GlobalDatasourceResource = {
  kind: "GlobalDatasource",
  metadata: { name: "hello" },
  spec: {
    default: true,
    plugin: {
      kind: "PrometheusDatasource",
      spec: {
        directUrl: "https://prometheus.demo.prometheus.io",
      },
    },
  },
};

class DatasourceApiImpl implements DatasourceApi {
  getDatasource(
    project: string,
    selector: DatasourceSelector,
  ): Promise<DatasourceResource | undefined> {
    console.log("getDatasource", project, selector);
    return Promise.resolve(undefined);
  }

  getGlobalDatasource(
    selector: DatasourceSelector,
  ): Promise<GlobalDatasourceResource | undefined> {
    console.log("getGlobalDatasource");
    console.log(selector);
    return Promise.resolve(fakeDatasource);
  }

  listDatasources(
    project: string,
    pluginKind?: string,
  ): Promise<DatasourceResource[]> {
    console.log("list", project, pluginKind);
    return Promise.resolve([]);
  }

  listGlobalDatasources(
    pluginKind?: string,
  ): Promise<GlobalDatasourceResource[]> {
    console.log("list global", pluginKind);
    return Promise.resolve([fakeDatasource]);
  }
}

export default function Page() {
  const pluginLoader = dynamicImportPluginLoader([
    {
      resource: prometheusPlugin.getPluginModule(),
      importPlugin: () => Promise.resolve(prometheusPlugin),
    },
    {
      resource: tracingGanttChartPlugin.getPluginModule(),
      importPlugin: () => Promise.resolve(tracingGanttChartPlugin),
    },
    {
      resource: timeseriesChartPlugin.getPluginModule(),
      importPlugin: () => Promise.resolve(timeseriesChartPlugin),
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
    <PersesChartWrapper>
      <SnackbarProvider
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        variant="default"
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
                        spec: { query: `up{}` },
                      },
                    ]}
                  >
                    <Panel
                      panelOptions={{
                        hideHeader: true,
                      }}
                      definition={{
                        kind: "Panel",
                        spec: {
                          display: { name: "Example Panel" },
                          plugin: {
                            kind: "TimeSeriesChart",
                            spec: {
                              legend: {
                                position: "bottom",
                                size: "medium",
                              },
                            },
                          },
                        },
                      }}
                    />
                  </DataQueriesProvider>
                </DatasourceStoreProvider>
              </VariableProvider>
            </TimeRangeProvider>
          </QueryClientProvider>
        </PluginRegistry>
      </SnackbarProvider>
    </PersesChartWrapper>
  );
}
