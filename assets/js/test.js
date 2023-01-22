let tasks = [];
let total_tasks = 0;

function build_task_object(task_title, task_description, task_time){

  let task_object = {
    'id': "task_"+(total_tasks+1),
    'title': task_title,
    'description': task_description,
    'time': task_time
  };
  total_tasks += 1;
  return task_object;
}

function add_task(task_title, task_description, task_time){
  let task_object = build_task_object(task_title, task_description, task_time);
  tasks.push(task_object);
  return task_object;
}

function search_task(task_id){
  return tasks.find((task_object)=>{return task_object.id==task_id;});
}

function delete_task_with_id(task_id){
  tasks = tasks.filter((task_object)=>{
    return task_object.id != task_id;  
  });
}
