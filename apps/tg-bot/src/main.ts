import { otelReady } from './observability/otel-sdk'  // before NestFactory
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { json } from 'express'
import { getBotToken } from 'nestjs-telegraf'
import { Telegraf } from 'telegraf'
import { Logger } from 'nestjs-pino'
import { TraceContextInterceptor } from './observability/trace-context.interceptor'
import { MetricsInterceptor } from './observability/metrics.interceptor'
import type { Request, Response, NextFunction } from 'express'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)
    const config = app.get(ConfigService)

    const hookPath = config.get<string>('WEBHOOK_PATH') ?? '/tg/webhook'
    const secret = config.get<string>('TELEGRAM_SECRET_TOKEN') ?? undefined

    const bot = app.get<Telegraf>(getBotToken())

    app.use(hookPath, json(), bot.webhookCallback(undefined, { secretToken: secret }))

    // typed handler to avoid `any` accesses
    app.use(hookPath, (req: Request, res: Response, next: NextFunction) =>
        (req.method === 'HEAD' ? res.sendStatus(200) : next()),
    )

    app.useLogger(app.get(Logger))

    app.useGlobalInterceptors(
        new TraceContextInterceptor(),
        new MetricsInterceptor(),
    )

    // otelReady is a Promise<void>
    await otelReady

    await app.listen(process.env.PORT ?? 8080)
    const logger = app.get(Logger)
    logger.log(`Webhook mounted at ${hookPath}, listening on ${process.env.PORT ?? 8080}`)
}

void bootstrap()