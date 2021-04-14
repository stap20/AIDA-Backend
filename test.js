const express = require("express");
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function(req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single("myImage");

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif|pdf/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

const app = express();

app.set("view engine", "ejs");

app.use(express.static("./public"));

app.post("/upload", (req, res) => {
  upload(req, res, err => {
    if (err) {
      res.send(err);
    } else {
      console.log(req.file);
      res.send("test");
    }
  });
});

port = 5000;
app.listen(port, () => console.log(`server listen on port ${port}`));
