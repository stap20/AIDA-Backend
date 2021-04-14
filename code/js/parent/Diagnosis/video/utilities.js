const db = require("../../../db/quiries");

const video_utilities = {
  async get_pdf_res(response) {
    const table_name = response.table;
    const state_table = "diagnosis_process_queue";
    // check if questioniare exist data in data base
    const get_report_query = await db.quiries.getData(
      table_name,
      {},
      { video_id: response.video_id }
    );
    if (get_report_query === null) {
      return {
        success: false,
        message: "Doesn't exist in db",
        errors: ["video doesn't exist"],
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

  async get_all_video(response) {
    const main_table = "create_video";
    const joined_table1 = "video";
    const joined_table2 = "child";
    join_type = "inner";
    join_condition1 = {
      "create_video.video_id": "video.video_id",
    };
    join_condition2 = { "create_video.child_id": "child.child_id" };
    condition = { "create_video.parent_id": response.parent_uuid };
    values = {
      "child.child_code": "",
      "child.first_name": "",
      "child.last_name": "",
      "video.video_id": "",
      "video.date": "",
      "video.time": "",
      "video.result": "",
    };

    if (response.hasOwnProperty("type")) {
      values["" + response.type + " as type"] = "";
    }

    // get all video data
    const get_all_videos_query = await db.quiries.join3_query(
      main_table,
      values,
      condition,
      join_type,
      joined_table1,
      joined_table2,
      join_condition1,
      join_condition2
    );
    if (get_all_videos_query === null) {
      return {
        success: false,
        message: "no video exists for this parent in db",
        errors: ["no video exists for you"],
      };
    } else if (get_all_videos_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_all_videos_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_all_videos_query,
      };
    }
  },
  async get_all_video_for_child(response) {
    const main_table = "create_video";
    const joined_table1 = "video";
    const joined_table2 = "child";
    join_type = "inner";
    join_condition1 = {
      "create_video.video_id": "video.video_id",
    };
    join_condition2 = { "create_video.child_id": "child.child_id" };
    condition = {
      "create_video.parent_id": response.parent_uuid,
      "child.child_code": response.child_code,
    };
    values = {
      "child.child_code": "",
      "child.first_name": "",
      "child.last_name": "",
      "video.video_id": "",
      "video.date": "",
      "video.time": "",
      "video.result": "",
    };

    // get all video data
    const get_all_videos_query = await db.quiries.join3_query(
      main_table,
      values,
      condition,
      join_type,
      joined_table1,
      joined_table2,
      join_condition1,
      join_condition2
    );
    if (get_all_videos_query === null) {
      return {
        success: false,
        message: "no video exists for this parent in db",
        errors: ["no video exists for you"],
      };
    } else if (get_all_videos_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_all_videos_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_all_videos_query,
      };
    }
  },

  async get_selected_video(response) {
    const main_table = "create_video";
    const joined_table1 = "video";
    const joined_table2 = "child";
    join_type = "inner";
    join_condition1 = {
      "create_video.video_id": "video.video_id",
    };
    join_condition2 = { "create_video.child_id": "child.child_id" };
    condition = {
      "create_video.parent_id": response.parent_uuid,
      "create_video.video_id": response.video_id,
    };
    values = {
      "child.child_code": "",
      "child.first_name": "",
      "child.last_name": "",
      "video.video_id": "",
      "video.date": "",
      "video.time": "",
      "video.result": "",
    };

    // get video data
    const get_videos_query = await db.quiries.join3_query(
      main_table,
      values,
      condition,
      join_type,
      joined_table1,
      joined_table2,
      join_condition1,
      join_condition2
    );
    if (get_videos_query === null) {
      return {
        success: false,
        message: "no video exists for this parent in db",
        errors: ["no video exists for you"],
      };
    } else if (get_videos_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_videos_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_videos_query,
      };
    }
  },

  async set_video_queue(response) {
    const rater_queue_table = "rater_queue";
    const video_queue_table = "video_queue";
    const rater_table = "rater";
    const rater_inqueue_threshold = 4;
    const recomended_views_for_video = 4;

    // here we get video_queue length if we have so we will put in video_queue
    const get_video_queue_query = await db.quiries.getallData(
      video_queue_table,
      {},
      {}
    );

    if (get_video_queue_query === null) {
      // here we get rater that have space in queue to put video in there queue
      const get_rater_have_space_query = await db.quiries.getallData(
        video_queue_table,
        {},
        { in_queue: { $lt: rater_inqueue_threshold } }
      );

      if (get_rater_have_space_query.length < recomended_views_for_video) {
        // insert video in video queue because all rater busy now
        const video_queue_query = await db.quiries.insert(video_queue_table, {
          video_id: response.video_id,
          views: get_rater_have_space_query.length, //because we have available rater number views
          date_time: response.date_time,
          status: "pending",
        });

        //error handler class
        if (video_queue_query.name === "error") {
          return {
            success: false,
            status: "db error",
          };
        }
      }
      console.log(get_rater_have_space_query);
      for (var i = 0; i < get_rater_have_space_query.length && i < 4; i++) {
        var rater = get_rater_have_space_query[i];
        // insert video in rater_queue
        const rater_queue_query = await db.quiries.insert(rater_queue_table, {
          rater_id: rater.rater_id,
          video_id: response.video_id,
          date_time: response.date_time,
          status: "pending",
        });

        //error handler class
        if (rater_queue_query.name === "error") {
          return {
            success: false,
            status: "db error",
          };
        }

        // update rater in queue number
        const rater_query_res = await db.quiries.modifiData(
          rater_table,
          { rater_id: rater.rater_id },
          { in_queue: rater.in_queue + 1 }
        );

        //error handler class
        if (rater_query_res.name === "error") {
          return {
            success: false,
            status: "db error",
          };
        }
      }
      return {
        success: true,
        message: "video in raters queue!!",
      };
    } else if (get_video_queue_query.name === "error") {
      return {
        success: false,
        status: "db error",
      };
    } else if (get_video_queue_query) {
      // insert video in video queue because all rater busy now
      const video_queue_query = await db.quiries.insert(video_queue_table, {
        video_id: response.video_id,
        views: 0, //because no views so far
        date_time: response.date_time,
        status: "pending",
      });

      //error handler class
      if (video_queue_query.name === "error") {
        return {
          success: false,
          status: "db error",
        };
      } else if (video_queue_query) {
        return {
          success: true,
          status: "video setted in video queue",
        };
      }
    }
  },
};

exports.video_utilities = video_utilities;
