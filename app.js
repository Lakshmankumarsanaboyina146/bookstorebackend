const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

let db;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, "bookstore.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`Data base Error is ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/", async (req, res) => {
  const getuserDetails = `SELECT * FROM register`;
  const userDetails = await db.all(getuserDetails);
  res.send(userDetails);
});

// login page detail checking
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const getUserQuery = `SELECT * FROM register WHERE username = '${username}'`;
  const user = await db.get(getUserQuery);
  console.log(user);
  if (user === undefined) {
    return res.status(404).json({ success: false, error: "User not found" });
  } else {
    const hashedPassword = user.password;
    const isPasswordCorrect = await bcrypt.compare(password, hashedPassword);
    if (isPasswordCorrect === true) {
      const userpayLoad = {
        username: username,
      };
      const jwtToken = jwt.sign(userpayLoad, "my_secret_token");
      res
        .status(200)
        .json({ success: true, message: "Login successful", jwtToken });
    } else {
      res
        .status(401)
        .json({ success: false, error: "Password you entered is not correct" });
    }
  }
});

// Create a new user
app.post("/register/", async (request, response) => {
  const { firstname, lastname, email, password, username } = request.body;

  const userExistsQuery = `SELECT * FROM register WHERE username = '${username}'`;
  const user = await db.get(userExistsQuery);

  if (user !== undefined) {
    return response
      .status(409)
      .json({ success: false, error: "User already exists" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertUserQuery = `INSERT INTO register(username,firstname,lastname,email,password) VALUES('${username}','${firstname}','${lastname}','${email}','${hashedPassword}')`;
    await db.run(insertUserQuery);

    response
      .status(201)
      .json({ success: true, message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    response
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Internal Server Error" });
});
