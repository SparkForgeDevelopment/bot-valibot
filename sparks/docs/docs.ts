import {
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	SlashCommandStringOption,
	SlashCommandSubcommandBuilder,
} from 'discord.js';
import { CommandSparkWithAutocomplete } from '../../lib/sparks';
import { apiTopics, guideTopics } from './lib/topics.ts';

const topicOption = new SlashCommandStringOption();
topicOption
	.setName('topic')
	.setDescription('The topic to link to.')
	.setAutocomplete(true)
	.setRequired(true);

const apiSubcommand = new SlashCommandSubcommandBuilder();
apiSubcommand
	.setName('api')
	.setDescription('Request me to search my databanks for API documentation.')
	.addStringOption(topicOption);

const guideSubcommand = new SlashCommandSubcommandBuilder();
guideSubcommand
	.setName('guide')
	.setDescription('Request me to search my databanks for a guide.')
	.addStringOption(topicOption);

const command = new SlashCommandBuilder();
command
	.setName('docs')
	.setDescription('Request a documentation link.')
	.addSubcommand(apiSubcommand)
	.addSubcommand(guideSubcommand);

export class Command extends CommandSparkWithAutocomplete {
	override command = command;
	override id = command.name;
	override execute(interaction: ChatInputCommandInteraction): void {
		const topics =
			interaction.options.getSubcommand() === 'api' ? apiTopics : guideTopics;
		const userRequest = interaction.options.getString('topic', true);

		const result = topics.find(
			(_value, key) => key.toLowerCase() === userRequest.toLowerCase(),
		);

		if (result) {
			interaction
				.reply(
					`I searched my databanks and found this: https://valibot.dev${result}`,
				)
				.catch((exception: unknown) => {
					if (exception instanceof Error) {
						interaction.client.logger.warn(exception);
					} else {
						interaction.client.logger.warn(String(exception));
					}
				});
		} else {
			interaction
				.reply({
					content:
						'I was unable to locate anything in my databanks for that topic.',
					ephemeral: true,
				})
				.catch((exception: unknown) => {
					if (exception instanceof Error) {
						interaction.client.logger.warn(exception);
					} else {
						interaction.client.logger.warn(String(exception));
					}
				});
		}
	}

	override async autocomplete(interaction: AutocompleteInteraction) {
		const topics =
			interaction.options.getSubcommand() === 'api' ? apiTopics : guideTopics;
		const focusedValue = interaction.options.getFocused();
		const filteredKeys = topics.filter((_value, key) =>
			key.toLowerCase().startsWith(focusedValue.toLowerCase()),
		);

		const response =
			filteredKeys.size > 25
				? [{ name: 'To many matches', value: 'To many matches' }]
				: filteredKeys.map((_value, key) => ({ name: key, value: key }));
		interaction.respond(response).catch((exception: unknown) => {
			if (exception instanceof Error) {
				interaction.client.logger.warn(exception);
			} else {
				interaction.client.logger.warn(String(exception));
			}
		});
	}
}
