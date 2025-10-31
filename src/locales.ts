const formatCurrency = (value: number) => value.toFixed(2).replace('.', '\\.').replace('-', '\\-')
const formatInitialBalance = (value: number) => Math.round(value).toString()

export const locales = {
	start: `
👋 Hi\\! Send me your current Campus Card \\(mealplan\\) balance and I will help you track your expenses\\.

For more information, use /help
`,
	help: `
Keep track of your mealplan balance 😎

Send me your current Campus Card \\(mealplan\\) balance, for example: \`1543.50\`

*Available commands:*
/arrival \`\\{date\\}\` — Set YOUR semester/mealplan start date \\(inclusive\\), e\\.g\\. default: \`/arrival 21\\.08\\.2025\`
/leave \`\\{date\\}\` — Set YOUR semester/mealplan end date \\(inclusive\\), e\\.g\\. default: \`/leave 31\\.01\\.2026\`
/initial \`\\{amount\\}\` — Set YOUR initial mealplan balance, e\\.g\\. default: \`/initial 2000\`
`,
	arrivalDatePrompt: `Please provide a date after the command\\. For example: \`/arrival 21\\.08\\.2025\``,
	leaveDatePrompt: `Please provide a date after the command\\. For example: \`/leave 31\\.01\\.2026\``,
	initialAmountPrompt: `Please provide an amount after the command\\. For example: \`/initial 2500\``,
	invalidInitialAmount: '❌ The initial amount must be a positive number\\.',
	invalidInitialAmountNotInteger: '❌ The initial amount must be a whole number \\(e\\.g\\., 2500\\), not a fractional one\\.',
	initialAmountChanged: (oldAmount: number, newAmount: number) => `✅ The initial balance was changed from *€${formatInitialBalance(oldAmount)}* to *€${formatInitialBalance(newAmount)}*`,
	dateRecognitionError: '❌ Failed to recognize the date\\. Please use formats like DD\\.MM\\.YYYY or DD/MM/YYYY\\.',
	dateChanged: (dateType: string, oldDate: string, newDate: string) => `✅ The ${dateType} was changed from *${oldDate}* to *${newDate}*`,
	notANumber: 'This does not look like a number 🤔\\. Please send your account balance or check the available commands in /help\\.',
	negativeBalance: `Your balance cannot be negative\\. Perhaps you made a mistake? 😊`,
	balanceTooHigh: (initialBalance: number) => `Your balance cannot be higher than the initial €${formatInitialBalance(initialBalance)}\\. Perhaps you made a mistake? 😊

You can change your initial balance using the \\/initial command\\.`,
	periodEnded: (remainingMoney: number) => `
The spending period has ended\\. You have *€${formatCurrency(remainingMoney)}* left\\.

To calculate your daily spending for a new period, please set a new end date using the \`/leave\` command\\.
`,
	arrivalAfterLeaveError: (leaveDate: string) => `❌ The arrival date cannot be after the current leave date \\(${leaveDate}\\)\\.`,
	leaveBeforeArrivalError: (arrivalDate: string) => `❌ The leave date cannot be before the current arrival date \\(${arrivalDate}\\)\\.`,

	// --- Modularized spending report ---
	statusSaved: (savedAmount: number) =>
		`You have saved *€${formatCurrency(savedAmount)}* 👍`,

	idealSpending: (initialBalance: number, startDate: string, endDate: string, idealSpending: number) =>
		`Ideal daily spending of *€${formatInitialBalance(initialBalance)}* \\(${startDate} — ${endDate}\\) is *€${formatCurrency(idealSpending)}*\\.`,

	statusOverspent: (overspendAmount: number) =>
		`You have overspent by *€${formatCurrency(overspendAmount)}* 😢`,

	recommendationSaved: (recommendedSpending: number) =>
		`Starting tomorrow, you can spend *€${formatCurrency(recommendedSpending)} per day*\\.`,

	recommendationOverspent: (recommendedSpending: number) =>
		`To catch up, your daily budget starting tomorrow is *€${formatCurrency(recommendedSpending)}*\\.`,

	calculationSpoiler: (date: string, idealSpendingText: string) =>
		`||${idealSpendingText} Calculated as of the end of day: ${date}\\.||`,

	errors: {
		markdownV2: 'Oops! I couldn\'t send your reply due to a formatting issue. Please try again 😊',
	},
	webhook: {
		registered: 'Webhook registered.',
		registerFailed: 'Failed to register webhook.',
		unregistered: 'Webhook unregistered.',
		unregisterFailed: 'Failed to unregister webhook.',
		error: (error: any) => `Error: ${error}`,
	},
	http: {
		notFound: 'Not found',
		unauthorized: 'Unauthorized',
	}
}

