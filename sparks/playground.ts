import {
	ChannelType,
	type ChatInputCommandInteraction,
	Events,
	type Message,
	SlashCommandBuilder,
} from 'discord.js';
import * as v from 'valibot';
import lz from 'lz-string';
import { CommandSpark, GatewayEventSpark } from '../lib/sparks';

const linkSchema = v.pipe(
	v.string(),
	v.url('Invalid URL format.'),
	v.startsWith(
		'https://valibot.dev/playground/?code=',
		'Not a Valibot playground link.',
	),
);

const command = new SlashCommandBuilder();
command
	.setName('playground')
	.setDescription('Post a formatted playground link')
	.addStringOption((option) =>
		option
			.setName('link')
			.setDescription('Playground link to post')
			.setRequired(true),
	);

export class Command extends CommandSpark {
	override command = command;
	override id = command.name;
	override execute(interaction: ChatInputCommandInteraction) {
		const link = v.safeParse(
			linkSchema,
			interaction.options.getString('link', true),
		);

		if (link.success) {
			const codeIndex = link.output.indexOf('code=') + 'code='.length;
			const code = lz.decompressFromEncodedURIComponent(
				link.output.slice(codeIndex),
			);
			void interaction.reply({
				content:
					`[Try this code in my playground](<${link.output}>)\n` +
					'```ts\n' +
					code +
					'\n```',
			});
		} else {
			void interaction.reply({
				content: `I apologize for the inconvenience but the link you provided is not valid.  My internal processors tell me the the error was: ${link.issues[0].message}`,
				ephemeral: true,
			});
		}
	}
}

const codeBlockSchema = v.pipe(
	v.string(),
	v.startsWith('```ts\n'),
	v.endsWith('\n```'),
	v.transform((input) => input.slice(('```ts\n'.length, '\n```'.length * -1))),
);

export class GatewayEvent extends GatewayEventSpark<Events.MessageCreate> {
	override eventType = Events.MessageCreate as const;

	override async execute(message: Message): Promise<void> {
		if (
			message.channel.type === ChannelType.GuildText &&
			message.content.startsWith('!pg')
		) {
			const codeBlock = v.safeParse(
				codeBlockSchema,
				message.content.slice('!pg'.length + 1),
			);

			if (codeBlock.success) {
				const messageContent =
					`[Run this code in my playground](<https://valibot.dev/playground/?code=${lz.compressToEncodedURIComponent(codeBlock.output)}>)\n` +
					message.content.slice('!pg'.length + 1);

				if (message.reference?.messageId) {
					const orgMessage = await message.channel.messages.fetch(
						message.reference.messageId,
					);
					await orgMessage.reply(messageContent);
				} else {
					await message.channel.send(messageContent);
				}

				if (message.channel.manageable) {
					void message.delete();
				} else {
					message.client.logger.warn(
						`${import.meta.path}: Cannot delete messages in channel ${message.channel.name}`,
					);
				}
			} else {
				void message.reply({
					content:
						'I apologize for the inconvenience but your message does not appear to be correctly formatted.  Please remember your code must be inside code blocks and may not contain other content.\n\n> \\```ts\n> your code\n> \\```',
				});
			}
		}
	}
}
