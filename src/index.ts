import {handleWebhook} from './telegram/utils/handleUpdates'
import {setEnv} from './telegram/utils/envManager'
import {tg} from './telegram/lib/methods'
import {messages} from './messages/en'

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
				if (result) return new Response(messages.webhook.registered)
				else return new Response(messages.webhook.registerFailed)
			} catch (error) {
				ctx.waitUntil((async () => {
					return new Promise(resolve => {
						console.log(messages.webhook.error(error))
						resolve(error)
					})
				})())
				return new Response(messages.webhook.error(error))
			}
		} else if (url.pathname === UNREGISTER) {
			try {
				const result = await tg.setWebhook({
					url: '',
				})
				if (result) return new Response(messages.webhook.unregistered)
				else return new Response(messages.webhook.unregisterFailed)
			} catch (error) {
				return new Response(messages.webhook.error(error))
			}
		} else {
			return new Response(messages.http.notFound, {status: 404})
		}
	},
} satisfies ExportedHandler<Env>
