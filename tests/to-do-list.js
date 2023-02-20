class ToDoListUtilities {
  static hashing_crypt(message){
    return CryptoJS.SHA1(message).toString(CryptoJS.enc.Hex);
  }
  static encrypt(message, key) {
    return CryptoJS.AES.encrypt(message, key).toString();
  }
  static decrypt(message, key) {
    return CryptoJS.AES.decrypt(message, key).toString(CryptoJS.enc.Utf8);
  }
}


class Task {
  static Done = "DONE";
  static Trashed = "TRASHED"
  static Pending = "PENDING"
  static Waiting = "WAITING"

  constructor(id, title, description, tags, creation_time, reminder_time, status){
    this.id = id;
    this.title = title;
    this.description = description;
    this.tags = tags;
    this.creation_time = creation_time;
    this.reminder_time = reminder_time;
    this.status = status;
  }

  encrypt(key) {
      this.title = ToDoListUtilities.encrypt(this.title, key);
      this.description =  ToDoListUtilities.encrypt(this.description, key);
      this.tags = ToDoListUtilities.encrypt(this.tags, key);
      this.creation_time = ToDoListUtilities.encrypt(this.creation_time, key);
      this.reminder_time = ToDoListUtilities.encrypt(this.reminder_time, key);
      this.status = ToDoListUtilities.encrypt(this.status, key);
  }

  decrypt(key) {
    this.title = ToDoListUtilities.decrypt(this.title, key);
    this.description =  ToDoListUtilities.decrypt(this.description, key);
    this.tags = ToDoListUtilities.decrypt(this.tags, key);
    this.creation_time = ToDoListUtilities.decrypt(this.creation_time, key);
    this.reminder_time = ToDoListUtilities.decrypt(this.reminder_time, key);
    this.status = ToDoListUtilities.decrypt(this.status, key);
  }
  
  getObj() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      tags: this.tags,
      creation_time: this.creation_time,
      reminder_time: this.reminder_time,
      status: this.status
    };
  }

  save() {
    let json_data = JSON.stringify(this.getObj());
    localStorage.setItem(this.id, json_data);
  }

  delete() {
    localStorage.removeItem(this.id);
  }

  static getFromLocalStorage(task_id){
    let task = localStorage.getItem(task_id);
    if(!task) 
      throw Error(`Task(${task_id}) doesn't exist!`);
    
    task = JSON.parse(task);
    return new Task(
      task.id,
      task.title,
      task.description,
      task.tags,
      task.creation_time,
      task.reminder_time,
      task.status
    );
  }

  static createNewEncryptedTask(title, description, tags, creation_time, reminder_time, status, key) {
    if(key==null || key=="")
      throw Error("Key can't be empty!");
    if(creation_time==null || creation_time=="" || creation_time==undefined)
      throw Error("Creation Time appropriately not provided!");
    
    let id = ToDoListUtilities.hashing_crypt(`${creation_time.toString()}-${title}`);
    let new_task = new Task(
      id,
      title,
      description,
      tags,
      creation_time,
      reminder_time,
      status
    );
    new_task.encrypt(key);
    new_task.save();
    return Task.getFromLocalStorage(id);
  }

}


class User{
  constructor(username, email, encrypted_password, tasks) {
    this.username = username;
    this.email = email;
    this.encrypted_password = encrypted_password;
    this.authorized = false;
    this.tasks = tasks;
  } 

  /* BELOW THESE METHODS CONSIDERS USER OBJECT TO BE ENCRYPTED */
  addTask(task_id, password) {
    this.tasks.unshift(task_id);
    this.save();
    return this.getTask(task_id, password);
  }

  getTask(task_id, password) {
    if(this.tasks.indexOf(task_id)<0) 
      throw Error(`Task(${task_id}) for User(${this.username}) doesn't exist`);
    let task = Task.getFromLocalStorage(task_id);
    task.decrypt(password);
    return task.getObj();
  }

  updateTask(task_id, title, description, tags, reminder_time, status, password) {
    if(this.tasks.indexOf(task_id)<0) 
      throw Error(`Task(${task_id}) for User(${this.username}) doesn't exist`);
    let task = Task.getFromLocalStorage(task_id);
    task.decrypt(password);
    task.title = title;
    task.description = description;
    task.tags = tags;
    task.reminder_time = reminder_time;
    task.status = status;
    task.encrypt(password);
    task.save();
    task.decrypt(password);
    return task.getObj();
  }

  deleteTask(task_id, password) {
    if(this.tasks.indexOf(task_id)<0) 
      throw Error(`Task(${task_id}) for User(${this.username}) doesn't exist`);

    let task = Task.getFromLocalStorage(task_id);
    task.delete();

    this.tasks = this.tasks.filter((tid)=>tid!=task_id);
    this.save();

    task.decrypt(password);
    return task.getObj();
  }

