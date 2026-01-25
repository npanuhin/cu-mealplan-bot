import { differenceInCalendarDays, format, isValid, parse, subDays } from 'date-fns'
import { sendMessage } from '../telegramApi'
import { getEnv } from '../utils/envManager'
import { messages } from '../../messages/en'
import { toZonedTime } from 'date-fns-tz'

// --- Default Configuration ---
const DEFAULT_START_DATE = new Date('2025-08-21')
const DEFAULT_END_DATE = new Date('2026-05-31')
const DEFAULT_INITIAL_BALANCE = 4000

export async function handleMessage(message: tgTypes.Message) {
	if (!message.text) {
		return
	}

	const messageText = message.text.trim()
	const chatId = message.chat.id
	const env = getEnv()

	// --- Logging & User Identification ---
	// User-friendly identifier for logs: first + last name + @username if available.
	const user = message.from
	const userIdentifier = user
		? `[ChatID: ${chatId}, UserID: ${user.id}, User: ${user.first_name} ${user.last_name || ''}${user.username ? ` (@${user.username})` : ''}]`
		: `[ChatID: ${chatId}]`

	console.log(`<- Received from ${userIdentifier}: "${messageText}"`)

	// --- KV Storage Integration ---
	const userStartDateStr = await env.CU_MEALPLAN_USERS.get(`${chatId}-arrival`)
	const userEndDateStr = await env.CU_MEALPLAN_USERS.get(`${chatId}-leave`)
	const userInitialBalanceStr = await env.CU_MEALPLAN_USERS.get(`${chatId}-money`)

	const startDate = userStartDateStr ? new Date(userStartDateStr) : DEFAULT_START_DATE
	const endDate = userEndDateStr ? new Date(userEndDateStr) : DEFAULT_END_DATE
	const initialBalance = userInitialBalanceStr ? parseFloat(userInitialBalanceStr) : DEFAULT_INITIAL_BALANCE

	// --- Command Handling ---
	if (messageText.startsWith('/')) {
		const parts = messageText.split(/\s+/)
		const command = parts[0]
		const arg = parts.slice(1).join(' ')

		switch (command) {
			case '/start':
				await sendMessage({chatId, text: messages.start, useMarkdownV2: true})
				return

			case '/help':
				await sendMessage({chatId, text: messages.help, useMarkdownV2: true})
				return

			case '/initial':
				if (!arg) {
					await sendMessage({chatId, text: messages.initialAmountPrompt, useMarkdownV2: true})
					return
				}
				const amount = parseFloat(arg.replace(',', '.'))
				if (isNaN(amount) || amount <= 0) {
					await sendMessage({chatId, text: messages.invalidInitialAmount, useMarkdownV2: true})
					return
				}
				if (amount % 1 !== 0) {
					await sendMessage({chatId, text: messages.invalidInitialAmountNotInteger, useMarkdownV2: true})
					return
				}
				await env.CU_MEALPLAN_USERS.put(`${chatId}-money`, amount.toString())
				await sendMessage({
					chatId,
					text: messages.initialAmountChanged(initialBalance, amount),
					useMarkdownV2: true,
				})
				return

			case '/arrival':
			case '/leave':
				if (!arg) {
					const promptText = command === '/arrival'
						? messages.arrivalDatePrompt
						: messages.leaveDatePrompt
					await sendMessage({chatId, text: promptText, useMarkdownV2: true})
					return
				}

				const dateFormats = ['dd.MM.yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'dd.MM.yy', 'dd/MM/yy']
				let parsedDate: Date | null = null
				for (const fmt of dateFormats) {
					const date = parse(arg, fmt, new Date())
					if (isValid(date)) {
						parsedDate = date
						break
					}
				}

				if (parsedDate) {
					// --- Date Validation Logic ---
					if (command === '/arrival' && parsedDate > endDate) {
						await sendMessage({chatId, text: messages.arrivalAfterLeaveError(endDate), useMarkdownV2: true})
						return
					}

					if (command === '/leave' && parsedDate < startDate) {
						await sendMessage({
							chatId,
							text: messages.leaveBeforeArrivalError(startDate),
							useMarkdownV2: true,
						})
						return
					}

					const oldDate = command === '/arrival' ? startDate : endDate
					const dateType = command === '/arrival' ? 'start date' : 'end date'

					const responseText = messages.dateChanged(dateType, oldDate, parsedDate)

					const key = command === '/arrival' ? `${chatId}-arrival` : `${chatId}-leave`
					await env.CU_MEALPLAN_USERS.put(key, format(parsedDate, 'yyyy-MM-dd'))

					await sendMessage({chatId, text: responseText, useMarkdownV2: true})
				} else {
					await sendMessage({chatId, text: messages.dateRecognitionError, useMarkdownV2: true})
				}
				return
		}
	}

	// --- Handling Numeric Input (Balance) ---
	const cleanedText = messageText.replace(',', '.').replace(/\s/g, '')
	const currentBalance = parseFloat(cleanedText)

	if (isNaN(currentBalance)) {
		await sendMessage({chatId, text: messages.notANumber, useMarkdownV2: true})
		return
	}

	if (currentBalance < 0) {
		await sendMessage({chatId, text: messages.negativeBalance, useMarkdownV2: true})
		return
	}

	// --- Statistics Calculation ---
	const nowInBerlin = toZonedTime(new Date(), 'Europe/Berlin')
	const today = nowInBerlin.getHours() < 5 ? subDays(nowInBerlin, 1) : nowInBerlin

	const totalDaysInPeriod = differenceInCalendarDays(endDate, startDate) + 1
	const daysPassed = differenceInCalendarDays(today, startDate) + 1
	const daysRemaining = totalDaysInPeriod - daysPassed

	if (daysRemaining <= 0) {
		await sendMessage({chatId, text: messages.periodEnded(currentBalance), useMarkdownV2: true})
		return
	}

	const idealDailySpending = initialBalance / totalDaysInPeriod
	const recommendedSpending = daysRemaining > 0 ? currentBalance / daysRemaining : 0
	const idealBalanceToday = initialBalance - (idealDailySpending * Math.max(0, daysPassed))
	const differenceFromIdeal = currentBalance - idealBalanceToday

	const spoilerText = messages.spoiler(
		initialBalance,
		startDate,
		endDate,
		idealDailySpending,
		today,
	)

	let finalMessage: string
	if (differenceFromIdeal < 0) {
		finalMessage = messages.statusOverspent(
			Math.abs(differenceFromIdeal),
			recommendedSpending,
			spoilerText,
		)
	} else {
		finalMessage = messages.statusSaved(
			differenceFromIdeal,
			recommendedSpending,
			spoilerText,
		)
	}

	await sendMessage({chatId, text: finalMessage, useMarkdownV2: true})
}
