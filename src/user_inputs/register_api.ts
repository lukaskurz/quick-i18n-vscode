import * as vscode from 'vscode';
import DeeplApiManager from '../apis/deepl';

export async function registerApi() {
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
        const isApiKeyValid = await new DeeplApiManager().testApiKey(apiKey);
        if (isApiKeyValid) {
            await config.update(`deepl.apiKey`, apiKey, true);
            vscode.window.showInformationMessage(`API Key for ${apiProvider} is valid`);
        } else {
            vscode.window.showErrorMessage(`Invalid API Key for ${apiProvider}`);
        }
    } else {
        vscode.window.showErrorMessage(`Unknown API Provider ${apiProvider}`);
    }

}