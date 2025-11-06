import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { metrics } from '@opentelemetry/api'
import type { Request, Response } from 'express'

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const http = context.switchToHttp()
        const req = http.getRequest<Request & { route?: { path?: string } }>()
        const res = http.getResponse<Response>()

        const meter = metrics.getMeter('tgbot')
        const counter = meter.createCounter('http_requests_total', {
            description: 'Total number of HTTP requests',
        })
        const histogram = meter.createHistogram('http_request_duration_seconds', {
            description: 'HTTP request duration in seconds',
        })

        const started = Date.now()
        return next.handle().pipe(
            tap(() => {
                const duration = (Date.now() - started) / 1000

                // Safely narrow req.route which may be typed as unknown/any
                const route = (req as { route?: unknown }).route
                let path: string = req.url
                if (route && typeof route === 'object' && 'path' in route) {
                    const maybePath = (route as { path?: unknown }).path
                    if (typeof maybePath === 'string') {
                        path = maybePath
                    }
                }

                counter.add(1, {
                    method: req.method,
                    status_code: res.statusCode,
                    path,
                })
                histogram.record(duration, {
                    method: req.method,
                    status_code: res.statusCode,
                    path,
                })
            }),
        )
    }
}