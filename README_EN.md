🕵️‍♂️ What does this tool do?
This userscript systematically scans Instagram Stories for hidden @mentions — that is, users tagged in a story without obvious visibility (e.g., via transparent or very small tags).
It extracts these accounts and saves them collectively in a locally downloadable HTML file.

✨ Main Features
🔍 Detects hidden mentions in Instagram Stories
🖱️ Automates navigation through relevant story elements and dialogs
📄 Exports a formatted HTML file with clickable links to profiles
💡 Easy-to-use button integrated directly into the Instagram interface

🚀 How to use
Install Tampermonkey for your browser.
Add this script.
Open any Instagram Story (https://www.instagram.com/stories/*).
Click the displayed button: ⬇️ Export Mentions
If the button doesn’t appear, reload the page.
The tool automatically scans all interactions and lists all found accounts.
You will receive an HTML file with the results.

🧠 Technical overview
The script identifies potential mention buttons based on their position, size, and content.
It opens all suspicious dialogs in the story UI one by one.
Extracts Instagram profile links from these dialogs.
Generates a dark-mode styled HTML document.
Automatically downloads the file as: mentioned_accounts.html

📌 Usage note
This tool is intended for analytical and personal use, e.g., uncovering hidden mentions in stories. Please respect Instagram’s terms of service, especially regarding public or automated usage.

🧪 Compatibility
✅ Desktop browsers (Chrome, Firefox, Edge) with Tampermonkey installed
