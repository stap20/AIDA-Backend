const db = require("../../../db/quiries");
var Time = require("time-calculate");
const { commands } = require("npm");
var Mutex = require("async-mutex").Mutex;
var lock_dict = {};
function repeat_date_calculate(date, repeat_type) {
  switch (repeat_type) {
    case "Y":
      date.setFullYear(date.getFullYear() + 1);
      break;
    case "-Y":
      date.setFullYear(date.getFullYear() - 1);
      break;

    case "M":
      date.setMonth(date.getMonth() + 1);
      break;
    case "-M":
      date.setMonth(date.getMonth() - 1);
      break;

    case "D":
      date.setDate(date.getDate() + 1);
      break;
    case "-D":
      date.setDate(date.getDate() - 1);
      break;

    case "W":
      date.setDate(date.getDate() + 7);
      break;
    case "-W":
      date.setDate(date.getDate() - 7);
      break;

    case "2W":
      date.setDate(date.getDate() + 14);
      break;
    case "-2W":
      date.setDate(date.getDate() - 14);
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
  current_date = new Date();
  current_date_time =
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
    current_date.getSeconds();

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
    SELECT child.child_id,
        child.child_code,
        child.first_name,
        child.last_name,
        task.task_id,
        task.source_task_id,
        task.start_date_time,
        task.end_date_time,
        task.duration,
        task.name,
        (CASE
          WHEN complete_task.start_date_time IS not NULL THEN 'done'
          ELSE (CASE
                WHEN '` +
    current_date_time +
    `' > task.end_date_time THEN 'missed'
                ELSE  'due' END)
        END) AS state,
        task.repeat,
        task.repeat_until,
        (CASE
          WHEN task.image_path IS NULL THEN 0
          ELSE 1
      END) AS has_image,     
        t4.public_tags,
        t4.private_tags
    FROM t4
    INNER JOIN task ON t4.task_id = task.task_id
    INNER JOIN child ON t4.child_id = child.child_id
    LEFT JOIN complete_task ON complete_task.task_id = task.task_id
`;
  return [query_text, values_list];
}

function task_clone_data(table, values, condition) {
  var string_condition = `WHERE `;
  var string_values = ``;
  var string_select_values = ``;
  var values_list = [];
  var i = 1;
  for (i = 1; i <= Object.keys(condition).length; i++) {
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

  for (var j = 0; j < Object.keys(values).length; j++) {
    if (Object.keys(values)[j] == "task_id") {
      string_select_values =
        string_select_values +
        " $" +
        i.toString() +
        " as " +
        Object.keys(values)[j];
      string_values = string_values + Object.keys(values)[j];
      values_list.push(values.task_id);
    } else {
      string_select_values = string_select_values + Object.keys(values)[j];
      string_values = string_values + Object.keys(values)[j];
    }
    if (j + 1 < Object.keys(values).length) {
      string_select_values = string_select_values + ",";
      string_values = string_values + ",";
    }
  }

  var query_text =
    `insert into ` +
    table +
    ` (` +
    string_values +
    `) ` +
    `select ` +
    string_select_values +
    ` ` +
    `from ` +
    table +
    ` ` +
    string_condition;

  return [query_text, values_list];
}

function insert_after_all_task_query(table, condition, values, insert_values) {
  var string_insert_select_values = ``;
  string_values = ``;
  var values_list = [];

  var i = 1;
  for (i = 1; i <= Object.keys(condition).length; i++) {
    values_list.push(condition[Object.keys(condition)[i - 1]]);
  }

  for (var j = 0; j < insert_values.values.length; j++) {
    string_insert_select_values =
      string_insert_select_values +
      "select CAST($" +
      i.toString() +
      " as UUID) as " +
      insert_values.alias;
    values_list.push(insert_values.values[j]);

    if (j + 1 < insert_values.values.length) {
      string_insert_select_values = string_insert_select_values + " union all ";
    }
    i += 1;
  }

  for (var j = 0; j < Object.keys(values).length; j++) {
    string_values = string_values + Object.keys(values)[j];

    if (j + 1 < Object.keys(values).length) {
      string_values = string_values + " , ";
    }
  }

  string_condition =
    "source_task_id = $1 and (start_date_time >= $2 or repeat_until is null)";

  var query_text =
    `WITH t1 AS( ` +
    string_insert_select_values +
    ` ), ` +
    `t2 AS( SELECT * FROM task WHERE ` +
    string_condition +
    ` ), ` +
    `t3 AS( SELECT ` +
    string_values +
    ` FROM t1
      cross join t2 )` +
    ` INSERT INTO ` +
    table +
    ` ( ` +
    string_values +
    ` ) ` +
    `SELECT ` +
    string_values +
    ` FROM T3`;

  return [query_text, values_list];
}

function modify_delete_after_all_task_query(
  table,
  condition,
  type,
  modify_values
) {
  modify_values = typeof modify_values === "undefined" ? {} : modify_values;

  var values_list = [];
  string_modify_values = ``;
  var interval_type = "second";
  var sign = "+";

  if (modify_values.hasOwnProperty("interval_type")) {
    interval_type = modify_values.interval_type;
  }

  if (modify_values.interval < 0) {
    sign = "-";
    modify_values.interval = modify_values.interval * -1;
  }

  var i = 1;
  for (i = 1; i <= Object.keys(condition).length; i++) {
    values_list.push(condition[Object.keys(condition)[i - 1]]);
  }

  idx = values_list.length;

  for (i = 1; i <= Object.keys(modify_values).length; i++) {
    if (
      !(
        modify_values.hasOwnProperty("interval") &&
        (Object.keys(modify_values)[i - 1] == "start_date_time" ||
          Object.keys(modify_values)[i - 1] == "end_date_time" ||
          Object.keys(modify_values)[i - 1] == "interval" ||
          Object.keys(modify_values)[i - 1] == "interval_type" ||
          Object.keys(modify_values)[i - 1] == "repeat_until")
      )
    ) {
      string_modify_values =
        string_modify_values + Object.keys(modify_values)[i - 1];

      string_modify_values = string_modify_values + " = ";
      values_list.push(modify_values[Object.keys(modify_values)[i - 1]]);
      idx = idx + 1;

      string_modify_values = string_modify_values + " $" + idx.toString() + " ";
      if (i + 1 <= Object.keys(modify_values).length) {
        string_modify_values = string_modify_values + " , ";
      }
    }
  }

  if (modify_values.hasOwnProperty("interval")) {
    if (modify_values.interval < 0) {
      sign = "-";
      modify_values.interval = modify_values.interval * -1;
    }
    string_modify_values =
      string_modify_values +
      " start_date_time = start_date_time " +
      sign +
      " interval '" +
      modify_values.interval.toString() +
      " " +
      modify_values.interval_type +
      "'";

    string_modify_values =
      string_modify_values +
      " , end_date_time = end_date_time " +
      sign +
      " interval '" +
      modify_values.interval.toString() +
      " " +
      modify_values.interval_type +
      "'";

    string_modify_values =
      string_modify_values +
      " , repeat_until = repeat_until " +
      sign +
      " interval '" +
      modify_values.interval.toString() +
      " " +
      modify_values.interval_type +
      "'";
  }

  string_condition = `task_id IN (SELECT task_id FROM task WHERE source_task_id = $1 and (start_date_time >= $2 or repeat_until is null))`;

  var start_query = ``;
  if (type == "modify") {
    start_query = `UPDATE ` + table + ` SET ` + string_modify_values + ` `;
  } else if ((type = "remove")) {
    start_query = `DELETE FROM ` + table + ` `;
  }

  var query_text = start_query + ` WHERE ` + string_condition;

  return [query_text, values_list];
}

async function insert_clone(table, values, condition) {
  //now clone data in table

  [query_text, query_values] = task_clone_data(table, values, condition);

  // get all task data
  const query_res = await db.quiries.custom_query(query_text, query_values);

  if (query_res === null) {
    return {
      success: true,
    };
  } else if (query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  } else {
    return {
      success: true,
    };
  }
}

async function before_slice_task(before_task_data, before_task_uuid, response) {
  const task_table = "task";
  const create_task_table = "create_task";
  const private_match_table = "private_tag_match";
  const public_match_table = "public_tag_match";
  //prepairing new task data to insert it
  before_task_data.task_id = before_task_uuid;

  var repeat_until_date_time = repeat_date_calculate(
    new Date(response.date_time),
    "-" + before_task_data.repeat
  );

  before_task_data.repeat_until = repeat_until_date_time;
  // insert task data in data base
  const addtask_query_res = await db.quiries.insert(
    task_table,
    before_task_data
  );

  if (addtask_query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  }

  //now clone task data in table create_task
  condition = { task_id: response.task_id };
  values = {
    parent_id: "",
    task_id: before_task_uuid,
    child_id: "",
  };

  insert_res = await insert_clone(create_task_table, values, condition);

  if (!insert_res.success) {
    return insert_res;
  }

  //now clone task data in table public_tag_match
  condition = { task_id: response.task_id };
  values = {
    tag_id: "",
    task_id: before_task_uuid,
  };

  insert_res = await insert_clone(public_match_table, values, condition);

  if (!insert_res.success) {
    return insert_res;
  }

  //now clone task data in table private_tag_match
  condition = { task_id: response.task_id };
  values = {
    tag_id: "",
    task_id: before_task_uuid,
  };

  insert_res = await insert_clone(private_match_table, values, condition);

  if (!insert_res.success) {
    return insert_res;
  }

  return {
    success: true,
    message: "Task clonned successful",
  };
}

async function after_slice_task(after_task_data, after_task_uuid, response) {
  const task_table = "task";
  const create_task_table = "create_task";
  const private_match_table = "private_tag_match";
  const public_match_table = "public_tag_match";
  //after target date
  //prepairing new task data to insert it
  after_task_data.task_id = after_task_uuid;

  var new_start_date_time = repeat_date_calculate(
    new Date(response.date_time),
    after_task_data.repeat
  );

  after_task_data.end_date_time = Time.add(
    new_start_date_time,
    JSON.parse(after_task_data.duration)
  );

  after_task_data.start_date_time = new_start_date_time;
  // insert task data in data base
  const addtask_query_res = await db.quiries.insert(
    task_table,
    after_task_data
  );

  if (addtask_query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"],
    };
  }

  //now clone task data in table create_task
  condition = { task_id: response.task_id };
  values = {
    parent_id: "",
    task_id: after_task_uuid,
    child_id: "",
  };

  insert_res = await insert_clone(create_task_table, values, condition);

  if (!insert_res.success) {
    return insert_res;
  }

  //now clone task data in table public_tag_match
  condition = { task_id: response.task_id };
  values = {
    tag_id: "",
    task_id: after_task_uuid,
  };

  insert_res = await insert_clone(public_match_table, values, condition);

  if (!insert_res.success) {
    return insert_res;
  }

  //now clone task data in table private_tag_match
  condition = { task_id: response.task_id };
  values = {
    tag_id: "",
    task_id: after_task_uuid,
  };

  insert_res = await insert_clone(private_match_table, values, condition);

  if (!insert_res.success) {
    return insert_res;
  }
  return {
    success: true,
    message: "Task clonned successful",
  };
}

async function clone_task_process(response) {
  //here logic based to maked task before target date with untill = target date - 1 and task after target date with untill same original
  const task_table = "task";

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

  const before_task_uuid = await db.quiries.uuidGenerator();
  const after_task_uuid = await db.quiries.uuidGenerator();
  before_task_data = { ...get_task_data };
  after_task_data = { ...get_task_data };

  if (response.type == 0 || response.type == "0") {
    if (
      get_task_data.repeat_until == null ||
      get_task_data.start_date_time.getTime() <
        get_task_data.repeat_until.getTime()
    ) {
      if (
        response.date_time.getTime() >
          get_task_data.start_date_time.getTime() &&
        (get_task_data.repeat_until == null ||
          response.date_time.getTime() < get_task_data.repeat_until.getTime())
      ) {
        //before and after normal
        before_res = await before_slice_task(
          before_task_data,
          before_task_uuid,
          response
        );
        if (!before_res.success) {
          return before_res;
        }
        after_res = await after_slice_task(
          after_task_data,
          after_task_uuid,
          response
        );
        if (!after_res.success) {
          return before_res;
        }
      }
      //after only
      else if (
        response.date_time.getTime() == get_task_data.start_date_time.getTime()
      ) {
        after_res = await after_slice_task(
          after_task_data,
          after_task_uuid,
          response
        );
        if (!after_res.success) {
          return before_res;
        }
      }
      //before only
      else if (
        response.date_time.getTime() == get_task_data.repeat_until.getTime()
      ) {
        before_res = await before_slice_task(
          before_task_data,
          before_task_uuid,
          response
        );
        if (!before_res.success) {
          return before_res;
        }
      }

      {
        //update current task
        // update task data in data base
        const task_modify_query_res = await db.quiries.modifiData(
          task_table,
          { task_id: response.task_id },
          {
            start_date_time: new Date(response.date_time),
            repeat_until: response.date_time,
          }
        );
        //error handler class
        if (task_modify_query_res.name === "error") {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }
      }
    }
  } else if (response.type == 1 || response.type == "1") {
    if (
      get_task_data.repeat_until == null ||
      response.date_time.getTime() <= get_task_data.repeat_until.getTime()
    ) {
      before_res = await before_slice_task(
        before_task_data,
        before_task_uuid,
        response
      );
      if (!before_res.success) {
        return before_res;
      }
    }

    if (response.hasOwnProperty("deletion_type")) {
      // remove task data and all after it base
      new_start_date_time = response.date_time;
      condition = {
        source_task_id: get_task_data.source_task_id,
        start_date_time: new_start_date_time,
      };

      [query_text, query_values] = modify_delete_after_all_task_query(
        task_table,
        condition,
        "remove"
      );

      // get all task data
      const query_res = await db.quiries.custom_query(query_text, query_values);

      if (query_res != null && query_res.name === "error") {
        return {
          success: false,
          message: "db error",
          errors: ["something wrong on the input"],
        };
      } else {
        return {
          success: true,
        };
      }
    } else if (response.hasOwnProperty("modify_type")) {
      //update current task
      // update task data in data base
      const task_modify_query_res = await db.quiries.modifiData(
        task_table,
        { task_id: response.task_id },
        {
          start_date_time: new Date(response.date_time),
        }
      );
      //error handler class
      if (task_modify_query_res.name === "error") {
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
    message: "Tasks clonned successful",
  };
}
async function clone_task(response) {
  if (lock_dict[response.task_id] === undefined) {
    lock_dict[response.task_id] = new Mutex();
  }
  const release = await lock_dict[response.task_id].acquire();

  try {
    var res = await clone_task_process(response);
  } catch {
    var res = {
      success: false,
      message: "Lock thread error",
      errors: ["Multiple requests or incorrect id"],
    };
  } finally {
    release();
  }

  return res;
}
const visual_schedule_utils = {
  async getTasks_Image(response) {
    const table_name = "task";

    // check if task exist data in data base
    const get_task_image_query = await db.quiries.isExist(table_name, {
      task_id: response.task_id,
    });
    if (get_task_image_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (!get_task_image_query) {
      return {
        success: false,
        message:
          "Task ID <" + response.task_id + ">" + "This task doesn't exist",
        errors: [
          "Task ID <" + response.task_id + ">" + "This task doesn't exist",
        ],
      };
    }

    // check if pdf report done or not
    const get_image_path_query_res = await db.quiries.getData(
      table_name,
      {},
      { task_id: response.task_id }
    );
    if (get_image_path_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (get_image_path_query_res) {
      var image_path = get_image_path_query_res.image_path;
      if (response.reduced == "1") {
        image_path = get_image_path_query_res.image_path.split(".");
        get_image_path_query_res.image_path = "." + image_path[1];
        image_path = get_image_path_query_res.image_path + "_r.jpg";
      }
      return {
        success: true,
        result: image_path,
        message: "Successful",
      };
    }
  },
  async getallTasks_Data(response) {
    condition = {
      "create_task.parent_id": response.parent_uuid,
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
  async getallParentTag_Data(response) {
    var query_text = `
        with main_table as (
          select
            task.task_id,
            public_tag_match.tag_id as public_tag_id,
            private_tag_match.tag_id as private_tag_id
          from
            create_task
            inner join task on create_task.task_id = task.task_id
            left join public_tag_match on create_task.task_id = public_tag_match.task_id
            left join private_tag_match on create_task.task_id = private_tag_match.task_id
          where
            create_task.parent_id = $1
        ),
        public_tag_data as (
          select
            name,
            'public' as tag_type,
            tag_id
          from
            public_tag
        ),
        private_tag_data as (
          select
            name,
            'private' as tag_type,
            tag_id
          from
            private_tag
          where
            parent_id = $1
        ),
        t2 as (
          select
            main_table.task_id,
            CONCAT(
              '{"tag_id":"',
              main_table.public_tag_id,
              '", "name":"',
              public_tag_data.name,
              '", "type":"',
              public_tag_data.tag_type,
              '"}'
            ) AS public_tags
          from
            main_table
            left join public_tag_data on main_table.public_tag_id = public_tag_data.tag_id
        ),
        t3 as (
          select
            main_table.task_id,
            CONCAT(
              '{"tag_id":"',
              main_table.private_tag_id,
              '", "name":"',
              private_tag_data.name,
              '", "type":"',
              private_tag_data.tag_type,
              '"}'
            ) AS private_tags
          from
            main_table
            left join private_tag_data on main_table.private_tag_id = private_tag_data.tag_id
        ),
        t4 as (
          select
            task_id,
            array_agg(public_tags) as public_tags
          from
            t2
          where
            public_tags <> '{"tag_id":, "name":, "type":}'
          group by
            task_id
        ),
        t5 as (
          select
            task_id,
            array_agg(private_tags) as private_tags
          from
            t3
          where
            private_tags <> '{"tag_id":, "name":, "type":}'
          group by
            task_id
        )
        select
          t4.public_tags,
          t5.private_tags
        from
          t4
          left join t5 on t4.task_id = t5.task_id
    `;

    var query_values = [response.parent_uuid];

    // get all task data
    const get_all_parent_tag_query = await db.quiries.custom_query(
      query_text,
      query_values
    );
    if (get_all_parent_tag_query === null) {
      return {
        success: false,
        message: "Successful get data",
        result: [],
      };
    } else if (get_all_parent_tag_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_all_parent_tag_query) {
      public_tags = [];
      private_tags = [];

      get_all_parent_tag_query.forEach((task_tags) => {
        if (task_tags.public_tags != null) {
          public_tags.push(task_tags.public_tags);
        }
        if (task_tags.private_tags != null) {
          private_tags.push(task_tags.private_tags);
        }
      });

      public_tags = public_tags.flat(Infinity);
      private_tags = private_tags.flat(Infinity);

      public_tags = public_tags.map((tag) => JSON.parse(tag));

      private_tags = private_tags.map((tag) => JSON.parse(tag));

      public_tags = public_tags.filter(function (tag, index, self) {
        return (
          index ===
          self.findIndex(
            (idxtag) => idxtag.tag_id === tag.tag_id && idxtag.tag_id !== ""
          )
        );
      });

      private_tags = private_tags.filter(function (tag, index, self) {
        return (
          index ===
          self.findIndex(
            (idxtag) => idxtag.tag_id === tag.tag_id && idxtag.tag_id !== ""
          )
        );
      });

      result = {
        public_tags: public_tags,
        private_tags: private_tags,
      };

      return {
        success: true,
        message: "Successful get data",
        result: result,
      };
    }
  },
  async getallTasksInTime_Frame(response) {
    const complete_task = "complete_task";
    condition = {
      "create_task.parent_id": response.parent_uuid,
    };

    if (response.hasOwnProperty("child_id")) {
      condition = {
        "create_task.parent_id": response.parent_uuid,
        "create_task.child_id": response.child_id,
      };
    }

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

    // get all complete task
    const get_all_complete_task_query_res = await db.quiries.getallData(
      complete_task
    );
    if (
      get_all_complete_task_query_res != null &&
      get_all_complete_task_query_res.name === "error"
    ) {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    }
    get_all_tasks_InTimeFrame = get_all_tasks_InTimeFrame_query.filter(
      function (task, index, self) {
        return (
          index ===
          self.findIndex(
            (idxtask) =>
              idxtask.task_id === task.task_id &&
              idxtask.child_id === task.child_id
          )
        );
      }
    );

    var tasks_list = [];
    get_all_tasks_InTimeFrame.forEach(function (task) {
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
          if (
            new_task.repeat_until == null &&
            new_task.start_date_time > response.end_date_time
          ) {
            break;
          } else if (
            new_task.repeat_until != null &&
            new_task.start_date_time > new Date(new_task.repeat_until)
          ) {
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

    tasks_list.map((task) => {
      is_complete = get_all_complete_task_query_res.find((comp_task) => {
        if (
          comp_task.task_id === task.task_id &&
          comp_task.start_date_time.getTime() === task.start_date_time.getTime()
        ) {
          return true;
        }
        return false;
      });

      if (is_complete) {
        task.state = "done";
      } else {
        if (new Date().getTime() < task.start_date_time.getTime()) {
          task.state = "due";
        } else {
          task.state = "missed";
        }
      }
      return task;
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
        message: "no tasks exists for this child in db",
        errors: ["no tasks exists for this child"],
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
  async get_selected_Task_Data(response) {
    condition = {
      "create_task.parent_id": response.parent_id,
      "create_task.task_id": response.task_id,
    };

    [query_text, query_values] = task_data_query(condition);

    // get all task data
    const get_task_query = await db.quiries.custom_query(
      query_text,
      query_values
    );

    if (get_task_query === null) {
      return {
        success: false,
        message: "Successful get data",
        result: [],
      };
    } else if (get_task_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_task_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_task_query,
      };
    }
  },
  async search_tag(response) {
    const table1 = "public_tag";
    const table2 = "private_tag";
    mix_type = "union";

    q1 = {
      table: table1,
      values: { name: "", "'public' as tag_type": "", tag_id: "" },
      condition: {},
    };

    q2 = {
      table: table2,
      values: { name: "", "'private' as tag_type": "", tag_id: "" },
      condition: { parent_id: response.parent_uuid },
    };

    // get tags data
    const get_tags_query = await db.quiries.search_mixed([q1, q2], mix_type, {
      name: response.name,
    });

    if (get_tags_query === null) {
      return {
        success: true,
        message: "Successful get data",
        result: [],
      };
    } else if (get_tags_query.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something went wrong"],
      };
    } else if (get_tags_query) {
      return {
        success: true,
        message: "Successful get data",
        result: get_tags_query,
      };
    }
  },
  async modifyTask(response) {
    const task_table = "task";
    const create_task_table = "create_task";
    const private_match_table = "private_tag_match";
    const public_match_table = "public_tag_match";

    // check task already exist in database or not
    const exist_res = await db.quiries.isExist(task_table, {
      task_id: response.task_id,
    });

    if (exist_res === false) {
      return {
        success: false,
        message:
          "Task ID <" + response.task_id + ">" + "This task doesn't exist",
        errors: [
          "Task ID <" + response.task_id + ">" + "This task doesn't exist",
        ],
      };
    }

    // check child already exist in database or not
    const task_data = await db.quiries.getData(
      task_table,
      {},
      {
        task_id: response.task_id,
      }
    );

    if (task_data.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    }

    if (
      task_data.repeat != null &&
      response.hasOwnProperty("date_time") &&
      response.hasOwnProperty("modify_type")
    ) {
      response.type = response.modify_type;
      if (response.modify_type == 0 || response.modify_type == "0") {
        clone_res = await clone_task(response);
        if (!clone_res.success) {
          return clone_res;
        }
      } else if (
        (response.modify_type == 1 || response.modify_type == "1") &&
        response.date_time.getTime() > task_data.start_date_time.getTime()
      ) {
        clone_res = await clone_task(response);
        if (!clone_res.success) {
          return clone_res;
        }
      } else {
        // check child already exist in database or not
        const alltask_data = await db.quiries.getallData(
          task_table,
          {},
          {
            source_task_id: task_data.source_task_id,
          }
        );
        if (task_data.name === "error") {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }

        // remove task data and all after it base
        response.date_time = alltask_data[0].start_date_time;
      }
    }

    if (response.hasOwnProperty("child_id")) {
      // check child already exist in database or not
      const exist_res = await db.quiries.isExist("child", {
        parent_id: response.parent_id,
        child_id: response.child_id,
      });
      if (exist_res === false) {
        return {
          success: false,
          message:
            "Child ID <" + response.child_id + ">" + "This child doesn't exist",
          errors: [
            "Child ID <" + response.child_id + ">" + "This child doesn't exist",
          ],
        };
      }

      if (
        response.modify_type >= 1 ||
        response.modify_type == "1" ||
        response.modify_type == "2"
      ) {
        condition = {
          source_task_id: task_data.source_task_id,
          start_date_time: response.date_time,
        };

        modify_values = {
          child_id: response.child_id,
        };

        [query_text, query_values] = modify_delete_after_all_task_query(
          create_task_table,
          condition,
          "modify",
          modify_values
        );

        // modify all child id for all version after selected date time
        const modify_child_query_res = await db.quiries.custom_query(
          query_text,
          query_values
        );

        if (
          modify_child_query_res != null &&
          modify_child_query_res.name === "error"
        ) {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }
      } else {
        // update task data in data base
        const task_modify_child_query_res = await db.quiries.modifiData(
          create_task_table,
          { task_id: response.task_id },
          { child_id: response.child_id }
        );
        //error handler class
        if (task_modify_child_query_res.name === "error") {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }
      }
    }

    if (
      response.hasOwnProperty("public_tags") &&
      response.public_tags.length > 0
    ) {
      if (
        response.modify_type >= 1 ||
        response.modify_type == "1" ||
        response.modify_type == "2"
      ) {
        condition = {
          source_task_id: task_data.source_task_id,
          start_date_time: response.date_time,
        };

        //delete all tag after selected date time
        {
          [query_text, query_values] = modify_delete_after_all_task_query(
            public_match_table,
            condition,
            "remove"
          );

          // delete all old public tags
          const remove_old_public_tags_query_res = await db.quiries.custom_query(
            query_text,
            query_values
          );

          if (
            remove_old_public_tags_query_res != null &&
            remove_old_public_tags_query_res.name === "error"
          ) {
            return {
              success: false,
              message: "db error",
              errors: ["something wrong on the input"],
            };
          }
        }

        values = {
          tag_id: "",
          task_id: "",
        };

        insert_values = {
          values: response.public_tags,
          alias: "tag_id",
        };

        [query_text, query_values] = insert_after_all_task_query(
          public_match_table,
          condition,
          values,
          insert_values
        );

        // after remove old tags add new tags to database
        const add_public_tags_query_res = await db.quiries.custom_query(
          query_text,
          query_values
        );

        if (
          add_public_tags_query_res != null &&
          add_public_tags_query_res.name === "error"
        ) {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }
      } else {
        // remove all tags data base
        const tags_query_res = await db.quiries.remove(public_match_table, {
          task_id: response.task_id,
        });

        if (tags_query_res != null && tags_query_res.name === "error") {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }

        //then add all passed tags
        // pass a function to map
        const public_tags = response.public_tags.map((public_tag_id) => {
          return { task_id: response.task_id, tag_id: public_tag_id };
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
    }

    if (
      response.hasOwnProperty("private_tags") &&
      response.private_tags.length > 0
    ) {
      if (
        response.modify_type >= 1 ||
        response.modify_type == "1" ||
        response.modify_type == "2"
      ) {
        condition = {
          source_task_id: task_data.source_task_id,
          start_date_time: response.date_time,
        };

        //delete all tag after selected date time
        {
          [query_text, query_values] = modify_delete_after_all_task_query(
            private_match_table,
            condition,
            "remove"
          );

          // delete old private tags
          const remove_old_private_tags_query_res = await db.quiries.custom_query(
            query_text,
            query_values
          );

          if (
            remove_old_private_tags_query_res != null &&
            remove_old_private_tags_query_res.name === "error"
          ) {
            return {
              success: false,
              message: "db error",
              errors: ["something wrong on the input"],
            };
          }
        }

        values = {
          tag_id: "",
          task_id: "",
        };

        insert_values = {
          values: response.private_tags,
          alias: "tag_id",
        };

        [query_text, query_values] = insert_after_all_task_query(
          private_match_table,
          condition,
          values,
          insert_values
        );

        // after remove old tags add new tags to database
        const add_private_tags_query_res = await db.quiries.custom_query(
          query_text,
          query_values
        );

        if (
          add_private_tags_query_res != null &&
          add_private_tags_query_res.name === "error"
        ) {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }
      } else {
        // remove all tags data base
        const tags_query_res = await db.quiries.remove(private_match_table, {
          task_id: response.task_id,
        });

        if (tags_query_res != null && tags_query_res.name === "error") {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }

        //then add all passed tags
        // pass a function to map
        const private_tags = response.private_tags.map((private_tag_id) => {
          return { task_id: response.task_id, tag_id: private_tag_id };
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

    //make sure we have data to be modified
    if (Object.keys(response.data).length > 0) {
      // update task data in data base
      if (
        response.modify_type >= 1 ||
        response.modify_type == "1" ||
        response.modify_type == "2"
      ) {
        condition = {
          source_task_id: task_data.source_task_id,
          start_date_time: response.date_time,
        };
        modify_values = { ...response.data };

        delete modify_values.start_date_time;
        delete modify_values.end_date_time;
        delete modify_values.repeat_until;

        if (response.data.repeat != task_data.repeat) {
          const uuid = await db.quiries.uuidGenerator();
          modify_values.source_task_id = uuid;
        }

        if (
          Time.diff(
            response.data.start_date_time,
            task_data.start_date_time,
            "{D}"
          ) > 0
        ) {
          const uuid = await db.quiries.uuidGenerator();
          modify_values.source_task_id = uuid;
        }

        if (
          response.data.start_date_time.getTime() !=
          task_data.start_date_time.getTime()
        ) {
          (diff =
            response.data.start_date_time.getTime() -
            task_data.start_date_time.getTime()),
            (modify_values.interval = diff / 1000);
          modify_values.interval_type = "second";
        }

        [query_text, query_values] = modify_delete_after_all_task_query(
          task_table,
          condition,
          "modify",
          modify_values
        );

        console.log(query_text);
        console.log(query_values);
        // modify task data after selected date_time
        const modify_task_data_query_res = await db.quiries.custom_query(
          query_text,
          query_values
        );

        console.log(modify_task_data_query_res);

        if (modify_task_data_query_res.name === "error") {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }
      } else {
        if (
          Time.diff(
            response.data.start_date_time,
            task_data.start_date_time,
            "{D}"
          ) > 0
        ) {
          const uuid = await db.quiries.uuidGenerator();
          response.data.source_task_id = uuid;
        }
        const task_modify_query_res = await db.quiries.modifiData(
          task_table,
          { task_id: response.task_id },
          response.data
        );
        //error handler class
        if (task_modify_query_res.name === "error") {
          return {
            success: false,
            message: "db error",
            errors: ["something wrong on the input"],
          };
        }
      }
    }
    /*
     */
    return { success: true, message: "modified successful" };
  },
  async removeTask(response) {
    const task_table = "task";
    // check task already exist in database or not
    const exist_res = await db.quiries.isExist(task_table, {
      task_id: response.task_id,
    });
    if (exist_res === false) {
      return {
        success: false,
        message:
          "Task ID <" + response.task_id + ">" + "This task doesn't exist",
        errors: [
          "Task ID <" + response.task_id + ">" + "This task doesn't exist",
        ],
      };
    }

    // check child already exist in database or not
    const task_data = await db.quiries.getData(
      task_table,
      {},
      {
        task_id: response.task_id,
      }
    );
    if (task_data.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    }

    if (
      task_data.repeat != null &&
      response.hasOwnProperty("date_time") &&
      response.hasOwnProperty("deletion_type")
    ) {
      response.type = response.deletion_type;
      if (response.deletion_type == 0 || response.deletion_type == "0") {
        clone_res = await clone_task(response);
        if (!clone_res.success) {
          return clone_res;
        }
      } else if (response.deletion_type == 1 || response.deletion_type == "1") {
        clone_res = await clone_task(response);
        if (!clone_res.success) {
          return clone_res;
        }
      } else {
        if (
          response.date_time.getTime() != task_data.start_date_time.getTime()
        ) {
          // check child already exist in database or not
          const alltask_data = await db.quiries.getallData(
            task_table,
            {},
            {
              source_task_id: task_data.source_task_id,
            }
          );
          if (task_data.name === "error") {
            return {
              success: false,
              message: "db error",
              errors: ["something wrong on the input"],
            };
          }

          // remove task data and all after it base
          new_start_date_time = alltask_data[0].start_date_time;
          condition = {
            source_task_id: get_task_data.source_task_id,
            start_date_time: new_start_date_time,
          };

          [query_text, query_values] = modify_delete_after_all_task_query(
            task_table,
            condition,
            "remove"
          );

          // get all task data
          const query_res = await db.quiries.custom_query(
            query_text,
            query_values
          );

          if (query_res.name === "error") {
            return {
              success: false,
              message: "db error",
              errors: ["something wrong on the input"],
            };
          } else {
            return {
              success: true,
              message: "Tasks removed successful",
            };
          }
        }
      }
    }

    // remove task data base
    const task_remove_query_res = await db.quiries.remove(task_table, {
      task_id: response.task_id,
    });

    //error handler class
    if (task_remove_query_res.name === "error") {
      return {
        success: false,
        message: "db error",
        errors: ["something wrong on the input"],
      };
    } else if (task_remove_query_res) {
      return {
        success: true,
        message: "Task removed successful",
      };
    }
  },
};

exports.visual_schedule_utils = visual_schedule_utils;
