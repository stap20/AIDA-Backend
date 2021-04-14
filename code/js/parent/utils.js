const db = require("../db/quiries");
const vl = require("../utils/validation");
const user_utils = {
  async getuserData(response) {
    const table_name = "parent";

    // check if user exist data in data base
    get_user_query = await db.quiries.getData(
      table_name,
      {},
      { parent_id: response.parent_id }
    );

    if (get_user_query == null) {
      return {
        result: null,
        details: {
          success: false,
          message: "Doesn't exist in db",
          errors: ["invalid username or password"]
        }
      };
    } else if (get_user_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_user_query
      };
    }
  },
  async modifiuserData(response) {
    table_name = "parent";

    // check user already exist in database or not
    const exist_res = await db.quiries.isExist(table_name, {
      parent_id: response.parent_id
    });
    if (exist_res === false) {
      return {
        success: false,
        message: "User doesn't exist in db",
        errors: ["User doesn't exist in db"]
      };
    }

    if (response.data.hasOwnProperty("password")) {
      var password_validate_res = vl.validation.isValidPassword(
        response.data.password
      );
      if (password_validate_res.length > 0) {
        password_validate_res = vl.validation.correct_password_validationMessage(
          password_validate_res
        );
        errors_list = errors_list.concat(password_validate_res);
        // input errors handler
        if (errors_list.length > 0) {
          return {
            success: false,
            message: "invalid input format",
            errors: errors_list
          };
        }
      }

      // get user data from database
      const get_data_query = await db.quiries.getData(
        table_name,
        {},
        {
          parent_id: response.parent_id
        }
      );
      check_user_password = vl.validation.comparePassword(
        get_data_query.password,
        response.data.password
      );

      if (check_user_password) {
        return {
          success: false,
          message: "password same in db",
          errors: ["Password can't be same as previous"]
        };
      }
      response.data.password = vl.validation.hashPassword(response.data.password)
    }
    // update user data in data base
    const user_query_res = await db.quiries.modifiData(
      table_name,
      { parent_id: response.parent_id },
      response.data
    );

    //error handler class
    if (user_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"]
      };
    } else if (user_query_res) {
      return {
        success: true,
        message: "modified successful"
      };
    }
  }
};

exports.user_utils = user_utils;
