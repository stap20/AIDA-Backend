const db = require("../db/quiries");
const vl = require("../utils/validation");

async function signup(response) {
  table_name = "parent";

  errors_list = [];
  //check if email in valid format or not
  const validate_res = vl.validation.isValidEmail(response.email);
  if (!validate_res) {
    errors_list.push("Email isn't in valid fromat");
  }

  var password_validate_res = vl.validation.isValidPassword(response.password);
  if (password_validate_res.length > 0) {
    password_validate_res = vl.validation.correct_password_validationMessage(
      password_validate_res
    );
    errors_list = errors_list.concat(password_validate_res);
  }

  // input errors handler
  if (errors_list.length > 0) {
    return {
      success: false,
      message: "invalid input format",
      errors: errors_list
    };
  }

  // check email already exist in database or not
  const exist_res = await db.quiries.isExist(
    table_name,
    { email: response.email }
  );
  if (exist_res) {
    return {
      success: false,
      message: "Already exist in db",
      errors: [response.email + " " + "already exists"]
    };
  }

  // generate uuid
  const uuid = await db.quiries.uuidGenerator();
  response.parent_id = uuid;
  response.password=vl.validation.hashPassword(response.password)
  response.Birth_Date = new Date(response.Birth_Date);
  // insert user data in data base
  const signup_query_res = await db.quiries.insert(table_name, response);
  if (signup_query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"]
    };
  }
  if (!signup_query_res) {
    return {
      success: false,
      message: "Already exist in db",
      errors: [response.email + " " + "already exists"]
    };
  } else if (signup_query_res) {
    return { success: true, message: "Signup successful" };
  }
}

exports.signup = signup;
