(function(additionalNpcNamesToSearch) {
    'use strict';

    const accessTokens = [
        'o.15n00HNr0a2cTae4bNX9B6mTh290U4eh', //Nolifequ
        'o.zPfR1mkUeCLjaChOxwC3P9CYAEUZLOjt', //Truskawkowy Cowboy
        'o.PGYWa6B0Nfntzr1plT8fnnzIASgyIqor', //Sennik
    ];

    const discordWebhookUrl = 'https://discord.com/api/webhooks/1261034228527661179/MDDL3KK8WgMe2ntSQTDpoLxSKbX6ify7QQIXecZ68VfP0ZiDdtUjaTvBYVv0qzfEzHWC';
    let notificationCount = 0;
    const maxNotifications = 1;

    function sendPushbulletNotification(title, body) {
        const url = 'https://api.pushbullet.com/v2/pushes';
        const data = {
            type: 'note',
            title: title,
            body: body,
        };

        accessTokens.forEach(token => {
            fetch(url, {
                method: 'POST',
                headers: {
                    'Access-Token': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
            })
            .catch(error => {
            });
        });
    }

    function sendDiscordNotification(content) {
        const data = {
            content: content,
            username: '📢📢📢',
            avatar_url: 'https://cdn3.emoji.gg/emojis/StardewRabbit.png',
        };

        fetch(discordWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
        })
        .catch(error => {
        });
    }

    function displayPopup(nick, npc, map) {
        if (npc.nick === 'Zabójczy Królik' && notificationCount < maxNotifications) {
            const pushbulletTitle = 'Zabójczy Królik (70lvl)';
            const pushbulletBody = `${map.name} (${npc.x}, ${npc.y})`;
            const discordMessage = `@here Zabójczy Królik (70lvl) ${map.name} (${npc.x}, ${npc.y})`;

            sendPushbulletNotification(pushbulletTitle, pushbulletBody);
            sendDiscordNotification(discordMessage);
            notificationCount++;
        }
    }

    function getCookie(name) {
        const regex = new RegExp(`(^| )${name}=([^;]+)`);
        const match = document.cookie.match(regex);
        if (match) {
            return match[2];
        }
    }

    function start() {
        if (getCookie('interface') === 'ni') {
            if (!window.Engine?.npcs?.check) {
                setTimeout(start, 1500);
                return;
            }
            window.API.addCallbackToEvent('newNpc', function(npc) {
                if (additionalNpcNamesToSearch.includes(npc.d.nick)) {
                    displayPopup(window.Engine.hero.nick, npc.d, window.Engine.map.d);
                }
            });

            document.getElementsByClassName('bottom-panel-pointer-bg')[0].appendChild(discordIcon);
        } else {
            const oldNewNpc = window.newNpc;
            window.newNpc = function(npcs) {
                oldNewNpc(npcs);
                for (const npc of npcs) {
                    if (additionalNpcNamesToSearch.includes(npc.nick)) {
                        displayPopup(window.hero.nick, npc, window.map);
                    }
                }
            };
            document.getElementById('config').appendChild(discordIcon);
        }
    }

    start();
})([
    'Zabójczy Królik'
]);
