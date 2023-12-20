import * as deepl from 'deepl-node';
import * as vscode from 'vscode';
import { TranslationApi } from './translation_api';

export default class DeeplApiManager implements TranslationApi {
    async testApiKey(apiKey: string): Promise<boolean> {
        try {
            const result = await new deepl.Translator(apiKey).getSourceLanguages();
            return true;
        } catch (error) {
            return false;
        }
    }

    public async registerApiKey(apiKey: string): Promise<boolean> {
        if (!await this.testApiKey(apiKey)) {
            return false;
        }

        const config = vscode.workspace.getConfiguration('quick-i18n-gen');
        config.update('deepl.apiKey', apiKey, true);

        return true;
    }

    public async translate(text: string, sourceLanguage: deepl.SourceLanguageCode, targetLanguages: deepl.TargetLanguageCode[]): Promise<{ [key: string]: string }> {
        const config = vscode.workspace.getConfiguration('quick-i18n-gen');
        const apiKey = config.get<string>('deepl.apiKey');
        if (apiKey === undefined || apiKey.length === 0) {
            throw new Error("No api key found!");
        }

        const translator = new deepl.Translator(apiKey);

        const results = await Promise.all(targetLanguages.map(async (targetLanguage) => translator.translateText(text, sourceLanguage || null, targetLanguage)));
        const translatedTexts = results.map((result) => result.text);

        const translations: { [key: string]: string } = {};
        for (let i = 0; i < targetLanguages.length; i++) {
            translations[targetLanguages[i]] = translatedTexts[i];
        }

        return translations;
    }
}