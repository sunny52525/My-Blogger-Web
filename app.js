
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const admin = require("firebase-admin");
const app = express();
const cookieParser = require("cookie-parser");
const appHost = require("https-localhost")();
// intialise the express app
const https = require('https');
const fs = require('fs');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname));
app.use(cookieParser());
if (typeof process.env.PRIVATE_KEY !== 'string') {
    console.log(process.env.PRIVATE_KEY);
} else {
    var key = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
}
admin.initializeApp({
    credential: admin.credential.cert({

        "private_key": key,
        "client_email": process.env.CLIENT_EMAIL,
        "project_id": process.env.PROJECT_ID

    }
    ),
    databaseURL: "https://my-blogger-1b264.firebaseio.com",
    authDomain: "my-blogger-1b264.firebaseapp.com"

});

var db = admin.database();

app.get("/posts/:postId", function (req, res) {
    // console.log(req.params);
    var postid = req.params.postId;
    console.log(postid);
    var postRef = db.ref("posts").child(postid);

    postRef.on("value", snap => {

        console.log(snap.val());

        if (snap.val() != null) {
            // res.send(snap.val().content);
            res.render("home", {

                title: snap.val().title,
                content: snap.val().content,
                author: snap.val().nameOP,
                authorUsername: snap.val().username,
                time: snap.val().time

            });
        }
        else
            res.sendFile(__dirname + "/views/404.html");

        // console.log(snap.value);
    }, function (error) {
        console.log("The read failed " + error.code);
    }
    );
});


app.get('/sessionLogin', (req, res) => {
    const idToken = req.query.idToken;
    console.log("****************");
    console.log(idToken);
    console.log("*****************88");

    setCookie(idToken, res);
});


app.get("/home",checkCookieMiddleware,(req,res) =>{
var avatar="https://firebasestorage.googleapis.com/v0/b/my-blogger-1b264.appspot.com/o/avatar.png?alt=media&token=d875c7d3-fccc-41b8-87ba-7f5e80c8b873";
   

    var posts=[];
    let postRef=db.ref("posts");
    postRef.once("value",snap =>{

        snap.forEach(function(item) {
            var itemVal = item.val();
            // console.log(item.val());
            posts.push(itemVal);
        });
        
    // console.log(posts);

    res.render('homepage',{
        profileImg: avatar,
        post:posts.reverse()
    });

    });


});


app.post("/posts/", function (req, res) {
    // console.log(req);
    // console.log("***************8");
    // console.log(req.body.token);
    var token = (req.body.token);
    admin.auth().verifyIdToken(token).then(function (decodedToken) {
        let uid = decodedToken.uid;
        res.redirect("/");
        console.log(uid);
    }).catch(function (err) {
        console.log(err);
    });
});



app.get("/signin",function (req, res) {

    
    res.render('signin');
});


app.get('/', checkCookieMiddleware, (req, res) => {
    let uid =  req.decodedClaims.uid;
    console.log("uid is "+ uid);
    res.sendFile(__dirname + "/views/index.html")
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.get('*', function (req, res) {
    res.sendFile(__dirname + "/views/404.html");
});


https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, app)
  .listen(port, function () {
    console.log('My Bloggerlistening on port 3000! Go to https://localhost:3000/')
  });




function setCookie(idToken, res) {
	// Set session expiration to 5 days.
	// Create the session cookie. This will also verify the ID token in the process.
	// The session cookie will have the same claims as the ID token.
	
	const expiresIn = 60 * 60 * 24 * 5 * 1000;
	admin.auth().createSessionCookie(idToken, {expiresIn}).then((sessionCookie) => {
		
		// Set cookie policy for session cookie and set in response.
		const options = {maxAge: expiresIn, httpOnly: true, secure: true};
		res.cookie('__session', sessionCookie, options);
		
		admin.auth().verifyIdToken(idToken).then(function(decodedClaims) {
			res.redirect('/');
		});
			
	}, error => {
		res.status(401).send('UNAUTHORIZED REQUEST!');
	});
}


// middleware to check cookie
function checkCookieMiddleware(req, res, next) {

	const sessionCookie = req.cookies.__session || '';

	admin.auth().verifySessionCookie(
		sessionCookie, true).then((decodedClaims) => {
			req.decodedClaims = decodedClaims;
			next();
		})
		.catch(error => {
            console.log(error);
			// Session cookie is unavailable or invalid. Force user to login.
			res.redirect('/signin');
		});
}