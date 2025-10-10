import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import nspell from 'nspell';

export class SpellChecker {
    private spell: any;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadDictionary();
        
        // Reload dictionary when configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('markdownSpellCheck.language')) {
                this.loadDictionary();
            }
        });
    }

    private async loadDictionary() {
        try {
            // Get configured language
            const config = vscode.workspace.getConfiguration('markdownSpellCheck');
            const language = config.get('language', 'en-AU');
            
            // Load dictionary for configured language
            const dictPath = path.join(this.context.extensionPath, 'dictionaries');
            const affPath = path.join(dictPath, `${language}.aff`);
            const dicPath = path.join(dictPath, `${language}.dic`);

            if (fs.existsSync(affPath) && fs.existsSync(dicPath)) {
                const aff = fs.readFileSync(affPath, 'utf8');
                const dic = fs.readFileSync(dicPath, 'utf8');
                this.spell = nspell(aff, dic);
                console.log(`Dictionary loaded successfully: ${language}`);
            } else {
                console.log(`Dictionary files not found for ${language}, using fallback`);
                // Create a fallback with common words
                this.createFallbackDictionary();
            }
        } catch (error) {
            console.error('Failed to load dictionary:', error);
            this.createFallbackDictionary();
        }
    }

    private createFallbackDictionary() {
        // Create a basic spell checker with common English words
        const commonWords = [
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out',
            'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who',
            'boy', 'did', 'man', 'men', 'run', 'too', 'any', 'big', 'end', 'far', 'got', 'let', 'put', 'say', 'she',
            'try', 'use', 'win', 'yes', 'yet', 'about', 'after', 'again', 'back', 'came', 'come', 'could', 'down',
            'each', 'first', 'from', 'good', 'have', 'here', 'home', 'into', 'just', 'know', 'last', 'left', 'like',
            'long', 'look', 'made', 'make', 'many', 'more', 'most', 'much', 'must', 'name', 'never', 'next', 'only',
            'open', 'over', 'part', 'place', 'right', 'said', 'same', 'seem', 'show', 'small', 'some', 'such', 'take',
            'than', 'that', 'them', 'time', 'very', 'want', 'water', 'well', 'went', 'were', 'what', 'when', 'where',
            'which', 'will', 'with', 'work', 'would', 'write', 'year', 'your', 'before', 'being', 'between', 'both',
            'called', 'cannot', 'does', 'every', 'found', 'great', 'hand', 'help', 'house', 'keep', 'kind', 'large',
            'life', 'light', 'live', 'might', 'move', 'need', 'number', 'other', 'people', 'should', 'still', 'think',
            'through', 'under', 'used', 'using', 'while', 'world', 'years', 'young', 'this', 'document', 'test',
            'spell', 'checker', 'extension', 'markdown', 'code', 'visual', 'studio', 'github', 'repository', 'file',
            'text', 'word', 'sentence', 'paragraph', 'line', 'example', 'link', 'url', 'https', 'www', 'com'
        ];
        
        // Create a simple dictionary format
        const dicContent = `${commonWords.length}\n${commonWords.join('\n')}`;
        const affContent = 'SET UTF-8\nTRY esianrtolcdugmphbyfvkwzESIANRTOLCDUGMPHBYFVKWZ\'';
        
        this.spell = nspell(affContent, dicContent);
        console.log('Fallback dictionary created with', commonWords.length, 'words');
    }

    public checkWord(word: string): boolean {
        if (!this.spell || !word || word.length < 2) {
            return true;
        }
        
        // Skip numbers, URLs, and markdown syntax
        if (/^\d+$/.test(word) || 
            /^https?:\/\//.test(word) || 
            /^[#*_`\[\]()]+$/.test(word) ||
            /^[A-Z_]+$/.test(word)) { // Skip ALL_CAPS words (often constants)
            return true;
        }

        // Check both original case and lowercase
        const isCorrect = this.spell.correct(word) || this.spell.correct(word.toLowerCase());
        
        // If it's a capitalized word and lowercase version is correct, accept it
        if (!isCorrect && word[0] === word[0].toUpperCase()) {
            return this.spell.correct(word.toLowerCase());
        }
        
        return isCorrect;
    }

    public getSuggestions(word: string): string[] {
        if (!this.spell || !word) {
            return [];
        }
        
        return this.spell.suggest(word).slice(0, 5); // Limit to 5 suggestions
    }

    public extractWords(text: string): Array<{word: string, start: number, end: number}> {
        const words: Array<{word: string, start: number, end: number}> = [];
        const wordRegex = /\b[a-zA-Z]+\b/g;
        let match;

        while ((match = wordRegex.exec(text)) !== null) {
            words.push({
                word: match[0],
                start: match.index,
                end: match.index + match[0].length
            });
        }

        return words;
    }
}
