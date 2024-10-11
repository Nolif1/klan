// ==UserScript==
// @name         ꜱʜʀᴏᴏᴍꜱᴘᴏᴛᴛᴇʀ
// @namespace    http://tampermonkey.net/
// @version      10.0
// @description  Informuje o pojawieniu się grzybów na Discordzie
// @author       Nolifequ
// @icon         https://i.ibb.co/NrsXPQs/grzyb20-out-la.png
// @match        https://fobos.margonem.pl/
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Nolif1/klan/main/grzybobranie.user.js
// @downloadURL  https://raw.githubusercontent.com/Nolif1/klan/main/grzybobranie.user.js
// ==/UserScript==

vv(function() {
    'use strict';

    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://raw.githubusercontent.com/Nolif1/klan/main/grzybobranie.js',
        onload: function(response) {
            const script = document.createElement('script');
            script.textContent = response.responseText;
            document.head.appendChild(script);
            console.log('Skrypt grzybobranie.js został załadowany i wykonany.');
        },
        onerror: function() {
            console.error('Błąd podczas ładowania skryptu grzybobranie.js');
        }
    });
})();
