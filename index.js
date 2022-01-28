const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const fs = require("fs");
var path = require("path");
require("dotenv").config();
var multer = require("multer");
const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
// mongodb connection uri
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.iuevi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.use(express.static(__dirname + "/"));
// middleware
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `calculation`);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage });
const run = async () => {
  try {
    await client.connect();
    console.log("Database connected");
    const database = client.db("calculation");
    const calculationCollection = database.collection("calculation");
    // insert file and database function
    app.post("/calculation", upload.single("file"), async (req, res) => {
      fs.readFile(
        `calculation/${req.file.filename}`,
        "utf8",
        async (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          const calculationResult = eval(data);
          const insertCalculateData = {
            calculationTitle: req.body.calculationTitle,
            calculationResult: calculationResult,
            filePath: `calculation/${req.file.filename}`,
          };
          const result = await calculationCollection.insertOne(
            insertCalculateData
          );
          res.json({ result, insertCalculateData });
        }
      );
    });
    app.put("/updatePosition", async (req, res) => {
      const data = req.body;
      const updateData1 = { ...data[0] };
      delete updateData1._id;
      const updateData2 = { ...data[1] };
      delete updateData2._id;
      const data1 = await calculationCollection.findOne({
        _id: ObjectId(data[0]._id),
      });
      const data2 = await calculationCollection.findOne({
        _id: ObjectId(data[1]._id),
      });
      const result = await calculationCollection.replaceOne(
        {
          _id: ObjectId(data[0]._id),
        },
        updateData2
      );
      const result2 = await calculationCollection.replaceOne(
        {
          _id: ObjectId(data[1]._id),
        },
        updateData1
      );
    });
    // get all calculation data from database
    app.get("/calculations/:page", async (req, res) => {
      const page = req.params.page;
      const cursor = calculationCollection.find({}).sort({ _id: -1 });
      const count = await cursor.count();
      let result;
      if (page) {
        result = await cursor
          .skip(page * 5)
          .limit(5)
          .toArray();
      } else {
        result = await cursor.limit(5).toArray();
      }
      res.json({ calculations: result, count });
    });
  } finally {
    // await client.close();
  }
};
run().catch(console.dir);
// initial route
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log("Server running on port", port);
});
