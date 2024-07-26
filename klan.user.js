// ==UserScript==
// @name         Enemy klan online
// @version      2.0
// @description  Pokazuje liczbę aktywnych osób w wybranych klanach
// @author       Nolifequ
// @match        https://fobos.margonem.pl/
// @grant        GM_xmlhttpRequest
// @connect      staticinfo.margonem.pl
// @connect      margonem.pl
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @downloadURL  https://raw.githubusercontent.com/Nolif1/klan/main/klan.user.js
// @updateURL    https://raw.githubusercontent.com/Nolif1/klan/main/klan.user.js
// ==/UserScript==

(function() {
    'use strict';

    const button = $('<img id="checkClan" src="https://micc.garmory-cdn.cloud/obrazki/itemy/kuf/leg_xxv_shadow.gif" alt="Open GUI">');
    button.css({
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        width: '32px',
        height: '32px',
        cursor: 'pointer'
    });
    $('body').append(button);

const guiDiv = $(`
    <div id="clanGui" style="display: none; position: fixed; top: 50px; right: 10px; z-index: 1000; background-color: white; border: 1px solid #ccc; border-radius: 5px; padding: 10px 10px 50px 10px; width: 300px;">
        <input type="text" id="clanName" placeholder="Wyświetlana nazwa własna" style="width: 100%; margin-bottom: 5px;">
        <input type="text" id="clanUrl" placeholder="URL klanu" style="width: 100%; margin-bottom: 5px;">
        <input type="number" id="clanNotifyCount" placeholder="Ilość osób, od której przyjdzie powiadomienie" style="width: 100%; margin-bottom: 5px;">
        <button id="addClan" style="width: 100%; padding: 5px; background-color: #189a21; color: white; border: none; border-radius: 5px; cursor: pointer;">dodaj</button>
        <div id="clanList" style="margin-top: 10px;"></div>
        <div id="footer" style="position: absolute; bottom: 10px; right: 10px; text-align: right; color: #666; font-size: 10px;">
            <span>dodatek stworzony przez Nolifequ</span>
            <a href="https://discordapp.com/users/442051476928593920/" target="_blank" style="margin-left: 5px;">
                <img src="https://i.imgur.com/dmGpjfi.gif" alt="Nolifequ" style="width: 16px; height: 24px; vertical-align: middle;">
            </a>
        </div>
    </div>
`);
$('body').append(guiDiv);

    $('#checkClan').on('click', function() {
        $('#clanGui').toggle();
    });

    const audio = new Audio('https://cdn.pixabay.com/audio/2024/02/19/audio_e4043ea6be.mp3');
    const notificationSent = {};

    function saveClans(clans) {
        localStorage.setItem('clans', JSON.stringify(clans));
    }

    function loadClans() {
        const clans = localStorage.getItem('clans');
        return clans ? JSON.parse(clans) : [];
    }

    function renderClans() {
        const clans = loadClans();
        const clanList = $('#clanList');
        clanList.empty();
        clans.forEach((clan, index) => {
            const box = $(`
                <div style="display: flex; align-items: center; border: 1px solid #ccc; border-radius: 5px; padding: 10px; margin-bottom: 10px;">
                    <img src="https://micc.garmory-cdn.cloud/obrazki/itemy/pap/zwoj4.gif" alt="Icon" style="margin-right: 5px;">
                    <span style="flex: 1;">${clan.name}</span>
                    <span id="onlineCount-${index}" style="margin-left: 10px; font-weight: bold;">Loading...</span>
                    <img src="https://cdn-icons-png.freepik.com/512/6861/6861329.png" alt="usuń" style="margin-left: 10px; width: 20px; height: 20px; cursor: pointer;" data-index="${index}" class="removeClan">
                </div>
            `);
            clanList.append(box);
            updateOnlineCount(clan, index);
        });
    }

    function checkClanMembers(clanUrl) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: clanUrl,
                onload: function(response) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    const members = $(doc).find('tbody tr');
                    const memberNicks = [];
                    members.each(function() {
                        const nick = $(this).find('td.nick a').text().trim();
                        memberNicks.push(nick);
                    });

                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://staticinfo.margonem.pl/online/fobos.json',
                        onload: function(response) {
                            const onlineData = JSON.parse(response.responseText);
                            if (Array.isArray(onlineData)) {
                                const onlineMembers = memberNicks.filter(nick => {
                                    return onlineData.some(online => online.n === nick);
                                });
                                resolve(onlineMembers.length);
                            } else {
                                reject('Online data structure is not as expected');
                            }
                        }
                    });
                }
            });
        });
    }

    function updateOnlineCount(clan, index) {
        checkClanMembers(clan.url).then(count => {
            const onlineCountElement = $(`#onlineCount-${index}`);
            onlineCountElement.text(`Online: ${count}`);
            if (count >= clan.notifyCount) {
                onlineCountElement.css('color', 'red');
                if (!notificationSent[clan.name]) {
                    audio.play();
                    notificationSent[clan.name] = true;
                }
            } else {
                onlineCountElement.css('color', '');
                notificationSent[clan.name] = false;
            }
        }).catch(error => {
            $(`#onlineCount-${index}`).text('Error');
        });
    }

    function startPeriodicUpdate() {
        setInterval(() => {
            const clans = loadClans();
            clans.forEach((clan, index) => {
                updateOnlineCount(clan, index);
            });
        }, 10000);
    }

    $('#addClan').on('click', function() {
        const clanName = $('#clanName').val();
        const clanUrl = $('#clanUrl').val();
        const notifyCount = parseInt($('#clanNotifyCount').val(), 10);
        if (clanName && clanUrl && !isNaN(notifyCount)) {
            const clans = loadClans();
            clans.push({ name: clanName, url: clanUrl, notifyCount: notifyCount });
            saveClans(clans);
            renderClans();
            $('#clanName').val('');
            $('#clanUrl').val('');
            $('#clanNotifyCount').val('');
        }
    });

    $(document).on('click', '.removeClan', function() {
        const index = $(this).data('index');
        let clans = loadClans();
        clans.splice(index, 1);
        saveClans(clans);
        renderClans();
    });

    renderClans();
    startPeriodicUpdate();
})();
