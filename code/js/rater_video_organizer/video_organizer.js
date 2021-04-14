const db = require("../../db/quiries");

async function submit_video_rating(response) {
  table_name = "rate";

  //send rating to model in python script and it's return result
  var result = 7; //temp result so far

  //submit video rating result to database
  const submit_video_rating_query = await db.quiries.insert(table_name, {
    rater_id: response.rater_id,
    video_id: response.video_id,
    date_time: response.date_time,
    result: result,
  });

  if (submit_video_rating_query.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  } else if (submit_video_rating_query) {
    return {
      success: true,
      message: "video rating submitted successfully",
    };
  }
}

exports.submit_video_rating = submit_video_rating;
