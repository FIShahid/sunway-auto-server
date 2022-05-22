const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.celll.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log('Mongodb Connected');
   const partCollection = client.db('sunWay-autoParts').collection('parts')
     
   app.get('/parts' , async(req,res)=>{
       const query ={};
       const cursor = await partCollection.find(query).toArray()
       res.send(cursor);
   } )
    
  } finally {
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Sunway Server Running..');
});

app.listen(port, () => {
  console.log('To-Do Server Running on Port..' ,port);
});