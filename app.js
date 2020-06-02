//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const _ = require("lodash")
const delay = require("delay")
const saltRounds = 10;

let userauthenticated;
let array = [];

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
console.log(mongoose.connect("mongodb+srv://amandugar25:amandugar25@cluster0-3q18p.mongodb.net/test?retryWrites=true&w=majority/test", {useNewUrlParser: true,useUnifiedTopology: true}));
delay(10000);

const userSchema = new mongoose.Schema ({
  email: {type: String, unique: true},
  password: String,
  name: String,
  username: {type: String, unique: true},
  purpose: String,
  phone: String
});


const chatSchema = new mongoose.Schema ({
  from: String,
  to: String,
  chat: String
});

const taskSchema = new mongoose.Schema ({
  username: String,
  name: String,
  project_name: String,
  assignedby:String,
  project_description: String,
  resource_detail: String,
  date: Date,
  officer_purpose: String,
  status: String,
  lastupdate: Date
})

const updateSchema = new mongoose.Schema({
  task_id:  String,
  estimated_time: Date,
  estimated_resource: String,
  current_status: String,
  remarks: String
})

const Update = new mongoose.model("Update",updateSchema);
const User = new mongoose.model("User", userSchema);
const Pending = new mongoose.model("Pending",userSchema)
const Task = new mongoose.model("Task",taskSchema);
const Chat = new mongoose.model("Chat",chatSchema);

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){
  if(req.body.password === req.body.confirm_password){
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newPendingUser =  new Pending({
      email: req.body.email,
      password: hash,
      name: req.body.name,
      username: req.body.username,
      purpose: "Not Allotted",
      phone:req.body.phone
    });
    newPendingUser.save(function(err){
      if (err) {
        res.redirect("/register")
      } else {
        res.redirect("/login");
      }
    });
  });
  } else{
    res.render("notmatching")
  }
});

app.get("/forgotpassword",function(req,res){
  res.render("forgotpassword")
})
let allowchangepassword = false;
app.post("/forgotpassword",function(req,res){
  User.findOne({email: req.body.email,phone: req.body.phone},function(err,foundUser){
    console.log(req.body.email);
    console.log(req.body.phone)
    if(foundUser){   
      res.redirect(`/changepassword/${foundUser.username}`)
      allowchangepassword = true;
    } else {
      res.render("notregistered")
    }
  })
})

app.get("/changepassword/:username",function(req,res){
  if(allowchangepassword){
      res.render("changepassword",{
      username: req.params.username
    })
  }
})

app.post("/changepassword/:username",function(req,res){
  if(allowchangepassword){
    let myhash = "";
    console.log(req.body.confirm_password)
    if(req.body.password === req.body.confirm_password){
      bcrypt.hash(req.body.password,saltRounds,function(err,hash){
        myhash = hash;
        console.log(myhash)
        const userSchema = new Pending({
          username: req.params.username,
          password: hash
        })
        userSchema.save(function(err){
          res.redirect("/login")
        })
      })
    }
  } else {
    res.render("404")
  }
})

let purposeauthenticated;

app.post("/login", function(req, res){
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({email: email}, function(err, foundUser){
    if (err) {
      res.redirect("/login")
    } else {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if (result === true) {
            purpose = foundUser.purpose;
            username = foundUser.username;
            res.redirect(`/${_.lowerCase(purpose)}/${username}`)
            userauthenticated = `${username}`;
            purposeauthenticated = _.lowerCase(`${purpose}`)
          } else {
            res.redirect("/wrongpassword");
          }
        });
      }
      else{
        res.redirect("/registering")
      }
    }
  });
});

app.get("/wrongpassword",function(req,res){
  userauthenticated = undefined;
  purposeauthenticated = undefined;
  res.render("notregistered")
})


app.get("/registering",function(req,res){{
  res.render("processing")
}})
app.get("/:purpose/:username",function(req,res){
  if(userauthenticated === req.params.username && purposeauthenticated === req.params.purpose){
  const purpose = req.params.purpose;
  const username = req.params.username;
  User.findOne({username: username},function(err,foundUser){
    if(err){
      console.log(err)
    } else if(foundUser){
      name = foundUser.name;
      if(_.lowerCase(purpose) === _.lowerCase(foundUser.purpose)){      
        res.render(_.lowerCase(purpose),{username:username,purpose: _.lowerCase(purpose)})
        userauthenticated = username;
      } else {
        userauthenticated = undefined;
        res.redirect("/");
      }
    }
  })
    
} else {
  res.redirect("/")
  purposeauthenticated = undefined;
  userauthenticated = undefined;
}
})


app.get("/logout",function(req,res){
  userauthenticated = undefined;
  purposeauthenticated = undefined;
  res.redirect("/");
})

