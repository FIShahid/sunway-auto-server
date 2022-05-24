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
    const orderCollection = client.db('sunWay-autoParts').collection('order')
    const reviewCollection = client.db('sunWay-autoParts').collection('review')
    const userCollection = client.db('sunWay-autoParts').collection('users')

    //User collection

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updatedDoc, options);
      res.send(result);

    })



    app.get('/parts', async (req, res) => {
      const query = {};
      const cursor = await partCollection.find(query).toArray()
      res.send(cursor);
    })


    app.get('/parts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const product = await partCollection.findOne(query);
      res.send(product)
    });

    app.put('/parts/:id', async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true }
      const updatedDoc = {
        $set: {
          stock: updatedUser.stock
        }
      }
      const result = await partCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })


    // getting all orders according to individual email address 
    app.get('/order', async (req, res) => {

      const email = req.query.userEmail
      const query = { email: email }
      const cursor = orderCollection.find(query)
      const myOrders = await cursor.toArray()
      res.send(myOrders);
    })



    //Post  Order Information
    app.post('/order', async (req, res) => {
      const order = req.body;

      const result = await orderCollection.insertOne(order);
      res.send(result);
    });


    app.post('/orders', async (req, res) => {

      const orders = req.body;
      const result = await orderCollection.insertOne(orders);
      res.send(result)
    })

    //Get Review 

    app.get('/review', async (req, res) => {
      const query = {};
      const cursor = await reviewCollection.find(query).toArray()
      res.send(cursor);
    })


    //Post Review

    app.post('/review', async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    })





  } finally {
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Sunway Server Running..');
});

app.listen(port, () => {
  console.log('To-Do Server Running on Port..', port);
});