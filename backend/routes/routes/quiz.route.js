const express = require("express");
const {createquiz, deletequiz, getquiz, updatequiz} = require("../controllers/quiz.controller.js");

const router = express.Router();


//create a user
router.post("/", createquiz);

//get a user
router.get('/', getquiz);

//update a user
router.put('/:id',updatequiz );

//delete a user
router.delete('/:id',deletequiz );


module.exports = router;