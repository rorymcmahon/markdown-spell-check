import * as vscode from 'vscode';

export interface MarkdownIssue {
    range: vscode.Range;
    message: string;
    severity: vscode.DiagnosticSeverity;
    code: string;
    fix?: string;
}

export class MarkdownFormatter {
    
    public checkFormatting(document: vscode.TextDocument): MarkdownIssue[] {
        const config = vscode.workspace.getConfiguration('markdownSpellCheck.formatting');
        const checkBlankLines = config.get('blankLines', true);
        const checkTrailingWhitespace = config.get('trailingWhitespace', true);
        const checkListConsistency = config.get('listConsistency', true);
        
        const issues: MarkdownIssue[] = [];
        const lines = document.getText().split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
            const prevLine = i > 0 ? lines[i - 1] : '';
            
            // Check for trailing whitespace
            if (checkTrailingWhitespace && (line.endsWith(' ') || line.endsWith('\t'))) {
                issues.push({
                    range: new vscode.Range(i, line.length - line.trimEnd().length, i, line.length),
                    message: 'Remove trailing whitespace',
                    severity: vscode.DiagnosticSeverity.Information,
                    code: 'trailing-whitespace',
                    fix: line.trimEnd()
                });
            }
            
            if (checkBlankLines) {
                // Check for headings without blank lines
                if (this.isHeading(line)) {
                    if (prevLine && prevLine.trim() !== '' && !this.isHeading(prevLine)) {
                        issues.push({
                            range: new vscode.Range(i, 0, i, 0),
                            message: 'Add blank line before heading',
                            severity: vscode.DiagnosticSeverity.Information,
                            code: 'heading-blank-line-before'
                        });
                    }
                    
                    if (nextLine && nextLine.trim() !== '' && !this.isHeading(nextLine)) {
                        issues.push({
                            range: new vscode.Range(i, 0, i, 0),
                            message: 'Add blank line after heading',
                            severity: vscode.DiagnosticSeverity.Information,
                            code: 'heading-blank-line-after'
                        });
                    }
                }
                
                // Check for code blocks without blank lines
                if (this.isCodeBlockStart(line)) {
                    if (prevLine && prevLine.trim() !== '') {
                        issues.push({
                            range: new vscode.Range(i, 0, i, 0),
                            message: 'Add blank line before code block',
                            severity: vscode.DiagnosticSeverity.Information,
                            code: 'code-block-blank-line-before'
                        });
                    }
                }
                
                if (this.isCodeBlockEnd(line, lines, i)) {
                    if (nextLine && nextLine.trim() !== '') {
                        issues.push({
                            range: new vscode.Range(i, 0, i, 0),
                            message: 'Add blank line after code block',
                            severity: vscode.DiagnosticSeverity.Information,
                            code: 'code-block-blank-line-after'
                        });
                    }
                }
                
                // Check for multiple consecutive blank lines
                if (line.trim() === '' && nextLine && nextLine.trim() === '') {
                    let consecutiveBlankLines = 1;
                    for (let j = i + 1; j < lines.length && lines[j].trim() === ''; j++) {
                        consecutiveBlankLines++;
                    }
                    
                    if (consecutiveBlankLines > 1) {
                        issues.push({
                            range: new vscode.Range(i + 1, 0, i + consecutiveBlankLines, 0),
                            message: `Remove ${consecutiveBlankLines - 1} extra blank line${consecutiveBlankLines > 2 ? 's' : ''}`,
                            severity: vscode.DiagnosticSeverity.Information,
                            code: 'multiple-blank-lines'
                        });
                    }
                }
            }
            
            // Check for inconsistent list formatting
            if (checkListConsistency && this.isListItem(line)) {
                const listMarker = this.getListMarker(line);
                if (listMarker && (listMarker.includes('*') || listMarker.includes('+'))) {
                    issues.push({
                        range: new vscode.Range(i, 0, i, listMarker.length),
                        message: 'Use consistent list markers (prefer "-")',
                        severity: vscode.DiagnosticSeverity.Information,
                        code: 'inconsistent-list-marker',
                        fix: line.replace(/^(\s*)[\*\+]/, '$1-')
                    });
                }
            }
        }
        
        return issues;
    }
    
    private isHeading(line: string): boolean {
        return /^#{1,6}\s/.test(line.trim());
    }
    
    private isCodeBlockStart(line: string): boolean {
        return /^```/.test(line.trim());
    }
    
    private isCodeBlockEnd(line: string, lines: string[], currentIndex: number): boolean {
        if (!/^```\s*$/.test(line.trim())) {
            return false;
        }
        
        // Check if this is actually the end of a code block by looking backwards
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (/^```/.test(lines[i].trim())) {
                return true;
            }
        }
        return false;
    }
    
    private isListItem(line: string): boolean {
        return /^\s*[-\*\+]\s/.test(line);
    }
    
    private getListMarker(line: string): string | null {
        const match = line.match(/^(\s*[-\*\+]\s)/);
        return match ? match[1] : null;
    }
}
