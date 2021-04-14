const db = require("../../db/quiries");

async function submit_video_rating(response) {
  table_name = "rate";
  rater_table = "rater";
  rater_queue_table = "rater_queue";

  //send rating to model in python script and it's return result
  var result = response.video_rate; //temp result so far

  //submit video rating result to database
  const submit_video_rating_query = await db.quiries.insert(table_name, {
    rater_id: response.rater_id,
    video_id: response.video_id,
    date_time: response.date_time,
    result: result,
  });
  console.log(submit_video_rating_query)
  if (submit_video_rating_query.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  }

  const set_state = await db.quiries.modifiData(
    rater_queue_table,
    { rater_id: response.rater_id, video_id: response.video_id },
    { status: "done" }
  );
  
  if (set_state.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  }
  // get rater inqueue data
  const get_rater_video_in_queue_query = await db.quiries.getData(
    rater_table,
    { in_queue: "" },
    { rater_id: response.rater_id }
  );

  if (get_rater_video_in_queue_query.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something went wrong"],
    };
  }
  const update_rater_inqueue_query_res = await db.quiries.modifiData(
    rater_table,
    { rater_id: response.rater_id },
    { in_queue: get_rater_video_in_queue_query.in_queue-1 }
  );
  if (update_rater_inqueue_query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something went wrong"],
    };
  } else if (update_rater_inqueue_query_res) {
    return {
      success: true,
      message: "video rating submitted successfully",
    };
  }
}

exports.submit_video_rating = submit_video_rating;
