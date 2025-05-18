import { type TraceData, type DatasourceSelector } from "@perses-dev/core";
import { type TraceQueryContext } from "@perses-dev/plugin-system";

export async function getData(
  spec: ClickhouseTraceQuerySpec,
  ctx: TraceQueryContext,
): Promise<TraceData> {
  console.log("called");
  console.log(spec);
  console.log(ctx);
  return {
    metadata: {},
    searchResult: [
      {
        traceId: "",
        rootServiceName: "",
        rootTraceName: "",
        startTimeUnixMs: 0,
        durationMs: 0,
        serviceStats: {},
      },
    ],
    trace: {
      resourceSpans: [
        {
          scopeSpans: [
            {
              spans: [
                {
                  traceId: "123",
                  spanId: "123",
                  name: "hello",
                  startTimeUnixNano: "1",
                  endTimeUnixNano: "1000",
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

export const ClickhouseTraceQuery = {
  getTraceData: getData,
  createInitialOptions: (): {
    query: string;
    limit: number;
    datasource?: string;
  } => ({
    query: "",
    limit: 20,
    datasource: undefined,
  }),
};

export interface ClickhouseTraceQuerySpec {
  query: string;
  limit?: number;
  datasource?: ClickhouseDatasourceSelector;
}

export const CLICKHOUSE_DATASOURCE_KIND = "ClickhouseDatasource";

export interface ClickhouseDatasourceSelector extends DatasourceSelector {
  kind: typeof CLICKHOUSE_DATASOURCE_KIND;
}
