const db = require("../../db/quiries");
var Time = require("time-calculate");

function repeat_date_calculate(date, repeat_type) {
  switch (repeat_type) {
    case "Y":
      date.setFullYear(date.getFullYear() + 1);
      break;
    case "M":
      date.setMonth(date.getMonth() + 1);
      break;
    case "D":
      date.setDate(date.getDate() + 1);
      break;
  }

  return date;
}

function task_data_query(condition) {
  var string_condition = `WHERE `;
  var values_list = [];
  for (var i = 1; i <= Object.keys(condition).length; i++) {
    string_condition = string_condition + Object.keys(condition)[i - 1];

    if (condition[Object.keys(condition)[i - 1]].hasOwnProperty("$gt")) {
      string_condition = string_condition + " > ";
      values_list.push(condition[Object.keys(condition)[i - 1]].$gt);
    } else if (condition[Object.keys(condition)[i - 1]].hasOwnProperty("$lt")) {
      string_condition = string_condition + " < ";
      values_list.push(condition[Object.keys(condition)[i - 1]].$lt);
    } else if (
      condition[Object.keys(condition)[i - 1]].hasOwnProperty("$gte")
    ) {
      string_condition = string_condition + " >= ";
      values_list.push(condition[Object.keys(condition)[i - 1]].$gte);
    } else if (
      condition[Object.keys(condition)[i - 1]].hasOwnProperty("$lte")
    ) {
      string_condition = string_condition + " <= ";
      values_list.push(condition[Object.keys(condition)[i - 1]].$lte);
    } else {
      string_condition = string_condition + " = ";
      values_list.push(condition[Object.keys(condition)[i - 1]]);
    }

    string_condition = string_condition + " $" + i.toString() + " ";
    if (i + 1 <= Object.keys(condition).length) {
      string_condition = string_condition + " AND ";
    }
  }
  var query_text =
    `
    WITH main_table_public AS
    (SELECT task.task_id,
            child.child_id,
            public_tag_match.tag_id AS public_tag_id
      FROM create_task
      INNER JOIN task ON create_task.task_id = task.task_id
      INNER JOIN child ON create_task.child_id = child.child_id
      LEFT JOIN public_tag_match ON create_task.task_id = public_tag_match.task_id
      ` +
    string_condition +
    ")," +
    `
    main_table_private AS
    (SELECT task.task_id,
            child.child_id,
            private_tag_match.tag_id AS private_tag_id
      FROM create_task
      INNER JOIN task ON create_task.task_id = task.task_id
      INNER JOIN child ON create_task.child_id = child.child_id
      LEFT JOIN private_tag_match ON create_task.task_id = private_tag_match.task_id
    ` +
    string_condition +
    ")," +
    ` 
    public_tag_data AS
    (SELECT name,
            'public' AS tag_type,
            tag_id
      FROM public_tag),
        private_tag_data AS
    (SELECT name,
            'private' AS tag_type,
            tag_id
      FROM private_tag
      WHERE parent_id = $1),
      t2 AS
    (SELECT main_table_public.task_id,
          main_table_public.child_id,
          array_agg(CASE
                        WHEN main_table_public.public_tag_id IS NULL THEN NULL
                        ELSE CONCAT('{"tag_id":"', main_table_public.public_tag_id, '", "name":"', public_tag_data.name, '", "tag_type":"', public_tag_data.tag_type, '"}')
                    END) AS public_tags
    FROM main_table_public
    LEFT JOIN public_tag_data ON main_table_public.public_tag_id = public_tag_data.tag_id
    GROUP BY main_table_public.task_id,
            main_table_public.child_id),
      t3 AS
    (SELECT main_table_private.task_id,
          main_table_private.child_id,
          array_agg(CASE
                        WHEN main_table_private.private_tag_id IS NULL THEN NULL
                        ELSE CONCAT('{"tag_id":"', main_table_private.private_tag_id, '", "name":"', private_tag_data.name, '", "tag_type":"', private_tag_data.tag_type, '"}')
                    END) AS private_tags
    FROM main_table_private
    LEFT JOIN private_tag_data ON main_table_private.private_tag_id = private_tag_data.tag_id
    GROUP BY main_table_private.task_id,
            main_table_private.child_id),
      t4 AS
    (SELECT t2.task_id,
          t2.child_id,
          CASE
              WHEN t2.public_tags = '{NULL}' THEN NULL
              ELSE t2.public_tags
          END AS public_tags,
          CASE
              WHEN t3.private_tags = '{NULL}' THEN NULL
              ELSE t3.private_tags
          END AS private_tags
    FROM t2
    LEFT JOIN t3 ON t2.task_id = t3.task_id)
    SELECT task.task_id,
        task.start_date_time,
        task.end_date_time,
        task.duration,
        task.name,
        task.state,
        task.repeat,
        t4.public_tags,
        t4.private_tags
    FROM t4
    INNER JOIN task ON t4.task_id = task.task_id
    INNER JOIN child ON t4.child_id = child.child_id
`;
  return [query_text, values_list];
}

