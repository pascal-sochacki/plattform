import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const logProcessor = new SimpleLogRecordProcessor(new OTLPLogExporter());
export const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(logProcessor);

const sdk = new NodeSDK({
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],

  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: "clickhouse",
  }),
  traceExporter: new OTLPTraceExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
  }),
});
sdk.start();
