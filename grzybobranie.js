(function(additionalNpcNamesToSearch) {
    'use strict';

    const discordWebhookUrl = 'https://discord.com/api/webhooks/1292809249558233200/a3EGRHxAxTRG22DffByujtNwgPK9t_BLJqsuYrPln146lHPre-hbJV9ZxdZ0Te0rWUfo';
    let currentNpc = null;
    let currentMap = null;
    let currentKillTime = null;
    let intervalId = null;
    const roleMention = '<@&1292782417169350678>'; // Oznaczenie rangi

    function createDraggablePopup() {
        const popup = document.createElement('div');
        const savedTop = localStorage.getItem('popupTop') || '50px';
        const savedLeft = localStorage.getItem('popupLeft') || '50px';

        popup.style.position = 'fixed';
        popup.style.top = savedTop;
        popup.style.left = savedLeft;
        popup.style.backgroundColor = 'rgba(255, 255, 255, 0.40)';
        popup.style.border = '1px solid #333';
        popup.style.borderRadius = '8px';
        popup.style.padding = '10px 15px';
        popup.style.width = '230px';
        popup.style.boxShadow = '0px 4px 12px rgba(0, 0, 0, 0.3)';
        popup.style.zIndex = '10000';
        popup.style.cursor = 'move';
        popup.style.fontFamily = 'Segoe UI, Arial, sans-serif';
        popup.style.fontSize = '12px';
        popup.style.lineHeight = '1.5';

        popup.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong></strong> <strong><span id="npcName">Brak</span><br></strong>
                    <strong>Mapa:</strong> <span id="mapName">Nieznana</span><br>
                    <strong>Zniknie za:</strong> <span id="killTime">Nieznany</span>
                </div>
                <img id="sendToDiscordIcon" src="https://i.imgur.com/9FayxcR.png" title="Wyślij na Discord" style="width: 24px; height: 24px; cursor: pointer; margin-left: 10px;">
            </div>`;

        document.body.appendChild(popup);

        let isDragging = false;
        let offsetX, offsetY;

        popup.addEventListener('mousedown', function (e) {
            isDragging = true;
            offsetX = e.clientX - popup.offsetLeft;
            offsetY = e.clientY - popup.offsetTop;
        });

        document.addEventListener('mousemove', function (e) {
            if (isDragging) {
                const newLeft = `${e.clientX - offsetX}px`;
                const newTop = `${e.clientY - offsetY}px`;
                popup.style.left = newLeft;
                popup.style.top = newTop;

                localStorage.setItem('popupTop', newTop);
                localStorage.setItem('popupLeft', newLeft);
            }
        });

        document.addEventListener('mouseup', function () {
            isDragging = false;
        });

        document.getElementById('sendToDiscordIcon').addEventListener('click', function () {
            if (currentNpc && currentMap) {
                const actualKillTime = calculateRemainingTime();
                const unixTimeToKill = Math.floor(Date.now() / 1000) + actualKillTime;
                const npcLevel = currentNpc.level || currentNpc.minlevel || currentNpc.lvl || 'brak';

                sendEmbedDiscordNotification(
                    `${roleMention} **${currentNpc.nick} (${npcLevel})**`,
                    currentNpc.icon,
                    currentMap.name,
                    currentNpc.x,
                    currentNpc.y,
                    actualKillTime,
                    unixTimeToKill
                );
            } else {
                alert('Brak danych do wysłania.');
            }
        });
    }

    function displayPopup(npc, map) {
        currentNpc = npc;
        currentMap = map;
        currentKillTime = npc.killSeconds;

        updatePopup(npc.nick, map.name, npc.killSeconds);

        localStorage.setItem('npcName', npc.nick);
        localStorage.setItem('mapName', map.name);
        localStorage.setItem('npcIcon', npc.icon);
        localStorage.setItem('npcX', npc.x);
        localStorage.setItem('npcY', npc.y);
        localStorage.setItem('npcKillTime', npc.killSeconds);
    }

    function updatePopup(npcName, mapName, killSeconds) {
        document.getElementById('npcName').innerText = npcName || 'Brak';
        document.getElementById('mapName').innerText = mapName || 'Nieznana';
        if (killSeconds && killSeconds > 0) {
            startKillTimeCountdown(killSeconds);
        } else {
            document.getElementById('killTime').innerText = 'Nieznany';
        }
    }

    function startKillTimeCountdown(killSeconds) {
        if (intervalId) {
            clearInterval(intervalId);
        }

        localStorage.setItem('killSeconds', killSeconds);
        localStorage.setItem('lastUpdateTime', new Date().getTime());

        intervalId = setInterval(function () {
            const remainingTime = calculateRemainingTime();
            if (remainingTime <= 0) {
                clearInterval(intervalId);
                document.getElementById('killTime').innerText = 'Nieznany';
                resetNpcData();
            } else {
                document.getElementById('killTime').innerText = formatKillSeconds(remainingTime);
            }
        }, 1000);
    }

    function calculateRemainingTime() {
        const lastUpdateTime = localStorage.getItem('lastUpdateTime');
        if (lastUpdateTime && currentKillTime) {
            const elapsedTime = Math.floor((new Date().getTime() - lastUpdateTime) / 1000);
            return currentKillTime - elapsedTime;
        }
        return currentKillTime;
    }

    function formatKillSeconds(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes > 0 ? `${minutes} min ` : ''}${seconds < 10 ? '0' : ''}${seconds} sek`;
    }

    function resetNpcData() {
        currentNpc = null;
        currentMap = null;
        currentKillTime = null;
        document.getElementById('npcName').innerText = 'Brak';
        document.getElementById('mapName').innerText = 'Nieznana';
    }

    async function sendEmbedDiscordNotification(content, thumbnailPath, mapName, npcX, npcY, killSeconds, unixTimeToKill) {
        try {
            const thumbnailUrl = thumbnailPath.startsWith('http') ? thumbnailPath : `https://micc.garmory-cdn.cloud/obrazki/npc/${thumbnailPath}`;
            const response = await fetch(thumbnailUrl);
            if (!response.ok) throw new Error(`Nie udało się pobrać miniaturki: ${response.statusText}`);
            const blob = await response.blob();
            const file = new File([blob], 'thumbnail.png', { type: blob.type });

            const payload = {
                content: content,
                username: 'ꜱʜʀᴏᴏᴍꜱᴘᴏᴛᴛᴇʀ 9.0',
                avatar_url: 'https://i.ibb.co/NrsXPQs/grzyb20-out-la.png',
                embeds: [{
                    color: 16776960,
                    fields: [
                        { name: 'Lokalizacja', value: `**${mapName}** (${npcX}, ${npcY})`, inline: false },
                        { name: 'Czas do zniknięcia', value: `<t:${unixTimeToKill}:R>`, inline: false }
                    ],
                    footer: { text: 'ᴀᴜᴛᴏʀ ɴᴏʟɪꜰᴇǫᴜ' },
                    timestamp: new Date().toISOString()
                }]
            };

            if (thumbnailPath) {
                payload.embeds[0].thumbnail = { url: 'attachment://thumbnail.png' };
            }

            const formData = new FormData();
            formData.append('payload_json', JSON.stringify(payload));
            if (thumbnailPath) {
                formData.append('files[0]', file);
            }

            const xhr = new XMLHttpRequest();
            xhr.open('POST', discordWebhookUrl, true);
            xhr.onload = function () {
                if (xhr.status === 204) {
                    console.log('Powiadomienie wysłane na Discord z miniaturką.');
                } else {
                    console.error(`Błąd podczas wysyłania powiadomienia na Discord: ${xhr.status} ${xhr.statusText}`);
                }
            };
            xhr.onerror = function () {
                console.error('Błąd podczas wysyłania powiadomienia na Discord.');
            };
            xhr.send(formData);

        } catch (error) {
            console.error('Błąd podczas wysyłania powiadomienia na Discord:', error);
        }
    }

    function startMonitoring() {
        if (typeof window.newNpc === 'function') {
            const originalNewNpc = window.newNpc;
            window.newNpc = function (npcs) {
                originalNewNpc(npcs);
                for (const npc of npcs) {
                    if (additionalNpcNamesToSearch.includes(npc.nick)) {
                        displayPopup(npc, window.map);
                    }
                }
            };
        }

        if (window.Engine && window.Engine.npcs && window.Engine.npcs.check) {
            window.API.addCallbackToEvent('newNpc', function (npc) {
                if (additionalNpcNamesToSearch.includes(npc.d.nick)) {
                    displayPopup(npc.d, window.Engine.map.d);
                }
            });
        }
    }

    function start() {
        createDraggablePopup();
        loadSavedData();
        startMonitoring();
    }

    function loadSavedData() {
        const savedNpcName = localStorage.getItem('npcName');
        const savedMapName = localStorage.getItem('mapName');
        const savedNpcIcon = localStorage.getItem('npcIcon');
        const savedNpcX = localStorage.getItem('npcX');
        const savedNpcY = localStorage.getItem('npcY');
        const savedKillSeconds = localStorage.getItem('npcKillTime');
        const lastUpdateTime = localStorage.getItem('lastUpdateTime');

        if (savedNpcName && savedMapName && savedKillSeconds && lastUpdateTime) {
            const elapsedTime = Math.floor((new Date().getTime() - lastUpdateTime) / 1000);
            let remainingTime = savedKillSeconds - elapsedTime;

            if (remainingTime > 0) {
                currentNpc = {
                    nick: savedNpcName,
                    icon: savedNpcIcon,
                    x: savedNpcX,
                    y: savedNpcY
                };
                currentMap = {
                    name: savedMapName
                };
                currentKillTime = remainingTime;

                updatePopup(savedNpcName, savedMapName, remainingTime);
                startKillTimeCountdown(remainingTime);
            }
        }
    }

    start();

})([
    'Ogromny bulwiak pospolity',
    'Ogromny mroźlarz',
    'Ogromny szpicak ponury',
    'Ogromna dzwonkówka tarczowata',
    'Ogromna płomiennica tląca'
]);
