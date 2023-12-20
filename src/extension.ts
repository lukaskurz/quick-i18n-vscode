// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { QuickFixTranslationProvider } from './text_matching_provider';
import { registerApi } from './user_inputs/register_api';
import { selectTranslationFilesWithLanguages } from './user_inputs/translation_files';
import { translateText } from './user_inputs/translate_text';
import { configureFileTypeSettings } from './user_inputs/file_type_settings';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposables = [
		vscode.commands.registerCommand('quick-i18n-gen.registerApi', registerApi),
		vscode.commands.registerCommand('quick-i18n-gen.selectTranslationFiles', selectTranslationFilesWithLanguages),
		vscode.commands.registerCommand('quick-i18n-gen.translateText', translateText),
		vscode.commands.registerCommand('quick-i18n-gen.configureFileTypeSettings', configureFileTypeSettings),
		vscode.languages.registerCodeActionsProvider('*', new QuickFixTranslationProvider()),
	];

	context.subscriptions.push(...disposables);
}

// this method is called when your extension is deactivated
export function deactivate() { }
