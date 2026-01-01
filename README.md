# .env Manager

Do you use `.env` files to manage your environment variables in your local dev environment? Use this extension to quickly add values to `.env` file and automatically sync them to `.env.example` files for your team. Checkout the quick demo of its working below.

![demo](https://raw.githubusercontent.com/onlyutkarsh/vscode-dot-envmanager/refs/heads/main/marketplace/demo.gif)

## Features

### 🚀 Quick Add to .env
Quickly add environment variables to your `.env` file with a simple command or context menu.

### 🔄 Auto-Sync to Example Files (New!)
Automatically keep your `.env.example`, `.env.sample`, and template files in sync with your actual `.env` files:
- **Variable names are copied**, values replaced with placeholders
- **Comments and structure preserved** from source files
- **Wildcard support** for multiple environments (`.env.*` → `.env.*.example`)
- **Customizable placeholders** (default: `<your-value-here>`)

**Quick Start:**
```json
{
  "envmanager.syncMappings": {
    ".env": [".env.example"],
    ".env.*": [".env.*.example"]
  }
}
```

This will automatically sync:
- `.env` → `.env.example`
- `.env.production` → `.env.production.example`
- `.env.staging` → `.env.staging.example`
- Any `.env.*` file to its corresponding example file

## Usage

### Adding Variables

The extension exposes a command called `.env Manager: Add to .env`. The command is available in VS Code "Command Palette" which you can also access using shortcut <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> on Mac.

![command palette](https://raw.githubusercontent.com/onlyutkarsh/vscode-dot-envmanager/refs/heads/main/marketplace/command-palette.jpg)

Alternatively you can also right click on any active editor and select `.env Manager: Add to .env` from the context menu.

### Syncing to Example Files

**Automatic sync** (when configured):
- Happens automatically when you save any `.env` file
- Triggered when you add a variable using the "Add to .env" command

**Manual sync:**
- Open Command Palette
- Run: `.env Manager: Sync to Example Files`
- Select the `.env` file to sync

If the folder does not contain `.env` file at the root, the extension attempts to create it before adding the line.

## Configuration

### Sync Mappings
Define which example files should be synced from which source files:

```json
{
  // Recommended: Simple wildcard pattern
  "envmanager.syncMappings": {
    ".env": [".env.example"],
    ".env.*": [".env.*.example"]
  },

  // Optional: Customize placeholder (default: "<your-value-here>")
  "envmanager.exampleFilePlaceholder": "<your-value-here>"
}
```

**Advanced configuration:**
```json
{
  "envmanager.syncMappings": {
    // Sync .env to multiple example files
    ".env": [".env.example", ".env.sample"],

    // Environment-specific mappings
    ".env.production": [".env.production.example"],

    // Wildcard for all other .env.* files
    ".env.*": [".env.*.example"]
  }
}
```

**To disable sync:** Remove mappings or set to `{}`

### Example Sync Behavior

**Before sync:**
```env
# .env
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=super-secret-key
```

**After sync:**
```env
# .env.example
DATABASE_URL=<your-value-here>
API_KEY=<your-value-here>
```

> **Important Notes:**
> 1. Make sure you backup your .env file if you have very important secrets in the .env file.
> 2. Never commit your .env file in to source control.
> 3. Sync is one-way: from `.env` to example files only.

## Reporting issues

The extension pushes the logs in to its own Output channel called, `.env Manager`. If you encounter any issues, raise the issue in GitHub repo and paste the contents of Output channel for analysis and easy troubleshooting.

![log window](https://raw.githubusercontent.com/onlyutkarsh/vscode-dot-envmanager/refs/heads/main/marketplace/logwindow.jpg)

