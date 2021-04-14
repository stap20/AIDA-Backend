const db = require("../../db/quiries");
const rater_question_utils = {
  async getallQuestion_in_set_Data(response) {
    const set_question_table_name = "set_question";
    const rater_set_question_table = "rater_question_set";
    const rater_state_table = "state";
    const question_table_name = "question";
    var questions_type = "";
    var selectedSet_id = "";
    // get type of state
    const get_state_query = await db.quiries.getData(
      rater_state_table,
      { state_number: "" },
      { state_id: response.state_id }
    );

    if (get_state_query.state_number == 0) {
      questions_type = "eng_test";
    } else if (get_state_query.state_number == 2) {
      questions_type = "future_test";
    } else {
      return {
        success: false,
        message: "sorry not allowed for you to get questions",
      };
    }
    join_type = "inner";
    values = {
      "rater_question_set.set_id": "",
      "set_question.type": "",
    };

    condition = {
      "rater_question_set.rater_id": response.rater_id,
      "set_question.type": questions_type,
    };

    join_condition = {
      "rater_question_set.set_id": "set_question.set_id",
    };

    // get all set for rater if available
    const get_available_set_query = await db.quiries.join_query(
      rater_set_question_table,
      values,
      condition,
      join_type,
      set_question_table_name,
      join_condition
    );

    //rater doesn't have any set so far so select random set for him
    if (get_available_set_query === null) {
      //get rater question set id
      const get_all_set_query = await db.quiries.getallData(
        set_question_table_name,
        { set_id: "" },
        { type: questions_type }
      );
      if (get_all_set_query === null) {
        return {
          success: true,
          message: "There are no questions in database",
        };
      } else if (get_all_set_query.name === "error") {
        return {
          success: false,
          message: "db error",
          errors: ["something went wrong"],
        };
      }
      set_idx = Math.floor(Math.random() * get_all_set_query.length);
      selectedSet_id = get_all_set_query[set_idx].set_id;

      const add_selected_set_query_res = await db.quiries.insert(
        rater_set_question_table,
        { rater_id: response.rater_id, set_id: selectedSet_id }
      );
      if (add_selected_set_query_res.name === "error") {
        return {
          success: false,
          message: "db error",
          errors: ["something wrong on the input"],
        };
      }
    } else if (get_available_set_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_available_set_query) {
      selectedSet_id = get_available_set_query[0].set_id;
    }

    // get all data
    const get_all_question_query = await db.quiries.getallData(
      question_table_name,
      { question_id: "", title: "", correct_answer: "", choices: [] },
      { set_id: selectedSet_id }
    );
    if (get_all_question_query === null) {
      return {
        success: true,
        message: "Successful get data",
        result: [],
      };
    } else if (get_all_question_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_all_question_query) {
      return {
        success: true,
        message: "Successful get data",
        set_id: selectedSet_id,
        result: get_all_question_query,
      };
    }
  },
  async getTest_result(response) {
    const submit_question_answers_table = "submit_answers";
    const set_question_table = "set_question";

    join_type = "inner";
    values = {
      "submit_answers.result": "",
      "submit_answers.answers": "",
      "submit_answers.date_time": "",
      "set_question.type": "",
    };

    condition = {
      "submit_answers.rater_id": response.rater_id,
      "set_question.type": response.type,
    };

    join_condition = {
      "submit_answers.set_id": "set_question.set_id",
    };

    // get all set for rater if available
    const get_test_result_query_res = await db.quiries.join_query(
      submit_question_answers_table,
      values,
      condition,
      join_type,
      set_question_table,
      join_condition
    );

    if (get_test_result_query_res === null) {
      return {
        success: false,
        message: "Sorry you didn't reach this Test <" + response.type + ">",
      };
    } else if (get_test_result_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_test_result_query_res) {
      return {
        success: true,
        message: "Successful get data",
        result: get_test_result_query_res[0].result,
      };
    }
  },
};

exports.rater_question_utils = rater_question_utils;
