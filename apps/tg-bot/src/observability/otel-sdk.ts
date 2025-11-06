import { IncomingMessage } from 'http'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'

const WEBHOOK_PATH = process.env.WEBHOOK_PATH ?? '/tg/webhook'

// --- Exporters ---
const traceExporter = new OTLPTraceExporter({
    // env OTEL_EXPORTER_OTLP_ENDPOINT
    // url: 'http://otel-collector:4318/v1/traces',
})

const metricReader =
    process.env.OTEL_METRICS_EXPORTER === 'prometheus'
        ? new PrometheusExporter({
            port: Number(process.env.OTEL_PROM_port) ?? 9464,
            endpoint: process.env.OTEL_PROM_ENDPOINT ?? '/metrics',
        })
        : new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
                // url: 'http://otel-collector:4318/v1/metrics',
            }),
            exportIntervalMillis: 15_000,
        })

// --- NodeSDK ---
export const sdk = new NodeSDK({
    traceExporter,
    metricReader,
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-http': {
                ignoreIncomingRequestHook: (req: IncomingMessage) =>
                    req.url?.match(/^\/health$|^\/metrics$/) !== null ||
                    (req.method === 'HEAD' && (req.url?.startsWith(WEBHOOK_PATH) ?? false)),
            },
            '@opentelemetry/instrumentation-express': { enabled: true },
        }),
    ],
})

// ensure we always expose a Promise<void> regardless of sdk.start() return type
export const otelReady: Promise<void> = (async () => {
    try {
        const maybe = sdk.start() as Promise<void> | void
        if (maybe instanceof Promise) {
            await maybe
        }
    } catch (_e) {
        // ignore start failures here
    }
})()

process.on('SIGTERM', () => void sdk.shutdown())
process.on('SIGINT', () => void sdk.shutdown())