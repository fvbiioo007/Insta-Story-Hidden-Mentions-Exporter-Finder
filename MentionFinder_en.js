// ==UserScript==
// @name         Insta Story Mentions Exporter - HTML Download
// @namespace    http://tampermonkey.net/
// @version      1.13
// @description  Export ALL mentioned accounts from Instagram stories as an HTML file
// @match        https://www.instagram.com/stories/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const BASE_URL = "https://www.instagram.com/";

    const waitForStory = setInterval(() => {
        if (document.querySelectorAll('div[role="button"]').length > 0) {
            clearInterval(waitForStory);
            addExportButton();
        }
    }, 500);

    function addExportButton() {
        if (document.getElementById('exportMentionsBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'exportMentionsBtn';
        btn.textContent = '⬇️ Export Mentions';
        Object.assign(btn.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: '#3897f0',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
        });

        btn.onclick = findMentions;
        document.body.appendChild(btn);
    }

    function isMentionButton(btn) {
        const rect = btn.getBoundingClientRect();
        const area = rect.width * rect.height;
        const isSuspicious = btn.closest('[aria-label], [role="dialog"], header, footer') ||
            btn.innerText.trim() ||
            btn.querySelector('svg');

        return !isSuspicious && area > 1;
    }

    function waitForDialog(timeout = 3000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const dialog = document.querySelector('[role="dialog"]');
                if (dialog) return resolve(dialog);
                if (Date.now() - start > timeout) return reject("❌ Timeout while waiting for dialog to open");
                requestAnimationFrame(check);
            };
            check();
        });
    }

    function waitForDialogClose(timeout = 3000) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                const dialog = document.querySelector('[role="dialog"]');
                if (!dialog) return resolve();
                if (Date.now() - start > timeout) return resolve();
                requestAnimationFrame(check);
            };
            check();
        });
    }

    async function findMentions() {
        const mentions = new Set();
        const allButtons = [...document.querySelectorAll('div[role="button"]')];
        const filtered = allButtons.filter(isMentionButton);
        console.log("Buttons found to process:", filtered.length);

        for (let i = 0; i < filtered.length; i++) {
            const btn = filtered[i];
            console.log(`Clicking button ${i + 1} of ${filtered.length}`);

            const oldDialog = document.querySelector('[role="dialog"]');
            if (oldDialog) {
                console.log("🧹 Removing old dialog before next click");
                oldDialog.remove();
                await new Promise(res => setTimeout(res, 200));
            }

            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

            try {
                const dialog = await waitForDialog(2000);
                console.log("Dialog opened");

                const links = dialog.querySelectorAll('a[href^="/"]');
                console.log("Links found in dialog:", links.length);

                links.forEach(link => {
                    const href = link.getAttribute('href');
                    console.log("➡️ Found link href:", href);
                    if (/^\/[^\/]+\/$/.test(href)) {
                        const full = BASE_URL + href.replace(/\//g, '') + "/";
                        if (!mentions.has(full)) {
                            mentions.add(full);
                            console.log("✅ Added:", full);
                        } else {
                            console.log("⚠️ Already exists:", full);
                        }
                    }
                });

                const videoArea = document.querySelector('section > div > div > div > div');
                if (videoArea) {
                    const rect = videoArea.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    videoArea.dispatchEvent(new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: x,
                        clientY: y
                    }));
                } else {
                    document.body.dispatchEvent(new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: window.innerWidth / 2,
                        clientY: window.innerHeight / 2
                    }));
                }

                await waitForDialogClose(50);
                console.log("Dialog closed");
                await new Promise(res => setTimeout(res, 150));

            } catch (err) {
                console.warn("❌ Error opening/processing dialog:", err);
            }
        }

        if (mentions.size === 0) {
            alert("No mentions found.");
        } else {
            downloadAsHTML([...mentions]);
        }
    }

    function downloadAsHTML(links) {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mentioned Instagram Accounts</title>
<style>
  body {
    background-color: #121212;
    color: #e0e0e0;
    font-family: Arial, sans-serif;
    padding: 20px;
  }
  a {
    color: #bb86fc;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  h2 {
    border-bottom: 1px solid #333;
    padding-bottom: 10px;
  }
  ul {
    list-style-type: none;
    padding-left: 0;
  }
  li {
    margin: 8px 0;
  }
</style>
</head>
<body>
<h2>Found Mentions (${links.length}):</h2>
<ul>
${links.map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`).join("\n")}
</ul>
</body>
</html>
        `.trim();

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'mentioned_accounts.html';
        a.click();

        URL.revokeObjectURL(url);
        alert("✅ HTML file has been saved!");
    }

})();
