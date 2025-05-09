const { default: mongoose } = require("mongoose");
const mongo = require("mongoose");

const Answers = new mongoose.Schema({
    id : String,
    selected_answer : String
});

const Response = new mongoose.Schema({
    quiz_id : String,
    answers : [Answers]
});

module.exports = Response;