const db = require("../db/quiries");
const vl = require("../utils/validation");
// Function to generate random number
function randomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const rater_utils = {
  async getraterData(response) {
    const table_name = "rater";

    // check if rater exist data in data base
    const get_rater_query = await db.quiries.getData(
      table_name,
      {},
      { rater_id: response.rater_id }
    );

    if (get_rater_query == null) {
      return {
        result: null,
        details: {
          success: false,
          message: "Doesn't exist in db",
          errors: ["invalid username or password"],
        },
      };
    } else if (get_rater_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_rater_query,
      };
    }
  },
  async getraterState(response) {
    const table_name = "rater";
    const state_table_name = "state";

    // get state relative number from db
    const get_state_query = await db.quiries.getData(
      state_table_name,
      { state_number: 0 },
      { state_id: response.state_id }
    );
    //error handler class
    if (get_state_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (get_state_query == null) {
      return {
        result: null,
        details: {
          success: false,
          message: "Doesn't exist in db",
          errors: ["something wrong on state"],
        },
      };
    } else if (get_state_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_state_query,
      };
    }
  },
  async updateraterState(response) {
    const table_name = "rater";
    const state_table_name = "state";

    // get rater state data
    const get_rater_State_query = await db.quiries.getData(
      table_name,
      { state_id: "" },
      { rater_id: response.rater_id }
    );
    if (get_rater_State_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong on the input"],
      };
    }

    // get all state data
    const get_all_state_query = await db.quiries.getallData(state_table_name);
    if (get_all_state_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong on the input"],
      };
    }

    //get current state for rater
    const current_state = get_all_state_query.find(
      (element) => element.state_id == get_rater_State_query.state_id
    );

    if (current_state.state_number == 0 && response.state_case == 0) {
      return {
        success: true,
        result: "can't demote lower than that!!",
      };
    } else if (current_state.state_number == 3 && response.state_case == 1) {
      return {
        success: true,
        result: "can't promote greater than that!!",
      };
    }
    //this number will be added to current state number to get next state
    var adding_state_number = 0;
    if (response.state_case == 0) {
      adding_state_number = -1;
    } else if (response.state_case == 1) {
      adding_state_number = 1;
    }
    //now update rater state
    const next_state_for_rater = get_all_state_query.find(
      (element) =>
        element.state_number == current_state.state_number + adding_state_number
    );
    // update rater data in data base
    const rater_query_res = await db.quiries.modifiData(
      table_name,
      { rater_id: response.rater_id },
      { state_id: next_state_for_rater.state_id }
    );

    //error handler class
    if (rater_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (rater_query_res) {
      return {
        success: true,
        message: "rater state updated successfully!!",
      };
    }
  },
  async passratertrainingState(response) {
    const table_name = "rater";
    const state_table_name = "state";

    // get rater state data
    const get_rater_State_query = await db.quiries.getData(
      table_name,
      { state_id: "" },
      { rater_id: response.rater_id }
    );
    if (get_rater_State_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong on the input"],
      };
    }

    // get all state data
    const get_all_state_query = await db.quiries.getallData(state_table_name);
    if (get_all_state_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong on the input"],
      };
    }

    //get current state for rater
    const current_state = get_all_state_query.find(
      (element) => element.state_id == get_rater_State_query.state_id
    );

    if (current_state.state_number == 2) {
      return {
        success: true,
        message: "rater already passed this stage",
        result: "you already passed training stage!!",
      };
    }

    //this number will be added to current state number to get next state
    var adding_state_number = 1;

    //now update rater state
    const next_state_for_rater = get_all_state_query.find(
      (element) =>
        element.state_number == current_state.state_number + adding_state_number
    );
    // update rater data in data base
    const rater_query_res = await db.quiries.modifiData(
      table_name,
      { rater_id: response.rater_id },
      { state_id: next_state_for_rater.state_id }
    );

    //error handler class
    if (rater_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (rater_query_res) {
      return {
        success: true,
        message: "rater state updated successfully!!",
      };
    }
  },
  async modifiraterData(response) {
    table_name = "rater";

    // check user already exist in database or not
    const exist_res = await db.quiries.isExist(table_name, {
      rater_id: response.rater_id,
    });
    if (exist_res === false) {
      return {
        success: false,
        message: "User doesn't exist in db",
        errors: ["User doesn't exist in db"],
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
            errors: errors_list,
          };
        }
      }

      // get rater data from database
      const get_data_query = await db.quiries.getData(
        table_name,
        {},
        {
          parent_id: response.parent_id,
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
          errors: ["Password can't be same as previous"],
        };
      }
      response.data.password = vl.validation.hashPassword(
        response.data.password
      );
    }
    // update rater data in data base
    const rater_query_res = await db.quiries.modifiData(
      table_name,
      { rater_id: response.rater_id },
      response.data
    );

    //error handler class
    if (rater_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (rater_query_res) {
      return {
        success: true,
        message: "modified successful",
      };
    }
  },
  async getraterVideoPath(response) {
    const rater_queue_table = "rater_queue";
    const video_table = "video";
    // get video data
    const get_rater_video_queue_query = await db.quiries.getallData(
      rater_queue_table,
      {},
      { rater_id: response.rater_id }
    );

    if (get_rater_video_queue_query === null) {
      return {
        success: false,
        message: "no videos exists for this rater in db",
        errors: ["no video exists for you now"],
      };
    } else if (get_rater_video_queue_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_rater_video_queue_query) {
      get_rater_video_queue_query.sort(function (vid_a, vid_b) {
        if (vid_a.date_time < vid_b.date_time) {
          return -1;
        }
        if (vid_a.start_date_time > vid_b.start_date_time) {
          return 1;
        }
        // dates must be equal
        return 0;
      });

      // get tags data
      const get_rater_video_path_query = await db.quiries.getData(
        video_table,
        { video_path: "" },
        { video_id: get_rater_video_queue_query[0].video_id }
      );

      if (get_rater_video_path_query.name === "error") {
        return {
          success: false,
          message: "db error",
          errors: ["something went wrong"],
        };
      } else if (get_rater_video_path_query) {
        return {
          success: true,
          message: "Successful get data",
          result: get_rater_video_path_query,
        };
      }
    }
  },

  async getraterVideoID(response) {
    const table = "rater_queue";

    // get tags data
    const get_rater_video_id_query = await db.quiries.getallData(
      table,
      {},
      { rater_id: response.rater_id, status: "pending" }
    );

    if (get_rater_video_id_query === null) {
      return {
        success: false,
        message: "no videos exists for this rater in db",
        errors: ["no video exists for you now"],
      };
    } else if (get_rater_video_id_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_rater_video_id_query) {
      get_rater_video_id_query.sort(function (vid_a, vid_b) {
        if (vid_a.date_time < vid_b.date_time) {
          return -1;
        }
        if (vid_a.start_date_time > vid_b.start_date_time) {
          return 1;
        }
        // dates must be equal
        return 0;
      });
      return {
        success: true,
        message: "Successful get data",
        result: get_rater_video_id_query[0].video_id,
      };
    }
  },

  async getraterVideosNumber(response) {
    const table = "rater";

    // get tags data
    const get_rater_video_in_queue_query = await db.quiries.getData(
      table,
      { in_queue: "" },
      { rater_id: response.rater_id }
    );

    if (get_rater_video_in_queue_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_rater_video_in_queue_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_rater_video_in_queue_query.in_queue,
      };
    }
  },
  
};

exports.rater_utils = rater_utils;
