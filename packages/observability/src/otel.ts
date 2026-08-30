import { metrics, trace } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';

let started = false;

export function startOtel(serviceName: string): void {
  if (started) return;
  started = true;
  const resource = new Resource({ 'service.name': serviceName });
  const tracerProvider = new BasicTracerProvider({ resource });
  trace.setGlobalTracerProvider(tracerProvider);
  const meterProvider = new MeterProvider({
    resource,
    readers: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      ? [new PeriodicExportingMetricReader({ exporter: new ConsoleMetricExporter() })]
      : [],
  });
  metrics.setGlobalMeterProvider(meterProvider);
}

export function getTracer(name = 'paid') {
  return trace.getTracer(name);
}

export function getMeter(name = 'paid') {
  return metrics.getMeter(name);
}
