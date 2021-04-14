var app = require("../index");
var chai = require("chai");
var request = require("supertest");

var expect = chai.expect;

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

describe("Public Requests Server Testing", () => {
  describe("Check Conenction", function() {
    it("should return default page", function(done) {
      request(app)
        .get("/")
        .end(function(err, res) {
          expect(res.statusCode).to.equal(200);
          expect(res.text).to.be.equal(
            "Welcome to this page for the first time!"
          );
          expect(res.body).to.be.empty;
          done();
        });
    });
  });

  describe("Sign Up Valid Input", () => {
    // Test to get all students record
    const req = {
      first_name: "test",
      last_name: "test",
      email: uuidv4() + "@gmail.com",
      password: "elmomes_",
      gender: "M",
      country: "Egypt",
      date:"1997-06-17"
    };

    it("should sign up a new account", done => {
      request(app)
        .post("/signup")
        .send(req)
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          expect(res.body.success).to.equal(true);

          done();
        });
    });
  });

  describe("Sign Up Missing Input", () => {
    // Test to get all students record
    const req = {
      first_name: "test",
      last_name: "test",
      email: uuidv4() + "@gmail.com",
      password: "elmomes_",
      gender: "M",
      country: "Egypt",
      date:"1997-06-17"
    };
    invalid_vals = ["", null];
    for (var key in req) {
      for (var invalid in invalid_vals) {
        new_req = req;
        new_req[key] = invalid;

        it("should fail to sign up a new account", done => {
          request(app)
            .post("/signup")
            .send(new_req)
            .end((err, res) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.success).to.equal(false);
              done();
            });
        });
      }
    }
  });

  describe("Login Valid Input", () => {
    // Test to get all students record
    const login_req = {
      email: "momenkoprossy1@gmail.com",
      password: "elmomes_"
    };

    it("should login into new account", done => {
      request(app)
        .post("/login")
        .send(login_req)
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          expect(res.body.success).to.equal(true);
          done();
        });
    });
  });
});

describe("Child Generation and Creation", function() {
  describe("Generate Child Code", () => {
    // Test to get all students record
    const login_req = {
      email: "momenkoprossy1@gmail.com",
      password: "elmomes_"
    };
    var cookie;

    it("Generate Child Code", done => {
      request(app)
        .post("/login")
        .send(login_req)
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          expect(res.body.success).to.equal(true);
          cookie = res.headers["set-cookie"];
          console.log(cookie);
          request(app)
            .post("/generate_child_code")
            .set("cookie", cookie)
            .end((err, res) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.success).to.equal(true);
              done();
            });
        });
    });
  });

  describe("Login Child Code", () => {
    // Test to get all students record
    const login_req = {
      email: "momenkoprossy1@gmail.com",
      password: "elmomes_"
    };
    var cookie;

    it("Generate Child Code", done => {
      request(app)
        .post("/login")
        .send(login_req)
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          expect(res.body.success).to.equal(true);
          cookie = res.headers["set-cookie"];
          request(app)
            .post("/generate_child_code")
            .set("cookie", cookie)
            .end((err, res) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.success).to.equal(true);
              request(app)
                .post("/addchild")
                .set("cookie", cookie)
                .send({
                  child_code: res.body.child_code,
                  first_name: "7amasa",
                  last_name: "7amasa",
                  gender: "male",
                  date:"1997-06-17"
                })
                .end((err, res) => {
                  expect(res.statusCode).to.equal(200);
                  expect(res.body.success).to.equal(true);
                  done();
                });
            });
        });
    });
  });
});

describe("Questionaire", function() {
  describe("Test Questionaire", () => {
    // Test to get all students record
    const login_req = {
      email: "momenkoprossy1@gmail.com",
      password: "elmomes_"
    };
    var cookie;
    it("should submit valid questionaire", done => {
      request(app)
        .post("/login")
        .send(login_req)
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          expect(res.body.success).to.equal(true);
          cookie = res.headers["set-cookie"];
          request(app)
            .post("/submit_questionaire")
            .set("cookie", cookie)
            .send({
              child_code: "AE9O7OIW",
              model_type: "Adult",
              answers: ["Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree"]
            })
            .end((err, res) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.success).to.equal(true);
              done();
            });
        });
    });
  });
});
