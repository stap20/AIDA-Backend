const db = require("../../../db/quiries");
const visual_schedule = {
  //add task handler
  async add_task(response) {
    const table_name = "task";
    const create_task_table_name = "create_task";
    const private_match_table = "private_tag_match";
    const public_match_table = "public_tag_match";
    var tags = {};

    if (response.hasOwnProperty("public_tags")) {
      tags.public_tags = response.public_tags;
      delete response.public_tags;
    }

    if (response.hasOwnProperty("private_tags")) {
      tags.private_tags = response.private_tags;
      delete response.private_tags;
    }

    // generate uuid
    const uuid = await db.quiries.uuidGenerator();
    response.task_data.task_id = uuid;
    response.task_data.source_task_id = uuid;

    if (Object.keys(response.image_path).length > 0) {
      response.task_data.image_path =
        response.image_path.dir +
        uuid +
        "." +
        response.image_path.type.split("/").pop();
    }

    // insert task data in data base
    const addtask_query_res = await db.quiries.insert(
      table_name,
      response.task_data
    );
    console.log(addtask_query_res);
    if (addtask_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    }

    const createtask_query_res = await db.quiries.insert(
      create_task_table_name,
      {
        parent_id: response.parent_uuid,
        child_id: response.child_uuid,
        task_id: uuid,
      }
    );
    if (createtask_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    }

    //if we have a tags
    if (Object.keys(tags).length > 0) {
      if (tags.hasOwnProperty("public_tags")) {
        // pass a function to map
        const public_tags = tags.public_tags.map((public_tag_id) => {
          return { task_id: uuid, tag_id: public_tag_id };
        });
        const match_tag_query_res = await db.quiries.insert(
          public_match_table,
          public_tags
        );
        if (match_tag_query_res.name === "error") {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }
      }

      if (tags.hasOwnProperty("private_tags")) {
        // pass a function to map
        const private_tags = tags.private_tags.map((private_tag_id) => {
          return { task_id: uuid, tag_id: private_tag_id };
        });

        const match_tag_query_res = await db.quiries.insert(
          private_match_table,
          private_tags
        );
        if (match_tag_query_res.name === "error") {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }
      }
    }
    return {
      success: true,
      message: "Task added successful",
      task_id: response.task_data.task_id,
    };
  },

  //add private tags handler
  async add_tag(response) {
    const table_name = "private_tag";

    // check tag_name already exist in database or not
    const exist_res = await db.quiries.isExist(table_name, {
      name: response.name,
      parent_id: response.parent_id,
    });
    if (exist_res) {
      return {
        success: false,
        message: "Already exist in db",
        errors: [response.name + " " + "already exists"],
      };
    }

    // generate uuid
    const uuid = await db.quiries.uuidGenerator();
    response.tag_id = uuid;
    // insert tag data in data base
    const addtag_query_res = await db.quiries.insert(table_name, response);

    if (addtag_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (addtag_query_res) {
      return {
        success: true,
        message: "Tag added successful",
        result: { tag_id: response.tag_id, name: response.name },
      };
    }
  },
};
exports.visual_schedule = visual_schedule;
