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
    }

    private async loadDictionary() {
        try {
            // Load bundled en-US dictionary
            const dictPath = path.join(this.context.extensionPath, 'dictionaries');
            const affPath = path.join(dictPath, 'en-US.aff');
            const dicPath = path.join(dictPath, 'en-US.dic');

            if (fs.existsSync(affPath) && fs.existsSync(dicPath)) {
                const aff = fs.readFileSync(affPath, 'utf8');
                const dic = fs.readFileSync(dicPath, 'utf8');
                this.spell = nspell(aff, dic);
            } else {
                // Fallback: create basic spell checker
                this.spell = nspell();
            }
        } catch (error) {
            console.error('Failed to load dictionary:', error);
            this.spell = nspell();
        }
    }

    public checkWord(word: string): boolean {
        if (!this.spell || !word || word.length < 2) {
            return true;
        }
        
        // Skip numbers, URLs, and markdown syntax
        if (/^\d+$/.test(word) || 
            /^https?:\/\//.test(word) || 
            /^[#*_`\[\]()]+$/.test(word)) {
            return true;
        }

        return this.spell.correct(word);
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
