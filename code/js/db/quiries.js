/*
* this file contain general query for database so u can use it for any table ex:
* func getalldata if u wanna get all data from table query must be like that select * from tabel_name where condition
* so if u see func getalldata param (table,values,condition) , values that mean column name "values u want get from table"
* so it must make it easier for dev on back end so he wont need to to write queryonly call func that make a funcationality
* that he want like get data or select or insert or modifi or join so u want only to pass generall params
* and return result of the quirey
*/

const pg = require("pg");
var jsonSql = require("json-sql")();
var assert = require("assert");

const url = {
  user: "mmpzqono",
  host: "rogue.db.elephantsql.com",
  database: "mmpzqono",
  password: "nOGdXJ715VmST4eCgwZfYkHiHl0dG6sg",
  port: 5432
};

function fixQuery(query_text,target_remove = "$p") {
  var idx = query_text.indexOf(target_remove);
  var iterate = 0
  while (idx >= 0 && iterate < query_text.length) {
    first = query_text.substr(0, idx + 1);
    last = query_text.substr(idx + 2, query_text.length - 1);

    query_text = first + last;
    idx = query_text.indexOf(target_remove);
    iterate++;
  }

  return query_text;
}
String.prototype.replaceAt=function(index, replacement) {
  return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}

function remove_string_from_text(text, target_tobe_removed) {
  //here convert = to ilike and $number => to $valid number
  text_len = text.length;
  new_text = text;
  var pos = new_text.indexOf(target_tobe_removed);
  while (pos > 0 && pos < text_len) {
    new_text = [
      new_text.slice(0, pos),
      "",
      new_text.slice(pos + target_tobe_removed.length)
    ].join(""); //make query with 2 join
    pos = new_text.indexOf(target_tobe_removed);
  }
  return new_text;
}


function queryGenerator(parm_json) {
  var query_type = parm_json.query_type;
  var query_table = parm_json.query_table;
  var values_list = parm_json.values_list;
  var condition = parm_json.condition;
  var modifiers = parm_json.modifiers;
  var sort = parm_json.sort;

  assert(typeof query_type !== "undefined", "query type cannot be undefined");
  assert(typeof query_table !== "undefined", "query table cannot be undifined");

  values_list = typeof values_list === "undefined" ? {} : values_list;
  condition = typeof condition === "undefined" ? {} : condition;
  modifiers = typeof modifiers === "undefined" ? {} : modifiers;
  sort = typeof sort === "undefined" ? {} : sort;

  var fields = values_list instanceof Array ? Object.keys(values_list[0]) : Object.keys(values_list);

  var sql = jsonSql.build({
    type: query_type,
    table: query_table,
    fields: fields,
    values: values_list,
    condition: condition,
    modifier: modifiers,
    sort: sort
  });

  query = {
    text: fixQuery(sql.query),
    values: Object.values(sql.values)
  };
  return query;
}

function join_queryGenerator(parm_json) {
  
  var values_list = parm_json.values_list;
  var condition = parm_json.condition;

  assert(
    typeof parm_json.table_name !== "undefined",
    "query table cannot be undefined"
  );
  assert(
    typeof parm_json.join_json.type !== "undefined",
    "join type cannot be undifined"
  );
  assert(
    typeof parm_json.join_json.table !== "undefined",
    "join table cannot be undifined"
  );
  assert(
    typeof parm_json.join_json.on !== "undefined",
    "join condition cannot be undifined"
  );

  values_list = typeof values_list === "undefined" ? {} : values_list;
  condition = typeof condition === "undefined" ? {} : condition;

  var fields =
    parm_json.values_list instanceof Array
      ? Object.keys(values_list[0])
      : Object.keys(values_list);

  var sql = jsonSql.build({
    table: parm_json.table_name,
    fields: fields,
    condition: condition,
    join: [parm_json.join_json]
  });
  query = {
    text: fixQuery(sql.query),
    values: Object.values(sql.values)
  };
  return query;
}

function mix_queryGenerator(parm_json) {
  var query_type = parm_json.query_type;
  var queries = parm_json.queries;

  assert(typeof query_type !== "undefined", "query type cannot be undefined");
  assert(typeof queries !== "undefined", "queries cannot be undifined");

  for (i = 0; i < queries.length; i++) {
    queries[i].type = "select";
    queries[i].values_list = queries[i].values;
    queries[i].fields =
      queries[i].values_list instanceof Array
        ? Object.keys(queries[i].values_list[0])
        : Object.keys(queries[i].values_list);
    delete queries[i].values;
  }
  var sql = jsonSql.build({
    type: query_type,
    queries: queries
  });

  query = {
    text: fixQuery(sql.query),
    values: Object.values(sql.values)
  };
  return query;
}

