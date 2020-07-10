const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res) {
  let foodObject = req.foodObject;
  res.render("index", {
    title: "Food On Campus",
    mopDagens: foodObject.mop.dagens,
    mopVeg: foodObject.mop.veg,
    finnDagens: foodObject.finnInn.dagens,
    finnSallad: foodObject.finnInn.sallad,
    finnVeg: foodObject.finnInn.veg,
    brygganDagens: foodObject.bryggan.dagens,
    brygganVeg: foodObject.bryggan.veg,
  });
});

module.exports = router;
