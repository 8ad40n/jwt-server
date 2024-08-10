const express = require("express");
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "https://jwt-auth-2f433.web.app", "https://jwt-auth-2f433.web.app"],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const logger = (req, res, next)=>{
  console.log("Logger Middleware ", req.method, req.url);
  next();
}
const verifyToken = (req, res, next)=>{
  const token = req.cookies?.token;
  if(!token)
  {
    return res.status(401).send({message:"unauthorized"});
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err)
    {
      return res.status(401).send({message:"unauthorized"});
    }
    req.user = decoded;
    next();
  })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2vsxcvm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();

    const userCollection = client.db("jwt").collection("users");

    // APIs
    app.get("/users", logger, verifyToken, async(req,res)=>{

      console.log("Cookies from user's home: ", req.cookies);
      console.log("Token owner info: ", req.user);      

      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post("/users", async(req, res)=>{
      const newUser = req.body;
      // console.log(newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    })


    app.post("/jwt", (req, res)=>{
        const user = req.body;
        console.log("User for token", user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});

        // cookie set and send res
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV ==="production" ? true : false,
            sameSite: 'none'
        })
        .send({success: true});
        
    })

    app.post("/logout", (req, res)=>{
        const user = req.body;
        console.log("logging out ", user);
        
        res.clearCookie('token', {maxAge: 0}).send({success:true});
    })

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
