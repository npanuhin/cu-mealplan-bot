import {handleWebhook} from './telegram/utils/handleUpdates'
import {setEnv} from './telegram/utils/envManager'
import {tg} from './telegram/lib/methods'
import {locales} from './locales'

// use `npm run gen` to regenerate `worker-configuration.d.ts`
export interface Env {
	TELEGRAM_SECRET: string  // Telegram bot API secret
	TELEGRAM_TOKEN: string   // Telegram bot API token

	CU_MEALPLAN_USERS: KVNamespace
}

// Define constant paths for webhook management.
const WEBHOOK: string = '/endpoint'
const REGISTER: string = '/registerWebhook'
const UNREGISTER: string = '/unRegisterWebhook'

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		setEnv(env)
		const url: URL = new URL(request.url)

		if (url.pathname === WEBHOOK) {
			return handleWebhook(request)
		} else if (url.pathname === REGISTER) {
			try {
				const result = await tg.setWebhook({
					url: `${url.protocol}//${url.hostname}${WEBHOOK}`,
					secret_token: env.TELEGRAM_SECRET,
				})
				if (result) return new Response(locales.webhook.registered)
				else return new Response(locales.webhook.registerFailed)
			} catch (error) {
				ctx.waitUntil((async () => {
					return new Promise(resolve => {
						console.log(locales.webhook.error(error))
						resolve(error)
					})
				})())
				return new Response(locales.webhook.error(error))
			}
		} else if (url.pathname === UNREGISTER) {
			try {
				const result = await tg.setWebhook({
					url: '',
				})
				if (result) return new Response(locales.webhook.unregistered)
				else return new Response(locales.webhook.unregisterFailed)
			} catch (error) {
				return new Response(locales.webhook.error(error))
			}
		} else {
			return new Response(locales.http.notFound, {status: 404})
		}
	},
} satisfies ExportedHandler<Env>
