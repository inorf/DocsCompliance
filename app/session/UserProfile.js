let UserProfile = (function() {
  let user_name = "";
  let group_name = "";
  let user_email = "";

  let getName = function() {
    return user_name;
  };

  let setName = function(name) {
    user_name = name;
  };

  let getGName = function() {
    return group_name;
  };

  let setGName = function(Gname) {
    group_name = Gname;
  };

  let getEmail = function() {
    return user_email;
  };

  let setEmail = function(email) {
    user_email = email;
  };

  return {
    getName: getName,
    setName: setName,
    getGName: getGName,
    setGName: setGName,
    getEmail: getEmail,
    setEmail: setEmail
  }

})();

export default UserProfile;