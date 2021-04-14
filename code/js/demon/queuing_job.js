const db = require("../db/quiries");
var Heap = require("heap");
const { stat } = require("fs");
var HashMap = require("hashmap");

var video_heap = new Heap(function (vid_a, vid_b) {
  if (vid_a.views < vid_b.views) {
    return vid_a.views - vid_b.views;
  }
  if (vid_a.views > vid_b.views) {
    return vid_b.views - vid_a.views;
  } else {
    if (vid_a.date_time < vid_b.date_time) {
      return vid_a.date_time - vid_b.date_time;
    }
    if (vid_a.date_time > vid_b.date_time) {
      return vid_b.date_time - vid_a.date_time;
    }
  }
  return;
});

var rater_heap = new Heap(function (rater_a, rater_b) {
  if (rater_a.views < rater_b.views) {
    return rater_a.views - rater_b.views;
  }
  if (rater_a.views > rater_b.views) {
    return rater_b.views - rater_a.views;
  } else {
    if (rater_a.last_activity < rater_b.last_activity) {
      return rater_a.last_activity - rater_b.last_activity;
    }
    if (rater_a.last_activity > rater_b.last_activity) {
      return rater_b.last_activity - rater_a.last_activity;
    } else {
      if (rater_a.in_queue < rater_b.in_queue) {
        return rater_a.in_queue - rater_b.in_queue;
      }
      if (rater_a.in_queue > rater_b.in_queue) {
        return rater_b.in_queue - rater_a.in_queue;
      }
    }
  }
  return;
});

function min_videos(vid_a, vid_b) {
  if (vid_a.views < vid_b.views) {
    return vid_a;
  }
  if (vid_a.views > vid_b.views) {
    return vid_b;
  } else {
    if (vid_a.date_time < vid_b.date_time) {
      return vid_a;
    }
    if (vid_a.date_time > vid_b.date_time) {
      return vid_b;
    }
    return vid_a;
  }
}

function get_current_video(video_list) {
  var current_video = video_list[0];
  var temp_video = video_list[0];
  for (var i = 1; i < video_list.length; i++) {
    vid_a = temp_video;
    vid_b = video_list[i];
    temp_video = min_videos(vid_a, vid_b);
    current_video = temp_video;
  }
  return current_video;
}

async function queuing_job() {
  rater_table = "rater";
  rater_queue_table = "rater_queue";
  video_queue_table = "video_queue";
  const rater_inqueue_threshold = 4;
  current_date = new Date();
  date_time = new Date(
    current_date.getFullYear() +
      "-" +
      (current_date.getMonth() + 1) +
      "-" +
      current_date.getDate() +
      " " +
      current_date.getHours() +
      ":" +
      current_date.getMinutes() +
      ":" +
      current_date.getSeconds()
  );

  rater_queue_list = [];
  video_queue_list = [];
  rater_modifi_list = [];
  var visited_map = new HashMap();

  // get all video data
  const get_all_video_from_queue_query_res = await db.quiries.getallData(
    video_queue_table,
    {},
    { status: "pending" }
  );
  if (get_all_video_from_queue_query_res === null) {
    return {
      success: true,
      message: "No video in queue so far",
    };
  } else if (get_all_video_from_queue_query_res) {
    // get all available rater data
    // here we get rater that have space in queue to put video in there queue
    const get_all_available_rater_query_res = await db.quiries.getallData(
      rater_table,
      { rater_id: "", in_queue: "" },
      { in_queue: { $lt: rater_inqueue_threshold } }
    );
    if (get_all_available_rater_query_res === null) {
      return {
        success: true,
        message: "No rater available in queue so far",
      };
    } else if (get_all_available_rater_query_res) {
      var status = "pending";
      var video_list_length = get_all_available_rater_query_res.length;
      get_all_available_rater_query_res.forEach(function (selected_rater) {
        visited_map.set(selected_rater.rater_id, []);
      });

      for (var i = 0; i < get_all_available_rater_query_res.length; i++) {
        current_rater = get_all_available_rater_query_res[i];
        video_list = get_all_video_from_queue_query_res.slice();

        while (
          current_rater.in_queue <= 4 &&
          visited_map.get(current_rater.rater_id).length <= video_list_length &&
          video_list.length > 0
        ) {
          current_video = get_current_video(video_list);

          is_visited = visited_map
            .get(current_rater.rater_id)
            .findIndex((element) => element == current_video.video_id);

          if (is_visited > -1) {
            var index = video_list.findIndex(
              (element) => element.video_id == current_video.video_id
            );
            video_list.splice(index, 1);
          } else {
            visited_map
              .get(current_rater.rater_id)
              .push(current_video.video_id);
          }

          // check task already exist in database or not
          const exist_res = await db.quiries.isExist(rater_queue_table, {
            rater_id: current_rater.rater_id,
            video_id: current_video.video_id,
          });

          if (!exist_res) {
            //modify rater table inqueue column
            const update_rater_inqueue = await db.quiries.modifiData(
              rater_table,
              { rater_id: current_rater.rater_id },
              { in_queue: current_rater.in_queue + 1 }
            );

            if (update_rater_inqueue.name === "error") {
              return {
                success: false,
                message: "db error",
                errors: ["something wrong on the input"],
              };
            }

            index = rater_modifi_list.findIndex(
              (element) => element.rater_id == current_rater.rater_id
            );
            if (index > -1) {
              rater_modifi_list[index].in_queue =
                rater_modifi_list[index].in_queue + 1;
            } else {
              rater_modifi_list.push({
                rater_id: current_rater.rater_id,
                in_queue: current_rater.in_queue + 1,
              });
            }
            current_rater.in_queue = current_rater.in_queue + 1;

            rater_queue_list.push({
              rater_id: current_rater.rater_id,
              video_id: current_video.video_id,
              date_time: date_time,
            });

            const add_in_rater_queue = await db.quiries.insert(
              rater_queue_table,
              {
                rater_id: current_rater.rater_id,
                video_id: current_video.video_id,
                status: "pending",
                date_time: date_time,
              }
            );

            if (add_in_rater_queue.name === "error") {
              return {
                success: false,
                message: "db error",
                errors: ["something wrong on the input"],
              };
            }

            if (current_video.views + 1 == 4) {
              status = "done";
            } else {
              status = "pending";
            }

            index = video_queue_list.findIndex(
              (element) => element.video_id == current_video.video_id
            );
            if (index > -1) {
              video_queue_list[index].views = video_queue_list[index].views + 1;

              video_queue_list[index].status = status;
            } else {
              video_queue_list.push({
                video_id: current_video.video_id,
                views: current_video.views + 1,
                date_time: date_time,
                status: status,
              });
            }

            const update_video_queue_data = await db.quiries.modifiData(
              video_queue_table,
              { video_id: current_video.video_id },
              {
                views: current_video.views + 1,
                date_time: date_time,
                status: status,
              }
            );

            if (update_video_queue_data.name === "error") {
              return {
                success: false,
                message: "db error",
                errors: ["something wrong on the input"],
              };
            }

            current_video.views = current_video.views + 1;

            var index = video_list.findIndex(
              (element) => element.video_id == current_video.video_id
            );
            video_list.splice(index, 1);
          }
        }
      }
    }
  }
  list = [rater_modifi_list, video_queue_list, rater_queue_list];
  return {
    success: true,
    message: "Demon setted videos for raters",
    summary_list: list,
  };
}

exports.queuing_job = queuing_job;
