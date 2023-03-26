const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbname: "backend",
  })
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log(err));

//schema is like structure
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema); //creating model or collection

//middleware
app.use(express.static(path.join(path.resolve(), "public"))); //now we can use sendFile() without __dirname
app.use(express.urlencoded({ extended: true })); //now we can read data from form
app.use(cookieParser()); //now we can read the cookies

//set up view engine
app.set("view engine", "ejs");

//will check if there any cookie or not for authentication
const isAuthenticate = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decode = jwt.verify(token, "abcdefghijk"); //will compare the token genrated by id and verify it
    req.user = await User.findById(decode._id); //will search the id in the users
    next();
  } else {
    res.redirect("login");
  }
};
app.get("/", isAuthenticate, (req, res) => {
  console.log(req.user); //it will console the user detail
  res.render("logout", { name: req.user.name }); //will render the logout page and name in the logut page
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

/*
//This will automatically add data to message collection when the route will be /add

app.get("/add", async (req, res) => {
  await Message.create({ name: "ayush2", email: "ayush2@gmail.com" });
  res.send("nice");
});
*/

/*for taking data from form and putting into message collection-----

app.post("/contact", async (req, res) => {
  const { name, email } = req.body; //destructuring the body data so that we dont have to use req.body.name or req.body.email
  await Message.create(name, email); //if key value pair is same we can write this otherwise name:name,email:email
  res.redirect("/success");
});
*/

//check if user presewnt or not
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email }); //will find user by email

  if (!user) {
    return res.redirect("/register");
  }
const isMatch = await bcrypt.compare(password,user.password);  //will compare the hash password in login page
  if (!isMatch) {
    return res.render("login", { email, message: "Incorrect password" });
  }
  const token = jwt.sign({ _id: user._id }, "abcdefghijk");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

//generating the cookies and create user
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email }); //will check if user present or not
  if (user) {
    console.log("alread a user");
    return res.redirect("/login");
  }

  const hashPassword = await bcrypt.hash(password, 10);   //covert the password into hashed password
  user = await User.create({
    name: name,
    email: email,
    password: hashPassword,
  });
  const token = jwt.sign({ _id: user._id }, "abcdefghijk");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

//deleting the cookies
app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.listen(5000, () => {
  console.log("Server is running");
});
