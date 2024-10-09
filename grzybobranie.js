(async function(additionalNpcNamesToSearch) {
    'use strict';

    const discordWebhookUrl = 'https://discord.com/api/webhooks/1264983971377446943/esdrsHnwVFa0cIksNkEXcmmhc7h8Bh8m9rpCScLukUtss6j-rl_Rc0D9aAiZ1-MfWZjV';
    const maxNotifications = 1;
    const pauseDuration = 15 * 60 * 1000; // 15 minut w milisekundach
    let notificationCount = 0;

    /**
     * Sprawdza, czy upłynęło 15 minut od ostatniego powiadomienia.
     * @returns {boolean} - Zwraca `true`, jeśli można wznowić monitorowanie.
     */
    function canSendNotification() {
        const lastNotificationTime = localStorage.getItem('lastNotificationTime');
        if (!lastNotificationTime) return true;

        const currentTime = new Date().getTime();
        const elapsedTime = currentTime - parseInt(lastNotificationTime, 10);

        return elapsedTime >= pauseDuration;
    }

    /**
     * Ustawia czas ostatniego powiadomienia w `localStorage`.
     */
    function setLastNotificationTime() {
        const currentTime = new Date().getTime();
        localStorage.setItem('lastNotificationTime', currentTime.toString());
    }

    /**
     * Funkcja do zamiany sekund na minuty i sekundy.
     * @param {number} totalSeconds - Całkowita liczba sekund.
     * @returns {string} - Tekstowy opis w formacie minut i sekund.
     */
    function formatKillSeconds(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes > 0 ? `${minutes} min ` : ''}${seconds} sek`;
    }

    /**
     * Funkcja do wysyłania powiadomień na Discord z załączoną miniaturką i embedem.
     * @param {string} content - Treść wiadomości (np. wzmianka o roli i nazwie NPC).
     * @param {string} thumbnailPath - Ścieżka do pliku graficznego (np. 'bur/npc232.gif').
     * @param {string} mapName - Nazwa mapy.
     * @param {number} npcX - Koordynata X NPC.
     * @param {number} npcY - Koordynata Y NPC.
     * @param {number} [killSeconds] - Czas do zniknięcia w sekundach (opcjonalnie).
     */
    async function sendEmbedDiscordNotification(content, thumbnailPath, mapName, npcX, npcY, killSeconds) {
        try {
            const thumbnailUrl = `https://micc.garmory-cdn.cloud/obrazki/npc/${thumbnailPath}`;
            const response = await fetch(thumbnailUrl);
            if (!response.ok) {
                throw new Error(`Nie udało się pobrać miniaturki: ${response.statusText}`);
            }
            const blob = await response.blob();
            const file = new File([blob], 'thumbnail.png', { type: blob.type });

            const czasDoZnikniecia = (typeof killSeconds !== 'undefined' && killSeconds !== null)
                ? formatKillSeconds(killSeconds)
                : 'nieotwarty';

            const payload = {
                content: content,
                username: 'ᴍᴜᴄʜᴏᴍᴏʀᴇᴋ',
                avatar_url: 'https://i.ibb.co/rMZ32np/7eee97508330466783dc33f51c87980f.png',
                embeds: [{
                    color: 16776960,
                    fields: [
                        { name: '', value: `**${mapName}** (${npcX}, ${npcY})`, inline: false },
                        { name: 'Czas do zniknięcia', value: czasDoZnikniecia, inline: false }
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
            xhr.onload = function() {
                if (xhr.status === 204) {
                    console.log('Powiadomienie wysłane na Discord z miniaturką.');
                } else {
                    console.error(`Błąd podczas wysyłania powiadomienia na Discord: ${xhr.status} ${xhr.statusText}`);
                }
            };
            xhr.onerror = function() {
                console.error('Błąd podczas wysyłania powiadomienia na Discord.');
            };
            xhr.send(formData);

        } catch (error) {
            console.error('Błąd podczas wysyłania powiadomienia na Discord:', error);
        }
    }

    /**
     * Funkcja monitorująca NPC.
     */
    function displayPopup(nick, npc, map) {
        if (canSendNotification() && notificationCount < maxNotifications) {
            let npcLevel = npc.level || npc.minlevel || npc.lvl || '';
            let thumbnailPath = npc.icon ? npc.icon : 'default.gif';
            const discordMessage = `<@&1292594213564711047> **${npc.nick}(${npcLevel})**`;
            const killSeconds = npc.killSeconds !== undefined ? npc.killSeconds : null;

            sendEmbedDiscordNotification(discordMessage, thumbnailPath, map.name, npc.x, npc.y, killSeconds);
            notificationCount++;

            // Zapisz czas wysłania powiadomienia i blokuj monitorowanie na 15 minut
            setLastNotificationTime();
        }
    }

    function start() {
        window.API.addCallbackToEvent('newNpc', function(npc) {
            if (additionalNpcNamesToSearch.includes(npc.d.nick)) {
                displayPopup(window.Engine.hero.nick, npc.d, window.Engine.map.d);
            }
        });
    }

    start();
})([
    'Ogromny bulwiak pospolity',
    'Ogromny mroźlarz',
    'Ogromny szpicak ponury',
    'Ogromna dzwonkówka tarczowata',
    'Żywa skała',
    'Bard Grant',
    'Ogromna płomiennica tląca'
]);
