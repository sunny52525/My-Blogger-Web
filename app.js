
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const admin = require("firebase-admin");
const app = express();
const cookieParser = require("cookie-parser");
const path = require('path');
const { Storage } = require('@google-cloud/storage');
var multer = require('multer');
var upload = multer();
const appHost = require("https-localhost")();
// intialise the express app
const https = require('https');
const firebaseAuth = require("firebase-auth");
const fs = require('fs');

var fileUpload = require('express-fileupload');

app.set('view engine', 'ejs');



app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname));
// app.use(upload.array()); 
app.use(cookieParser());
var mime = require('mime');
app.use(fileUpload({}));
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
    storageBucket: "gs://my-blogger-1b264.appspot.com",
    databaseURL: "https://my-blogger-1b264.firebaseio.com",
    authDomain: "my-blogger-1b264.firebaseapp.com"

});

var db = admin.database();
// var database = firebase.database();
app.get("/posts/:postId", function (req, res) {
    // console.log(req.params);
    var postid = req.params.postId;
    console.log(postid);

    var regex = /^[^~.!@#$]+$/;
    if (regex.test(postid)) {

    } else {
        res.redirect('/posts/notfound')
    }

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

app.get('/save', (req, res) => {

    const sessionC = req.cookies.__session || '';
    admin.auth().verifySessionCookie(sessionC, true).then((decodedClaims) => {

        req.decodedClaims = decodedClaims;
        let uid = decodedClaims.uid;
        let userRef = db.ref("Users").child(uid);

        userRef.once("value", snapshot => {
            if (snapshot.exists()) {
                console.log("exist");
                res.redirect("/home");
            } else {
                res.render('saveinfo');
            }
        });
    }).catch(err => {
        res.redirect('/signin');
    })


});

// var uploads=upload.fields([{photo:'avatar',maxCount:1},{username:}])
app.post('/verify', upload.single('pic'), (req, res) => {

    // console.log(req.files.file.data);
    console.log(req.query.username);
    console.log(req.query.name);
    let photo;
    if (req.files != null) {
        photo = req.files.file.data;
    } else {
        photo = null;
    }
    let username = req.query.username;
    let bio = req.query.bio;
    var regex = /^[a-zA-Z0-9]+([_ -]?[a-zA-Z0-9])*$/;
    let name = req.query.name;
    if (username == "") {
        res.send("username-empty");
    } else if (name == "") {
        res.send("name-empty");
    } else if (!(regex.test(username))) {
        res.send("username-invalid");
    }
    else {
        console.log(username);

        let userRef = db.ref("username").child(username);

        userRef.once("value", snapshot => {
            if (snapshot.exists()) {
                console.log("exist");
                res.send("username-error");
            } else {


                const cookie=req.cookies.__session||'';
                admin.auth().verifySessionCookie(cookie ,true).then((decodedClaims)=>{
                    req.decodedClaims=decodedClaims;
                    let UID=decodedClaims.uid;

                //Pphoto id name username
                if (photo != null) {



                    const options = {
                        action: 'read',
                        expires: '03-17-2025'
                    };
                    var data = photo;

                    const bucket = admin.storage().bucket();
                    var imageBuffer = new Uint8Array(data);
                    var file = bucket.file(Date.now().toString());
                    console.log(Date.now());
                    file.save(imageBuffer, {
                        metadata: { contentType: 'image/png' },
                    },
                        ((error) => {

                            if (error) {
                                console.log("++++++++++++++++++++++");
                                console.log(error);
                                res.send(error);
                            }
                            file.getSignedUrl(options)
                                .then(results => {
                                    const url = results[0];
                                    let userData = {
                                        Pphoto: url,
                                        id: UID,
                                        name: name,
                                        username: username,
                                        bio: bio

                                    };
                                    saveUser(userData);


                                    console.log(`The signed url for "fi" is ${url}.`);
                                });
                        }));


                } else {
                    let userData = {
                        Pphoto: "https://firebasestorage.googleapis.com/v0/b/my-blogger-1b264.appspot.com/o/user.png?alt=media&token=51c974ff-e679-4ae8-bbd5-c91b0726c5b6",
                        id: UID,
                        name: name,
                        username: username,
                        bio: bio
                    };
                    saveUser(userData);
                }

                res.send("ok");
                }).catch(err=>{
                    res.status(401);
                });




            }
        });

    }

});

function saveUser(userData) {
    var updates = {};
    updates['/Users/' + userData.id] = userData;
    updates['username/' + userData.username] = userData.username;
    return db.ref().update(updates);

}

app.get('/sessionLogin', (req, res) => {
    const idToken = req.query.idToken;
    console.log("****************");
    console.log(idToken);
    console.log("*****************88");

    setCookie(idToken, res);
});





app.get("/home", (req, res) => {


    var isLogged = false;
    // let uid=req.decodedClaims.uid;
    const sessionCookie = req.cookies.__session || '';
    admin.auth().verifySessionCookie(
        sessionCookie, true).then((decodedClaims) => {
            req.decodedClaims = decodedClaims;
            isLogged = true;
            let uid = decodedClaims.uid;
            console.log("uid is " + uid);
            let userRef = db.ref("Users").child(uid);

            userRef.once("value", snapshot => {
                if (snapshot.exists()) {
                    loadPost(isLogged, res);
                } else {
                    res.redirect('/save');
                }
            });



        })
        .catch(error => {
            console.log(error);
            // Session cookie is unavailable or invalid. Force user to login.
            isLogged = false;
            loadPost(isLogged, res);
        });

});


function loadPost(isLogged, res) {
    var avatar = "https://firebasestorage.googleapis.com/v0/b/my-blogger-1b264.appspot.com/o/avatar.png?alt=media&token=d875c7d3-fccc-41b8-87ba-7f5e80c8b873";

    
    var posts = [];
    let postRef = db.ref("posts").limitToLast(50);
    postRef.once("value", snap => {
        snap.forEach(function (item) {

            var itemVal = item.val();

            if (itemVal.postCover == null) {
                itemVal.postCover = "https://picsum.photos/1600/900";

            }
            // console.log(item.val());
            posts.push(itemVal);

        });

        // console.log(posts);

        res.render('homepage', {
            isLogged: isLogged,
            profileImg: avatar,
            post: posts
        });

    });


}

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


app.post('/upload-image', (req, res) => {
    console.log(req.files.file.name);
    const options = {
        action: 'read',
        expires: '03-17-2025'
    };
    var data = req.files.file.data;

    const bucket = admin.storage().bucket();
    var imageBuffer = new Uint8Array(data);
    var file = bucket.file(Date.now().toString());
    console.log(Date.now());
    file.save(imageBuffer, {
        metadata: { contentType: 'image/png' },
    },
        ((error) => {

            if (error) {
                console.log("++++++++++++++++++++++");
                console.log(error);
                res.send(error);
            }
            file.getSignedUrl(options)
                .then(results => {
                    const url = results[0];

                    res.send({ 'location': url });
                    console.log(`The signed url for "fi" is ${url}.`);
                });
        }));

});






app.get('/signout', (req, res) => {
    res.clearCookie('__session');
    res.redirect('/');
});

app.get("/signin", function (req, res) {


    res.render('signin');
});

app.get('/newpost', checkCookieMiddleware, (req, res) => {
    var avatar = "https://firebasestorage.googleapis.com/v0/b/my-blogger-1b264.appspot.com/o/avatar.png?alt=media&token=d875c7d3-fccc-41b8-87ba-7f5e80c8b873";

    res.render('newpost', {
        profileImg: avatar
    });
});


app.get('/', checkCookieMiddleware, (req, res) => {
    let uid = req.decodedClaims.uid;
    console.log("uid is " + uid);
res.redirect("/home");
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.get('*', function (req, res) {
    res.sendFile(__dirname + "/views/404.html");
});





app.post('/newpost', checkCookieMiddleware, (req, res) => {
    let postTitle = req.body.posttitle;
    let postContent = req.body.postcontent;
    // console.log(req.body.posttitle);
    let uid = req.decodedClaims.uid;

    var userRef = db.ref("Users").child(uid);
    var userData;

    let id = db.ref().child("posts").push().key;
    userRef.on("value", snap => {
        userData = snap.val();
        console.log(snap.val());
        uploadPost(postTitle, postContent, uid, userData, id);
    });

    res.redirect('/home');
});




function uploadPost(postTitle, postContent, uid, userData, id) {
    //content id like_count nameOP time title username


    var postData = {
        content: "<body>" + postContent.replace(/^ {4}/gm, '') + "</body>",
        id: id,
        like_count: 0,
        nameOP: userData.name,
        time: new Date().toLocaleString(),
        title: postTitle.replace(/^ {4}/gm, ''),
        username: userData.username,
        userId:uid
    };
    var updates = {};
    updates['/posts/' + id] = postData;
    updates['user-posts/' + uid + '/' + id] = postData;
    return db.ref().update(updates);

}









// https.createServer({
//     key: fs.readFileSync('server.key'),
//     cert: fs.readFileSync('server.cert')
// }, app)
//     .listen(3001, function () {
//         console.log('My Bloggerlistening on port 3000! Go to https://localhost:3001/');
//     });


app.listen(port, function () {
    console.log("Server started on port" + port);
});


function setCookie(idToken, res) {
    // Set session expiration to 5 days.
    // Create the session cookie. This will also verify the ID token in the process.
    // The session cookie will have the same claims as the ID token.

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    admin.auth().createSessionCookie(idToken, { expiresIn }).then((sessionCookie) => {

        // Set cookie policy for session cookie and set in response.
        const options = { maxAge: expiresIn, httpOnly: true, secure: true };
        res.cookie('__session', sessionCookie, options);

        admin.auth().verifyIdToken(idToken).then(function (decodedClaims) {
            res.redirect('/home');
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