// for connection information
var client = new pg.Client(url);
client.connect();

const quiries = {

  async insert(table,values) {
    values_list = typeof values_list === "undefined" ? {} : values_list;
    try {
        const res = await client.query(queryGenerator({query_type:"insert",query_table:table,values_list:values}));
        if (res.rowCount > 0)
        return true;     
        else 
        return false;
    } 
    catch (error) {return error;}
  },
   
  async isExist(table,condition) {
    try {
        const res = await client.query(queryGenerator({query_type:"select",query_table:table,condition:condition}));
        if (res.rowCount > 0)
        return true     
        else 
        return false;
    } 
    //for all catch must send to class to classifi error to get useful details about error
    catch (error) {return error;}
  },

  async getData(table,values,condition) {
    values_list = typeof values_list === "undefined" ? {} : values_list;
    condition = typeof condition === "undefined" ? {} : condition;
    
    try {
        const res = await client.query(queryGenerator({query_type:"select",query_table:table,values_list:values,condition:condition}));
        if (res.rowCount > 0)
            return res.rows[0];     
        else 
            return null;
    } 
    catch (error) {return error;}
  },

  async getallData(table,values,condition,sort) {
    values_list = typeof values_list === "undefined" ? {} : values_list;
    condition = typeof condition === "undefined" ? {} : condition;
    try {
        const res = await client.query(queryGenerator({query_type:"select",query_table:table,values_list:values,condition:condition,sort:sort}));
        if (res.rowCount > 0)
            return res.rows;     
        else 
            return null;
    } 
    catch (error) {return error;}
  },

  async modifiData(table,condition,modifiers) {
    try {
        const res = await client.query(queryGenerator({query_type:"update",query_table:table,condition:condition,modifiers:modifiers}));
        if (res.rowCount > 0)
            return true;     
        else 
            return false;
    } 
    catch (error) {return error;}
  },

  async search(table, values, condition) {
    values_list = typeof values_list === "undefined" ? {} : values_list;
    condition = typeof condition === "undefined" ? {} : condition;
  
    for (i = 0; i < Object.keys(condition).length; i++) {
      condition[Object.keys(condition)[i]]=condition[Object.keys(condition)[i]]+"%"
    }
  
    main_query = queryGenerator({
      query_type: "select",
      query_table: table,
      values_list: values,
      condition: condition
    });
  
    for (i = 0; i < Object.keys(condition).length; i++) {
      const pos = main_query.text.search("=");
      main_query.text = [
        main_query.text.slice(0, pos),
        "ilike",
        main_query.text.slice(pos + 1)
      ].join(""); //make query with 2 join
    }
    console.log(main_query)
    try {
      const res = await client.query(main_query);
      if (res.rowCount > 0) 
          return res.rows;
      else 
          return null;
    } catch (error) {return error;}
  },

  async search_mixed(queries_list, type, condition) {
    assert(typeof condition !== "undefined", "condition cannot be undifined");
  
    for (i = 0; i < Object.keys(condition).length; i++) {
      condition[Object.keys(condition)[i]] = condition[Object.keys(condition)[i]] + "%";
    }

    //queries is array of queris data
    //type like 'union' | 'intersect' | 'except'
    son = {
      query_type: type,
      queries: queries_list
    };
  
    //get mix query => query contin relation 'union' | 'intersect' | 'except' between queries
    mix_query = mix_queryGenerator(son);
    //remove simicolone form end of query text
    mix_query.text = query.text.substring(0, mix_query.text.length - 1);
  
    mix_query_text = "with mix as (" + query.text + ")";
    mix_query_values = mix_query.values;
  
    //search query like select mix from t1 where name ilike '%%'
    search_query = queryGenerator({
      query_type: "select",
      query_table: "mix",
      values_list: {},
      condition: condition
    });
  
    //here convert = to ilike and $number => to $valid number
    for (i = 0; i < Object.keys(condition).length; i++) {
      string_to_be_replaced = "= $" + (i + 1);
      const pos = search_query.text.indexOf(string_to_be_replaced);
      search_query.text = [
        search_query.text.slice(0, pos),
        "ilike $" + (mix_query_values.length + i + 1) + " ",
        search_query.text.slice(pos + string_to_be_replaced.length)
      ].join(""); //make query with 2 join
    }
  
    search_query_text = search_query.text;
    search_query_values = search_query.values;
  
    main_query = {
      text: remove_string_from_text(mix_query_text + " " + search_query_text,'"'),
      values: mix_query_values.concat(search_query_values)
      };
      
    try {
      const res = await client.query(main_query);
      if (res.rowCount > 0) 
          return res.rows;
      else 
          return null;
    } catch (error) {return error;}
  },

  async remove(table, condition) {
    main_query = queryGenerator({
      query_type: "remove",
      query_table: table,
      condition: condition
    });
  
    //handle multi values like id IN (value1, value2, ...);
    if (Array.isArray(condition)) {
      const pos = main_query.text.search("=");
      main_query.text = [main_query.text.slice(0, pos), "IN "].join(""); //make query like DELETE FROM your_table WHERE id IN
  
      valid_format_values_string = "("; //($1,$2,....)
      for (i = 0; i < condition.length; i++) {
        if (i + 1 === condition.length) {
          valid_format_values_string += "$" + (i + 1) + ")";
          break;
        }

        valid_format_values_string += "$" + (i + 1) + ",";
      }
      //updtae query text
      main_query.text += valid_format_values_string;
    }

    try {
      const res = await client.query(main_query);
      return true;
    } catch (error) {return error;}
  },

  async join_query(main_table,values,condition,join_type,joined_table,join_condition) {
    
    try {
        const res = await client.query(join_queryGenerator({table_name:main_table,values_list: values,condition: condition,join_json:{type:join_type,table:joined_table,on:join_condition}}));
        if (res.rowCount > 0)
            return res.rows;     
        else 
            return null;
    } 
    catch (error) {return error;}
  },

  async  join3_query(main_table,values,condition,join_type,joined_table1,joined_table2,join_condition1,join_condition2) {
    
    main_query = join_queryGenerator({
      table_name: main_table,
      values_list: values,
      condition: condition,
      join_json: { type: join_type, table: joined_table1, on: join_condition1 }
    });

    const pos1 = main_query.text.search("where");
  
    second_query = join_queryGenerator({
      table_name: main_table,
      values_list: {},
      condition: {},
      join_json: { type: join_type, table: joined_table2, on: join_condition2 }
    });

    const pos2 = second_query.text.search(join_type);
    second_query = second_query.text.slice(pos2, second_query.text.length); // to remove all string befor join type in query
    second_query = second_query.slice(0, second_query.length - 1); //to remove this ;
    main_query.text = [main_query.text.slice(0, pos1), second_query+" ", main_query.text.slice(pos1)].join(""); //make query with 2 join

    main_query.text = main_query.text.replace(/\"/g, '')

    try {
      const res = await client.query(main_query);
      if (res.rowCount > 0) 
          return res.rows;
      else 
          return null;
    } 
    catch (error) {return error;}
  },

  async custom_query(query_text,values) {
    assert(typeof query_text !== "undefined", "query text cannot be undefined");
    assert(typeof values !== "undefined", "query values cannot be undifined");

    query = {
      text: query_text,
      values: values
    };

    try {
        const res = await client.query(query);
        if (res.rowCount > 0)
            return res.rows;     
        else 
            return null;
    } 
    catch (error) {return error;}
  },

  async check_emp_kind(uuid) {
    table = `WITH T1 AS (
      SELECT employee_boss_uuid as uuid,'BOSS' AS EMP_KIND FROM employee_boss
      ),
      T2 AS (
      SELECT employee_supervisor_uuid as uuid,'SUPER' AS EMP_KIND FROM employee_supervisor
      ),
      T3 AS (
      SELECT employee_worker_uuid as uuid,'WORKER' AS EMP_KIND FROM employee_worker
      ),
      T4 AS (
      SELECT * FROM T1
      UNION
      SELECT * FROM T2
      UNION
      SELECT * FROM T3
      )
      select emp_kind from T4`
      query = queryGenerator("select",table,{},{uuid:uuid})
      query.text=fixQuery(query.text,' "')
      query.text=fixQuery(query.text,'4"')
      //query.text[query.text.length-12]='"'
      query.text=query.text.replaceAt(query.text.length-12, '"u')
      query.text = query.text.substr(14,query.text.length)

      return (await client.query(query)).rows[0].emp_kind;
  },

  async uuidGenerator() {
    return (await client.query("select uuid_generate_v1()")).rows[0].uuid_generate_v1;
  }
};

exports.quiries = quiries