const parent_child_utils = {
  async getallChild_to_parent_Data(response) {
    const table_name = "child";
    // get all data
    const get_all_child_query = await db.quiries.getallData(
      table_name,
      {},
      { parent_id: response.parent_uuid }
    );
    if (get_all_child_query === null) {
      return {
        success: true,
        message: "Successful get data",
        result: [],
      };
    } else if (get_all_child_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_all_child_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_all_child_query,
      };
    }
  },

  async getChild_Data(response) {
    const table_name = "child";
    // get all child data
    const get_child_query = await db.quiries.getData(
      table_name,
      {},
      { parent_id: response.parent_uuid, child_code: response.child_code }
    );
    if (get_child_query == null) {
      return {
        success: false,
        message: "doesn't exists in db",
        errors: ["Child doesn't exists"],
      };
    } else if (get_child_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_child_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_child_query,
      };
    }
  },

  async modifichildData(response) {
    table_name = "child";

    // check child already exist in database or not
    const exist_res = await db.quiries.isExist(table_name, {
      parent_id: response.parent_uuid,
      child_code: response.child_code,
    });
    if (exist_res === false) {
      return {
        success: false,
        message: "This child doesn't exist in db",
        errors: ["This child doesn't exist"],
      };
    }

    // update child data in data base
    const child_query_res = await db.quiries.modifiData(
      table_name,
      { parent_id: response.parent_uuid, child_code: response.child_code },
      response.data
    );

    //error handler class
    if (child_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (child_query_res) {
      return {
        success: true,
        message: "modified successful",
      };
    }
  },

  async remove_child(response) {
    const table_name = "child";

    // check child already exist in database or not
    const exist_res = await db.quiries.isExist(table_name, {
      parent_id: response.parent_uuid,
      child_code: response.child_code,
    });
    if (exist_res === false) {
      return {
        success: false,
        message: "This child doesn't exist in db",
        errors: ["This child doesn't exist"],
      };
    }

    // remove child data base
    const child_remove_query_res = await db.quiries.remove(table_name, {
      parent_id: response.parent_uuid,
      child_code: response.child_code,
    });

    //error handler class
    if (child_remove_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (child_remove_query_res) {
      return {
        success: true,
        message: "Child removed successful",
      };
    }
  },

  async getallTasksInTime_Frame(response) {
    condition = {
      "create_task.parent_id": response.parent_id,
    };

    [query_text, query_values] = task_data_query(condition);

    // get all task data
    const get_all_tasks_InTimeFrame_query = await db.quiries.custom_query(
      query_text,
      query_values
    );

    if (get_all_tasks_InTimeFrame_query === null) {
      return {
        success: true,
        message: "Successful get data",
        result: [],
      };
    } else if (get_all_tasks_InTimeFrame_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    }

    var tasks_list = [];
    get_all_tasks_InTimeFrame_query.forEach(function (task) {
      if (
        task.start_date_time >= response.start_date_time &&
        task.start_date_time <= response.end_date_time
      ) {
        tasks_list.push(task);
      }
      if (task.repeat !== null) {
        old_task = JSON.parse(JSON.stringify(task));
        while (true) {
          new_task = JSON.parse(JSON.stringify(old_task));
          new_task.start_date_time = repeat_date_calculate(
            new Date(new_task.start_date_time),
            new_task.repeat
          );
          if (new_task.start_date_time > response.end_date_time) {
            break;
          }
          new_task.end_date_time = Time.add(
            new Date(new_task.start_date_time),
            JSON.parse(new_task.duration)
          );
          if (
            new_task.start_date_time >= response.start_date_time &&
            new_task.start_date_time <= response.end_date_time
          ) {
            tasks_list.push(new_task);
          }
          old_task = JSON.parse(JSON.stringify(new_task));
        }
      }
    });

    tasks_list.sort(function (task_a, task_b) {
      if (task_a.start_date_time < task_b.start_date_time) {
        return -1;
      }
      if (task_a.start_date_time > task_b.start_date_time) {
        return 1;
      }
      // dates must be equal
      return 0;
    });

    list_collide_events = [];
    for (i = 0; i < tasks_list.length; i++) {
      for (j = i + 1; j < tasks_list.length; j++) {
        //collision detection
        if (tasks_list[j].start_date_time <= tasks_list[i].end_date_time) {
          list_collide_events.push({ first: i, second: j });
        } else {
          break;
        }
      }
    }

    return {
      success: true,
      message: "Successful get data",
      result: tasks_list,
      collide: list_collide_events,
    };
  },

  async getallTasks_Data_for_child(response) {
    condition = {
      "create_task.parent_id": response.parent_id,
      "child.child_id": response.child_id,
    };

    [query_text, query_values] = task_data_query(condition);

    // get all task data
    const get_all_tasks_query = await db.quiries.custom_query(
      query_text,
      query_values
    );

    if (get_all_tasks_query === null) {
      return {
        success: true,
        message: "Successful get data",
        result: [],
      };
    } else if (get_all_tasks_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_all_tasks_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_all_tasks_query,
      };
    }
  },

  async finishTask(response) {
    const task_table = "task";
    const complete_task_table = "complete_task";

    // check task already exist in database or not
    const exist_res = await db.quiries.isExist(complete_task_table, {
      task_id: response.task_id,
    });
    if (exist_res === true) {
      return {
        success: false,
        message:
          "Task ID <" +
          response.task_id +
          ">" +
          "This task already done before",
        errors: [
          "Task ID <" +
            response.task_id +
            ">" +
            "This task already done before",
        ],
      };
    }

    // check if questioniare exist data in data base
    const get_task_data = await db.quiries.getData(
      task_table,
      {},
      { task_id: response.task_id }
    );
    if (get_task_data.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    }

    // insert task data in data base
    const addtask_query_res = await db.quiries.insert(complete_task_table, {
      task_id: response.task_id,
      start_date_time: get_task_data.start_date_time,
    });

    if (addtask_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (addtask_query_res) {
      return {
        success: true,
        message: "Successful task mark as done",
      };
    }
  },
};

exports.parent_child_utils = parent_child_utils;
