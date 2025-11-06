import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TelegrafModule } from 'nestjs-telegraf'
import { BotUpdate } from './bot.update'
import { HealthController } from './health.controller'
import { LoggingModule } from './observability/logging.module'

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TelegrafModule.forRootAsync({
            useFactory: () => {
                const token = process.env.BOT_TOKEN ?? ''
                if (!token) {
                    throw new Error('Bot Token is required')
                }
                const hookPath = process.env.WEBHOOK_PATH ?? '/tg/webhook'
                const secretToken = process.env.TELEGRAM_SECRET_TOKEN ?? undefined
                // always provide a string for domain to satisfy telegraf types
                const domain = process.env.PUBLIC_URL ?? ''

                const isDummy = token === 'dummy_token'

                return {
                    token,
                    launchOptions: isDummy ? false : {
                        webhook: {
                            domain, // string (may be empty)
                            hookPath,
                            secretToken,
                        },
                    },
                }
            },
        }),
        LoggingModule,
    ],
    controllers: [HealthController],
    providers: [BotUpdate],
})
export class AppModule { }