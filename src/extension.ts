import * as vscode from 'vscode';
import { exec } from 'child_process';

// Array to hold recent shell commands in memory
let recentCommands: string[] = [];

// Function to activate the extension
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('shellfilter.runCustomShellCommand', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const text = editor.document.getText(selection);

            if (!text) {
                vscode.window.showErrorMessage('No text selected.');
                return;
            }

            // Show the Quick Pick menu for recent commands or input a new one
            const selectedCommand = await promptUserForCommand();
            
            if (!selectedCommand) {
                vscode.window.showErrorMessage('No command selected or entered.');
                return;
            }

            // Call the function to run the shell command
            try {
                const result = await runShellCommand(selectedCommand, text);
                // Replace the selected text with the result
                editor.edit(editBuilder => {
                    editBuilder.replace(selection, result);
                });

                // Store the command in recent history (avoid duplicates)
                if (!recentCommands.includes(selectedCommand)) {
                    recentCommands.unshift(selectedCommand);  // Add to the front of the list
                    if (recentCommands.length > 10) {
                        recentCommands.pop();  // Limit to the last 10 commands
                    }
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        }
    });

    context.subscriptions.push(disposable);
}

async function promptUserForCommand(): Promise<string | undefined> {
    // Check if there is history; if not, prompt for a new command immediately
    if (recentCommands.length === 0) {
        return await vscode.window.showInputBox({
            prompt: 'No history available. Enter your first shell command',
            placeHolder: 'e.g., grep -v foobar'
        });
    }

    // Define quick pick items with correct type
    const quickPickItems: vscode.QuickPickItem[] = recentCommands.map(cmd => ({
        label: cmd,
        description: ''  // Empty description if not used
    }));

    quickPickItems.push({
        label: '$(pencil) Enter a new command...',
        description: 'Type a new shell command'
    });

    const pickedItem = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Search history or type a new command',
        canPickMany: false
    });

    if (!pickedItem) {
        return undefined;  // User canceled the Quick Pick
    }

    if (pickedItem.label === '$(pencil) Enter a new command...') {
        // Open Input Box for new command entry
        return await vscode.window.showInputBox({
            prompt: 'Enter a shell command to run',
            placeHolder: 'e.g., grep -v foobar'
        });
    } else {
        // Pre-fill Input Box with the selected command for modification
        return await vscode.window.showInputBox({
            prompt: 'Modify the command before executing',
            value: pickedItem.label  // Pre-fill with the selected command from history
        });
    }
}

// Function to run the shell command and return the output
async function runShellCommand(command: string, input: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`echo "${input}" | ${command}`, (error, stdout, stderr) => {
            if (error) {
                reject(stderr.trim());
            } else {
                resolve(stdout.trim());
            }
        });
    });
}
