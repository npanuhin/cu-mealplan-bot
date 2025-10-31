import { tg } from '../../lib/telegram/lib/methods'
import { messages } from '../messages/en'

// --- Send Message ---
export interface SendMessageOptions {
	chatId: string | number;
	text: string;
	disableNotification?: boolean;
	useMarkdownV2?: boolean;
}

export async function sendMessage({
	chatId,
	text,
	disableNotification = true,
	useMarkdownV2 = false,
}: SendMessageOptions): Promise<tgTypes.Message> {
	const trimmedText = text.trim()
	console.log(`-> Replying to [ChatID: ${chatId}]: "${trimmedText.replace(/\n/g, '\\n')}"`)

	if (useMarkdownV2) {
		try {
			return await tg.sendMessage({
				chat_id: chatId,
				text: trimmedText,
				disable_notification: disableNotification,
				parse_mode: 'MarkdownV2',
			})
		} catch (error) {
			console.error(`!!! MarkdownV2 sending failed for [ChatID: ${chatId}]. Falling back to plain text.`, error)
			return sendMessage({chatId, text: messages.errors.markdownV2, disableNotification, useMarkdownV2: false})
		}
	}

	return tg.sendMessage({chat_id: chatId, text: trimmedText, disable_notification: disableNotification})
}


// --- Edit Message ---
export interface EditMessageOptions {
	chatId: string | number;
	messageId: number;
	text: string;
	useMarkdownV2?: boolean;
}

export async function editMessage({
	chatId,
	messageId,
	text,
	useMarkdownV2 = false,
}: EditMessageOptions): Promise<tgTypes.Message | boolean> {
	const trimmedText = text.trim()
	console.log(`-> Editing message ${messageId} in [ChatID: ${chatId}]: "${trimmedText.replace(/\n/g, '\\n')}"`)

	if (useMarkdownV2) {
		try {
			return await tg.editMessageText({
				chat_id: chatId,
				message_id: messageId,
				text: trimmedText,
				parse_mode: 'MarkdownV2',
			})
		} catch (error) {
			console.error(`!!! MarkdownV2 editing failed for message ${messageId} in [ChatID: ${chatId}]. Falling back to plain text.`, error)
			// return editMessage({chatId, messageId, text: en.errors.markdownV2, useMarkdownV2: false})
			return false
		}
	}

	return tg.editMessageText({chat_id: chatId, message_id: messageId, text: trimmedText})
}


// --- Delete Message ---
export interface DeleteMessageOptions {
	chatId: string | number;
	messageId: number;
}

export async function deleteMessage({
	chatId,
	messageId,
}: DeleteMessageOptions): Promise<boolean> {
	console.log(`-> Deleting message ${messageId} in [ChatID: ${chatId}]`)
	return tg.deleteMessage({chat_id: chatId, message_id: messageId})
}
