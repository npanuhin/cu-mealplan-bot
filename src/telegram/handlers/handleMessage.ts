import {parse, isValid, differenceInCalendarDays, format, subDays} from 'date-fns'
import {sendMessage} from '../telegramApi'
import {getEnv} from '../utils/envManager'
import {toZonedTime} from 'date-fns-tz'
import {locales} from '../../locales'

// --- Default Configuration ---
const DEFAULT_START_DATE = new Date('2025-08-21')
const DEFAULT_END_DATE = new Date('2026-01-31')
const DEFAULT_INITIAL_BALANCE = 2000

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
				await sendMessage({chatId, text: locales.start, useMarkdownV2: true})
				return

			case '/help':
				await sendMessage({chatId, text: locales.help, useMarkdownV2: true})
				return

			case '/initial':
				if (!arg) {
					await sendMessage({chatId, text: locales.initialAmountPrompt, useMarkdownV2: true})
					return
				}
				const amount = parseFloat(arg.replace(',', '.'))
				if (isNaN(amount) || amount <= 0) {
					await sendMessage({chatId, text: locales.invalidInitialAmount, useMarkdownV2: true})
					return
				}
				if (amount % 1 !== 0) {
					await sendMessage({chatId, text: locales.invalidInitialAmountNotInteger, useMarkdownV2: true})
					return
				}
				await env.CU_MEALPLAN_USERS.put(`${chatId}-money`, amount.toString())
				await sendMessage({chatId, text: locales.initialAmountChanged(initialBalance, amount), useMarkdownV2: true})
				return

			case '/arrival':
			case '/leave':
				if (!arg) {
					const promptText = command === '/arrival'
						? locales.arrivalDatePrompt
						: locales.leaveDatePrompt
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
						const formattedEndDate = format(endDate, "d 'of' MMMM yyyy")
						await sendMessage({chatId, text: locales.arrivalAfterLeaveError(formattedEndDate), useMarkdownV2: true})
						return
					}

					if (command === '/leave' && parsedDate < startDate) {
						const formattedStartDate = format(startDate, "d 'of' MMMM yyyy")
						await sendMessage({chatId, text: locales.leaveBeforeArrivalError(formattedStartDate), useMarkdownV2: true})
						return
					}

					const oldDate = command === '/arrival' ? startDate : endDate
					const formattedOldDate = format(oldDate, "d 'of' MMMM yyyy")
					const newFriendlyDate = format(parsedDate, "d 'of' MMMM yyyy")
					const dateType = command === '/arrival' ? 'start date' : 'end date'

					const responseText = locales.dateChanged(dateType, formattedOldDate, newFriendlyDate)

					const key = command === '/arrival' ? `${chatId}-arrival` : `${chatId}-leave`
					await env.CU_MEALPLAN_USERS.put(key, format(parsedDate, 'yyyy-MM-dd'))

					await sendMessage({chatId, text: responseText, useMarkdownV2: true})
				} else {
					await sendMessage({chatId, text: locales.dateRecognitionError, useMarkdownV2: true})
				}
				return
		}
	}

	// --- Handling Numeric Input (Balance) ---
	const cleanedText = messageText.replace(',', '.').replace(/\s/g, '')
	const currentBalance = parseFloat(cleanedText)

	if (isNaN(currentBalance)) {
		await sendMessage({chatId, text: locales.notANumber, useMarkdownV2: true})
		return
	}

	if (currentBalance < 0) {
		await sendMessage({chatId, text: locales.negativeBalance, useMarkdownV2: true})
		return
	}

	if (currentBalance > initialBalance) {
		await sendMessage({chatId, text: locales.balanceTooHigh(initialBalance), useMarkdownV2: true})
		return
	}

	// --- Statistics Calculation ---
	const nowInBerlin = toZonedTime(new Date(), 'Europe/Berlin')
	const today = nowInBerlin.getHours() < 5 ? subDays(nowInBerlin, 1) : nowInBerlin

	const totalDaysInPeriod = differenceInCalendarDays(endDate, startDate) + 1
	const daysPassed = differenceInCalendarDays(today, startDate) + 1
	const daysRemaining = totalDaysInPeriod - daysPassed

	if (daysRemaining <= 0) {
		await sendMessage({chatId, text: locales.periodEnded(currentBalance), useMarkdownV2: true})
		return
	}

	const idealAverageDailySpending = initialBalance / totalDaysInPeriod
	const recommendedSpendingForRemainingPeriod = daysRemaining > 0 ? currentBalance / daysRemaining : 0
	const idealBalanceToday = initialBalance - (idealAverageDailySpending * Math.max(0, daysPassed))
	const differenceFromIdeal = currentBalance - idealBalanceToday

	const formattedStartDate = format(startDate, "d 'of' MMMM yyyy")
	const formattedEndDate = format(endDate, "d 'of' MMMM yyyy")
	const formattedToday = format(today, "d 'of' MMMM yyyy")

	let statusText: string
	let recommendationText: string

	if (differenceFromIdeal < 0) {
		statusText = locales.statusOverspent(Math.abs(differenceFromIdeal))
		recommendationText = locales.recommendationOverspent(recommendedSpendingForRemainingPeriod)
	} else {
		statusText = locales.statusSaved(differenceFromIdeal)
		recommendationText = locales.recommendationSaved(recommendedSpendingForRemainingPeriod)
	}

	const idealSpendingText = locales.idealSpending(initialBalance, formattedStartDate, formattedEndDate, idealAverageDailySpending)
	const spoilerText = locales.calculationSpoiler(formattedToday, idealSpendingText)

	const finalMessage = [
		statusText,
		recommendationText,
		spoilerText
	].join('\n\n')

	await sendMessage({chatId, text: finalMessage, useMarkdownV2: true})
}

