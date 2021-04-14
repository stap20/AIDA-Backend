//------------------------------ Requires session --------------------------------
//node js requires
var express = require("express");
var passport = require("passport");
LocalStrategy = require("passport-local").Strategy;
var session = require("express-session");
const FileStore = require("session-file-store")(session);
var bodyParser = require("body-parser");
var cors = require("cors");
var cookieParser = require("cookie-parser");
var fs = require("fs");
var Time = require("time-calculate");
var Jimp = require("jimp");

const path = require("path");
const formidable = require("formidable");
const pdf2base64 = require("pdf-to-base64");
//our files requires
//user requires
//auth
const signup = require("./code/js/auth/signup");
const rater_signup = require("./code/js/rater/rater_signup");
const login = require("./code/js/auth/login");
const auth_utils = require("./code/js/auth/utils");

//requests
const add_Child = require("./code/js/parent/child/add_child");
const parent_child_utils = require("./code/js/parent/child/utils");
const Questionaire_Diagnosis = require("./code/js/parent/Diagnosis/questionaire/submit_questions");
const Video_Diagnosis = require("./code/js/parent/Diagnosis/video/submit_video");
const visual_schedule = require("./code/js/parent/assistance/visual_schedule/visual_schedule");
const visual_schedule_utils = require("./code/js/parent/assistance/visual_schedule/utils");
const rater_Question_utils = require("./code/js/rater/question/utils");
const submit_rater_test_question = require("./code/js/rater/question/submit_rater_test_question");
const submit_video_rating = require("./code/js/rater/video/submit_video_rating");

//utils
const parent_utils = require("./code/js/parent/utils");
const submit_result_ML = require("./code/js/to_py/data_toML_model");
const questionaire_utilities = require("./code/js/parent/Diagnosis/questionaire/utilities");
const video_utilities = require("./code/js/parent/Diagnosis/video/utilities");
const diagnosis_utilities = require("./code/js/parent/Diagnosis/utils");
const rater_utils = require("./code/js/rater/utils");

//server utils
const vl = require("./code/js/utils/validation");
const server_utils = require("./code/js/utils/generateLoginCode");
const input_modifi_handler = require("./code/js/utils/inputHandler");

//------------------------------ app.use() session --------------------------------
//Intiate Server App
var app = express();
//enable cross origin request
const corsConfig = {
  origin: true,
  credentials: true,
};
//app.use(cors());
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));
app.use(cookieParser());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,UPDATE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  next();
});

//Parses Request Body - TO DO LOOK INTO TWO BODY PARSER EFFECT
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//define session variables
app.use(
  session({
    store: new FileStore(),
    secret: "Shh, its a secret!",
    resave: true,
    saveUninitialized: true,
    cookie: { httpOnly: false },
  })
);
//passport local strategy definition
passport.use(
  new LocalStrategy(
    {
      usernameField: "auth_method",
      passwordField: "password",
      passReqToCallback: true,
    },
    function (req, auth_method, password, done) {
      var response = {
        auth_method: auth_method,
        password: password,
        table: req.body.table,
      };
      login.login(response).then((user) => {
        if (user.result) {
          user.result.table = req.body.table;
          return done(null, user);
        } else return done(null, false, { message: user.details });
      });
    }
  )
);
//intialize passport
app.use(passport.initialize());
//define passport session
app.use(passport.session());

//------------------------------ Other internal function session --------------------------------
//intialize serialize passport function
passport.serializeUser(function (user, done) {
  var auth_method = user.result.email;
  var type;

  if (user.result.child_code) {
    auth_method = user.result.child_code;
    type = "child_code";
  }
  done(null, {
    auth_method: auth_method,
    table: user.result.table,
    type: type,
  });
});
//intialize deserialize passport function
passport.deserializeUser(function (auth_data, done) {
  auth_utils.user_utils
    .getuserData(
      { auth_method: auth_data.auth_method, type: auth_data.type },
      auth_data.table
    )
    .then((userdata) => {
      done(null, userdata.result);
    });
});

//------------------------------ Our internal function session --------------------------------
function set_passwordValidation(validation_list) {
  //check if password in valid format or not
  vl.validation.setpasswordValidator(validation_list);
}
//convert bytes to mb
function formatBytes(a, b) {
  if (0 == a) return "0 Bytes";
  var c = 1024,
    d = b || 2,
    e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    f = Math.floor(Math.log(a) / Math.log(c));
  return parseFloat((a / Math.pow(c, f)).toFixed(d)) + " " + e[f];
}

//set password validation rules
set_passwordValidation(["min", "max"]);

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

app.use(
  "/api-docs",
  function (req, res, next) {
    swaggerDocument.host = req.get("host");
    req.swaggerDoc = swaggerDocument;
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup()
);

//--------------------------------------------- user handler requests session -----------------------------------------------
//------------------------------ auth requests --------------------------------
//login request
app.post("/login", function (req, res, next) {
  console.log("request login recieved");
  console.log(req.body);
  req.body = {
    auth_method: req.body.email,
    password: req.body.password,
    table: "parent",
  };
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.send(info.message);
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      console.log(user.details);
      return res.send(user.details);
    });
  })(req, res, next);
});

//signup request
app.post("/signup", function (req, res) {
  console.log("request signup recieved");
  console.log(req.body);
  // Prepare output in JSON format
  response = {
    parent_id: "",
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password,
    Birth_Date: new Date(req.body.date),
    gender: req.body.gender,
    country: req.body.country,
  };

  signup.signup(response).then((value) => {
    console.log(value);
    res.send(value);
  });
});

