parent_modifi = {
  firstname: "first_name",
  lastname: "last_name",
  phonenumber: "phone_number",
  date: "Birth_Date",
};
child_modifi = {
  firstname: "first_name",
  lastname: "last_name",
  date: "Birth_Date",
};
task_modify = {
  date: "date",
  time: "time",
  name: "name",
  duration: "duration",
  repeat: "repeat",
  date_time: "date_time",
};

//Convert Request Tags to Match Database columns
const handler = {
  itemName_jsonHandler(response, modifi_type) {
    key_names = Object.keys(response);
    json_str = JSON.stringify(response);
    //modifi json key names to fit with db
    key_names.forEach(function (key) {
      let new_key = key;
      if (modifi_type == "parent" && parent_modifi.hasOwnProperty(key)) {
        new_key = parent_modifi[key];
      } else if (modifi_type == "child" && child_modifi.hasOwnProperty(key)) {
        new_key = child_modifi[key];
      } else if (modifi_type == "task" && task_modify.hasOwnProperty(key)) {
        new_key = task_modify[key];
      }

      json_str = json_str.replace('"' + key + '":', '"' + new_key + '":');
      delete response.key;
    });

    return JSON.parse(json_str);
  },
};

exports.handler = handler;
