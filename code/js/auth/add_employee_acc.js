const db = require("../db/quiries");
const server_utils = require("../utils/generateLoginCode");
const vl = require("../utils/validation");
async function add_employeeAcc(response) {
  const table_name = "employee_account";

  // check login code already exist in database or not
  login_code = server_utils.serverUtils.generateLoginCode();
  exist_res = await db.quiries.isExist(
    table_name,
    {},
    { login_code: login_code }
  );
  while (exist_res) {
    login_code = server_utils.serverUtils.generateLoginCode();
    exist_res = await db.quiries.isExist(
      table_name,
      {},
      { login_code: login_code }
    );
  }
  response.login_code = login_code;
  response.password = vl.validation.hashPassword(response.password)
  // insert user data in data base
  const addworkeracc_query_res = await db.quiries.insert(table_name, response);
  if (addworkeracc_query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"]
    };
  }
  if (!addworkeracc_query_res) {
    return {
      success: false,
      message: "Already exist in db",
      errors: [response.email + " " + "already exists"]
    };
  } else if (addworkeracc_query_res) {
    return { success: true, message: "employee account added successful" };
  }
}

exports.add_employeeAcc = add_employeeAcc;
