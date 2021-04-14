const db = require("../db/quiries");
const vl = require("../utils/validation");
const user_utils = {
  async getuserData(auth, tablename, password = " ") {
    const table_name = tablename;
    var condition = { email: auth.auth_method };
    if (auth.type === "child_code") {
      condition = { child_code: auth.auth_method };
    }

    // check if user exist data in data base
    check_get_user_query = null;
    get_user_query = await db.quiries.getData(table_name, {}, condition);

    if (get_user_query && password !== " ") {
      check_get_user_query = vl.validation.comparePassword(
        get_user_query.password,
        password
      );
    }

    if (
      (get_user_query === null && check_get_user_query === null) ||
      (!check_get_user_query && password != " ")
    ) {
      return {
        result: null,
        details: {
          success: false,
          message: "Doesn't exist in db",
          errors: ["invalid username or password"],
        },
      };
    } else if (get_user_query && check_get_user_query && password !== " ") {
      get_user_query.acc_type = tablename;
      return {
        result: get_user_query,
        details: {},
      };
    } else if (get_user_query && password === " ") {
      get_user_query.acc_type = tablename;
      return {
        result: get_user_query,
        details: {},
      };
    }
  },

  async getallUserData() {
    table_name = "parent";

    // get all data
    const get_all_users_query = await db.quiries.getallData(table_name);
    console.log(get_all_users_query);
    if (get_all_users_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_all_users_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_all_users_query,
      };
    }
  },
};

exports.user_utils = user_utils;
