const express = require("express");
const app = express();
const port = 5050;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const methodoverride = require("method-override");
const mysql = require("mysql2");
const { error } = require("console");
const { default: mongoose } = require("mongoose");
const mongo = require("mongoose");
const dbs = require("./db.js");
const respns = require("./score.js");

app.use(express.urlencoded({ extended: true }));
app.use(methodoverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

let quizdb = "";
let responsedb = "";
main()
  .then((res) => {
    console.log("connection successful");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  quizdb = await mongo.createConnection("mongodb://localhost:27017/Quiz");
  responsedb = await mongo.createConnection(
    "mongodb://localhost:27017/Response"
  );
}

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "Quiz_app",
  password: "Reddy@24",
});

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/signin.ejs", (req, res) => {
  res.render("signin.ejs", { data: "" });
});

app.post("/signin", (req, res) => {
  let arr = [req.body.name, req.body.username, req.body.password];
  let q = `INSERT INTO credentials (name,username,password) VALUES(?,?,?)`;
  try {
    if (arr[0].length == 0 || arr[1].length == 0 || arr[2].length == 0) {
      res.render("signin.ejs", { data: "Please fill all the details" });
    }
    connection.query(
      "SELECT * FROM credentials WHERE username = ?",
      arr[1],
      (err, result) => {
        if (err) throw err;
        if (result.length != 0) {
          res.render("signin.ejs", { data: "Username Already Exists" });
        } else {
          connection.query(q, arr, (err, result) => {
            if (result == undefined) {
              throw new Error("username exists");
            }
            res.redirect(`/home/${req.body.username}`);
          });
        }
      }
    );
  } catch (err) {
    res.render("signin.ejs", { data: "Username Already Exists" });
  }
});

app.get("/login.ejs", (req, res) => {
  res.render("login.ejs", { data: "" });
});

app.post("/login", (req, res) => {
  let arr = [req.body.username, req.body.password];
  let q = "SELECT * FROM credentials WHERE username = ? AND password = ?";
  try {
    connection.query(q, arr, (err, result) => {
      if (err) throw err;
      if (result.length == 0 || arr[0].length == 0 || arr[1].length == 0) {
        res.render("login.ejs", { data: "Invalid Credentials" });
      } else {
        res.redirect(`/home/${arr[0]}`);
      }
    });
  } catch (error) {
    console.log(error);
  }
});

let allquizs = {};

app.get("/home/:username", (req, res) => {
  let username = req.params.username;
  res.render("home_id.ejs", { username });
});

async function getdetails(username) {
  let p = new Promise(function (res, rej) {
    let q = `SELECT * FROM credentials WHERE username = '${username}'`;
    connection.query(q, (err, result) => {
      if (err) throw err;
      res(result);
      //console.log(result);
    });
  });
  return p;
}

app.get("/myprofile/:username", async (req, res) => {
  let username = req.params.username;
  const temp = quizdb.model(username, dbs);
  const quizs = await temp.find({});
  //console.log(quizs);
  const resp = responsedb.model(username, respns);
  const useranswers = await resp.find({});
  //console.log(useranswers);
  let atp_qzs = [];
  let tp = [];
  let arr = await getdetails(username);
  console.log(arr);
  async function getattemptedQuizs() {
    let p = new Promise(function (res, req) {
      let q = `SELECT * FROM quizes`;
      connection.query(q, async (err, result) => {
        if (err) throw err;
        let at = [];
        for (i of useranswers) {
          for (j of result) {
            if (i.quiz_id === j.id) {
              const preQz = quizdb.model(j.username, dbs);
              const qz = await preQz.find({ _id: i.quiz_id });

              at.push({
                id: i.quiz_id,
                username: j.username,
                quizname: qz[0].quizname,
              });
            }
          }
        }
        res(at);
      });
    });
    return p;
  }
  atp_qzs = await getattemptedQuizs();
  res.render("myprofile.ejs", { username, quizs, atp_qzs, arr });
});

app.get("/:username/viewQuiz/:quizid", async (req, res) => {
  let username = req.params.username;
  let quizid = req.params.quizid;
  const temp = quizdb.model(username, dbs);
  const quizs = await temp.find({ _id: quizid });
  const questions = quizs[0].questions;
  console.log(questions);
  let quizname = quizs[0].quizname;
  // res.send("working");
  res.render("viewQuiz.ejs", { username, questions, quizname });
});

app.get("/createQuiz/:username", (req, res) => {
  let username = req.params.username;
  res.render("createQuiz.ejs", { msg: "", username });
});

app.get("/quizs/:username", (req, res) => {
  let username = req.params.username;
  let q = "SELECT distinct username FROM quizes";
  try {
    connection.query(q, async (err, result) => {
      if (err) throw err;
      let allqs = [];
      for (i of result) {
        const temp = quizdb.model(i.username, dbs);
        const quizs = await temp.find({});
        for (j of quizs) {
          allqs.push(j);
        }
      }
      res.render("showQuizes.ejs", { username, allqs });
    });
  } catch (err) {
    console.log(err);
  }

  //res.send("ALL QUIZS");
  //res.render("showQuizes.ejs",{})
});

