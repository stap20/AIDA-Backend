const db = require("../../db/quiries");

async function add_child(response) {
  const table_name = "child";

  // check worker already exist in database or not
  exist_res = await db.quiries.isExist(
    table_name,
    { child_code: response.child_code }
  );

  if (exist_res) {
    return {
      success: false,
      message: "Already exist in db",
      errors: [
        "Child code: " +
          response.child_code +
          " already exist"
      ]
    };
  }

  // generate uuid
  const uuid = await db.quiries.uuidGenerator();
  response.child_id = uuid;
  // insert worker data in data base
  const addChild_query_res = await db.quiries.insert(table_name, response);
  if (addChild_query_res.name === "error") {
    return {
      success: false,
      message: "db error",
      errors: ["something wrong on the input"]
    };
  }
  if (!addChild_query_res) {
    return {
      success: false,
      message: "Already exist in db",
      errors: [
        "child has code: " +
          response.child_code +
          " already exists"
      ]
    };
  } else if (addChild_query_res) {
    return { success: true, message: "Child added successful" };
  }
}

exports.add_child = add_child;
