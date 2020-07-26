const puppeteer = require("puppeteer");
const express = require("express");
const path = require("path");
const app = express();
const port = 3000;
const indexRoute = require("./routes/indexRoute");

const finnInnUrl = "https://www.finninn.se/lunch-meny/";
const mopUrl =
  "https://morotenopiskan.se/lunch/";
const brygganUrl = "https://www.bryggancafe.se/";
const hojdpunktenUrl = "http://restauranghojdpunkten.se/meny";
const edisonUrl = "http://restaurangedison.se/lunch";

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//Pass json to template
app.use(
  "/home",
  function (req, res, next) {
    req.foodObject = foodObject;
    next();
  },
  indexRoute
);

let foodObject = {};
const noLunchArray = ["-", "-"];

async function init() {
  console.log("Getting menus, this may take a few moments...");
  const date = new Date();
  const day = date.getDay();
  const browser = await puppeteer.launch();
  let finnInnMenu = await getFinnInnMenu();
  let mopMenu = await getMopMenu();
  let brygganMenu = await getBrygganMenu();
  let hojdpunktenMenu = await getHojdpunktenMenu();
  let edisonMenu = await getEdisonMenu();
  await browser.close();
  foodObject = {
    mop: {
      dagens: mopMenu[0],
      veg: mopMenu[1],
    },
    finnInn: {
      dagens: finnInnMenu[0],
      veg: finnInnMenu[1],
    },
    bryggan: {
      dagens: brygganMenu[0],
      veg: brygganMenu[1],
    },
    hojdpunkten: {
      dagens: hojdpunktenMenu[0],
      dagens2: hojdpunktenMenu[1],
    },
    edisonMenu: {
      dagens: edisonMenu[1],
      veg: edisonMenu[0],
    },
  };
  console.log("Menus ready to serve!");

  async function getFinnInnMenu() {
    const page = await browser.newPage();
    await page.goto(finnInnUrl);
    //TODO Filter out unnecessary parts of array
    let menu = await page.evaluate(() =>
      [...document.getElementsByTagName("LI")].map(
        (element) => element.innerText
      )
    );
    if (day === 0) {
      return ["-", "-", "-"];
    }
    //FinnInnWeekdays are +4
    let finnInnWeekday = day <= 5 ? day + 4 : 0;
    let splitWeekdayMenu = menu[finnInnWeekday].split("\n");
    //index 3, 6, 8 contain Dagens, Sallad, Veg
    return [splitWeekdayMenu[3], splitWeekdayMenu[8]];
  }

  async function getMopMenu() {
    const page = await browser.newPage();
    await page.goto(mopUrl);
    let menu = await page.evaluate(() =>
      [...document.querySelectorAll(".event-info")].map(
        (element) => element.innerText
      )
    );
    let splitMenu = menu[0].split("\n");
    //Position 0 & 4 contain the daily lunches in Swedish
    return [splitMenu[0], splitMenu[4]];
  }

  async function getBrygganMenu() {
    const page = await browser.newPage();
    await page.goto(brygganUrl);
    let menu = await page.evaluate(() =>
      [...document.querySelectorAll(".et_pb_text_inner")].map(
        (element) => element.innerText
      )
    );
    let splitMenu = menu[0].split("\n").slice(6);
    let weekdayString;
    switch (day) {
      case 1:
        weekdayString = "Måndag:";
        break;
      case 2:
        weekdayString = "Tisdag:";
        break;
      case 3:
        weekdayString = "Onsdag:";
        break;
      case 4:
        weekdayString = "Torsdag:";
        break;
      case 5:
        weekdayString = "Fredag:";
        break;
      default:
        return noLunchArray;
    }
    let dayIndex = splitMenu.indexOf(weekdayString);
    return [splitMenu[dayIndex + 2], splitMenu[dayIndex + 4]];
  }
  async function getHojdpunktenMenu() {
    const page = await browser.newPage();
    await page.goto(hojdpunktenUrl);
    let menu = await page.evaluate(() =>
      [...document.querySelectorAll(".bk-content-text")].map(
        (element) => element.innerText
      )
    );
    let cleanedMenu = menu[1].split("\n").filter((element) => element !== "");
    let dayIndex = cleanedMenu.indexOf(cleanedMenu.filter(element => element.includes(27))[0]);
      return [
        cleanedMenu[dayIndex + 1].substring(3),
        cleanedMenu[dayIndex + 2].substring(3).includes('2.') ? cleanedMenu[dayIndex + 2].substring(3) : "-",
      ];
  }
  async function getEdisonMenu() {
    const page = await browser.newPage();
    await page.goto(edisonUrl);
    let menu = await page.evaluate(() =>
      [...document.querySelectorAll(".course_description")].map(
        (element) => element.innerText
      )
    );
    let splitMenu = [];
    for (let i = 0; i < menu.length; i++) {
      splitMenu.push(menu[i].split(/\r?\n/).shift());
    }
    let indexDate;
    switch (day) {
      case 1:
        indexDate = 0;
        break;
      case 2:
        indexDate = 3;
        break;
      case 3:
        indexDate = 6;
        break;
      case 4:
        indexDate = 9;
        break;
      case 5:
        indexDate = 12;
        break;
      default:
        return noLunchArray;
    }
    return [splitMenu[indexDate], splitMenu[indexDate + 1]];
  }
}

app.listen(
  port,
  "0.0.0.0",
  console.log(`Server listening at: http://192.168.1.59:3000/home`),
  init()
);
