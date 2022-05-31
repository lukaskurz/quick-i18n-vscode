import * as deepl from 'deepl-node';

export default class DeeplApiManager {
    private apiKey: string;
    private translator: deepl.Translator;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.translator = new deepl.Translator(apiKey);
    }

    public static async testApiKey(apiKey: string): Promise<boolean> {
        try {
            const translator = new deepl.Translator(apiKey);
            const result = await translator.getSourceLanguages();
            return true;
        } catch (error) {
            return false;
        }
    }


}