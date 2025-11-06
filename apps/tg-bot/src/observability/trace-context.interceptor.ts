import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import type { Request, Response } from 'express'
import type pino from 'pino'
import { trace } from '@opentelemetry/api'

@Injectable()
export class TraceContextInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const req = context.switchToHttp().getRequest<Request & { log?: pino.Logger; id?: string; trace_id?: string; span_id?: string }>()
        const res = context.switchToHttp().getResponse<Response>()

        // skip health/metrics
        if (req.url === '/health' || req.url === '/metrics') {
            return next.handle()
        }

        const baseLogger = req.log
        if (!baseLogger) {
            return next.handle()
        }

        const span = trace.getActiveSpan()
        const sc = span?.spanContext()
        const valid = !!sc
            && sc.traceId !== '00000000000000000000000000000000'
            && sc.spanId !== '0000000000000000'
        const trace_id = valid ? sc.traceId : (req.id || 'unknown')
        const span_id = valid ? sc.spanId : 'unknown'

        const loggerWithContext = baseLogger.child({ trace_id, span_id })
            // avoid TS incompatibility with pino versions — assign via cast
            ; (req as unknown as Record<string, unknown>).logger = loggerWithContext
        req.trace_id = trace_id
        req.span_id = span_id

        res.setHeader('trace-id', trace_id)
        if (req.id) res.setHeader('x-request-id', req.id)

        const started = Date.now()
        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - started
                loggerWithContext.info({ duration }, 'Request completed')
            }),
        )
    }
}