//atempting quizes

app.get("/:username/attemptQuiz/:quizid", async (req, res) => {
  let username = req.params.username;
  let quizid = req.params.quizid;
  const resp = responsedb.model(username, respns);
  const useranswers = await resp.findOne({ quiz_id: quizid });
  if (useranswers != null) {
    res.render("attempted_Quiz", { username, quizid });
  } else {
    let q = `SELECT username FROM quizes where id = '${quizid}'`;
    try {
      connection.query(q, async (err, result) => {
        if (err) throw err;
        const temp = quizdb.model(result[0].username, dbs);
        const qz = await temp.findOne({ _id: quizid });
        let cnt = 1;
        res.render("attemptQuiz.ejs", { username, qz, cnt });
      });
    } catch (err) {
      console.log(err);
    }
  }
});

app.post("/:username/submitresponse/:quizid", async (req, res) => {
  let username = req.params.username;
  let quizid = req.params.quizid;
  const db = responsedb.model(username, respns);
  const useranswers = await db.findOne({ quiz_id: quizid });
  if (useranswers != null) {
    res.render("attempted_Quiz", { username, quizid });
  } else {
    let temp = req.body;
    let keys = Object.keys(temp);
    let rep = [];
    for (i of keys) {
      rep.push({
        id: i,
        selected_answer: temp[i],
      });
    }
    const resp = responsedb.model(username, respns);
    resp.insertOne({
      quiz_id: quizid,
      answers: rep,
    });
    res.redirect(`/${username}/getScore/${quizid}`);
  }
});

app.get("/:username/getScore/:quizid", async (req, res) => {
  let username = req.params.username;
  let quizid = req.params.quizid;
  const resp = responsedb.model(username, respns);
  const useranswers = await resp.findOne({ quiz_id: quizid });
  let q = `SELECT username FROM quizes where id = '${quizid}'`;
  try {
    connection.query(q, async (err, result) => {
      if (err) throw err;
      const temp = quizdb.model(result[0].username, dbs);
      const qz = await temp.findOne({ _id: quizid });
      let score = 0,
        total = qz.questions.length;
      for (i of useranswers.answers) {
        for (j of qz.questions) {
          if (i.id == j._id && i.selected_answer == j.answer) {
            score++;
          }
        }
      }
      let quizname = qz.quizname;
      res.render("displayScore.ejs", { score, total, username, quizname });
    });
  } catch (err) {
    console.log(err);
  }
});

//creating quizes

app.post("/addquiz/:username", async (req, res) => {
  let username = req.params.username;
  let quizname = req.body.quizname;
  const temp = quizdb.model(username, dbs);
  const tem = await temp.find({ quizname: quizname });
  if (tem.length != 0) {
    res.render("createQuiz.ejs", { msg: "Quizname Already Exists!", username });
  } else {
    allquizs[quizname] = [];
    res.redirect(`/${username}/addquiz/${quizname}`);
  }
});

app.get("/:username/addquiz/:quizname", async (req, res) => {
  let username = req.params.username;
  let quizname = req.params.quizname;
  const temp = quizdb.model(username, dbs);
  const tem = await temp.find({ quizname: quizname });
  if (tem.length != 0) {
    res.send("quiz already created");
  } else {
    let questions = allquizs[quizname];
    res.render("addQuestions.ejs", { username, quizname, questions });
  }
});

app.get("/:username/addquestion/:quizname", (req, res) => {
  let username = req.params.username;
  let quizname = req.params.quizname;
  res.render("newQuestion.ejs", { username, quizname });
});

app.post("/:username/addquestion/:quizname/add", (req, res) => {
  let username = req.params.username;
  let quizname = req.params.quizname;
  let temp = {
    question: req.body.question,
    options: [req.body.A, req.body.B, req.body.C, req.body.D],
    answer: req.body.answer,
  };
  allquizs[quizname].push(temp);
  res.redirect(`/${username}/addquiz/${quizname}`);
});

app.get("/:username/submitquiz/:quizname", async (req, res) => {
  let uname = req.params.username;
  let qname = req.params.quizname;

  const temp = quizdb.model(uname, dbs);
  const tem = await temp.find({ quizname: qname });
  if (tem.length != 0) {
    res.send("quiz already created");
  } else {
    let result = await temp.insertOne({
      username: uname,
      quizname: qname,
      questions: allquizs[qname],
    });
    if (result) {
      console.log("Inserted document ID:", result._id);
    } else {
      console.log("Document insertion failed");
    }
    let q = `INSERT INTO quizes (id,username) VALUES('${result.id.toString()}','${uname}')`;
    try {
      connection.query(q, (err, result) => {
        if (err) throw err;
      });
    } catch (error) {
      console.log(error);
    }
    res.redirect(`/home/${uname}`);
  }
});

app.listen(port, () => {
  console.log("Server is working");
});
