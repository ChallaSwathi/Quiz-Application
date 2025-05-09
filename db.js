const { default: mongoose } = require("mongoose");
const mongo = require("mongoose");

const QuizSchema = new mongoose.Schema({
    question : String,
    options : [String],
    answer : String,
});

const userSchema = new mongoose.Schema({
    username : String,
    quizname : {
        type :String,
        unique : true
    },
    questions : [QuizSchema]
})


module.exports = userSchema;
// const Employee = mongoose.model("Employee",userSchema);

// Employee.findOneAndUpdate({name : "ruthwik"},{age : 23},{new : true}).then((res)=>{
//     console.log(res);
// });
// const emp1 = new Employee({name : "bharath", email :"bharath@gmail.com", age : 20
// });

// emp1.save();

// Employee.insertMany([
//     {
//         name:"ruthwik",email:"ruthwik@gmail.com",age:19
//     },
//     {name : "chaitu", email : "chaitanya@gmail.com", age : 22}
// ]);