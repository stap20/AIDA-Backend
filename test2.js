var demon = require("./code/js/demon/queuing_job");

// open a file called "lenna.png"
demon.queuing_job().then((value) => {
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
  console.log(
    "===================== Log Date: " +
      date_time +
      " ====================="
  );
  if (!value.success) {
    console.log("-------------------- Error --------------------");
    console.log(value.message);
    console.log(value.errors);
    console.log("-----------------------------------------------");
  } else {
    console.log("------------------------------ Summary of demon ------------------------------");
    console.log("------------------------- Rater summary -------------------------");
    console.log(value.summary_list[0]);
    console.log("-----------------------------------------------------------------");
    console.log("------------------------- Video queue summary -------------------------");
    console.log(value.summary_list[1]);
    console.log("-----------------------------------------------------------------");
    console.log("------------------------- Rater queue summary -------------------------");
    console.log(value.summary_list[2]);
    console.log("-----------------------------------------------------------------");
    console.log("-------------------------------- Summary End --------------------------------");
  }
});

/*
with t1 as (select name from public_tag
union 
select name from private_tag where parent_id = '8b7c3916-69c1-11ea-9d8f-42010af00032')

select name from t1 where name ilike '%%'

{"question_id":"01e747d4-fcff-494f-83b8-05d0411e2a2f","question_answer":"do"}&{"question_id":"0711c857-f743-4df1-b7ab-aae6c013e9f8","question_answer":"absolutely"}&{"question_id":"a11cbb2f-f12b-4b1f-9e29-f0b0ba9fe52f","question_answer":"with"}&{"question_id":"7b1a1365-498e-4d5d-9785-baa3250028cd","question_answer":"during"}&{"question_id":"c8b41252-d90b-4757-805d-435710c5c6fb","question_answer":"ago"}
*/
