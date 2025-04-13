import { TraceData } from "@perses-dev/core";
import { TraceQueryContext } from "@perses-dev/plugin-system";
import { TempoTraceQuerySpec } from "@perses-dev/tempo-plugin";
import { TempoTraceQueryEditor } from "@perses-dev/tempo-plugin/dist/plugins/tempo-trace-query/TempoTraceQueryEditor";

export declare const ClickhouseTraceQuery: {
  getTraceData: (
    spec: TempoTraceQuerySpec,
    ctx: TraceQueryContext,
  ) => Promise<TraceData>;
  OptionsEditorComponent: typeof TempoTraceQueryEditor;
  createInitialOptions: () => {
    query: string;
    limit: number;
    datasource?: string;
  };
};