app.get("/:purpose/:username/submituser",function(req,res){
  if(userauthenticated === req.params.username && purposeauthenticated === req.params.purpose){
  if(req.params.purpose==="admin"){
  Pending.find({},function(err,pendingUser){
    res.render("submit",{
      confirmuser: pendingUser
    })
  })
  userauthenticated = req.params.username;
} 
} else {
  userauthenticated = undefined;
  purposeauthenticated = undefined;
  res.redirect("/");
}
})

app.post("/authorizeuser/:username",function(req,res){
  var purposeassinged = req.body.purpose;
  var password = "";
   if(req.body.authorization === "Approve"){
    User.findOne({username: req.params.username},function(err,foundUser){
      console.log("HI")
      console.log(foundUser);
      if(foundUser){
        
        Pending.findOne({username: req.params.username},function(err,findOne){
          password = findOne.password;
          console.log("HI"+password);
          User.updateOne({username: req.params.username},{password:password,purpose:purposeassinged},function(err){
            if (err) {
              console.log(err);
            } else {
              res.redirect(`/admin/${userauthenticated}/submituser`);
              Pending.deleteOne({username: req.params.username},function(err){});
            }
          })
        })
      } else {
        Pending.findOne({username: req.params.username},function(err,foundUser){
          const newUser = new User({
            email: foundUser.email,
            password: foundUser.password,
            name: foundUser.name,
            username: foundUser.username,
            purpose: purposeassinged,
            phone: foundUser.phone
          })
          Pending.deleteOne({username: req.params.username},function(err){});
          newUser.save(function(err){
            if (err) {
              console.log(err);
            } else {
              res.redirect(`/admin/${userauthenticated}/submituser`);
            }
          });
        })
      }
    })
    } else {
      Pending.deleteOne({username: req.params.username},function(err){});
      res.redirect(`/${userauthenticated}/submituser`)
    }
})

app.get("/:purpose/:username/task",function(req,res){
  if(userauthenticated === req.params.username && purposeauthenticated === req.params.purpose){
    let curr_purpose;
    if(req.params.purpose === "admin"){
      curr_purpose = "Officer";
    } else if(req.params.purpose === "officer"){
      curr_purpose = "Member"
    }
    Task.find({officer_purpose: `${curr_purpose}`},function(err,foundUser){
      if(err){
        console.log(err);
      } else{
        res.render("task",{
          users: foundUser,
          purpose: req.params.purpose,
          username: req.params.username
        })
      }
    })
  }
  else {
    res.redirect("/");
    purposeauthenticated = undefined;
    userauthenticated = undefined;
  }
})
app.get("/:purpose/:username/task/assignedtome",function(req,res){
  if(userauthenticated === req.params.username && purposeauthenticated === req.params.purpose){
    Task.find({username: req.params.username},function(err,foundUser){
      res.render("taskassignedtome",{
        users: foundUser,
        purpose: req.params.purpose,
        username: req.params.username
      })
    })
  }
  else{
    res.redirect("/");
    purposeauthenticated = undefined;
    userauthenticated = undefined;
  }
})

app.post("/:purpose/:username/task/assignedtome/update/:id",function(req,res){
  date = Date(Date.now());
  if(req.body.status === "Updated" || req.body.status === "Completed By User"){
    Task.updateOne({ _id:req.params.id},{status: req.body.status,lastupdate: date},function(err){
      res.redirect(`/${req.params.purpose}/${req.params.username}/task/assignedtome`)
    })
  }
})

app.post("/:purpose/:username/task/delete/:id",function(req,res){
  purpose = req.params.purpose;
  username = req.params.username;
  if(req.body.status === "Still Pending" || req.body.status === "Completed"){
    Task.updateOne({_id: req.params.id},{status :req.body.status},function(err){
      res.redirect(`/${purpose}/${username}/task`)
    })
  }
  if(req.body.delete === "Delete"){
    Task.deleteOne({_id: req.params.id},function(err){
      res.redirect(`/${purpose}/${username}/task`)
      return;
    })
  }
})


app.post("/:purpose/:username/task/assign",function(req,res){
  let officer_purpose,officer_name;

  (async () => {
    User.findOne({username: req.body.member},function(err,foundUser){
      officer_purpose = foundUser.purpose;
      officer_name = foundUser.name;
    })
    await delay(1000);
    const newAssignTask = new Task({
      username: req.body.member,
      name: officer_name,
      project_name: req.body.project_name,
      assignedby: req.params.username,
      project_description: req.body.project_description,
      resource_detail: req.body.resource_detail,
      date: req.body.date,
      officer_purpose: officer_purpose,
      status: "Pending",
      lastupdate: null
    })
    newAssignTask.save(function(err){
    if(err){
      console.log(err)
    } else {
      res.redirect(`/${req.params.purpose}/${req.params.username}/task/assign`);
    }
  })
})()
})




