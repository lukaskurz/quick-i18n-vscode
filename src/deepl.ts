import * as deepl from 'deepl-node';

export default class DeeplApiManager {
    private apiKey: string;
    private translator: deepl.Translator;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.translator = new deepl.Translator(apiKey);
    }

    public async testApiKey(): Promise<boolean> {
        try {
            const result = await this.translator.getSourceLanguages();
            return true;
        } catch (error) {
            return false;
        }
    }

    public async translate(text: string, sourceLanguage: deepl.SourceLanguageCode | null, targetLanguages: deepl.TargetLanguageCode[]): Promise<string[]> {
        const results = await Promise.all(targetLanguages.map(async (targetLanguage) => this.translator.translateText(text, sourceLanguage, targetLanguage)));
        const translatedTexts = results.map((result) => result.text);

        return translatedTexts;
    }
}