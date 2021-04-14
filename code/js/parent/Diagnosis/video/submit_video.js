const db = require("../../../db/quiries");

async function submit_video(response) {
  main_table_name = "video";
  relation = "create_video";
  process_queue = "diagnosis_process_queue";

  // Create process from video diagnosis and put in the queue
  // generate uuid
  var uuid = await db.quiries.uuidGenerator();
  process = {
    queue_id: uuid,
    in_time: response.time,
    state: "Pending",
  };

  // insert process in the queue
  const process_query_res = await db.quiries.insert(process_queue, process);

  //error handler class
  if (process_query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  }

  // now submit video data to video table
  var uuid = await db.quiries.uuidGenerator();
  video = {
    video_id: uuid,
    date: response.date,
    time: response.time,
    video_path:
      response.video_path.dir +
      uuid +
      "." +
      response.video_path.type.split("/").pop(),
    queue_id: process.queue_id,
  };

  // submit video data
  const video_query_res = await db.quiries.insert(main_table_name, video);

  //error handler class
  if (video_query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  }

  // now add process uuid with parent uuid and child uuid in create video relation
  //first get child uuid using child code
  get_child_uuid = await db.quiries.getData(
    "child",
    {},
    { child_code: response.child_code }
  );
  child_uuid = get_child_uuid.child_id;

  // insert process in relation between child&parent&process uuid
  relation_data = {
    parent_id: response.parent_id,
    video_id: video.video_id,
    child_id: child_uuid,
  };

  //now add the relation
  const relation_query_res = await db.quiries.insert(relation, relation_data);

  //error handler class
  if (relation_query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  } else if (relation_query_res) {
    //give it to quetionair ml model before return
    return {
      success: true,
      message: "answer submited successful",
      video_id: video.video_id,
      queue_id: video.queue_id,
    };
  }
}

exports.submit_video = submit_video;
