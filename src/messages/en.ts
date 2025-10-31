import {format} from 'date-fns'
import {t} from './utils'

const formatCurrency = (value: number) => value.toFixed(2).replace('.', '\\.').replace('-', '\\-')
const formatInitialBalance = (value: number) => Math.round(value).toString()

export const messages = {
	start: t`
👋 Hi\\! Send me your current Campus Card \\(mealplan\\) balance and I will help you track your expenses\\.

For more information, use /help
`,
	help: t`
Keep track of your mealplan balance 😎

Send me your current Campus Card \\(mealplan\\) balance, for example: \`1543.50\`

*Available commands:*
/arrival \`\\{date\\}\` — Set YOUR semester/mealplan start date \\(inclusive\\), e\\.g\\. default: \`/arrival 21\\.08\\.2025\`
/leave \`\\{date\\}\` — Set YOUR semester/mealplan end date \\(inclusive\\), e\\.g\\. default: \`/leave 31\\.01\\.2026\`
/initial \`\\{amount\\}\` — Set YOUR initial mealplan balance, e\\.g\\. default: \`/initial 2000\`
`,
	arrivalDatePrompt: t`Please provide a date after the command\\. For example: \`/arrival 21\\.08\\.2025\``,
	leaveDatePrompt: t`Please provide a date after the command\\. For example: \`/leave 31\\.01\\.2026\``,
	initialAmountPrompt: t`Please provide an amount after the command\\. For example: \`/initial 2500\``,
	invalidInitialAmount: t`❌ The initial amount must be a positive number\\.`,
	invalidInitialAmountNotInteger: t`❌ The initial amount must be a whole number \\(e\\.g\\., 2500\\), not a fractional one\\.`,
	initialAmountChanged: (oldAmount: number, newAmount: number) => t`✅ The initial balance was changed from *€${formatInitialBalance(oldAmount)}* to *€${formatInitialBalance(newAmount)}*`,
	dateRecognitionError: t`❌ Failed to recognize the date\\. Please use formats like DD\\.MM\\.YYYY or DD/MM/YYYY\\.`,
	dateChanged: (
		dateType: string,
		oldDate: Date,
		newDate: Date
	) => t`
✅ The ${dateType} was changed from *${format(oldDate, "d 'of' MMMM yyyy")}* to *${format(newDate, "d 'of' MMMM yyyy")}*
`,
	notANumber: t`This does not look like a number 🤔\\. Please send your account balance or check the available commands in /help\\.`,
	negativeBalance: t`Your balance cannot be negative\\. Perhaps you made a mistake? 😊`,
	balanceTooHigh: (initialBalance: number) => t`
Your balance cannot be higher than the initial €${formatInitialBalance(initialBalance)}\\. Perhaps you made a mistake? 😊

You can change your initial balance using the \\/initial command\\.
`,
	periodEnded: (remainingMoney: number) => t`
The spending period has ended\\. You have *€${formatCurrency(remainingMoney)}* left\\.

To calculate your daily spending for a new period, please set a new end date using the \`/leave\` command\\.
`,
	arrivalAfterLeaveError: (leaveDate: Date) => t`
❌ The arrival date cannot be after the current leave date \\(${format(leaveDate, "d 'of' MMMM yyyy")}\\)\\.
`,
	leaveBeforeArrivalError: (arrivalDate: Date) => t`
❌ The leave date cannot be before the current arrival date \\(${format(arrivalDate, "d 'of' MMMM yyyy")}\\)\\.
`,

	statusSaved: (savedAmount: number, recommendedSpending: number, spoiler: string) => t`
You have saved *€${formatCurrency(savedAmount)}* 👍

Starting tomorrow, you can spend *€${formatCurrency(recommendedSpending)} per day*

${spoiler}
`,

	statusOverspent: (overspendAmount: number, recommendedSpending: number, spoiler: string) => t`
You have overspent by *€${formatCurrency(overspendAmount)}* 😢

To catch up, your daily budget starting tomorrow is *€${formatCurrency(recommendedSpending)}*

${spoiler}
`,

	spoiler: (
		initialBalance: number,
		startDate: Date,
		endDate: Date,
		idealSpending: number,
		today: Date
	) => t`
||Ideal daily spending of *€${formatInitialBalance(initialBalance)}* \\(${format(startDate, "d 'of' MMMM yyyy")} — ${format(endDate, "d 'of' MMMM yyyy")}\\) is *€${formatCurrency(idealSpending)}*\\. Calculated as of the end of day: ${format(today, "d 'of' MMMM yyyy")}\\.||
`,

	errors: {
		markdownV2: t`Oops! I couldn\'t send your reply due to a formatting issue. Please try again 😊`,
	},
	webhook: {
		registered: t`Webhook registered.`,
		registerFailed: t`Failed to register webhook.`,
		unregistered: t`Webhook unregistered.`,
		unregisterFailed: t`Failed to unregister webhook.`,
		error: (error: any) => t`Error: ${error}`,
	},
	http: {
		notFound: t`Not found`,
		unauthorized: t`Unauthorized`,
	}
}
