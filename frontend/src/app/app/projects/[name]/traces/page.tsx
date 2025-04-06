"use client";
import {
  TimeSeriesChart,
  TraceTable,
  TracingGanttChart,
} from "@perses-dev/panels-plugin";
import { SnackbarProvider } from "@perses-dev/components";
import {
  DataQueriesProvider,
  dynamicImportPluginLoader,
  type PluginModuleResource,
  PluginRegistry,
  TimeRangeProvider,
} from "@perses-dev/plugin-system";
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
  DatasourceSelector,
} from "@perses-dev/core";
import { type DatasourceApi } from "@perses-dev/dashboards";
import PersesChartWrapper from "./PersesChartWrapper";
import tempoResource from "@perses-dev/tempo-plugin/plugin.json";

const fakeDatasource: GlobalDatasourceResource = {
  kind: "GlobalDatasource",
  metadata: { name: "hello" },
  spec: {
    default: true,
    plugin: {
      kind: "PrometheusDatasource",
      spec: {
        directUrl: "http://localhost:9090",
      },
    },
  },
};

const fakeTempoDatasource: GlobalDatasourceResource = {
  kind: "GlobalDatasource",
  metadata: {
    name: "tempo", // Unique identifier for the Tempo datasource
  },
  spec: {
    default: false,
    plugin: {
      kind: "TempoDatasource",
      spec: {
        directUrl: "http://localhost:3200", // Replace with your Tempo API URL
        // Alternatively, configure a proxy if needed:
      },
    },
  },
};

class DatasourceApiImpl implements DatasourceApi {
  getDatasource(
    project: string,
    selector: DatasourceSelector,
  ): Promise<DatasourceResource | undefined> {
    console.log(project, selector);
    return Promise.resolve(undefined);
  }

  getGlobalDatasource(
    selector: DatasourceSelector,
  ): Promise<GlobalDatasourceResource | undefined> {
    console.log("getGlobalDatasource");
    console.log(selector);
    return Promise.resolve(fakeTempoDatasource);
  }

  listDatasources(
    project: string,
    pluginKind?: string,
  ): Promise<DatasourceResource[]> {
    console.log(project, pluginKind);
    return Promise.resolve([]);
  }

  listGlobalDatasources(
    pluginKind?: string,
  ): Promise<GlobalDatasourceResource[]> {
    console.log(pluginKind);
    return Promise.resolve([fakeDatasource, fakeTempoDatasource]);
  }
}

export default function Page() {
  const pluginLoader = dynamicImportPluginLoader([
    {
      resource: prometheusResource as PluginModuleResource,
      importPlugin: () => import("@perses-dev/prometheus-plugin"),
    },
    {
      resource: tempoResource as PluginModuleResource,
      importPlugin: () => import("@perses-dev/tempo-plugin"),
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
    <PersesChartWrapper>
      <SnackbarProvider
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        variant="default"
        content=""
      >
        <PluginRegistry
          pluginLoader={pluginLoader}
          defaultPluginKinds={{
            Panel: "TracingGanttChart",
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
                        spec: { query: `209f4d8a9e7fb7c7422b5bfc1a54c57` },
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
    </PersesChartWrapper>
  );
}
