class ToDoListUtilities {
  static hashing_crypt(message){
    console.log("hashing_crypt ", message);
    return CryptoJS.SHA1(message).toString(CryptoJS.enc.Hex);
  }
  static encrypt(message, key) {
    console.log("encrypt ", message, "with", key);
    return CryptoJS.AES.encrypt(message, key).toString();
  }
  static decrypt(message, key) {
    console.log("decrypt ", message, "with", key);
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
  static getEncryptedTask(task, key) {
    task.title = ToDoListUtilities.encrypt(task.title, key)
    task.description = ToDoListUtilities.encrypt(task.description, key)
    task.tags = ToDoListUtilities.encrypt(task.tags, key)
    task.creation_time = ToDoListUtilities.encrypt(task.creation_time, key);
    task.reminder_time = ToDoListUtilities.encrypt(task.reminder_time, key);
    task.status = ToDoListUtilities.encrypt(task.status, key);
    return task;
  }
  static getDecryptedTask(task, key) {
    task.title = ToDoListUtilities.decrypt(task.title, key)
    task.description = ToDoListUtilities.decrypt(task.description, key)
    task.tags = ToDoListUtilities.decrypt(task.tags, key)
    task.creation_time = ToDoListUtilities.decrypt(task.creation_time, key);
    task.reminder_time = ToDoListUtilities.decrypt(task.reminder_time, key);
    task.status = ToDoListUtilities.decrypt(task.status, key);
    return task;
  }

  static saveTaskInLocalStorage(task) {
    console.log("save task, task: ", task);
    let jst = JSON.stringify(task);
    console.log("save task: ", jst);
    localStorage.setItem(task.id, jst);
  }

  static getTaskFromLocalStorage(task_id){
    let task = localStorage.getItem(task_id);
    if(!task) throw Error(`Task(${task_id}) doesn't exist!`);
    
    task = JSON.parse(task);
    console.log("things changes, ", task);
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

  static createNewTask(title, description, tags, creation_time, reminder_time, status) {
    let id = ToDoListUtilities.hashing_crypt(`${creation_time.toString()}-${title}`);
    return new Task(
      id,
      title,
      description,
      tags,
      creation_time,
      reminder_time,
      status
    );
  }

}


class User{
  constructor(username, email, password, encrypted_password, tasks) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.encrypted_password = encrypted_password;
    this.authorized = false;
    this.tasks = tasks;
  }
  static createNewUser(username, email, password) {
    if(localStorage.getItem(username)) throw Error("Username already exists!");
    let user = new User(username, email, password, 
                    ToDoListUtilities.hashing_crypt(password),
                    []
    );
    User.saveUserObjInLocalStorage(user);
    return user;
  }
  static getAuthorizedUser(username, password) {
    let user = User.getUserObjFromLocalStorage(username);
    if(!user) throw Error(`User (${username}) doesn't exist!`);
    user.password = password;
    console.log("password: ", password, user.password);
    if(user.encrypted_password == ToDoListUtilities.hashing_crypt(user.password))
      user.authorized = true;
    return User.getDecryptedUser(user);
  }
  static saveUserObjInLocalStorage(user) {
    console.log("inside save user ", user);
    user = User.getEncryptedUser(user);
    user.password = null;                 // strained point
    localStorage.setItem(user.username, JSON.stringify(user));
  }
  static getEncryptedUser(user) {
    user.email = ToDoListUtilities.encrypt(user.email, user.password);
    return user;
  }
  static getDecryptedUser(user) {
    user.email = ToDoListUtilities.decrypt(user.email, user.password);
    return user;
  }

  static getUserObjFromLocalStorage(username) {
    let uuo = localStorage.getItem(username);
    if(!uuo) throw Error(`Username(${username}) doesn't exist!`);

    let puo = JSON.parse(uuo);
    let user = new User(puo.username,
                    puo.email,
                    puo.password,
                    puo.encrypted_password,
                    puo.tasks
    );
    return user;
  }
  getTask(task_id) {
    if(this.tasks.indexOf(task_id)<0) 
      throw Error(`Task(${task_id}) for User(${this.username}) doesn't exist`);
    let task = Task.getTaskFromLocalStorage(task_id);
    console.log("task: ", task, "user: ", this);
    task = Task.getDecryptedTask(task, this.password);
    return task;
  }
  addNewTask(task) {
    let encrypted_task = Task.getEncryptedTask(task, this.password);
    Task.saveTaskInLocalStorage(encrypted_task);
    this.tasks.push(encrypted_task.id);
    User.saveUserObjInLocalStorage(this);
    return this.getTask(encrypted_task.id);
  }
  updateTask(task_id, title, description, tags, creation_time, reminder_time, status) {
    if(this.tasks.indexOf(task_id)<0) 
      throw Error(`Task(${task_id}) for User(${this.username}) doesn't exist`);
    let task = Task.getTaskFromLocalStorage(task_id);
    task = Task.getDecryptedTask(task, this.password);
    task.title = title;
    task.description = description;
    task.tags = tags;
    task.creation_time = creation_time;
    task.reminder_time = reminder_time;
    task.status = status;
    Task.saveTaskInLocalStorage(Task.getEncryptedTask(task, this.password));
    return task;
  }
  deleteTask(task_id) {
    if(this.tasks.indexOf(task_id)<0) 
      throw Error(`Task(${task_id}) for User(${this.username}) doesn't exist`);
    if(localStorage.getItem(task_id)==null)
      throw Error(`Task(${task_id}) not found in the storage!`);
    let task = Task.getTaskFromLocalStorage(task_id);
    task = Task.getDecryptedTask(task, this.password);
    localStorage.removeItem(task_id);
    this.tasks = this.tasks.filter((tid)=>tid!=task_id);
    User.saveUserObjInLocalStorage(this);
    return task;
  }
  updateTaskStatus(task_id, status) {
    if(this.tasks.indexOf(task_id)<0) 
      throw Error(`Task(${task_id}) for User(${this.username}) doesn't exist`);
    let task = Task.getTaskFromLocalStorage(task_id);
    task = Task.getDecryptedTask(task, this.password);
    task.status = status;
    Task.saveTaskInLocalStorage(Task.getEncryptedTask(task, this.password));
    return task;
  }
}

class ToDoListManager {
  constructor(authorized_callback, unauthorized_callback){
    this.authorized_user = null;
    this.authorized_username = null;
    this.authorized_password = null;
    if(localStorage.getItem("authorized_username") && localStorage.getItem("authorized_password")) {
      this.authorized_username = localStorage.getItem("authorized_username");
      this.authorized_password = localStorage.getItem("authorized_password");
      try {
        this.authorized_user = User.getAuthorizedUser(this.authorized_username, this.authorized_password);
        if(authorized_callback) authorized_callback(this.authorized_user);
        else console.log("currently logged in user: ", this.authorized_user);
      }
      catch(error) {
        ToDoListManager.__unauthorize__();
        if(unauthorized_callback) unauthorized_callback(true);
        else console.log("please log in!");
      }
    }
    else {
      if(unauthorized_callback) unauthorized_callback(true);
      else console.log("no authorized user currently logged in");
    }
  }
  static __unauthorize__() {
    localStorage.setItem("authorized_username", null);
    localStorage.setItem("authorized_password", null);
  }
  static __authorize__(username, password) {
    localStorage.setItem("authorized_username", username);
    localStorage.setItem("authorized_password", password);
  }
  signup(username, email, password, successful_callback, unsuccessful_callback) {
    let user = null;
    try {
      user = User.createNewUser(username, email, password);
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
      this.authorized_user = User.getAuthorizedUser(username, password);
      ToDoListManager.__authorize__(username, password);
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
      if(successful_callback) successful_callback("Logout successfull!");
    }
    else {
      if(unsuccessful_callback) unsuccessful_callback("No user logged in!");
    }
  }
  addNewTask(title, description, tags, creation_time, reminder_time, status, successful_callback, unsuccessful_callback) {
    try {
      let new_task = Task.createNewTask(title, description, tags, creation_time, reminder_time, status);
      if(!new_task) throw Error("Failed to create task!");
      console.log("new task: ", new_task);
      this.authorized_user.addNewTask(new_task);
      if(successful_callback) successful_callback(new_task);
      else console.log(new_task);
    }
    catch(error) {
      if(unsuccessful_callback) unsuccessful_callback(error);
      else console.log(error);
    }
  }
  updateTask(task_id, title, description, tags, creation_time, reminder_time, status, successful_callback, unsuccessful_callback) {
    try {
      if(this.authorized_user.tasks.indexOf(task_id)<0) 
        throw Error(`Task(${task_id}) for User(${this.authorized_user.username}) doesn't exist`);
      let task = this.authorized_user.updateTask(task_id, title, description, tags, creation_time, reminder_time, status);
      if(!task) throw Error("Failed to update task!");
      if(successful_callback) successful_callback(task);
      else console.log(task);
    }
    catch(error) {
      if(unsuccessful_callback) unsuccessful_callback(error);
      else console.log(error);
    }
  }
}