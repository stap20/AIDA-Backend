const db = require("../../db/quiries");
const questionaire_utilities = require("./questionaire/utilities");
const video_utilities = require("./video/utilities");

const diagnosis_utils = {
  async getallDiagnosis_Data(response) {
    all_questionair_data = await questionaire_utilities.questionaire_utilities.get_all_quetionaire(
      { parent_uuid: response.parent_id, type: "'Questionnaire'" }
    );

    if (
      !all_questionair_data.success &&
      !all_questionair_data.hasOwnProperty("result")
    ) {
      return all_questionair_data;
    }

    all_video_data = await video_utilities.video_utilities.get_all_video({
      parent_uuid: response.parent_id,
      type: "'Video'",
    });

    if (
      !all_video_data.success &&
      !all_video_data.hasOwnProperty("result")
    ) {
      return all_video_data;
    }

    all_diagnosis_data = all_questionair_data.result.concat(all_video_data.result);

    all_diagnosis_data.sort(function (diag_a, diag_b) {
      if (diag_a.date > diag_b.date) {
        return -1;
      }
      if (diag_a.date < diag_b.date) {
        return 1;
      } else {
        if (diag_a.time > diag_b.time) {
          return -1;
        }
        if (diag_a.time < diag_b.time) {
          return 1;
        }
      }
      // dates and times must be equal
      return 0;
    });

    return {
      success: true,
      message: "Successful get data",
      result: all_diagnosis_data,
    };
  },
};

exports.diagnosis_utils = diagnosis_utils;
