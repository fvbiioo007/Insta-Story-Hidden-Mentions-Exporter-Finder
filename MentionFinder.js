// ==UserScript==
// @name         Insta Story Mentions Exporter - HTML Download
// @namespace    http://tampermonkey.net/
// @version      1.13
// @description  Exportiere ALLE markierten Accounts aus Instagram-Stories als HTML-Datei
// @match        https://www.instagram.com/stories/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const BASE_URL = "https://www.instagram.com/";

    const waitForStory = setInterval(() => {
        if (document.querySelectorAll('div[role="button"]').length > 0) {
            clearInterval(waitForStory);
            addFindButton();
        }
    }, 500);

    function addFindButton() {
        if (document.getElementById('findMentionsBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'findMentionsBtn';
        btn.textContent = '⬇️ Markierungen exportieren';
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
                if (Date.now() - start > timeout) return reject("❌ Timeout beim Öffnen des Dialogs");
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
        console.log("Gefundene Buttons zum Durchgehen:", filtered.length);

        for (let i = 0; i < filtered.length; i++) {
            const btn = filtered[i];
            console.log(`Klicke Button ${i + 1} von ${filtered.length}`);

            const oldDialog = document.querySelector('[role="dialog"]');
            if (oldDialog) {
                console.log("🧹 Entferne altes Dialog-Element vor neuem Klick");
                oldDialog.remove();
                await new Promise(res => setTimeout(res, 200));
            }

            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

            try {
                const dialog = await waitForDialog(2000);
                console.log("Dialog geöffnet");

                const links = dialog.querySelectorAll('a[href^="/"]');
                console.log("Gefundene Links im Dialog:", links.length);

                links.forEach(link => {
                    const href = link.getAttribute('href');
                    console.log("➡️ Gefundener Link-href:", href);
                    if (/^\/[^\/]+\/$/.test(href)) {
                        const full = BASE_URL + href.replace(/\//g, '') + "/";
                        if (!mentions.has(full)) {
                            mentions.add(full);
                            console.log("✅ Hinzugefügt:", full);
                        } else {
                            console.log("⚠️ Bereits enthalten:", full);
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
                console.log("Dialog geschlossen");
                await new Promise(res => setTimeout(res, 150));

            } catch (err) {
                console.warn("❌ Fehler beim Öffnen/Verarbeiten des Dialogs:", err);
            }
        }

        if (mentions.size === 0) {
            alert("Keine Markierungen gefunden.");
        } else {
            downloadAsHTML([...mentions]);
        }
    }

function downloadAsHTML(links) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Markierte Instagram-Accounts</title>
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
<h2>Gefundene markierte Accounts (${links.length}):</h2>
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
    a.download = 'markierte_accounts.html';
    a.click();

    URL.revokeObjectURL(url);
    alert("✅ HTML-Datei wurde gespeichert!");
}


})();
