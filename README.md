# .env Manager

Do you use `.env` files to manage your environment variables in your local dev environment? Use this extension to quickly add values to `.env` file, either selecting a text or running the command. Checkout the quick demo of its working below.

![demo](images/marketplace/demo.gif)

## Usage

The extension exposes a command called `.env Manager: Add to .env`. The command is available in VS Code "Command Palette" which you can also access using shortcut <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> on Mac.

![command palette](images/marketplace/command-palette.jpg)

Alternatively you can also right click on any active editor and select `.env Manager: Add to .env` from the context menu.

If the folder does not contain `.env` file at the root, the extension attempts to create it before adding the line.

> Please see: 
> 1. Make sure you backup your .env file if you have very important secrets in the .env file.
> 2. Never commit your .env file in to source control.

## Reporting issues

The extension pushes the logs in to its own Output channel called, `.env Manager`. If you encounter any issues, raise the issue in GitHub repo and paste the contents of Output channel for analysis and easy troubleshooting.

![log window](images/marketplace/logwindow.jpg)

## Social

[![Twitter](https://img.shields.io/badge/Twitter-%231DA1F2.svg?style=for-the-badge&logo=Twitter&logoColor=white)](https://twitter.com/onlyutkarsh) [![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com/onlyutkarsh)
