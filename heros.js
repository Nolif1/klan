(function() {
    'use strict';

    const targetNpcName = "Dziwożona";
    let autoApproachEnabled = localStorage.getItem('autoApproachEnabled') === 'true';
    let autoWalkEnabled = localStorage.getItem('autoWalkEnabled') === 'true';
    let playSoundEnabled = localStorage.getItem('playSoundEnabled') === 'true';
    let discordNotifyEnabled = localStorage.getItem('discordNotifyEnabled') === 'true';
    let minInterval = parseInt(localStorage.getItem('minInterval')) || 5000;
    let maxInterval = parseInt(localStorage.getItem('maxInterval')) || 15000;
    let detectedNpc = null;
    let isApproaching = false;
    let timeoutId;
    let isWalking = false;
    let walkInterval;

    // Stworzenie obiektu Audio z publicznie dostępnym URL
    let audio = new Audio('https://cdn.freesound.org/previews/254/254819_4597795-lq.mp3');

    // Event listener odblokowujący odtwarzanie dźwięku po interakcji użytkownika
    function unlockAudioPlayback() {
        audio.play().then(() => {
            audio.pause();
            document.removeEventListener('click', unlockAudioPlayback);
            console.log('Odtwarzanie dźwięku zostało odblokowane.');
        }).catch((error) => {
            console.error('Błąd odblokowywania odtwarzania dźwięku:', error);
        });
    }

    document.addEventListener('click', unlockAudioPlayback);

    // Zaktualizowany styl CSS dla panelu
    const style = document.createElement('style');
    style.innerHTML = `
        .custom-window {
            position: fixed;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 5px;
            box-shadow: 0 0 2px #000;
            min-width: 120px;
            max-width: 200px;
            z-index: 10000;
            color: #fff;
            font-size: 13px;
            text-align: center;
            padding: 5px;
            transition: max-height 0.3s ease, padding 0.3s ease;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .custom-window.collapsed {
            max-height: 30px;
            padding: 5px;
        }
        .custom-window label {
            color: #fff;
            margin: 2px 5px;
            display: flex;
            justify-content: space-between;
            font-weight: normal;
            align-items: center;
            font-size: 11px;
        }
        .custom-window input[type="checkbox"],
        .custom-window input[type="number"] {
            margin-left: 5px;
            font-size: 11px;
            padding: 1px;
            max-width: 60px;
        }
        .panel-title {
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            user-select: none;
            margin-bottom: 5px;
        }
        .panel-content {
            position: relative;
            padding-bottom: 35px; /* Miejsce na ikonę */
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: stretch;
        }
        .panel-icon {
            position: absolute;
            bottom: 5px;
            right: 5px;
            width: 24px;
            height: 24px;
        }
        /* Ukryj zawartość, gdy panel jest zwinięty */
        .custom-window.collapsed .panel-content {
            display: none;
        }
    `;
    document.head.appendChild(style);

    // Tworzenie panelu kontrolnego
    const panel = document.createElement('div');
    panel.className = 'custom-window';
    panel.style.top = localStorage.getItem('panelTop') || '10px';
    panel.style.left = localStorage.getItem('panelLeft') || '10px';
    panel.innerHTML = `
        <div class="panel-title">Panel dodatku</div>
        <div class="panel-content">
            <label>
                <span>Dobiegnij</span>
                <input type="checkbox" id="autoApproachToggle" ${autoApproachEnabled ? 'checked' : ''}/>
            </label>
            <label>
                <span>Przechodzenie</span>
                <input type="checkbox" id="autoWalkToggle" ${autoWalkEnabled ? 'checked' : ''}/>
            </label>
            <label>
                <span>Wołanie Discord</span>
                <input type="checkbox" id="discordNotifyToggle" ${discordNotifyEnabled ? 'checked' : ''}/>
            </label>
            <label>
                <span>Alert mp3</span>
                <input type="checkbox" id="playSoundToggle" ${playSoundEnabled ? 'checked' : ''}/>
            </label>
            <label>
                <span>Min (ms):</span>
                <input type="number" id="minIntervalInput" value="${minInterval}" />
            </label>
            <label>
                <span>Max (ms):</span>
                <input type="number" id="maxIntervalInput" value="${maxInterval}" />
            </label>
            <img src="https://i.imgur.com/dmGpjfi.png" class="panel-icon">
        </div>
    `;
    document.body.appendChild(panel);

    // Obsługa zwijania i rozwijania panelu
    const panelContent = panel.querySelector('.panel-content');
    const panelTitle = panel.querySelector('.panel-title');
    let isCollapsed = localStorage.getItem('panelCollapsed') === 'true';

    if (isCollapsed) {
        panel.classList.add('collapsed');
    }

    function updatePanel() {
        if (isCollapsed) {
            panel.classList.add('collapsed');
        } else {
            panel.classList.remove('collapsed');
        }
        localStorage.setItem('panelCollapsed', isCollapsed);
    }

    // Kliknięcie na tytuł rozwija lub zwija panel
    panelTitle.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        updatePanel();
    });

    // Inicjalizacja stanu panelu
    updatePanel();

    // Obsługa przeciągania panelu
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    panelTitle.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = panel.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        panelTitle.style.cursor = 'grabbing'; // Zmiana kursora na 'grabbing'
        e.preventDefault(); // Zapobiega zaznaczaniu tekstu
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            panel.style.left = (e.clientX - offsetX) + 'px';
            panel.style.top = (e.clientY - offsetY) + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            panelTitle.style.cursor = 'grab'; // Przywrócenie kursora 'grab'
            localStorage.setItem('panelTop', panel.style.top);
            localStorage.setItem('panelLeft', panel.style.left);
        }
    });

    // Ustawienie stanu checkboxów
    document.getElementById('discordNotifyToggle').checked = discordNotifyEnabled;
    document.getElementById('playSoundToggle').checked = playSoundEnabled;

    // Obsługa checkboxów i pól tekstowych
    document.getElementById('autoApproachToggle').addEventListener('change', function() {
        autoApproachEnabled = this.checked;
        localStorage.setItem('autoApproachEnabled', autoApproachEnabled);
    });

    document.getElementById('autoWalkToggle').addEventListener('change', function() {
        autoWalkEnabled = this.checked;
        localStorage.setItem('autoWalkEnabled', autoWalkEnabled);
        if (autoWalkEnabled) {
            startAutoWalk();
        } else {
            clearTimeout(timeoutId);
            clearInterval(walkInterval);
            isWalking = false;
        }
    });

    document.getElementById('discordNotifyToggle').addEventListener('change', function() {
        discordNotifyEnabled = this.checked;
        localStorage.setItem('discordNotifyEnabled', discordNotifyEnabled);
    });

    document.getElementById('playSoundToggle').addEventListener('change', function() {
        playSoundEnabled = this.checked;
        localStorage.setItem('playSoundEnabled', playSoundEnabled);
    });

    document.getElementById('minIntervalInput').addEventListener('input', function() {
        minInterval = parseInt(this.value) || 5000;
        localStorage.setItem('minInterval', minInterval);
    });

    document.getElementById('maxIntervalInput').addEventListener('input', function() {
        maxInterval = parseInt(this.value) || 15000;
        localStorage.setItem('maxInterval', maxInterval);
    });

    // Funkcja wysyłająca powiadomienie na Discord
    function sendDiscordNotification(npcName, npcX, npcY, mapName) {
        const webhookUrl = "https://discord.com/api/webhooks/1298248196660920350/_a573B_aRtZ4TYHk-cEO7PDYdn_wFXAJksEW2SbviKKj98U7yUP1C_k2aqcp6CL9ebcA";
        const content = `@here Czekam na wpierdol: **${mapName}** (${npcX}, ${npcY})`;
        const payload = {
            content,
            username: "ꜱʟᴇᴘᴏᴛᴋᴀ",
            avatar_url: "https://i.ibb.co/9Nq3X7n/h24-h2-slepotka.gif"
        };

        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (response.ok) {
                console.log(`Wysłano powiadomienie na Discord: ${content}`);
            } else {
                console.error("Błąd wysyłania powiadomienia na Discord", response.statusText);
            }
        })
        .catch(error => console.error("Błąd wysyłania powiadomienia na Discord", error));
    }

    // Funkcja do odtwarzania dźwięku
    function playSound() {
        if (playSoundEnabled) {
            audio.currentTime = 0; // Reset do początku
            audio.play().catch(error => {
                console.error('Błąd odtwarzania dźwięku:', error);
            });
        }
    }

    // Funkcja do losowania interwału
    function getRandomInterval() {
        return Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
    }

    // Funkcja podchodzenia do współrzędnych
    function moveToCoordinates(x, y) {
        if (typeof Engine !== 'undefined' && Engine.hero && typeof Engine.hero.autoGoTo === 'function') {
            Engine.hero.autoGoTo({ x: x, y: y });
            console.log(`Próba podejścia do NPC na współrzędnych (${x}, ${y})`);
        } else if (typeof hero !== 'undefined' && typeof hero.searchPath === 'function') {
            hero.searchPath(x, y);
            console.log(`Próba podejścia do NPC na współrzędnych (${x}, ${y})`);
        } else {
            console.log("Nie udało się podejść do NPC - brak odpowiednich funkcji.");
        }
    }

    // Funkcja automatycznego przechodzenia przez mapę dla obu interfejsów
    function startAutoWalk() {
        if (autoWalkEnabled) {
            // Stary interfejs
            if (window.g && window.hero && window.g.gw) {
                function autoWalkOldInterface() {
                    if (window.g.gw[`${window.hero.x}.${window.hero.y}`]) {
                        window._g("walk");
                    }
                    timeoutId = setTimeout(autoWalkOldInterface, getRandomInterval());
                }
                autoWalkOldInterface();
            }

            // Nowy interfejs
            if (typeof Engine !== 'undefined' && typeof window._g === 'function') {
                function autoWalkNewInterface() {
                    walkInterval = setInterval(function() {
                        window._g('walk');
                        clearInterval(walkInterval); // Resetuje interwał
                        if (isWalking) {
                            walkInterval = setTimeout(autoWalkNewInterface, getRandomInterval());
                        }
                    }, getRandomInterval());
                }
                isWalking = true;
                autoWalkNewInterface();
            }
        }
    }

    // Zaktualizowana funkcja monitorująca pojawienie się NPC
    function startMonitoring() {
        if (typeof window.newNpc === 'function') {
            const originalNewNpc = window.newNpc;
            window.newNpc = function(npcs) {
                originalNewNpc(npcs);
                for (const npc of npcs) {
                    if (npc.nick === targetNpcName) {
                        // Odtwarzanie dźwięku niezależnie od autoApproachEnabled
                        if (playSoundEnabled) {
                            playSound();
                        }

                        // Wysyłanie powiadomienia na Discord
                        if (discordNotifyEnabled) {
                            sendDiscordNotification(npc.nick, npc.x, npc.y, window.map.name);
                        }

                        // Jeśli autoApproachEnabled jest włączone i postać nie podchodzi
                        if (autoApproachEnabled && !isApproaching) {
                            detectedNpc = { id: npc.id, nick: npc.nick, x: npc.x, y: npc.y, map: window.map.name };
                            console.log(`Wykryto NPC: ${targetNpcName}. Podejście nastąpi po 1 sekundzie...`);
                            isApproaching = true;

                            setTimeout(() => {
                                moveToCoordinates(npc.x, npc.y);
                                randomReapproach();
                            }, 1000);
                        }
                    }
                }
            };
        }

        if (window.Engine && window.Engine.npcs && window.Engine.npcs.check) {
            window.API.addCallbackToEvent('newNpc', function(npc) {
                if (npc.d.nick === targetNpcName) {
                    // Odtwarzanie dźwięku niezależnie od autoApproachEnabled
                    if (playSoundEnabled) {
                        playSound();
                    }

                    // Wysyłanie powiadomienia na Discord
                    if (discordNotifyEnabled) {
                        sendDiscordNotification(npc.d.nick, npc.d.x, npc.d.y, window.Engine.map.d.name);
                    }

                    // Jeśli autoApproachEnabled jest włączone i postać nie podchodzi
                    if (autoApproachEnabled && !isApproaching) {
                        detectedNpc = { id: npc.d.id, nick: npc.d.nick, x: npc.d.x, y: npc.d.y, map: window.Engine.map.d.name };
                        console.log(`Wykryto NPC: ${targetNpcName}. Podejście nastąpi po 1 sekundzie...`);
                        isApproaching = true;

                        setTimeout(() => {
                            moveToCoordinates(npc.d.x, npc.d.y);
                            randomReapproach();
                        }, 1000);
                    }
                }
            });
        }
    }

    // Funkcja sprawdzająca obecność NPC
    function checkNpcPresence(npcId, npcName, npcX, npcY) {
        // Nowy interfejs
        if (window.Engine && window.Engine.npcs) {
            if (typeof window.Engine.npcs.checkNpcPos === 'function') {
                const npcPresent = window.Engine.npcs.checkNpcPos(npcX, npcY);
                if (npcPresent) {
                    console.log(`NPC ${npcName} nadal jest na mapie na pozycji (${npcX}, ${npcY}).`);
                    return true;
                }
            } else if (typeof window.Engine.npcs.checkNpc === 'function') {
                const npcData = window.Engine.npcs.checkNpc(npcId);
                if (npcData && npcData.nick === npcName) {
                    console.log(`NPC ${npcName} nadal jest na mapie.`);
                    return true;
                }
            }
        }
        // Stary interfejs
        else if (window.g && window.g.npc) {
            console.log("Sprawdzanie obecności NPC w window.g.npc:", window.g.npc);
            return Object.values(window.g.npc).some(npc => npc.nick === npcName && npc.x === npcX && npc.y === npcY);
        }
        console.log(`NPC ${npcName} nie znaleziono na mapie`);
        return false;
    }

    // Funkcja do ponawiania podejścia do NPC
    function randomReapproach() {
        if (autoApproachEnabled && detectedNpc) {
            const randomInterval = getRandomInterval();
            console.log(`Ponowne podejście za ${randomInterval / 1000} sekund.`);
            setTimeout(() => {
                const npcStillExists = checkNpcPresence(detectedNpc.id, detectedNpc.nick, detectedNpc.x, detectedNpc.y);

                if (npcStillExists) {
                    moveToCoordinates(detectedNpc.x, detectedNpc.y);
                    randomReapproach();
                } else {
                    console.log(`NPC ${detectedNpc.nick} nie jest już obecny na mapie.`);
                    detectedNpc = null;
                    isApproaching = false;
                }
            }, randomInterval);
        }
    }

    // Przycisk testowy do sprawdzenia odtwarzania dźwięku
    const testButton = document.createElement('button');
    testButton.textContent = 'Testuj dźwięk';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = 10000;
    document.body.appendChild(testButton);

    testButton.addEventListener('click', () => {
        playSound();
    });

    // Uruchomienie monitoringu i autoWalk
    startMonitoring();
    if (autoWalkEnabled) startAutoWalk();
})();