  updateTaskStatus(task_id, status, password) {
    if(this.tasks.indexOf(task_id)<0) 
      throw Error(`Task(${task_id}) for User(${this.username}) doesn't exist`);
    let task = Task.getFromLocalStorage(task_id);
    task.decrypt(password);
    task.status = status;
    task.encrypt(password);
    task.save();
    task.decrypt(password);
    return task.getObj();
  }

  save() {
    localStorage.setItem(
      this.username, 
      JSON.stringify(this.getObj())
    );
  }
  /* ABOVE THESE METHODS CONSIDERS USER OBJECT TO BE ENCRYPTED */

  getObj() {
    return {
      username: this.username,
      email: this.email,
      encrypted_password: this.encrypted_password,
      tasks: this.tasks
    }
  }

  encrypt(password) {
    this.email = ToDoListUtilities.encrypt(this.email, password);
  }

  decrypt(password) {
    this.email = ToDoListUtilities.decrypt(this.email, password);
  }

  // returns encrypted user
  static createNewEncryptedUser(username, email, password) {
    if(password==null || password=="") 
      throw Error(`Password can't be empty!`);
    if(localStorage.getItem(username)) 
      throw Error(`Username ${username} already exists!`);
    let new_user = new User(
      username, 
      email, 
      ToDoListUtilities.hashing_crypt(password),
      []
    );
    new_user.encrypt(password);
    new_user.save();
    return new_user;
  }

  // returns encrypted user
  static getAuthorizedEncryptedUser(username, password) {
    let user = User.getFromLocalStorage(username);
    if(!(user.encrypted_password == ToDoListUtilities.hashing_crypt(password)))
      throw Error("Password Doesn't match!");
    return user
  }

  static getFromLocalStorage(username) {
    let json_data = localStorage.getItem(username);
    if(!json_data) 
      throw Error(`Username(${username}) doesn't exist!`);

    // parsed json data
    let pjd = JSON.parse(json_data);
    let user = new User(
      pjd.username,
      pjd.email,
      pjd.encrypted_password,
      pjd.tasks
    );
    return user;
  }
}

class TaskLoader {
  constructor(user) {
    this.user = user;
    this.loaded_tasks = [];
    this.current_indx = 0;
    this.stale = false;
    // this.previous_length = this.user.tasks.length;
  }
  load(password, bulk_size=5) {

    if(this.current_indx>=this.user.tasks.length || this.stale) {
      this.stale = true;
      // throw Error("CantLoadMore");
      return [];
    }
    let temp = 0;
    while(this.current_indx<this.user.tasks.length && temp<bulk_size) {
      let task_obj = this.user.getTask(this.user.tasks[this.current_indx], password);
      this.loaded_tasks.push(task_obj);
      this.current_indx += 1;
      temp += 1;
    }
    return this.loaded_tasks.slice(this.current_indx-temp, this.current_indx);
  }
  loadAll(password) {
    return this.load(password, this.user.tasks.length);
  }
  // necessary for current_indx
  taskAdded(task) {
    this.loaded_tasks.unshift(task);
    this.current_indx += 1;
  }
  // necessary for current_indx
  taskDeleted(task_id) {
    if(this.loaded_tasks.findIndex((task)=> task.id==task_id)>-1){
      this.loaded_tasks = this.loaded_tasks.filter((task)=> task.id!=task_id);
      this.current_indx -= 1;
    }
  }
  // may be redundant
  taskUpdated(task) {
    let indx = this.loaded_tasks.findIndex((xtask)=> xtask.id==task.id);
    if(indx>-1)
      this.loaded_tasks[indx] = task;
  }
}

class ToDoListManager {
  constructor(authorized_callback, unauthorized_callback){
    this.authorized_user = null;
    this.authorized_username = JSON.parse(localStorage.getItem("authorized_username"));
    this.authorized_password = JSON.parse(localStorage.getItem("authorized_password"));
    this.task_loader = null;

    if(this.authorized_username && this.authorized_password) {

      try {
        this.authorized_user = User.getAuthorizedEncryptedUser(this.authorized_username, this.authorized_password);
        this.task_loader = new TaskLoader(this.authorized_user);
        if(authorized_callback) 
          authorized_callback(this.authorized_user, this.task_loader.load(this.authorized_password));
        else 
          console.log("currently logged in user: ", this.authorized_user);
      }
      catch(error) {
        ToDoListManager.__unauthorize__();
        if(unauthorized_callback) unauthorized_callback(error);
        else console.log("Please log in!", error);
      }
    }
    else {
      if(unauthorized_callback) unauthorized_callback(true);
      else console.log("No authorized user currently logged in");
    }
  }
  static __unauthorize__() {
    localStorage.setItem("authorized_username", JSON.stringify(null));
    localStorage.setItem("authorized_password", JSON.stringify(null));
  }
  static __authorize__(username, password) {
    localStorage.setItem("authorized_username", JSON.stringify(username));
    localStorage.setItem("authorized_password", JSON.stringify(password));
  }

