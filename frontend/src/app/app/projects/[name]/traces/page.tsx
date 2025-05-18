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
import * as tempoPlugin from "@perses-dev/tempo-plugin";
import * as tracingGanttChartPlugin from "@perses-dev/tracing-gantt-chart-plugin";
import * as timeseriesChartPlugin from "@perses-dev/timeseries-chart-plugin";

const DemoPrometheus: GlobalDatasourceResource = {
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

const LocalTempo: GlobalDatasourceResource = {
  kind: "GlobalDatasource",
  metadata: { name: "hello" },
  spec: {
    default: true,
    plugin: {
      kind: "TempoDatasource",
      spec: {
        directUrl: "http://localhost:3200",
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
    if (selector.kind == "PrometheusDatasource") {
      return Promise.resolve(DemoPrometheus);
    }
    return Promise.resolve(LocalTempo);
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
    return Promise.resolve([DemoPrometheus]);
  }
}

export default function Page() {
  const pluginLoader = dynamicImportPluginLoader([
    {
      resource: prometheusPlugin.getPluginModule(),
      importPlugin: () => Promise.resolve(prometheusPlugin),
    },
    {
      resource: tempoPlugin.getPluginModule(),
      importPlugin: () => Promise.resolve(tempoPlugin),
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
            TraceQuery: "TempoTraceQuery",
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
                        kind: "TempoTraceQuery",
                        spec: { query: `c6fd67763b3935ab3099899a64c4a2de` },
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
                            kind: "TracingGanttChart",
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
