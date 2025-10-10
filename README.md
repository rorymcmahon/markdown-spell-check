# Markdown Spell Check

A lightweight, local spell checker for Markdown files in Visual Studio Code.

## Features

- ✅ **100% Local** - No internet connection required
- ✅ **Markdown Only** - Only checks `.md` files
- ✅ **Cross Platform** - Works on Windows, macOS, and Linux
- ✅ **Simple & Automatic** - Just install and it works
- ✅ **Quick Fixes** - Provides spelling suggestions
- ✅ **Configurable** - Enable/disable as needed
- ✅ **Markdown Formatting** - Helps create well-formatted markdown files

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or install from VSIX file

## Usage

The extension automatically activates when you open a Markdown file. Misspelled words will be underlined, and you can:

- Hover to see the error
- Use `Ctrl+.` (or `Cmd+.` on macOS) to see quick fix suggestions
- Choose from spelling suggestions or add words to your dictionary

## Configuration

Access settings via `File > Preferences > Settings` and search for "Markdown Spell Check":

**Spell Checking:**
- `markdownSpellCheck.enabled`: Enable/disable spell checking (default: true)
- `markdownSpellCheck.language`: Dictionary language (default: en-AU, options: en-AU, en-US, en-GB)

**Markdown Formatting:**
- `markdownSpellCheck.formatting.enabled`: Enable/disable formatting assistance (default: true)
- `markdownSpellCheck.formatting.blankLines`: Check blank lines around headings/code blocks (default: true)
- `markdownSpellCheck.formatting.trailingWhitespace`: Check for trailing whitespace (default: true)
- `markdownSpellCheck.formatting.listConsistency`: Check consistent list markers (default: true)

## Development

```bash
# Clone the repository
git clone https://github.com/rorymcmahon/markdown-spell-check.git
cd markdown-spell-check

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run in development mode
# Press F5 in VS Code to launch Extension Development Host
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