//logout
app.get("/logout", function (req, res) {
  console.log("request logout recieved");
  req.logout();
  res.send({ success: true });
});

//------------------------------ user normal requests --------------------------------
//generate child code
app.post("/generate_child_code", function (req, res) {
  console.log("request generate_child_code recieved");
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  res.send({
    success: true,
    child_code: server_utils.serverUtils.generateLoginCode(),
  });
});

//add Child request
app.post("/addchild", function (req, res) {
  console.log("request addchild recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  response = {
    child_id: "",
    child_code: req.body.child_code,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    Birth_Date: new Date(req.body.date),
    gender: req.body.gender,
    parent_id: req.user.parent_id,
  };
  add_Child.add_child(response).then((value) => {
    console.log(value);
    res.send(value);
  });
});

//gel all child data
app.post("/get_all_child_data", function (req, res) {
  console.log("request get_all_child_data recieved");
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  parent_child_utils.parent_child_utils
    .getallChild_to_parent_Data({ parent_uuid: req.user.parent_id })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//gel child data
app.post("/get_child_data", function (req, res) {
  console.log("request get_child_data recieved");
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  if (Object.keys(req.body).length > 1) {
    res.send({
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    });
    return;
  }
  //validator
  response = {
    child_code: req.body.child_code,
    parent_uuid: req.user.parent_id,
  };
  parent_child_utils.parent_child_utils
    .getChild_Data(response)
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//modifi child data
app.post("/modifi_child_data", function (req, res) {
  console.log("request modifi_child_data recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  if (
    req.body.hasOwnProperty("child_id") ||
    req.body.hasOwnProperty("parent_id")
  ) {
    res.send({
      success: false,
      message: "You can't change this columns in db",
      errors: ["Something wrong in the input"],
    });
    return;
  }

  response = input_modifi_handler.handler.itemName_jsonHandler(
    req.body,
    "child"
  );

  delete response.child_code;

  //contain date
  if (response.hasOwnProperty("date")) {
    response.Birth_Date = new Date(req.body.date);
  }

  parent_child_utils.parent_child_utils
    .modifichildData({
      parent_uuid: req.user.parent_id,
      child_code: req.body.child_code,
      data: response,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//remove child
app.post("/remove_child", function (req, res) {
  console.log("request remove_child recieved");
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  if (Object.keys(req.body).length > 1) {
    res.send({
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    });
    return;
  }

  //validator
  response = {
    child_code: req.body.child_code,
    parent_uuid: req.user.parent_id,
  };

  parent_child_utils.parent_child_utils.remove_child(response).then((value) => {
    console.log(value);
    res.send(value);
  });
});

//------------------------------ Diagnosis requests --------------------------------
//get all parent questionnaire data
app.post("/get_all_diagnosis_data", function (req, res) {
  console.log("request get_all_diagnosis_data recieved");
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  diagnosis_utilities.diagnosis_utils
    .getallDiagnosis_Data({
      parent_id: req.user.parent_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});
//-------------------------- Questionaire requests ---------------------------
//Submit Quationaire Diagnosis Method Answer request
app.post("/submit_questionnaire", function (req, res) {
  console.log("request submit_questionaire recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  response = {
    parent_id: req.user.parent_id,
    child_code: req.body.child_code,
    date: new Date(),
    time: new Date().toLocaleTimeString(),
    answers: req.body.answers.toString(),
  };
  Questionaire_Diagnosis.submit_questions(response).then((value) => {
    if (value.success) {
      //get questionaire first before return
      uuid = value.questionaire_id;
      queue_uuid = value.queue_id;
      delete value.queue_id;
      //res send sucess to client and start work at backend
      console.log(value);
      res.send(value);
      res.end();
      // now if it sucess give answer to model and wait for response
      response = {
        file_name: "./code/py/diag/test.py",
        table_name: "questionaire",
        queue_table: "diagnosis_process_queue",
        questionaire_id: uuid,
        answers: response.answers,
        queue_id: queue_uuid,
        model_type: req.body.model_type,
      };
      submit_result_ML.data_toML_model(response);
    } else res.send(value);
  });
});

//-------------------------- Questionaire utils ---------------------------
//get pdf request
app.get("/get_questionaire_report_pdf", function (req, res) {
  console.log("request get_questionaire_report_pdf recieved");
  req.body = req.query;
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  response = {
    table: "questionaire",
    questionaire_id: req.body.questionaire_id,
  };

  questionaire_utilities.questionaire_utilities
    .get_pdf_res(response)
    .then((value) => {
      if (!value.success) {
        console.log(value);
        res.send(value);
        res.end();
      } else {
        console.log(value);
        console.log("sending file");
        var file = fs.createReadStream(value.result);
        file.pipe(res);
        console.log("done");
      }
    });
});

//get pdf request
app.post("/get_questionaire_report_pdf_app", function (req, res) {
  console.log("request get_questionaire_report_pdf_app recieved");
  console.log(req.body);
  response = {
    table: "questionaire",
    questionaire_id: req.body.questionaire_id,
  };

  questionaire_utilities.questionaire_utilities
    .get_pdf_res(response)
    .then((value) => {
      if (!value.success) {
        console.log(value);
        res.send(value);
        res.end();
      } else {
        console.log(value);
        console.log("sending file");
        pdf2base64(value.result)
          .then((response) => {
            res.send(response); //cGF0aC90by9maWxlLmpwZw==
          })
          .catch((error) => {
            console.log(error); //Exepection error....
          });
        console.log("done");
      }
    });
});

//get all parent questionnaire data
app.post("/get_all_questionnaire_data", function (req, res) {
  console.log("request get_all_questionnaire_data recieved");
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  questionaire_utilities.questionaire_utilities
    .get_all_quetionaire({
      parent_uuid: req.user.parent_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get all parent questionaire data for current child
app.post("/get_child_questionaire_data", function (req, res) {
  console.log("request get_child_questionaire_data recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  if (Object.keys(req.body).length > 1) {
    res.send({
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    });
    return;
  }

  questionaire_utilities.questionaire_utilities
    .get_all_quetionaire_for_child({
      parent_uuid: req.user.parent_id,
      child_code: req.body.child_code,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get selected questionaire data
app.post("/get_selected_questionaire_data", function (req, res) {
  console.log("request get_selected_questionaire_data recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  if (Object.keys(req.body).length > 1) {
    res.send({
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    });
    return;
  }

  questionaire_utilities.questionaire_utilities
    .get_selected_quetionaire({
      parent_uuid: req.user.parent_id,
      questionaire_id: req.body.questionaire_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//-------------------------- Video requests ---------------------------
//Submit Video Diagnosis Method
app.post("/submit_video", function (req, res) {
  console.log("request submit_video recieved");
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  console.log("Starting recieving video ....");
  // create an incoming form object
  var form = new formidable.IncomingForm();
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  form.uploadDir = "./assets/video/";
  form.maxFileSize = 200 * 1024 * 1024; //200Mb limit file size
  var video_data = {};

  // file extension restriction
  form.onPart = function (part) {
    if (
      !part.filename ||
      part.filename.match(/\.(mp4|flv|avi|webm|mkv|pdf|text|docx|rar)$/i)
    ) {
      this.handlePart(part);
    } else {
      console.log(part.filename + " is not allowed");
    }
  };

  // rename it to it's orignal name
  form.on("file", function (field, file) {
    video_data.path = file.path;
    video_data.dir = form.uploadDir;
    video_data.name = file.name;
    video_data.type = file.type;
    if (video_data.type == "video/x-matroska") {
      video_data.type = "video/mp4";
    }
  });

  form.on("progress", function (bytesReceived, bytesExpected) {
    var progress = {
      type: "progress",
      MbytesReceived: formatBytes(bytesReceived),
      MbytesExpected: formatBytes(bytesExpected),
    };
    console.log(progress);
  });

  // log any errors that occur
  form.on("error", function (err) {
    console.log("An error has occured: \n" + err);
    res.status(413).send({
      success: false,
      message: err,
      errors: [err],
    });
    req.socket.end();
    return;
  });
  // once all the files have been uploaded, send a response to the client
  form.on("end", function () {
    console.log("done");
  });

  // parse the incoming request containing the form data
  form.parse(req, (err, fields, files) => {
    console.log(JSON.stringify(fields));
    response = {
      parent_id: req.user.parent_id,
      child_code: fields.child_code,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      video_path: video_data,
    };

    Video_Diagnosis.submit_video(response).then((value) => {
      if (value.success) {
        //get questionaire first before return
        uuid = value.video_id;
        queue_uuid = value.queue_id;
        delete value.queue_id;
        //res send sucess to client and start work at backend
        console.log(value);
        res.send(value);
        res.end();

        current_date = new Date();
        response = {
          video_id: uuid,
          date_time: new Date(
            current_date.getFullYear() +
              "-" +
              (current_date.getMonth() + 1) +
              "-" +
              current_date.getDate() +
              " " +
              current_date.getHours() +
              ":" +
              current_date.getMinutes() +
              ":" +
              current_date.getSeconds()
          ),
        };

        video_utilities.video_utilities
          .set_video_queue(response)
          .then((value) => {
            console.log(value);
          });

        // rename it to it's orignal name
        fs.rename(
          video_data.path,
          form.uploadDir + uuid + "." + video_data.type.split("/").pop(),
          (err) => {
            if (err) throw { err };
            else {
              console.log("Rename complete!");
            }
          }
        );
      } else {
        res.send(value);
      }
    });
  });
});

//-------------------------- Video utils ---------------------------
//get all parent video data
app.post("/get_all_video_data", function (req, res) {
  console.log("request get_all_video_data recieved");
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  video_utilities.video_utilities
    .get_all_video({ parent_uuid: req.user.parent_id })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get all parent video data for current child
app.post("/get_child_video_data", function (req, res) {
  console.log("request get_child_video_data recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  if (Object.keys(req.body).length > 1) {
    res.send({
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    });
    return;
  }

  video_utilities.video_utilities
    .get_all_video_for_child({
      parent_uuid: req.user.parent_id,
      child_code: req.body.child_code,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get selected video data
app.post("/get_video_data", function (req, res) {
  console.log("request get_video_data recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  if (Object.keys(req.body).length > 1) {
    res.send({
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    });
    return;
  }

  video_utilities.video_utilities
    .get_selected_video({
      parent_uuid: req.user.parent_id,
      video_id: req.body.video_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//------------------------- Assistance requests ---------------------------
//add_task
app.post("/add_task", function (req, res) {
  console.log("request add_task recieved");
  console.log(req.body);

  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  // create an incoming form object
  var form = new formidable.IncomingForm();
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  form.uploadDir = "./assets/image/visual_schedule/";
  form.maxFileSize = 2 * 1024 * 1024; //200Mb limit file size
  var image_data = {};

  // file extension restriction
  form.onPart = function (part) {
    if (!part.filename || part.filename.match(/\.(jpeg|jpg|png|gif|tiff)$/i)) {
      this.handlePart(part);
    } else {
      console.log(part.filename + " is not allowed");
    }
  };

  // rename it to it's orignal name
  form.on("file", function (field, file) {
    image_data.path = file.path;
    image_data.dir = form.uploadDir;
    image_data.name = file.name;
    image_data.type = file.type;
  });

  form.on("progress", function (bytesReceived, bytesExpected) {
    var progress = {
      type: "progress",
      MbytesReceived: formatBytes(bytesReceived),
      MbytesExpected: formatBytes(bytesExpected),
    };
    console.log(progress);
  });

  // log any errors that occur
  form.on("error", function (err) {
    console.log("An error has occured: \n" + err);
    res.status(413).send({
      success: false,
      message: err,
      errors: [err],
    });
    req.socket.end();
    return;
  });
  // once all the files have been uploaded, send a response to the client
  form.on("end", function () {
    console.log("done");
  });

  // parse the incoming request containing the form data
  form.parse(req, (err, fields, files) => {
    console.log(JSON.stringify(fields));
    old_fields = fields;
    fields = JSON.parse(fields.fields);
    console.log(fields);
    response = {
      task_data: {
        task_id: "",
        start_date_time: new Date(fields.date + " " + fields.time),
        name: fields.name,
        duration: fields.duration,
        repeat: fields.repeat,
      },
      parent_uuid: req.user.parent_id,
      child_uuid: fields.child_id,
      image_path: image_data,
    };

    current_date = new Date();

    if (
      new Date(fields.date + " " + fields.time).getTime() <
      current_date.getTime()
    ) {
      console.log("you can't do that");
      res.send({
        success: false,
        message: "you can't do that",
      });
      res.end();
      return;
    }

    if (fields.hasOwnProperty("private_tags")) {
      response.private_tags = fields.private_tags;
    }

    if (fields.hasOwnProperty("public_tags")) {
      response.public_tags = fields.public_tags;
    }

    if (fields.hasOwnProperty("until_date_time")) {
      response.task_data.repeat_until = new Date(fields.until_date_time);
    }

    response.task_data.end_date_time = Time.add(
      response.task_data.start_date_time,
      JSON.parse(fields.duration)
    );

    console.log(response);
    visual_schedule.visual_schedule.add_task(response).then((value) => {
      if (value.success) {
        //get task id first before return
        uuid = value.task_id;
        delete value.task_id;

        //res send sucess to client and start work at backend
        console.log(value);
        res.send(value);
        res.end();

        if (Object.keys(response.image_path).length > 0) {
          // rename it to it's orignal name
          fs.rename(
            image_data.path,
            form.uploadDir + uuid + "." + image_data.type.split("/").pop(),
            (err) => {
              if (err) throw { err };
              else {
                console.log("Rename complete!");
              }
            }
          );

          // reduce image quality and resize it
          Jimp.read(
            form.uploadDir + uuid + "." + image_data.type.split("/").pop(),
            (err, image) => {
              if (err) throw err;
              image_width = image.bitmap.width;
              image_heigth = image.bitmap.height;
              if (image_width < image_heigth) {
                image_width = Jimp.AUTO;
                image_heigth = 256;
              } else {
                image_heigth = Jimp.AUTO;
                image_width = 256;
              }

              image
                .resize(image_width, image_heigth) // resize
                .quality(60) // set JPEG quality
                .write("./assets/image/visual_schedule/" + uuid + "_r.jpg"); // save
            }
          );
        }
      } else {
        res.send(value);
      }
    });
  });
});

//add_tag
app.post("/add_tag", function (req, res) {
  console.log("request add_tag recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  response = {
    tag_id: "",
    parent_id: req.user.parent_id,
    name: req.body.name.toLowerCase(),
  };

  visual_schedule.visual_schedule.add_tag(response).then((value) => {
    console.log(value);
    res.send(value);
  });
});
//-------------------- Assistance utils ----------------------
//gel all tasks
app.post("/get_all_tasks_data", function (req, res) {
  console.log("request get_all_tasks_data recieved");
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  visual_schedule_utils.visual_schedule_utils
    .getallTasks_Data({
      parent_uuid: req.user.parent_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//gel all parent tags
app.post("/get_all_parent_tag_data", function (req, res) {
  console.log("request get_all_tasks_data recieved");
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  visual_schedule_utils.visual_schedule_utils
    .getallParentTag_Data({
      parent_uuid: req.user.parent_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//gel all tasks in time frame
app.post("/get_all_tasks_in_timeFrame", function (req, res) {
  console.log("request get_all_tasks_in_timeFrame recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  current_date = new Date();
  if (
    !req.body.hasOwnProperty("start_date") ||
    !req.body.hasOwnProperty("end_date")
  ) {
    req.body.start_date =
      current_date.getFullYear() +
      "-" +
      (current_date.getMonth() + 1) +
      "-" +
      current_date.getDate();

    req.body.end_date = req.body.start_date;
  }

  if (!req.body.hasOwnProperty("start_time")) {
    req.body.start_time = "00:00:00";
  }
  if (!req.body.hasOwnProperty("end_time")) {
    req.body.end_time = "23:59:59";
  }

  if (
    Time.diff(
      new Date(req.body.start_date),
      new Date(req.body.end_date),
      "{D}"
    ) > 60
  ) {
    res.send({
      success: false,
      message: "sorry time frame is too large you have maximum 2 months",
      errors: ["sorry time frame is too large you have maximum 2 months"],
    });
    return;
  }

  response = {
    parent_uuid: req.user.parent_id,
    start_date_time: new Date(req.body.start_date + " " + req.body.start_time),
    end_date_time: new Date(req.body.end_date + " " + req.body.end_time),
  };

  if (req.body.hasOwnProperty("child_id")) {
    response.child_id = req.body.child_id;
  }

  visual_schedule_utils.visual_schedule_utils
    .getallTasksInTime_Frame(response)
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get all parent task data for current child also can make it for child
app.post("/get_all_child_task_data", function (req, res) {
  console.log("request get_all_child_task_data recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  if (Object.keys(req.body).length > 1) {
    res.send({
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    });
    return;
  }

  visual_schedule_utils.visual_schedule_utils
    .getallTasks_Data_for_child({
      parent_id: req.user.parent_id,
      child_id: req.body.child_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get selected task data also can be for chil
app.post("/get_selected_task_data", function (req, res) {
  console.log("request get_selected_task_data recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  if (Object.keys(req.body).length > 1) {
    res.send({
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    });
    return;
  }

  visual_schedule_utils.visual_schedule_utils
    .get_selected_Task_Data({
      parent_id: req.user.parent_id,
      task_id: req.body.task_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get pdf request
app.get("/get_task_image", function (req, res) {
  console.log("request get_task_image recieved");
  req.body = req.query;
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  response = {
    task_id: req.body.task_id,
  };
  if (req.body.hasOwnProperty("reduced")) {
    response.reduced = req.body.reduced;
  }
  visual_schedule_utils.visual_schedule_utils
    .getTasks_Image(response)
    .then((value) => {
      if (!value.success) {
        console.log(value);
        res.send(value);
        res.end();
      } else {
        if (value.result == null) {
          return_message = {
            success: true,
            message: "no image for this task",
            errors: ["no image for this task"],
          };
          if (response.reduced == "1") {
            return_message.message = "no reduced image for this task";
            return_message.errors = ["no reduced image for this task"];
          }
          res.send(return_message);
        } else {
          console.log(value);
          console.log("sending file");
          try {
            var file = fs.createReadStream(value.result);
            file.pipe(res);
            console.log("done");
          } catch {
            return_message = {
              success: true,
              message: "no image for this task",
              errors: ["no image for this task"],
            };
            res.send(return_message);
          }
        }
      }
    });
});

//gel all tags
app.post("/search_tag", function (req, res) {
  console.log("request search_tag recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  if (!req.body.hasOwnProperty("name")) {
    req.body.name = "";
  }
  visual_schedule_utils.visual_schedule_utils
    .search_tag({
      parent_uuid: req.user.parent_id,
      name: req.body.name,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//modify task
app.post("/modify_task", function (req, res) {
  console.log("request modify_task recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  // create an incoming form object
  var form = new formidable.IncomingForm();
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  form.uploadDir = "./assets/image/visual_schedule/";
  form.maxFileSize = 2 * 1024 * 1024; //200Mb limit file size
  var image_data = {};

  // file extension restriction
  form.onPart = function (part) {
    if (!part.filename || part.filename.match(/\.(jpeg|jpg|png|gif|tiff)$/i)) {
      this.handlePart(part);
    } else {
      console.log(part.filename + " is not allowed");
    }
  };

  // rename it to it's orignal name
  form.on("file", function (field, file) {
    image_data.path = file.path;
    image_data.dir = form.uploadDir;
    image_data.name = file.name;
    image_data.type = file.type;
  });

  form.on("progress", function (bytesReceived, bytesExpected) {
    var progress = {
      type: "progress",
      MbytesReceived: formatBytes(bytesReceived),
      MbytesExpected: formatBytes(bytesExpected),
    };
    console.log(progress);
  });

  // log any errors that occur
  form.on("error", function (err) {
    console.log("An error has occured: \n" + err);
    res.status(413).send({
      success: false,
      message: err,
      errors: [err],
    });
    req.socket.end();
    return;
  });
  // once all the files have been uploaded, send a response to the client
  form.on("end", function () {
    console.log("done");
  });

  // parse the incoming request containing the form data
  form.parse(req, (err, fields, files) => {
    console.log(JSON.stringify(fields));
    old_fields = fields;
    fields = JSON.parse(fields.fields);
    console.log(fields);

    modified_data = input_modifi_handler.handler.itemName_jsonHandler(
      fields,
      "task"
    );

    delete modified_data.task_id;
    delete modified_data.child_id;
    delete modified_data.public_tags;
    delete modified_data.private_tags;
    delete modified_data.date;
    delete modified_data.time;
    delete modified_data.date_time;
    delete modified_data.edit_type;

    data = {
      parent_id: req.user.parent_id,
      task_id: fields.task_id,
      image_path: image_data,
      data: modified_data,
    };
    /*
    current_date = new Date();

    if (
      new Date(fields.date + " " + fields.time).getTime() <
      current_date.getTime()
    ) {
      console.log("you can't do that");
      res.send({
        success: false,
        message: "you can't do that",
      });
      res.end();
      return;
    }
    */

    if (fields.hasOwnProperty("private_tags")) {
      data.private_tags = fields.private_tags;
    }

    if (fields.hasOwnProperty("public_tags")) {
      data.public_tags = fields.public_tags;
    }

    if (fields.hasOwnProperty("child_id")) {
      data.child_id = fields.child_id;
    }

    if (fields.hasOwnProperty("child_id")) {
      data.child_id = fields.child_id;
    }

    if (fields.hasOwnProperty("date") && fields.hasOwnProperty("time")) {
      data.data.start_date_time = new Date(fields.date + " " + fields.time);
    }

    if (
      fields.hasOwnProperty("duration") &&
      (fields.hasOwnProperty("date") || fields.hasOwnProperty("time"))
    ) {
      data.data.end_date_time = Time.add(
        data.data.start_date_time,
        JSON.parse(fields.duration)
      );
    }

    if (fields.hasOwnProperty("edit_type")) {
      data.modify_type = fields.edit_type;
      if (fields.hasOwnProperty("date_time")) {
        data.date_time = new Date(fields.date_time);
      } else {
        res.send({
          success: false,
          message:
            "date_time is require field if you wanna edit version of task",
          errors: ["date_time missing"],
        });
        res.end();
      }
    }

    if (Object.keys(data.image_path).length > 0) {
      data.data.image_path =
        data.image_path.dir +
        fields.task_id +
        "." +
        data.image_path.type.split("/").pop();
    }

    if (
      old_fields.hasOwnProperty("file") &&
      JSON.parse(old_fields.file) == null
    ) {
      data.data.image_path = null;
    }
    visual_schedule_utils.visual_schedule_utils
      .modifyTask(data)
      .then((value) => {
        console.log(value);
        res.send(value);
        res.end();

        if (Object.keys(data.image_path).length > 0) {
          // rename it to it's orignal name
          fs.rename(
            image_data.path,
            form.uploadDir +
              fields.task_id +
              "." +
              image_data.type.split("/").pop(),
            (err) => {
              if (err) throw { err };
              else {
                console.log("Rename complete!");
              }
            }
          );

          // reduce image quality and resize it
          Jimp.read(
            form.uploadDir +
              fields.task_id +
              "." +
              image_data.type.split("/").pop(),
            (err, image) => {
              if (err) throw err;
              image_width = image.bitmap.width;
              image_heigth = image.bitmap.height;
              if (image_width < image_heigth) {
                image_width = Jimp.AUTO;
                image_heigth = 256;
              } else {
                image_heigth = Jimp.AUTO;
                image_width = 256;
              }

              image
                .resize(image_width, image_heigth) // resize
                .quality(60) // set JPEG quality
                .write(
                  "./assets/image/visual_schedule/" + fields.task_id + "_r.jpg"
                ); // save
            }
          );
        }
      });
  });
});

//remove task
app.post("/remove_task", function (req, res) {
  console.log("request remove_task recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  if (Object.keys(req.body).length > 3) {
    res.send({
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    });
    return;
  }

  response = {
    task_id: req.body.task_id,
  };

  if (req.body.hasOwnProperty("deletion_type")) {
    //0 -> ana bas , 1 -> ana wa kol aly ba3dy
    response.deletion_type = req.body.deletion_type;
    if (req.body.hasOwnProperty("date_time")) {
      response.date_time = new Date(req.body.date_time);
    }
  }

  console.log(response);

  visual_schedule_utils.visual_schedule_utils
    .removeTask(response)
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});
//------------------------------ user utils requests --------------------------------
//get parent data
app.post("/get_user_data", function (req, res) {
  console.log("request get_user_data recieved");
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  parent_utils.user_utils
    .getuserData({ parent_id: req.user.parent_id })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//modifi parent data
app.post("/modifi_user_data", function (req, res) {
  console.log("request modifi_user_data recieved");
  console.log(req.body);
  if (!req.user) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  if (
    req.body.hasOwnProperty("parent_id") ||
    req.body.hasOwnProperty("email")
  ) {
    res.send({
      success: false,
      message: "You can't change this columns in db",
      errors: ["Something wrong in the input"],
    });
    return;
  }

  response = input_modifi_handler.handler.itemName_jsonHandler(
    req.body,
    "parent"
  );

  //contain date
  if (response.hasOwnProperty("date")) {
    response.Birth_Date = new Date(req.body.date);
  }

  parent_utils.user_utils
    .modifiuserData({ parent_id: req.user.parent_id, data: response })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//--------------------------------------------- child handler requests session -----------------------------------------------
//------------------------------- auth requests -------------------------------
//login child request
app.post("/loginChild", function (req, res, next) {
  console.log("request login child recieved");
  console.log(req.body);
  req.body = {
    auth_method: req.body.child_code,
    password: " ",
    table: "child",
  };
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      console.log(info);
      return res.send(info.message);
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      console.log(user.details);
      return res.send(user.details);
    });
  })(req, res, next);
});

//logout
app.get("/logout_child", function (req, res) {
  console.log("request logout_child recieved");
  if (!req.user || req.user.acc_type != "child") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  req.logout();
  res.send({ success: true });
});
//------------------------------- child requests -------------------------------
//get all parent task data for current child also can make it for child
app.post("/get_all_task_for_child", function (req, res) {
  console.log("request get_all_child_task_data_for_child from child recieved");
  console.log(req.body);
  if (!req.user || req.user.acc_type != "child") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  parent_child_utils.parent_child_utils
    .getallTasks_Data_for_child({
      parent_id: req.user.parent_id,
      child_id: req.user.child_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//gel all tasks in time frame
app.post("/get_all_tasks_for_child_in_timeFrame", function (req, res) {
  console.log(
    "request get_all_tasks_for_child_in_timeFrame from child recieved"
  );
  if (!req.user || req.user.acc_type != "child") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  current_date = new Date();
  if (
    !req.body.hasOwnProperty("start_date") |
    !req.body.hasOwnProperty("end_date")
  ) {
    req.body.start_date =
      current_date.getFullYear() +
      "-" +
      (current_date.getMonth() + 1) +
      "-" +
      current_date.getDate();

    req.body.end_date = req.body.start_date;
  }

  if (!req.body.hasOwnProperty("start_time")) {
    req.body.start_time = "00:00:00";
  }
  if (!req.body.hasOwnProperty("end_time")) {
    req.body.end_time = "23:59:59";
  }
  parent_child_utils.parent_child_utils
    .getallTasksInTime_Frame({
      parent_id: req.user.parent_id,
      start_date_time: new Date(
        req.body.start_date + " " + req.body.start_time
      ),
      end_date_time: new Date(req.body.end_date + " " + req.body.end_time),
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//finish task set task id that sent from child done in database
app.post("/finish_task", function (req, res) {
  console.log("request finish_task from child recieved");
  console.log(req.body);
  if (!req.user || req.user.acc_type != "child") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  parent_child_utils.parent_child_utils
    .finishTask({
      task_id: req.body.task_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//--------------------------------------------- rater handler requests session -----------------------------------------------
//------------------------------- auth requests -------------------------------
//login
app.post("/login_rater", function (req, res, next) {
  console.log("request login_rater recieved");
  console.log(req.body);
  req.body = {
    auth_method: req.body.email,
    password: req.body.password,
    table: "rater",
  };
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.send(info.message);
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      console.log(user.details);
      return res.send(user.details);
    });
  })(req, res, next);
});

//signup request
app.post("/signup_rater", function (req, res) {
  console.log("request rater_signup recieved");
  console.log(req.body);
  // Prepare output in JSON format
  response = {
    rater_id: "",
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password,
    birth_date: new Date(req.body.date),
    gender: req.body.gender,
    country: req.body.country,
    views: 0,
    in_queue: 0,
    state_id: "",
  };

  if (req.body.hasOwnProperty("phone_number")) {
    response.phone_number = req.body.phone_number;
  }
  if (req.body.hasOwnProperty("ssn")) {
    response.ssn = req.body.ssn;
  }
  rater_signup.rater_signup(response).then((value) => {
    console.log(value);
    res.send(value);
  });
});

//logout
app.get("/logout_rater", function (req, res) {
  console.log("request logout_rater recieved");
  if (!req.user || req.user.acc_type != "rater") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  req.logout();
  res.send({ success: true });
});

//------------------------------- rater requests -------------------------------
//get parent data
app.post("/get_rater_data", function (req, res) {
  console.log("request get_user_data recieved");
  if (!req.user || req.user.acc_type != "rater") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  rater_utils.rater_utils
    .getraterData({ rater_id: req.user.rater_id })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//gel set of questions
app.post("/get_question_set", function (req, res) {
  console.log("request get_question_set recieved");
  if (!req.user || req.user.acc_type != "rater") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  rater_Question_utils.rater_question_utils
    .getallQuestion_in_set_Data({
      rater_id: req.user.rater_id,
      state_id: req.user.state_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//handle ansam formate
function question_answers_input_handler(question_answers) {
  question_answers = JSON.stringify(question_answers);
  question_answers = question_answers.replace("{", "");
  question_answers = question_answers.replace("}", "");
  question_answers = question_answers.split(',"');

  const answers_array = question_answers.map((answer) => {
    //remove " from whole string 4 because we have 4 " in string
    for (i = 0; i < 4; i++) answer = answer.replace('"', "");
    var temp = answer.split(":");
    return JSON.stringify({ question_id: temp[0], question_answer: temp[1] });
  });

  return answers_array;
}

//submit_test_question
app.post("/submit_test_question", function (req, res) {
  console.log("request submit_test_question recieved");
  console.log(req.body);
  if (!req.user || req.user.acc_type != "rater") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }

  req.body.question_answers = question_answers_input_handler(
    req.body.question_answers
  );
  current_date = new Date();
  response = {
    rater_id: req.user.rater_id,
    set_id: req.body.set_id,
    date_time: new Date(
      current_date.getFullYear() +
        "-" +
        (current_date.getMonth() + 1) +
        "-" +
        current_date.getDate() +
        " " +
        current_date.getHours() +
        ":" +
        current_date.getMinutes() +
        ":" +
        current_date.getSeconds()
    ),
    question_answers: JSON.parse("[" + req.body.question_answers + "]"), // "["+ --- + "]" only for post man need to change for ansam
  };

  console.log(response.question_answers);

  submit_rater_test_question
    .submit_rater_test_questions(response)
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get_rater_video_id
app.post("/get_rater_video_id", function (req, res) {
  console.log("request get_rater_video_id recieved");
  if (!req.user || req.user.acc_type != "rater") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  rater_utils.rater_utils
    .getraterVideoID({ rater_id: req.user.rater_id })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get_rater_state
app.post("/get_rater_state", function (req, res) {
  console.log("request get_rater_state recieved");
  if (!req.user || req.user.acc_type != "rater") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  rater_utils.rater_utils
    .getraterState({ state_id: req.user.state_id })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get_test_result
app.post("/get_rater_test_result", function (req, res) {
  console.log("request get_rater_test_result recieved");
  if (!req.user || req.user.acc_type != "rater") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  rater_Question_utils.rater_question_utils
    .getTest_result({ rater_id: req.user.rater_id, type: req.body.type })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//for dev mode
//update_rater_state
app.post("/update_rater_state", function (req, res) {
  console.log("request update_rater_state recieved");
  if (!req.user || req.user.acc_type != "rater") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  rater_utils.rater_utils
    .updateraterState({
      rater_id: req.user.rater_id,
      state_case: req.body.state_case,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

app.post("/pass_training_state", function (req, res) {
  console.log("request pass_training_state recieved");
  if (!req.user || req.user.acc_type != "rater") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  rater_utils.rater_utils
    .passratertrainingState({
      rater_id: req.user.rater_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get_rater_video queue number request
app.post("/get_rater_videos_number", function (req, res) {
  console.log("request get_rater_videos_number recieved");
  if (
    (!req.user &&
      req.user.state_id != "921849ab-be04-4135-a0e2-2a22949bff0f") ||
    req.user.acc_type != "rater"
  ) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  rater_utils.rater_utils
    .getraterVideosNumber({
      rater_id: req.user.rater_id, //req.user.rater_id,
    })
    .then((value) => {
      console.log(value);
      res.send(value);
    });
});

//get_rater_video request
app.get("/get_rater_next_video", function (req, res) {
  console.log("request get_rater_next_video recieved");
  if (!req.user || req.user.acc_type != "rater") {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  rater_utils.rater_utils
    .getraterVideoPath({
      rater_id: req.user.rater_id,
    })
    .then((value) => {
      if (!value.success) {
        console.log(value);
        res.send(value);
        res.end();
      } else {
        console.log(value);
        console.log("sending video to rater...");
        value.result.video_path = value.result.video_path.replace(".", "");
        res.sendFile(__dirname + value.result.video_path);
        console.log("done");
      }
    });
});

//submit_video_rate
app.post("/submit_video_rate", function (req, res) {
  console.log("request submit_video_rate recieved");
  console.log(req.body);
  if (
    (!req.user &&
      req.user.state_id != "921849ab-be04-4135-a0e2-2a22949bff0f") ||
    req.user.acc_type != "rater"
  ) {
    res.send({
      success: false,
      message: "don't have permission in db",
      errors: ["Please log in first"],
    });
    return;
  }
  current_date = new Date();
  response = {
    rater_id: req.user.rater_id,
    video_id: req.body.videoID,
    video_rate: 7, //req.body.video_rate,
    date_time: new Date(
      current_date.getFullYear() +
        "-" +
        (current_date.getMonth() + 1) +
        "-" +
        current_date.getDate() +
        " " +
        current_date.getHours() +
        ":" +
        current_date.getMinutes() +
        ":" +
        current_date.getSeconds()
    ),
  };

  submit_video_rating.submit_video_rating(response).then((value) => {
    console.log(value);
    res.send(value);
  });
});

//------------------------------ Other handler requests session --------------------------------
//defaullt request handler
app.get("/", function (req, res) {
  console.log(req.user);
  if (req.user) {
    res.send("You visited this page " + " times");
  } else {
    res.send("Welcome to this page for the first time!");
  }
});

app.post("/register", function (req, res) {
  console.log("register request recieved");
  console.log(req);
  res.send("a7la mesa 3alek XD");
});

app.get("/get_source_ip", function (req, res) {
  console.log(req.connection.remoteAddress);
  console.log(req.headers["x-forwarded-for"]);
  if (req.user) {
    res.send("You visited this page " + req.user.email + " times");
  } else {
    res.send("Welcome to this page for the first time!");
  }
});

//upload request
app.post("/upload", (req, res) => {
  console.log("request upload recieved");

  // create an incoming form object
  var form = new formidable.IncomingForm();
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  form.uploadDir = __dirname + "/public/uploads/";
  form.maxFileSize = 200 * 1024 * 1024;

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on("file", function (field, file) {
    fs.rename(file.path, __dirname + "/public/uploads/" + file.name, (err) => {
      if (err) throw err;
      console.log("Rename complete!");
    });
  });

  form.on("progress", function (bytesReceived, bytesExpected) {
    var progress = {
      type: "progress",
      MbytesReceived: formatBytes(bytesReceived),
      MbytesExpected: formatBytes(bytesExpected),
    };
    console.log(progress);
  });

  // log any errors that occur
  form.on("error", function (err) {
    console.log("An error has occured: \n" + err);
    res.status(413).send({
      success: false,
      message: err,
      errors: [err],
    });
    req.socket.end();
    return;
  });
  // once all the files have been uploaded, send a response to the client
  form.on("end", function () {
    console.log("done");
    res.end("success");
  });
  // parse the incoming request containing the form data
  //form.parse(req);
  form.parse(req, (err, fields, files) => {
    console.log("fields:", JSON.stringify(fields));
    console.log("files:", files);
  });
});

//get all parent task data for current child also can make it for child
app.post("/send_data", function (req, res) {
  console.log("request send_data recieved");
  console.log(req.body);
  res.send(req.body);
});

//------------------------------ Server session --------------------------------
//server listner
const port = process.env.PORT || 5000;
var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);
});

module.exports = server;
