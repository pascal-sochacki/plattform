"use client";
import { TraceTable } from "@perses-dev/panels-plugin";
import { SnackbarProvider } from "@perses-dev/components";
import {
  DataQueriesContext,
  DataQueriesProvider,
  dynamicImportPluginLoader,
  type PluginModuleResource,
  PluginRegistry,
  TimeRangeProvider,
  TraceQueryDefinition,
  transformQueryResults,
  useListPluginMetadata,
  useQueryType,
  useTimeRange,
} from "@perses-dev/plugin-system";
import {
  QueryClient,
  QueryClientProvider,
  useQueries,
  UseQueryResult,
} from "@tanstack/react-query";
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
  TraceData,
} from "@perses-dev/core";
import { type DatasourceApi } from "@perses-dev/dashboards";
import tempoResource from "@perses-dev/tempo-plugin/plugin.json";
import PersesChartWrapper from "../_components/PersesChartWrapper";
import { useParams } from "next/navigation";

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
        directUrl: "http://localhost:3000/api/proxy/tempo", // Replace with your Tempo API URL
        // Alternatively, configure a proxy if needed:
      },
    },
  },
};

const fakeClickhouseDatasource: GlobalDatasourceResource = {
  kind: "GlobalDatasource",
  metadata: {
    name: "clickhouse", // Unique identifier for the Tempo datasource
  },
  spec: {
    default: false,
    plugin: {
      kind: "ClickhouseDatasource",
      spec: {
        directUrl: "http://localhost:3000/api/proxy/tempo", // Replace with your Tempo API URL
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
    console.log("getDatasource", project, selector);
    return Promise.resolve(undefined);
  }

  getGlobalDatasource(
    selector: DatasourceSelector,
  ): Promise<GlobalDatasourceResource | undefined> {
    console.log("getGlobalDatasource");
    console.log(selector);
    return Promise.resolve(fakeClickhouseDatasource);
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
    return Promise.resolve([
      fakeDatasource,
      fakeTempoDatasource,
      fakeClickhouseDatasource,
    ]);
  }
}

export default function Page() {
  const params = useParams<{ name: string }>();
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
    {
      resource: {
        kind: "PluginModule",
        metadata: {
          name: "Clickhouse",
        },
        spec: {
          plugins: [
            {
              pluginType: "TraceQuery",
              kind: "ClickhouseTraceQuery",
              display: {
                name: "Clickhouse Trace Query",
                description: "",
              },
            },
            {
              pluginType: "Datasource",
              kind: "ClickhouseDatasource",
              display: {
                name: "Clickhouse Datasource",
                description: "",
              },
            },
          ],
        },
      } as PluginModuleResource,
      importPlugin: () => import("@perses-dev/panels-plugin"),
    },
  ]);
  pluginLoader.getInstalledPlugins().then((e) => console.log(e));
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
                  <ViewerTest />
                  <DataQueriesProvider
                    definitions={[
                      {
                        kind: "TempoTraceQuery",
                        spec: { query: `{}` },
                      },
                    ]}
                  >
                    <TraceTable.PanelComponent
                      traceLink={(id) =>
                        `/app/projects/${params.name}/traces/${id.traceId}`
                      }
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

function ViewerTest() {
  const { data: traceQueryPlugins, isLoading: isTraceQueryPluginLoading } =
    useListPluginMetadata(["TraceQuery"]);
  const a = useQueryType();

  console.log("a", a("ClickhouseTraceQuery"));

  console.log("plugins", traceQueryPlugins);

  return <></>;
}
function Test(props: { children: React.ReactNode }) {
  const traceResults = useTempoTraceQueries([
    {
      kind: "TraceQuery",
      spec: {
        plugin: {
          kind: "TempoTraceQuery",
          spec: { query: `{}` },
        },
      },
    },
  ]);
  const a = transformQueryResults(traceResults, [
    {
      kind: "TraceQuery",
      spec: {
        plugin: {
          kind: "TempoTraceQuery",
          spec: { query: `{}` },
        },
      },
    },
  ]);

  return (
    <DataQueriesContext.Provider
      value={{
        isFetching: false,
        isLoading: false,
        queryResults: a,
        refetchAll: () => {},
        errors: [],
      }}
    >
      {props.children}
    </DataQueriesContext.Provider>
  );
}

export function useTempoTraceQueries(
  definitions: TraceQueryDefinition[],
): Array<UseQueryResult<TraceData>> {
  const { absoluteTimeRange } = useTimeRange();

  // useQueries() handles data fetching from query plugins (e.g. traceQL queries, promQL queries)
  // https://tanstack.com/query/v4/docs/react/reference/useQuery
  return useQueries({
    queries: definitions.map((definition) => {
      const queryKey = [definition, absoluteTimeRange] as const; // `queryKey` watches and reruns `queryFn` if keys in the array change
      return {
        queryKey: queryKey,
        queryFn: async (): Promise<TraceData> => {
          return {
            metadata: {
              executedQueryString: "asd",
            },
            searchResult: [
              {
                traceId: "123",
                rootServiceName: "12",
                rootTraceName: "123",
                startTimeUnixMs: 0,
                durationMs: 100,
                serviceStats: {},
              },
            ],
          };
        },

        // The data returned by getTraceData() contains circular dependencies (a span has a reference to the parent span, and the parent span has an array of child spans)
        // Therefore structuralSharing must be turned off, otherwise the query is stuck in the 'fetching' state on re-fetch.
        // Ref: https://github.com/TanStack/query/issues/6954#issuecomment-1962321426
        structuralSharing: false,
      };
    }),
  });
}
