// ==UserScript==
// @name         ꜱʜʀᴏᴏᴍꜱᴘᴏᴛᴛᴇʀ
// @namespace    http://tampermonkey.net/
// @version      10.0
// @description  Informuje o pojawieniu się grzybów na Discordzie
// @author       Nolifequ
// @icon         https://i.ibb.co/NrsXPQs/grzyb20-out-la.png
// @match        https://fobos.margonem.pl/
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/Nolif1/klan/main/grzybobranie.user.js
// @downloadURL  https://raw.githubusercontent.com/Nolif1/klan/main/grzybobranie.user.js
// ==/UserScript==

(function() {
    'use strict';

    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://raw.githubusercontent.com/Nolif1/klan/main/grzybobranie.js?cache_buster=' + new Date().getTime(),
        onload: function(response) {
            if (response.status === 200) {
                var script = document.createElement('script');
                script.textContent = response.responseText;
                document.head.appendChild(script);
            } else {
                console.error('Nie udało się załadować skryptu:', response.statusText);
            }
        },
        onerror: function(err) {
            console.error('Błąd podczas próby załadowania skryptu:', err);
        }
    });
})();