app.get("/:purpose/:username/task/assign",function(req,res){
  if(userauthenticated === req.params.username && purposeauthenticated === req.params.purpose){
    let assigning_to = "";
    if(req.params.purpose === "admin"){
      assigning_to= "Officer";
    } else if(req.params.purpose === "officer"){
      assigning_to = "Member"
    }
    User.find({ purpose: `${assigning_to}`}, function (err, docs) {
      res.render("assigntask",{
        purpose: `${assigning_to}`,
        users: docs,
        c_username: req.params.username,
        c_user: req.params.purpose
      })
    });
  } 
  else{
    res.redirect("/");
    purposeauthenticated = undefined;
    userauthenticated = undefined;
  }
})


app.get("/:purpose/:username/task/:id",function(req,res,next){
  if(userauthenticated === req.params.username && purposeauthenticated === req.params.purpose){
  let found = [];
  Task.findOne({_id: req.params.id},function(err,found1){
    found = found1;
  })
  Update.findOne({task_id: req.params.id},function(err,update){
    console.log(found);
    
    res.render("singlepage_task",{
      task: found,
      update: update
    })
})
  } else{
    res.redirect("/");
    purposeauthenticated = undefined;
    userauthenticated = undefined;
  }
})

app.get("/:purpose/:username/task/assignedtome/updatetask/:id",function(req,res){
  if(userauthenticated === req.params.username && purposeauthenticated === req.params.purpose){
  const task_id = req.params.id;
  res.render("update",{
    task_id:task_id,
    username: req.params.username,
    purpose: req.params.purpose
  })
} else{
  res.redirect("/");
  purposeauthenticated = undefined;
  userauthenticated = undefined;
}
})

app.post("/:purpose/:username/task/assignedtome/updatetask/:id",function(req,res){
  const task_id = req.params.id;
  Update.findOne({task_id: task_id},function(err,foundUser){
    id = req.params.id;
    if(foundUser){
      Update.updateOne({task_id:task_id},{estimated_time:req.body.estimated_time,estimated_resource: req.body.estimated_resource,
        current_status: req.body.current_status,
        remarks: req.body.remarks},function(err){})
        res.redirect(`/${req.params.purpose}/${req.params.username}/task/assignedtome/updatetask/${req.params.id}`)
    } else{
      const newUpdate = new Update({
        task_id: task_id,
        estimated_time: req.body.estimated_time,
        estimated_resource: req.body.estimated_resource,
        current_status: req.body.current_status,
        remarks: req.body.remarks
      })
      newUpdate.save(function(err){
        res.redirect(`/${req.params.purpose}/${req.params.username}/task/assignedtome/updatetask/${req.params.id}`)
      });
    }
  })

})

app.get("/:purpose/:username/chat",function(req,res){
  if(userauthenticated === req.params.username && purposeauthenticated === req.params.purpose){
  User.find({},function(err,found){
    res.render("chats",{
      users: found,
      myusername: req.params.username,
      mypurpose: req.params.purpose
    });
  })
}
  else{
    res.redirect("/");
    purposeauthenticated = undefined;
    userauthenticated = undefined;
  }
})

app.post("/:purpose/:username/chat",function(req,res){
  res.redirect(`/${req.params.purpose}/${req.params.username}/chat/${req.body.member}`)
})

app.get("/:purpose/:username/chat/:member",function(req,res){
  if(userauthenticated === req.params.username && purposeauthenticated === req.params.purpose){
 Chat.find({},function(err,foundChats){
  res.render("mainchat",{
    from: req.params.username,
    tom: req.params.member,
    purpose: req.params.purpose,
    chats: foundChats
  })
 })
}else{
  res.redirect("/");
  purposeauthenticated = undefined;
  userauthenticated = undefined;
}
})

app.post("/:purpose/:username/chat/:member",function(req,res){
  const newChat = new Chat({
    from: req.params.username,
    to: req.params.member,
    chat: req.body.chat_message
  })
  newChat.save();
  res.redirect(`/${req.params.purpose}/${req.params.username}/chat/${req.params.member}`)
})


app.get("/:purpose/:username/otherdesk",function(req,res){
  if(userauthenticated === req.params.username && purposeauthenticated === req.params.purpose){
  User.find({},function(err,foundUser){
    res.render("otherdesk",{
      mypurpose:  req.params.purpose,
      users: foundUser,
      myusername: req.params.username
    })  
  })
} else{
  res.redirect("/");
  purposeauthenticated = undefined;
  userauthenticated = undefined;
}
})

app.post("/:purpose/:username/otherdesk",function(req,res){
  User.findOne({username: req.body.username},function(err,foundUser){
    redirected_purpose = foundUser.purpose;
    purposeauthenticated = _.lowerCase(redirected_purpose);
    redirected_username = req.body.username;
    userauthenticated = req.body.username;
    res.redirect(`/${_.lowerCase(redirected_purpose)}/${redirected_username}`)
  }) 
})


app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
