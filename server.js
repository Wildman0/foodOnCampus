const puppeteer = require("puppeteer");
const express = require("express");
const path = require("path");
const app = express();
const port = 3000;
const indexRoute = require("./routes/indexRoute");

const finnInnUrl = "https://www.finninn.se/lunch-meny/";
const mopUrl =
  "https://web.archive.org/web/20190404210917/http://morotenopiskan.se:80/lunch/";
const brygganUrl = "https://www.bryggancafe.se/";

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

async function init() {
  console.log("Getting menus, this may take a few moments...");
  let finnInnMenu = await getFinnInnMenu(finnInnUrl);
  let mopMenu = await getMopMenu(mopUrl);
  let brygganMenu = await getBrygganMenu(brygganUrl);
  foodObject = {
    mop: {
      dagens: mopMenu[0],
      veg: mopMenu[1],
    },
    finnInn: {
      dagens: finnInnMenu[0],
      sallad: finnInnMenu[1],
      veg: finnInnMenu[2],
    },
    bryggan: {
      dagens: brygganMenu[0],
      veg: brygganMenu[1],
    },
  };
  //console.log(foodObject);
  console.log("Menus ready to serve!");

  async function getFinnInnMenu(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    //TODO Filter out unnecessary parts of array
    let menu = await page.evaluate(() =>
      [...document.getElementsByTagName("LI")].map(
        (element) => element.innerText
      )
    );
    let date = new Date();
    let weekday = date.getDay();
    //FinnInnWeekdays are +5
    let finnInnWeekday = weekday <= 5 ? weekday + 4 : 0;
    browser.close();
    if (finnInnWeekday !== 0) {
      let splitWeekdayMenu = menu[finnInnWeekday].split("\n");
      //index 3, 6, 8 contain Dagens, Sallad, Veg
      return [splitWeekdayMenu[3], splitWeekdayMenu[6], splitWeekdayMenu[8]];
    } else {
      return ["-", "-", "-"];
    }
  }

  async function getMopMenu(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    let menu = await page.evaluate(() =>
      [...document.querySelectorAll(".event-info")].map(
        (element) => element.innerText
      )
    );
    let splitMenu = menu[0].split("\n");
    //Position 0 & 4 contain the daily lunches in Swedish
    return [splitMenu[0], splitMenu[4]];
  }

  async function getBrygganMenu(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    let menu = await page.evaluate(() =>
      [...document.querySelectorAll(".et_pb_text_inner")].map(
        (element) => element.innerText
      )
    );
    let splitMenu = menu[0].split("\n").slice(6);
    let date = new Date();
    let weekday = date.getDay();
    let weekdayString;
    switch (weekday) {
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
        weekdayString = ["No Lunch", "Today"];
    }
    let dayIndex = splitMenu.indexOf(weekdayString);
    return [splitMenu[dayIndex + 2], splitMenu[dayIndex + 4]];
  }
}

app.listen(
  port,
  console.log(`Server listening at http://localhost:${port}`),
  init()
);
