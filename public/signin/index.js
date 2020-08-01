


var firebaseConfig = {
  apiKey: "AIzaSyCMVzkxtsE3H4QR3lcVM2t_YDpH2nOalmk",
  authDomain: "my-blogger-1b264.firebaseapp.com",
  databaseURL: "https://my-blogger-1b264.firebaseio.com",
  projectId: "my-blogger-1b264",
  storageBucket: "my-blogger-1b264.appspot.com",
  messagingSenderId: "580169673576",
  appId: "1:580169673576:web:b6a749125f22350d2044dd",
  measurementId: "G-5YRSFMWQKY"
};
firebase.initializeApp(firebaseConfig);


firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);

// FirebaseUI config.
var uiConfig = {
  signInSuccessUrl: 'https://www.google.com',
  signInOptions: [
      // google sign in option
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.PhoneAuthProvider.PROVIDER_ID
  ],

  // Terms of service url/callback.
  tosUrl: '<your-tos-url>',
  // Privacy policy url/callback.
  privacyPolicyUrl: function() {
      window.location.assign('<your-privacy-policy-url>');
  },

  callbacks: {
      signInSuccess: function(user, credential, redirectUrl) {
          // User successfully signed in.

          user.getIdToken().then(function(idToken) {

              window.location.href = '/sessionLogin?idToken=' + idToken;
          }).catch(error => {
              alert(error);
              console.log(error);
          }) ;

      }
  }
};

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// The start method will wait until the DOM is loaded.
ui.start('#firebaseui-auth-container', uiConfig);
