// ==UserScript==
// @name         Get Calendar Rewards
// @version      2.0
// @description  Odbieranie kalendarza eventowego NI|SI
// @author       Nolifequ
// @match        http*://*.margonem.pl/
// @match        http*://*.margonem.com/
// @exclude      http*://margonem.*/*
// @exclude      http*://www.margonem.*/*
// @icon         https://i.ibb.co/J3VjzTL/calendar.png
// @exclude      http*://new.margonem.*/*
// @exclude      http*://forum.margonem.*/*
// @exclude      http*://commons.margonem.*/*
// @exclude      http*://dev-commons.margonem.*/*
// @downloadURL  https://raw.githubusercontent.com/Nolif1/klan/main/klan.user.js
// @updateURL    https://raw.githubusercontent.com/Nolif1/klan/main/klan.user.js
// @grant        none
// ==/UserScript==
(() => {
  const whData = {
    url: "https://discord.com/api/webhooks/1313644935697793034/_v_LxPsHYSgTSClLTADt9yVn41s70H9c24Avf_b3lYaaR05j9DrMHYzhPqwkE4TEFTw-" // url do webhooka na Discordzie
    // Jeśli nie chcesz wysyłać niczego, zostaw to puste
  };

  const Engine = new class Engine {
    constructor() {
      this.interface = document.cookie.match(/interface=(\w+)/)?.[1];
    }
    get hero() {
      return this.interface === "si" ? window.hero : window.Engine.hero.d;
    }
    get allInit() {
      return this.interface === "si" ? window.g?.init === 5 : window.Engine?.allInit;
    }
    get rewardsCalendar() {
      return this.interface === "si" ? window.g.rewardsCalendar : window.Engine.rewardsCalendar;
    }
    closeCalendar() {
      return this.interface == "si" ? window.g.rewardsCalendar.close() : window.Engine.rewardsCalendar.close();
    }
    load() {
      return new Promise(resolve => {
        const wait = () => {
          if (this.allInit) resolve();
          else setTimeout(wait, 20);
        };
        wait();
      });
    }
  };

  async function openCalendar() {
    if (!Engine.rewardsCalendar) {
      await window._g("rewards_calendar&action=show");
      return new Promise(resolve => {
        const wait = () => {
          if (Engine.rewardsCalendar?.hasOwnProperty("data")) {
            resolve();
          } else setTimeout(wait, 20);
        };
        wait();
      });
    }
  }

  function saveCalendar() {
    const data = {
      data: Engine.rewardsCalendar.data,
      rewardDays: Engine.rewardsCalendar.rewardDays
    };
    const key = "calendarData";
    const value = JSON.stringify(data);
    localStorage.setItem(key, value);
  }

  async function getTodaysReward() {
    await window._g(`rewards_calendar&action=open&day_no=${getTodayIndex() + 1}`);
    return new Promise(resolve => {
      const wait = () => {
        if (Engine.rewardsCalendar !== undefined && Engine.rewardsCalendar !== false) resolve();
        else setTimeout(wait, 20);
      };
      wait();
    });
  }

  function getTodayIndex() {
    const data = JSON.parse(localStorage.getItem("calendarData"));
    const index = data.rewardDays[getDate()];
    return index;
  }

  function getDate() {
    return Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  }

  function isNewDay(heroId) {
    const key = `lastRewardDate_${heroId}`;
    const oldDate = localStorage.getItem(key);
    const currentDate = getDate();
    if (currentDate !== parseInt(oldDate)) {
      localStorage.setItem(key, currentDate);
      return true;
    }
    return false;
  }

  async function isEventOngoing() {
    let calendarData = localStorage.getItem("calendarData");
    if (calendarData) {
      calendarData = JSON.parse(calendarData);

      if (calendarData.data.end_ts > getDate()) {
        return true;
      }
    }

    await openCalendar();
    saveCalendar();
    Engine.closeCalendar();

    calendarData = JSON.parse(localStorage.getItem("calendarData"));
    if (calendarData.data.start_ts <= getDate() && getDate() < calendarData.data.end_ts) {
      return true;
    }
    return false;
  }

  function sendInfoToDc() {
    if (!whData.url) return;

    const request = new XMLHttpRequest();
    request.open("POST", whData.url);
    request.setRequestHeader("Content-type", "application/json");
    request.send(
      JSON.stringify({
        username: "Get Calendar Rewards",
        avatar_url: `https://micc.garmory-cdn.cloud/obrazki/postacie/${Engine.hero.icon}`,
        content: `Odebrałem kalendarz z postaci **${Engine.hero.nick}**`
      })
    );
  }

  async function main() {
    await Engine.load().then(async () => {
      if (await isEventOngoing()) {
        const heroId = Engine.hero.id;
        const rewardKey = `rewardTaken_${heroId}`;

        const rewardTaken = localStorage.getItem(rewardKey);

        if (isNewDay(heroId) || rewardTaken !== "true") {
          await getTodaysReward();
          Engine.closeCalendar();
          localStorage.setItem(rewardKey, "true");
          console.log(`Odebrano kalendarz z ${getTodayIndex() + 1} dnia eventu dla postaci ${Engine.hero.nick}`);
          sendInfoToDc();
        } else {
          console.log(`Nagroda już została odebrana dzisiaj dla postaci ${Engine.hero.nick}.`);
        }
      } else {
        console.log("Niestety, nie ma aktualnie żadnego eventu.");
      }
    });
  }

  main();
  console.log(`[Get Calendar Reward] Script Initiated.`);
})();
