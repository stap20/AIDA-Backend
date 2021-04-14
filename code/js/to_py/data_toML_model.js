const db = require("../db/quiries");
const spawner = require("child_process").spawn;

async function data_toML_model(response) {
  var process = spawner("python", [
    response.file_name,
    JSON.stringify({ questionaire_id: response.questionaire_id }),
    JSON.stringify({ answers: response.answers.split(",") }),
    JSON.stringify({ model: response.model_type }),
  ]);
  // Takes stdout data from script which executed
  // with arguments and send this data to res object
  let diagnosis_res = {};
  process.stdout.on("data", function (data) {
    diagnosis_res = JSON.parse(data.toString());
  });
  //set data res on dp
  process.on("exit", async (code) => {
    const set_result_pdf = await db.quiries.modifiData(
      response.table_name,
      { questionaire_id: response.questionaire_id },
      {
        pdf_result_path: diagnosis_res.file_path,
        result: diagnosis_res.result,
        type: response.model_type,
      }
    );
    if (set_result_pdf.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    }
    const set_state = await db.quiries.modifiData(
      response.queue_table,
      { queue_id: response.queue_id },
      { state: "Done", done_time: new Date().toLocaleTimeString() }
    );
    if (set_state.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    }
  });
  // set result pdf_path in databas
}

exports.data_toML_model = data_toML_model;
