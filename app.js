const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const nocache = require("nocache");
const cookieSession = require("cookie-session");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const flash = require("connect-flash"); // Fixed typo here
const router = require("./router/userRouter");
const adminRouter = require("./router/adminRouter");
const connectDB = require("./config/connection");

const app = express();
const PORT = process.env.PORT || 3003;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Use connect-flash middleware
app.use(flash());

// Use session middleware
app.use(
  session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: false,
  })
);

// Use nocache middleware
app.use(nocache());

// Use bodyParser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use your routers
app.use("/", router);
app.use("/admin", adminRouter);

// Connect to the database
connectDB;

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});
