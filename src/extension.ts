// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import UserInputs, { QuickFixTranslationProvider } from './user-input';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposables = [
		vscode.commands.registerCommand('quick-i18n-gen.registerApi', UserInputs.registerApi),
		vscode.commands.registerCommand('quick-i18n-gen.selectTranslationFile', UserInputs.selectTranslationFile),
		vscode.commands.registerCommand('quick-i18n-gen.setTranslationFile', UserInputs.setTranslationFile),
		vscode.commands.registerCommand('quick-i18n-gen.translateText', UserInputs.translateText),
		vscode.languages.registerCodeActionsProvider('*', new QuickFixTranslationProvider()),
	];

	context.subscriptions.push(...disposables);
}

// this method is called when your extension is deactivated
export function deactivate() { }
