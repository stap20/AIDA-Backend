const db = require("../../db/quiries");

async function submit_rater_test_questions(response) {
  answers_table_name = "submit_answers";
  rater_table_name = "rater";
  question_table_name = "question";
  set_table_name = "set_question";
  state_table_name = "state";

  // get all data
  const get_all_questions_answer_query = await db.quiries.getallData(
    question_table_name,
    { question_id: "", correct_answer: "" },
    { set_id: response.set_id }
  );

  if (get_all_questions_answer_query === null) {
    return {
      success: false,
      message: "question set doesn't exist in db",
      errors: ["something went wrong"],
    };
  } else if (get_all_questions_answer_query.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something went wrong on the input"],
    };
  }

  //let's assume they will send formate like that for now "{question_id:'askldj', answer:'askjdh'}"
  //calc answer
  //result indicate to how many question rater answer with correct answer
  var result = 0;
  response.question_answers.forEach(function (answer) {
    const original_question = get_all_questions_answer_query.find(
      (element) => element.question_id == answer.question_id
    );

    if (
      original_question.correct_answer.toLowerCase() ==
      answer.question_answer.toLowerCase()
    )
      result += 1;
  });

  // get type of set
  const get_set_query = await db.quiries.getData(
    set_table_name,
    { type: "" },
    { set_id: response.set_id }
  );

  // get rater state data
  const get_rater_State_query = await db.quiries.getData(
    rater_table_name,
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

  //pass thresholds
  var pass_threshold_eng_test =
    (get_all_questions_answer_query.length * 50) / 100;
  var pass_threshold_future_test =
    (get_all_questions_answer_query.length * 80) / 100;
  var passed = 0;
  var failed_code = 100;

  //failed state handler
  if (
    current_state.state_number === 100 ||
    current_state.state_number === 102
  ) {
    // 100 -> for before failed english test state
    // 102 -> for before failed future test state
    return {
      success: true,
      message: "rater already got failed on test",
      result: "you already failed in our tests!!",
    };
  }

  if (get_set_query.type == "eng_test") {
    //rater passed already
    if (current_state.state_number > 0) {
      // 0 -> for before eng test state
      return {
        success: true,
        message: "rater already passed this stage",
        result: "you already passed this stage!!",
      };
    } else {
      //not passed
      if (result < pass_threshold_eng_test) {
        passed = 0;
        failed_code = 100;
      } else {
        passed = 1;
      }
    }
  } else if (get_set_query.type == "future_test") {
    if (current_state.state_number > 2) {
      // 2 -> for before future test
      return {
        success: true,
        message: "rater already passed this stage",
        result: "you already passed this stage!!",
      };
    } else {
      //not passed
      if (result < pass_threshold_future_test) {
        passed = 0;
        failed_code = 102;
      } else {
        passed = 1;
      }
    }
  }

  //submit rater test answers to database
  const submit_rater_test_answer_query = await db.quiries.insert(
    answers_table_name,
    {
      set_id: response.set_id,
      rater_id: response.rater_id,
      date_time: response.date_time,
      answers: JSON.stringify(response.question_answers),
      result: result,
    }
  );

  if (submit_rater_test_answer_query.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  }

  if (!passed) {
    //now update rater state
    const next_state_for_rater = get_all_state_query.find(
      (element) => element.state_number == failed_code
    );

    // update rater data in data base
    const rater_failed_query_update_res = await db.quiries.modifiData(
      rater_table_name,
      { rater_id: response.rater_id },
      { state_id: next_state_for_rater.state_id }
    );

    //error handler class
    if (rater_failed_query_update_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (rater_failed_query_update_res) {
      return {
        success: true,
        message: "result less than threshold",
        result_message: "not passed to next stage",
        result: result,
      };
    }
  } else if (passed) {
    //now update rater state
    const next_state_for_rater = get_all_state_query.find(
      (element) => element.state_number == current_state.state_number + 1
    );
    // update rater data in data base
    const rater_query_res = await db.quiries.modifiData(
      rater_table_name,
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
        result: result,
        message: "rater passed to next stage",
      };
    }
  }
}

exports.submit_rater_test_questions = submit_rater_test_questions;
