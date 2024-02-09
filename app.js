const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const nocache = require("nocache");
const cookieSession = require("cookie-session");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const falsh = require("connect-flash");
const router = require("./router/userRouter");
const adminRouter = require("./router/adminRouter");
const app = express();
const PORT = process.env.PORT || 3003;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const connectDB = require("./config/connection");
const flash = require("flash");
connectDB;

app.use(
  session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: false,
  })
);

// Use connect-flash middleware
app.use(flash());
app.use(nocache());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/", router);
app.use("/admin", adminRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});
