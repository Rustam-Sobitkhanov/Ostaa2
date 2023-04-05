require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const axios = require('axios');


var curUser = "";

// Use body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('public_html'));

app.use(cookieParser());
app.get('/setCookie/:username', function (req, res, next) {
    var user = req.params.username;
    res.cookie('username', user);
    res.redirect('/home.html');
    next();
});


mongoose.connect('mongodb+srv://sobitxanovr:2ik19goHn21Ej0RL@ostaa.jf7rett.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected...'))
    .catch((err) => console.log(err));

const itemSchema = new mongoose.Schema({
    title: String,
    description: String,
    image: String,
    price: Number,
    stat: String
});

const Item = mongoose.model('Item', itemSchema);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    listings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    purchases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }]
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/public_html/index.html`);
});


// Handle login request
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && user.password === password) {
        curUser = username;
        res.redirect('/setCookie/' + username);
    } else {
        res.send('Invalid username or password');
    }
});

// Handle registration request
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user) {
        res.send('User already exists');
    } else {
        curUser = username;
        const newUser = new User({ username, password });
        await newUser.save();
        res.redirect('/setCookie/' + username);
    }
});

app.post('/search', async (req, res) => {
    const { searchItem } = req.body;
    const regex = new RegExp(searchItem, 'i');
    const items = await Item.find({ description: regex });
    res.json(items);
});


app.post('/listings', async (req, res) => {
    const { usrName } = req.body;
    try {
        const user = await User.findOne({username: usrName});
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const listings = user.listings;

        Item.find({ _id: { $in: listings } }).exec()
            .then(docs => {
                res.json(docs);
            })
            .catch(err => {
                // Handle error
            });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to retrieve user listings' });
    }
});


app.post('/viewPurchases', async (req, res) => {
    const { usrName } = req.body;
    try {
        const user = await User.findOne({username: usrName});
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const purchases = user.purchases;

        Item.find({ _id: { $in: purchases } }).exec()
            .then(docs => {
                res.json(docs);
            })
            .catch(err => {
                // Handle error
            });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to retrieve user purchases' });
    }
});



app.post('/addItem', async (req, res) => {

    const { usrName, title, desc, price, img, stat } = req.body;
    //axios.get(`http://localhost:3000/image/${title}`).then(resp){}
    axios.get(`http://localhost:3000/image/${title +" "+ desc}`)
        .then(response => {
            const imgUrl = response.data; // Get the image URL from the response
                User.findOne({username: usrName})
                    .then(user => {
                        if (!user) {
                            return res.status(500).json({ error: 'User: not found' });
                        }
                        const item = new Item({ title: title, description: desc, image: imgUrl, price: price, stat: stat });
                        return item.save().then(item => {
                            user.listings.push(item._id);
                            user.save();
                            return;
                        }).then(() => {
                            console.log(`New item added to ${user.username}'s listings: ${item.title}`);
                            return res.status(200).json({ message: 'Item added successfully' });
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        return res.status(500).json({ error: 'Failed to add item to user' });
                    });

        })
        .catch(error => {
            console.error(error);
            return res.status(500).json({ error: 'Failed to fetch image' });
        });
    

});

app.post('/purchaseItem', async (req, res) => {
    const { usrName, title, price, img } = req.body;

    User.findOne({ username: usrName })
        .then(user => {
            if (!user) {
                return res.status(500).json({ error: 'User not found' });
            }
            Item.findOne({ title: title, price: price, image: img })
                .then(item => {
                    if (!item) {
                        return res.status(500).json({ error: 'Item not found' });
                    }
                    item.stat = 'sold';
                    item.save();
                    user.purchases.push(item._id);
                    user.save();
                    console.log(`Item ${item.title} added to ${user.username}'s purchases`);
                    return res.status(200).json({ message: 'Item purchased successfully' });
                })
                .catch(err => {
                    console.error(err);
                    return res.status(500).json({ error: 'Failed to add item to user purchases' });
                });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: 'Failed to find user' });
        });
});


app.get('/image/:prompt', async (req, res) => {
    const image = replaceUrlPath(req.params.prompt);
    const auth =  process.env.API_KEY;

    try {
      // Make request to DALL-E API
      const response = await axios.post('https://api.openai.com/v1/images/generations', {
        model: 'image-alpha-001',
        prompt: image,
        num_images: 1
      }, {
        headers: {
          'Authorization': 'Bearer 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', // Replace with your actual API key
          'Content-Type': 'application/json'
        }
      });
      // Extract image link from the response
      const imageUrl = response.data.data[0].url;
  
      // Send image link to client
      res.send(`${imageUrl}`);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error occurred while fetching image');
    }
  });
  


app.listen(3000, () => {
    console.log('Server is listening on port 3000...');
});

function replaceUrlPath(urlPath) {
    // Dictionary to map URL-encoded characters to their corresponding string representations
    const urlEncodingDict = {
      '%20': ' ',   // Space
      '%21': '!',   // Exclamation mark
      '%22': '"',   // Double quotation mark
      '%23': '#',   // Hash/pound sign
      '%24': '$',   // Dollar sign
      '%25': '%',   // Percent sign
      '%26': '&',   // Ampersand
      '%27': '\'',  // Single quotation mark
      '%28': '(',   // Left parenthesis
      '%29': ')',   // Right parenthesis
      '%2A': '*',   // Asterisk
      '%2B': '+',   // Plus sign
      '%2C': ',',   // Comma
      '%2D': '-',   // Hyphen/minus sign
      '%2E': '.',   // Period/full stop
      '%2F': '/',   // Forward slash
    };
  
    // Loop through the dictionary and replace URL-encoded characters in the URL path
    for (const key in urlEncodingDict) {
      if (urlEncodingDict.hasOwnProperty(key)) {
        const value = urlEncodingDict[key];
        urlPath = urlPath.replace(new RegExp(key, 'g'), value);
      }
    }
  
    return urlPath;
  }
  
  // Example usage
  const urlPath = 'example%20url%20path%2Fwith%20encoded%20characters';
  const decodedUrlPath = replaceUrlPath(urlPath);
  console.log(decodedUrlPath);
  