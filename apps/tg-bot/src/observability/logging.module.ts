import { Module } from '@nestjs/common'
import { LoggerModule } from 'nestjs-pino'
import { randomUUID } from 'crypto'
import { trace } from '@opentelemetry/api'
import type { Request } from 'express'

type LoggerModuleOptions = NonNullable<Parameters<typeof LoggerModule.forRoot>[0]>
type PinoHttpOptions = NonNullable<LoggerModuleOptions['pinoHttp']>

@Module({
    imports: [
        LoggerModule.forRoot({
            // build a strongly-typed options object and cast via unknown -> PinoHttpOptions
            pinoHttp: ((): PinoHttpOptions => {
                const normalizeHeader = (v: unknown): string | null => {
                    if (!v) return null
                    const s = String(v).trim()
                    if (!s) return null
                    if (/^\d+$/.test(s)) return null // reject numeric-only
                    return s
                }

                const opts = {
                    level: process.env.LOG_LEVEL ?? 'info',
                    mixin(): Record<string, string | undefined> {
                        const span = trace.getActiveSpan()
                        const ctx = span?.spanContext()
                        const valid =
                            !!ctx &&
                            ctx.traceId !== '00000000000000000000000000000000' &&
                            ctx.spanId !== '0000000000000000'
                        return valid ? { trace_id: ctx.traceId, span_id: ctx.spanId } : {}
                    },
                    formatters: {
                        level(label: string) {
                            return { level: label }
                        },
                    },
                    genReqId: (req: unknown) => {
                        const headers = (req as Record<string, unknown>)['headers'] as Record<string, unknown> | undefined
                        const hdrTrace = normalizeHeader(headers?.['trace-id'])
                        const hdrXReq = normalizeHeader(headers?.['x-request-id'])
                        return hdrTrace ?? hdrXReq ?? randomUUID()
                    },
                    customLogLevel: (_req: unknown, res?: { statusCode?: number } | null, err?: unknown) => {
                        if (err || (res && (res.statusCode ?? 0) >= 500)) return 'error'
                        return 'info'
                    },
                    serializers: {
                        req: (r: Request & { id?: string; body?: unknown }) => ({
                            method: r.method,
                            url: r.url,
                            request_id: r.id,
                            remote_ip: r.ip,
                            user_agent: (r.headers as Record<string, string | undefined>)['user-agent'],
                            dedupe_key: (r.body as Record<string, unknown> | undefined)?.dedupe_key,
                        }),
                    },
                    autoLogging: {
                        ignore: (r: Request) => r.url === '/health' || r.url === '/metrics',
                    },
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                return opts as unknown as PinoHttpOptions
            })(),
        }),
    ],
})
export class LoggingModule { }