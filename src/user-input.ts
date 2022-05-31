import * as vscode from "vscode";
import DeeplApiManager from "./deepl";

export default class UserInputs {
    static async registerApi() {
        const apiProviders = ['DeepL'];
        const choice = await vscode.window.showQuickPick(
            apiProviders,
            {
                placeHolder: 'Select API Provider', ignoreFocusOut: true, title: 'API Provider'
            }
        );
        if (choice === undefined) { return; } // user cancelled
        const config = vscode.workspace.getConfiguration('quick-i18n-gen');
        const apiProvider = choice;
        await config.update(`apiProvider`, apiProvider, true);

        if (apiProvider === 'DeepL') {
            const apiKey = await vscode.window.showInputBox(
                {
                    title: 'API Key', ignoreFocusOut: true, prompt: `Enter API Key for ${apiProvider}`,
                }
            );
            if (apiKey === undefined || apiKey.length === 0) { return; }
            // save apiKey in configuration
            const isApiKeyValid = await DeeplApiManager.testApiKey(apiKey);
            if (isApiKeyValid) {
                await config.update(`${apiProvider.toLowerCase()}.apiKey`, apiKey, true);
                vscode.window.showInformationMessage(`API Key for ${apiProvider} is valid`);
            } else {
                vscode.window.showErrorMessage(`Invalid API Key for ${apiProvider}`);
            }
        } else {
            vscode.window.showErrorMessage(`Unknown API Provider ${apiProvider}`);
        }

    }
    static async selectTranslationFile() {
        const filePath = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: 'Select Translation File',
            filters: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Translation File': ['csv'],
            },
            title: 'Select Translation File',
        });
        if (filePath === undefined) { return; }
        await UserInputs.setTranslationFile(filePath[0]);
    }

    static async setTranslationFile(url: vscode.Uri) {
        const config = vscode.workspace.getConfiguration('quick-i18n-gen');
        const translationFilePath = url.fsPath;
        await config.update(`translationFilePath`, translationFilePath, true);
        vscode.window.showInformationMessage(`Translation File Path is set to ${translationFilePath}`);
    }

    static async translateText(sourceText: string) {
        throw new Error('Method not implemented.');
    }
}

export class QuickFixTranslationProvider implements vscode.CodeActionProvider {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        // check if selection
        if (range.isEmpty) {

        } else { }
        // check if selection is a string literal
        const selection = document.getText(range);
        if (selection.startsWith('"') && selection.endsWith('"')) {
            const action = new vscode.CodeAction('Translate', vscode.CodeActionKind.QuickFix);
            const selectedText = document.getText(range);
            action.command = { command: 'quick-i18n-gen.translateText', title: 'Translate', arguments: [] };
            return [action];
        } else {
            return [];
        }
    }
}