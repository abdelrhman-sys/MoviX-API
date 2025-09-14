import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import pg from "pg";
import connectPgSimple from "connect-pg-simple";
import env from "dotenv";
import bcrypt from "bcrypt";
import cors from "cors";
import deleteProfileImg from "./utils/deleteProfileImg.js";

env.config();

const app = express();
const PgSession = connectPgSimple(session);
const db = new pg.Pool({
    connectionString: process.env.SUPABASE_DB_URL
});

app.use(cors({
  origin: "https://movix-web-six.vercel.app",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true  // for cookies / sessions
}));
app.use(session({
    store: new PgSession({
      pool: db,
      tableName: "session",
      pruneSessionInterval: 60 * 60 * 24 * 7, // Prune sessions older than 7 days
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,  // one week
        httpOnly: true, 
        secure: true,
        sameSite: 'none'
    }
}));
app.set("trust proxy", 1); // for production

app.use(express.urlencoded({extended : false}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

function isAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
    }
    next();
} 

// get all user data / shows
app.get("/api/user", isAuthenticated, async(req, res)=> {
    const {password, ...safeUser} = req.user;
    try {
        const fav = await db.query(`SELECT show_id, show_type, show_poster, show_name FROM fav_shows WHERE user_id =$1`, [safeUser.user_id]);
        const later = await db.query(`SELECT show_id, show_type, show_poster, show_name FROM later_shows WHERE user_id =$1`, [safeUser.user_id]);
        res.json({favShows: fav.rows, laterShows: later.rows, user: safeUser}); // fav and later are array of objects [{show_id, show_type}], user is object {user_id, ....}
    } catch (error) {
        res.status(400).send(error);
    }
});

// update user excluding profile picture
app.patch("/api/edit/user", isAuthenticated, async (req, res)=> {
    const user = req.body;        
    const fields = Object.keys(user); // [email, fname]
    const values = Object.values(user); // [ahmed@gmail.com, ahmed]

    for (let i = values.length - 1; i >= 0; i--) { // to extract the unedited fields
        if (!values[i] || values[i] == '' || fields[i] == 'profile_pic_flag') {
            values.splice(i, 1);
            fields.splice(i, 1);
        }
    }

    if (fields.length === 0 || values[0]==='') { // no fields edited
        if (user.profile_pic_flag) { // picture is edited
            const {password, ...safeUser} = req.user;
            return res.json({user: safeUser});
        } else { // picture is not edited
            return res.status(400).send("No fields to upadate");
        }
    } else { // has edited fields
        const setClause = fields.map((field, i) => `${field}=$${i+1}`);
        try {
            const response = await db.query(`UPDATE users SET ${setClause} WHERE user_id =$${fields.length + 1} RETURNING first_name, sec_name, email, profile_pic, user_id`, [...values, req.user.user_id]);
            res.json({user: response.rows[0]});                
        } catch (error) {
            res.status(400).send(error.detail? "Name is too long, max is 30 character" : "Email already exists");
        }
    }
});
// update profile picture path
app.patch('/api/update/profile_pic', isAuthenticated, async(req, res)=> {
    try {
        const respond = await db.query(`UPDATE users SET profile_pic=$1 WHERE user_id=$2 RETURNING profile_pic`, [req.body.pic, req.user.user_id]);
        res.json(respond.rows[0]);
    } catch (error) {
        res.status(400).send("Error uploading image");
    }
});

// delete user
app.delete("/api/delete/user", isAuthenticated, (req, res)=> {
    bcrypt.compare(req.body.password, req.user.password, async(err, result)=> {            
        if(err) return res.status(400).send("error checking password");
        if (result) {
            const user = req.user;
            req.logout(async(err)=> {
                if(err) return res.status(400).send("error terminating session");
                try {
                    await db.query(`DELETE FROM fav_shows WHERE user_id= $1`, [user.user_id]);
                    await db.query(`DELETE FROM later_shows WHERE user_id= $1`, [user.user_id]);
                    await deleteProfileImg(user.profile_pic);
                    await db.query(`DELETE FROM users WHERE user_id= $1`, [user.user_id]);
                    return res.send("User is deleted");
                } catch (error) {
                    res.status(400).send("error deleting account: " + error)
                }
            })
        } else {                
            return res.status(400).send("password is not correct");
        }
    })
})

// add shows
app.post('/api/fav', isAuthenticated, async(req, res)=> {
    try {
        await db.query(`INSERT INTO fav_shows (user_id, show_id, show_type, show_poster, show_name) VALUES ($1, $2, $3, $4, $5)`, [req.user.user_id, req.body.showId, req.body.showType, req.body.showPoster, req.body.showName]);
        res.send("Show is added");
    } catch (error) {
        res.status(400).send("Error adding show: " + error);
    }
});

app.post('/api/later', isAuthenticated, async(req, res)=> {
    try {
        await db.query(`INSERT INTO later_shows (user_id, show_id, show_type, show_poster, show_name) VALUES ($1, $2, $3, $4, $5)`, [req.user.user_id, req.body.showId, req.body.showType, req.body.showPoster, req.body.showName]);
        res.send("Show is added");
    } catch (error) {
        res.status(400).send("Error adding show: " + error);
    }
});

// remove show
app.delete("/api/fav/:showId", isAuthenticated, async (req, res) => {
    try {
        await db.query(`DELETE FROM fav_shows WHERE user_id=$1 AND show_id=$2 AND show_type=$3`, [req.user.user_id, req.params.showId, req.query.type]);
        res.send("Show is rempoved");
    } catch (error) {
        res.status(400).send(error);
    }
});

app.delete("/api/later/:showId", isAuthenticated, async (req, res) => {
    try {
        await db.query(`DELETE FROM later_shows WHERE user_id=$1 AND show_id=$2 AND show_type=$3`, [req.user.user_id, req.params.showId, req.query.type]);
        res.send("Show is rempoved");
    } catch (error) {
        res.status(400).send(error);
    }
});

// regiesters
app.post("/api/newuser", async (req, res)=> {
    const user = req.body;
    const fields = Object.keys(user);
    
    if (req.isAuthenticated()) {
        res.status(400).send("You are already signed in");
    } else {                
        try {
            const {rows} = await db.query(`SELECT * FROM users WHERE email =$1`, [user.email]);
            if (rows[0]) {
                res.status(400).send("User is already found");
            } else {
                bcrypt.hash(user.password, 10, async (err, hashedPassword)=> {
                    try {
                        if (err) throw err;
                        const newUser = await db.query(`INSERT INTO users (password, first_name, sec_name, email, profile_pic) VALUES ($1, $2, $3, $4, $5) RETURNING first_name, sec_name, email, profile_pic, user_id`, [hashedPassword, user.firstName, user.secName, user.email, user.pic]);
                        req.login(newUser.rows[0], err=> {
                            if (err) {
                                return res.status(400).send("Failed establishing session");
                            }
                            const {password, ...safeUser} = newUser.rows[0];
                            res.json({user: safeUser, favShows:[], laterShows:[]});
                        })
                    } catch (error) {
                        return res.status(400).send("Failed hashing password");
                    }
                })
            }
        } catch (error) {            
            res.status(400).send(error);
        }
    }
})

app.post("/api/local/user", (req, res)=> {
    passport.authenticate("local", (err, user)=> {
        if (err) return res.status(404).send( err );
        if (!user) return res.status(401).send( "Invalid credentials" );

        req.login(user, async (err) => {
        if (err) return res.status(500).send( err );
        const {password, ...safeUser} = req.user;
        const fav = await db.query(`SELECT show_id, show_type, show_poster, show_name FROM fav_shows WHERE user_id =$1`, [safeUser.user_id]);
        const later = await db.query(`SELECT show_id, show_type, show_poster, show_name FROM later_shows WHERE user_id =$1`, [safeUser.user_id]);
        return res.json({ user: safeUser, favShows: fav.rows, laterShows: later.rows });
        });
    })(req, res);
});

app.get("/api/google/user", passport.authenticate("google", {
    scope: ["profile", "email"]
}));  

app.get("/api/google/callback", passport.authenticate("google", { failureMessage: "User not authenticated"}), (req, res) => {
    res.redirect("http://localhost:5173");
});

app.get("/api/logout", (req, res)=> {
    if (req.isAuthenticated()) {
        req.logout(err=> {
            if (err) return res.status(400).send("Failed logging out");
            res.send("User logged out");
        });
    } else {
        res.status(400).send("User is not logged in");
    }
})

app.all("*", (req, res)=> {
    res.status(404).send("Resource not found");
})

passport.use("local", new Strategy({usernameField: "email"}, async(email, password, cb)=> {
    try {
        const user= await db.query(`SELECT * FROM users WHERE email=$1`, [email]);
        if (user.rows[0]) {
            bcrypt.compare(password, user.rows[0].password, (err, result)=> {
                if(err) return cb(err, null);
                if (result) {
                    return cb(null, user.rows[0]);
                } else {
                    return cb(null, false);
                }
            })
        } else {
            cb("User is not found");
        }
    } catch (error) {
        res.status(400).send(err);
    }
}))

passport.use("google",
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/api/google/callback",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  }, async (accessToken, refreshToken, profile, cb)=> {
    try {
      const checkEmail = await db.query("SELECT * FROM users WHERE email= $1", [profile.email]);
      if (checkEmail.rows.length === 0) { // sign up
        const newUser = await db.query("INSERT INTO users (email, password, first_name, sec_name) values ($1, $2, $3, $4) RETURNING user_id, first_name, sec_name, email, profile_pic", [profile.email, "google", profile.name.givenName, profile.name.familyName])
        return cb(null, newUser.rows[0]);
      } else { // login
        return cb(null, checkEmail.rows[0]);
      }
    } catch (error) {
      return cb(error);
    }
  }
));

passport.serializeUser((user, cb)=> {
    cb(null, user.user_id);
})

passport.deserializeUser(async(user_id, cb)=> {
    const {rows}= await db.query(`SELECT * FROM users WHERE user_id=$1`, [user_id]);    
    cb(null, rows[0]);
})

app.listen("3000", ()=> {
    console.log("listening on 3000");
})