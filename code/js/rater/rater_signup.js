const db = require("../db/quiries");
const vl = require("../utils/validation");

async function rater_signup(response) {
  table_name = "rater";
  state_table = "state";
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

  if (response.hasOwnProperty("ssn") && !vl.validation.ssn_validation(response.ssn)) {
    errors_list = errors_list.concat("invalid ssn");
  }

  if (response.hasOwnProperty("phone_number") && !vl.validation.phone_validation(response.phone_number)) {
    errors_list = errors_list.concat("invalid phone number");
  }

  // input errors handler
  if (errors_list.length > 0) {
    return {
      success: false,
      message: "invalid input format",
      errors: errors_list,
    };
  }

  // check email already exist in database or not
  const exist_res = await db.quiries.isExist(table_name, {
    email: response.email,
  });
  if (exist_res) {
    return {
      success: false,
      message: "Already exist in db",
      errors: [response.email + " " + "already exists"],
    };
  }

  // generate uuid
  const uuid = await db.quiries.uuidGenerator();
  response.rater_id = uuid;
  response.password = vl.validation.hashPassword(response.password);
  response.birth_date = new Date(response.birth_date);

  const get_state_query_res = await db.quiries.getallData(state_table);
  if (get_state_query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  }
  response.state_id = get_state_query_res[0].state_id;
  // insert user data in data base
  const signup_query_res = await db.quiries.insert(table_name, response);
  console.log(signup_query_res);
  if (signup_query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  }
  if (!signup_query_res) {
    return {
      success: false,
      message: "Already exist in db",
      errors: [response.email + " " + "already exists"],
    };
  } else if (signup_query_res) {
    return { success: true, message: "Signup successful" };
  }
}

exports.rater_signup = rater_signup;
