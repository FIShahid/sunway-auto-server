const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
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
//////////////////////////////////////////////
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}
///////////////////////

async function run() {
  try {
    await client.connect();
    console.log('Mongodb Connected');
    const partCollection = client.db('sunWay-autoParts').collection('parts')
    const orderCollection = client.db('sunWay-autoParts').collection('order')
    const reviewCollection = client.db('sunWay-autoParts').collection('review')
    const userCollection = client.db('sunWay-autoParts').collection('users')
    const profileCollection = client.db('sunWay-autoParts').collection('profile')


    ///Admin function for
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        next();
      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }
    }


    //User collection

    
    app.get('/user', verifyJWT, async (req, res) => {
      
      const user = await userCollection.find().toArray()
      res.send(user);

    });

    /////Admin Api
    app.get('/admin/:email', async(req, res) =>{
      const email = req.params.email;
      const user = await userCollection.findOne({email: email});
      const isAdmin = user.role === 'admin';
      res.send({admin: isAdmin})
    })


    app.put('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
      else{
        res.status(403).send({message: 'forbidden'});
      }

    })



    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
     console.log(email);
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result ,token });
    })



    app.get('/parts', async (req, res) => {
      const query = {};
      const cursor = await (await partCollection.find(query).toArray()).reverse();
      res.send(cursor);
    })

    ///Add Product to Database

    app.post('/parts',  async (req, res) => {
      const parts = req.body;
      const result = await partCollection.insertOne(parts);
      res.send(result);
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
    /////Manage Product
    app.get('/parts', verifyJWT  , async (req, res) => {
      const product = await partCollection.find().toArray()
     
      res.send(product);
    })
    // app.delete('/parts/:email', verifyJWT, async (req, res)=>{
    //   const email  = req.params.email;
    //   const filter = { email: email};
    //   const result = await partCollection.delete(filter);
    //   res.send(result);
    // })
    app.delete('/parts/:id',verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await partCollection.deleteOne(query);
      res.send(result);
  });

    // getting all orders according to individual email address 
    app.get('/order', async (req, res) => {

      const email = req.query.email
      const query = { userEmail: email }
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


    app.post('/order', async (req, res) => {

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

//Profile page/////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

// users profile API
// app.post('/profile', async (req, res) => {

//   const profile = req.body;
//   const result = await profileCollection.insertOne(profile);
//   res.send(result)
// })
app.post('/profile', async (req, res) => {
  const orders = req.body;
  console.log(orders.email);
  const query = { email: orders.email };
  const exists = await profileCollection.findOne(query);
  if (exists) {
    return res.send({ success: false, user: exists })
  }
  const result = await profileCollection.insertOne(orders);
  res.send(result)
})

app.get('/profile', async (req, res) => {
  const query = {};
  const cursor = await profileCollection.find(query).toArray()

  res.send(cursor);
})


app.get('/profile', async (req, res) => {

  const email = req.query.email
  const query = { email: email }
  const cursor = profileCollection.find(query)
  const profile = await cursor.toArray()
  res.send(profile)
})


app.put('/profile/:id', async (req, res) => {
  const id = req.params.id;
  const updateProfileData = req.body
  const filter = { _id: ObjectId(id) }
  const options = { upsert: true }
  const updateDoc = {
      $set: {

          education: updateProfileData.education,
          location: updateProfileData.location,
          linkdin: updateProfileData.linkdin,
      }
  };

  const result = await profileCollection.updateOne(filter, updateDoc, options);
  res.send(result)
})




// Payment Api

app.get('/orders/order/:id', async(req, res) =>{
  const id = req.params.id;
  console.log(id)
  const query = {_id: ObjectId(id)};
  const order = await orderCollection.findOne(query);
  res.send(order);
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