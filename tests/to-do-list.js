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

  constructor(id, title, task_description, tags, creation_time, reminder_time, status){
    this.id = id;
    this.title = title;
    this.description = task_description;
    this.tags = tags;
    this.creation_time = creation_time;
    this.reminder_time = reminder_time;
    this.status = status;
  }
  static getEncodedTask(task, key) {
    task.title = ToDoListUtilities.encrypt(task.title, key)
    task.description = ToDoListUtilities.encrypt(task.description, key)
    task.tags = ToDoListUtilities.encrypt(task.tags, key)
    task.creation_time = ToDoListUtilities.encrypt(task.creation_time, key);
    task.reminder_time = ToDoListUtilities.encrypt(task.reminder_time, key);
    task.status = ToDoListUtilities.encrypt(task.status, key);
    return task;
  }
  static getDecodedTask(task, key) {
    task.title = ToDoListUtilities.decrypt(task.title, key)
    task.description = ToDoListUtilities.decrypt(task.description, key)
    task.tags = ToDoListUtilities.decrypt(task.tags, key)
    task.creation_time = ToDoListUtilities.decrypt(task.creation_time, key);
    task.reminder_time = ToDoListUtilities.decrypt(task.reminder_time, key);
    task.status = ToDoListUtilities.decrypt(task.status, key);
    return task;
  }
}


class User{
  constructor(username, email, password, encrypted_password, tasks) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.encrypted_password = encrypted_password;
    this.authorized = False;
    this.tasks = tasks;
  }
  static createNewUser(username, email, password) {
    if(!localStorage.getItem(username)) throw Error("Username already exists!");
    user = new User(username, email, password, 
                    ToDoListUtilities.hashing_crypt(encrypted_password),
                    []
    );
    return user;
  }
  static getAuthorizedUser(username, password) {
    user = this.getUserObjFromLocalStorage(username);
    if(user && user.encrypted_password == ToDoListUtilities.hashing_crypt(password)) {
      user.authorized = True;
      user.password = password;
    }
    return user;
  }
  static saveUserObjInLocalStorage(user) {
    user.password = null;
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
    uuo = localStorage.getItem(username);
    puo = JSON.parse(uuo);
    return new User(puo.username,
                    puo.email,
                    puo.password,
                    puo.encrypted_password,
                    puo.tasks
    );
  }
}

class ToDoListManager {
  constructor(authorized_user){
    this.authorized_user = authorized_user;
  }
  add_task(task, callback){
    if(!this.authorized_user || !this.authorized_user.authorized)
      throw Error("User not authorized");
    task.owner = this.authorized_user.username;
  }
  signup(username, password, successful_callback, unsuccessful_callback) {

  }
}