/**
 * This module defines functionality related to managing command history
 * in a cache file stored in the user's home directory.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

export interface HistoryItem {
    command: string;
    count: number;
}

// Define the path for the history file
const historyFilePath = path.join(os.homedir(), '.vscode-shell-filter-history');

// Function to load the command history from a file
function loadHistory(): HistoryItem[] {
    if (fs.existsSync(historyFilePath)) {
        try {
            const historyData = fs.readFileSync(historyFilePath, 'utf8');
            return JSON.parse(historyData);  // Parse JSON to get the history as an array of objects
        } catch (err) {
            console.error('Error reading history file:', err);
        }
    }
    return [];
}

// Function to save the top 100 commands by usage count
function saveHistory(history: HistoryItem[]) {
    // Sort by usage count in descending order
    history.sort((a, b) => b.count - a.count);

    // Keep only the top 100 commands
    const topHistory = history.slice(0, 100);

    try {
        fs.writeFileSync(historyFilePath, JSON.stringify(topHistory, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving history to file:', err);
    }
}

// Function to update the usage count of a command
function updateCommandHistory(commandHistory: HistoryItem[], newCommand: string) {
    // Find the command in history
    const existingCommand = commandHistory.find(cmd => cmd.command === newCommand);

    if (existingCommand) {
        // If the command exists, increment its count
        existingCommand.count++;
    } else {
        // Otherwise, add the new command with a count of 1
        commandHistory.push({ command: newCommand, count: 1 });
    }
}

module.exports = {
    loadHistory,
    saveHistory,
    updateCommandHistory
};
