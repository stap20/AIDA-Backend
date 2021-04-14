const db = require("../../../db/quiries");

const questionaire_utilities = {
  async get_pdf_res(response) {
    const table_name = response.table;
    const state_table = "diagnosis_process_queue";
    // check if questioniare exist data in data base
    const get_report_query = await db.quiries.getData(
      table_name,
      {},
      { questionaire_id: response.questionaire_id }
    );
    if (get_report_query === null) {
      return {
        success: false,
        message: "Doesn't exist in db",
        errors: ["Questionaire doesn't exist"],
      };
    } else if (get_report_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    }

    // check if pdf report done or not
    const get_report_state = await db.quiries.getData(
      state_table,
      {},
      { queue_id: get_report_query.queue_id, state: "Done" }
    );
    if (get_report_state === null) {
      return {
        success: false,
        message: "Report under processing",
        errors: ["Report not ready yet"],
      };
    } else if (get_report_state.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (get_report_state) {
      return {
        success: true,
        result: get_report_query.pdf_result_path,
        message: "Successful",
      };
    }
  },

  async get_all_quetionaire(response) {
    const main_table = "create_questionaire";
    const joined_table1 = "questionaire";
    const joined_table2 = "child";
    join_type = "inner";
    join_condition1 = {
      "create_questionaire.questionaire_id": "questionaire.questionaire_id",
    };
    join_condition2 = { "create_questionaire.child_id": "child.child_id" };
    condition = { "create_questionaire.parent_id": response.parent_uuid };
    values = {
      "child.child_code": "",
      "child.first_name": "",
      "child.last_name": "",
      "questionaire.questionaire_id": "",
      "questionaire.date": "",
      "questionaire.time": "",
      "questionaire.result": "",
    };

    if (response.hasOwnProperty("type")) {
      values["" + response.type + " as type"] = "";
    }

    // get all questionaire data
    const get_all_quetionaires_query = await db.quiries.join3_query(
      main_table,
      values,
      condition,
      join_type,
      joined_table1,
      joined_table2,
      join_condition1,
      join_condition2
    );

    if (get_all_quetionaires_query === null) {
      return {
        success: false,
        message: "no questionaire exists for this parent in db",
        errors: ["no questionaire exists for you"],
        result: null,
      };
    } else if (get_all_quetionaires_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_all_quetionaires_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_all_quetionaires_query,
      };
    }
  },
  async get_all_quetionaire_for_child(response) {
    const main_table = "create_questionaire";
    const joined_table1 = "questionaire";
    const joined_table2 = "child";
    join_type = "inner";
    join_condition1 = {
      "create_questionaire.questionaire_id": "questionaire.questionaire_id",
    };
    join_condition2 = { "create_questionaire.child_id": "child.child_id" };
    condition = {
      "create_questionaire.parent_id": response.parent_uuid,
      "child.child_code": response.child_code,
    };
    values = {
      "child.child_code": "",
      "child.first_name": "",
      "child.last_name": "",
      "questionaire.questionaire_id": "",
      "questionaire.date": "",
      "questionaire.time": "",
      "questionaire.result": "",
    };

    // get all questionaire data
    const get_all_quetionaires_query = await db.quiries.join3_query(
      main_table,
      values,
      condition,
      join_type,
      joined_table1,
      joined_table2,
      join_condition1,
      join_condition2
    );
    if (get_all_quetionaires_query === null) {
      return {
        success: false,
        message: "no questionaire exists for this parent in db",
        errors: ["no questionaire exists for you"],
      };
    } else if (get_all_quetionaires_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_all_quetionaires_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_all_quetionaires_query,
      };
    }
  },

  async get_selected_quetionaire(response) {
    const main_table = "create_questionaire";
    const joined_table1 = "questionaire";
    const joined_table2 = "child";
    join_type = "inner";
    join_condition1 = {
      "create_questionaire.questionaire_id": "questionaire.questionaire_id",
    };
    join_condition2 = { "create_questionaire.child_id": "child.child_id" };
    condition = {
      "create_questionaire.parent_id": response.parent_uuid,
      "create_questionaire.questionaire_id": response.questionaire_id,
    };
    values = {
      "child.child_code": "",
      "child.first_name": "",
      "child.last_name": "",
      "questionaire.questionaire_id": "",
      "questionaire.date": "",
      "questionaire.time": "",
      "questionaire.result": "",
    };

    // get questionaire data
    const get_quetionaires_query = await db.quiries.join3_query(
      main_table,
      values,
      condition,
      join_type,
      joined_table1,
      joined_table2,
      join_condition1,
      join_condition2
    );
    if (get_quetionaires_query === null) {
      return {
        success: false,
        message: "no questionaire exists for this parent in db",
        errors: ["no questionaire exists for you"],
      };
    } else if (get_quetionaires_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_quetionaires_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_quetionaires_query,
      };
    }
  },
};

exports.questionaire_utilities = questionaire_utilities;
