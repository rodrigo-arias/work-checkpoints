# Work Checkpoints

A [Raycast](https://raycast.com) extension for logging work checkpoints throughout the day. Designed as part of a personal AI-powered time tracking system — Claude Desktop reads the checkpoints and generates daily timesheets automatically.

## How it fits together
```
┌─────────────────────┐
│  Raycast Extension  │  ← you log checkpoints here
│  (this repo)        │
└────────┬────────────┘
         │ writes
         ▼
   checkpoints.json     ← flat file, local only
         │
         │ reads
         ▼
┌─────────────────────┐
│   MCP Server        │  ← timesheet-data-mcp
│   (Claude Desktop)  │
└────────┬────────────┘
         │ exposes tools to
         ▼
   Claude Desktop       ← generates timesheet from checkpoints
```

The extension writes to a local JSON file. The [MCP server](https://github.com/rodrigo-arias/timesheet-data-mcp) exposes that data to Claude Desktop via the Model Context Protocol, where Claude can query checkpoints and produce structured time reports.

## Features

- Log checkpoints directly from the Raycast search bar
- View and edit today's checkpoints at a glance
- Browse the full current week grouped by day (Today, Yesterday, Monday…)
- Syncs checkpoints to a JSON file for external tools to read
- Keyboard shortcuts for fast editing and management

## Commands

### Add Checkpoint

Type what you're working on directly in the search bar and hit Enter. Today's checkpoints are shown below for context.

### List Checkpoints

View the current week's checkpoints grouped by day. Edit, copy, or delete entries.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` | Save checkpoint |
| `Cmd` + `E` | Edit checkpoint |
| `Cmd` + `C` | Copy description |
| `Cmd` + `Shift` + `C` | Copy JSON file path |
| `Cmd` + `Shift` + `Backspace` | Delete checkpoint |

## Storage

Checkpoints are stored in two places:

- **Raycast LocalStorage** — primary store, used by the extension UI
- **`checkpoints.json`** — synced on every write, lives in the extension's support directory; this is what the MCP server reads

The JSON file path is available via the `Copy JSON File Path` action in the List Checkpoints command.

## Related

- [timesheet-data-mcp](https://github.com/rodrigo-arias/timesheet-data-mcp) — MCP server that exposes checkpoints to Claude Desktop