  signup(username, email, password, successful_callback, unsuccessful_callback) {
    try {
      if(this.authorized_user)
        throw Error("User already logged in!");
      let user = User.createNewEncryptedUser(username, email, password);
      if(successful_callback) successful_callback(user);
      else console.log(user);
    }
    catch(error) {
      if(unsuccessful_callback) unsuccessful_callback(error);
      else console.log(error);
    }
  }
  signin(username, password, successful_callback, unsuccessful_callback) {
    try{
      if(this.authorized_user)
        throw Error("User already logged in!");
      
      this.authorized_user = User.getAuthorizedEncryptedUser(username, password);
      ToDoListManager.__authorize__(username, password);
      this.authorized_password = password;
      this.task_loader = new TaskLoader(this.authorized_user);
      if(successful_callback) successful_callback(this.authorized_user);
      else console.log(this.authorized_user);
    }
    catch(error){
      if(unsuccessful_callback) unsuccessful_callback(error);
      else console.log(error);
    }
    
  }
  signout(successful_callback, unsuccessful_callback) {
    if(this.authorized_user) {
      this.authorized_user = null;
      ToDoListManager.__unauthorize__();
      if(successful_callback) 
        successful_callback("Logout successful!");
      else
        console.log("Logout successful!");
    }
    else {
      if(unsuccessful_callback) 
        unsuccessful_callback("No user logged in!");
      else
        console.log("No user logged in!");
    }
    this.task_loader = null;
  }
  addNewTask(title, description, tags, creation_time, reminder_time, status, successful_callback, unsuccessful_callback) {
    try {
      if(!this.authorized_user)
        throw Error("No user logged in!");
      let new_task = Task.createNewEncryptedTask(title, description, tags, creation_time, reminder_time, status, this.authorized_password);
      console.log("new task: ", new_task);
      new_task = this.authorized_user.addTask(new_task.id, this.authorized_password);
      this.task_loader.taskAdded(new_task);

      if(successful_callback) 
        successful_callback(new_task);
      else 
        console.log(new_task);
    }
    catch(error) {
      if(unsuccessful_callback) 
        unsuccessful_callback(error);
      else 
        console.log(error);
    }
  }
  updateTask(task_id, title, description, tags, reminder_time, status, successful_callback, unsuccessful_callback) {
    try {
      if(!this.authorized_user)
        throw Error("No user logged in!");
      let task = this.authorized_user.updateTask(task_id, title, description, tags, reminder_time, status, this.authorized_password);
      this.task_loader.taskUpdated(task);
      if(successful_callback) 
        successful_callback(task);
      else 
        console.log(task);
    }
    catch(error) {
      if(unsuccessful_callback) 
        unsuccessful_callback(error);
      else 
        console.log(error);
    }
  }
  loadTasks(bulk_size=5, successful_callback, unsuccessful_callback) {
    try {
      if(!this.authorized_user)
        throw Error("No user logged in!");
      if(!this.task_loader)
        throw Error("No task loader found!");
      let tasks = this.task_loader.load(this.authorized_password, bulk_size);
      if(successful_callback) 
        successful_callback(tasks);
      else 
        console.log(tasks);
    }
    catch(error) {
      if(unsuccessful_callback) 
        unsuccessful_callback(error);
      else 
        console.log(error);
    }
  }
  deleteTask(task_id, successful_callback, unsuccessful_callback) {
    try {
      if(!this.authorized_user)
        throw Error("No user logged in!");
      let task = this.authorized_user.deleteTask(task_id, this.authorized_password);
      this.task_loader.taskDeleted(task_id);

      if(successful_callback) 
        successful_callback(task);
      else 
        console.log(task);
    }
    catch(error) {
      if(unsuccessful_callback) 
        unsuccessful_callback(error);
      else 
        console.log(error);
    }
  }
  getTasksWithStatus(status, successful_callback, unsuccessful_callback) {
    try {
      this.task_loader.loadAll(this.authorized_password);
      
      let tasks = this.task_loader.loaded_tasks.filter((task)=> task.status == status);
      if(successful_callback)
        successful_callback(tasks);
      else 
        console.log(tasks);
    }
    catch(error) {
      if(unsuccessful_callback)
        unsuccessful_callback(error);
      else
        console.log(error);
    }
  }
  getAllTasks(successful_callback, unsuccessful_callback) {
    try {
      this.task_loader.loadAll(this.authorized_password);
      let tasks = this.task_loader.loaded_tasks.slice(0, this.task_loader.length);
      if(successful_callback)
        successful_callback(tasks);
      else 
        console.log(tasks);
    }
    catch(error) {
      if(unsuccessful_callback)
        unsuccessful_callback(error);
      else
        console.log(error);
    }
  }
}