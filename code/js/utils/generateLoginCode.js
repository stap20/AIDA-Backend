var randomize = require("randomatic");
const serverUtils = {
  generateLoginCode() {
    return randomize("?", 8, { chars: "0123456789ABCDEFGHIJKLMNOPQWXYZ" });
  }
};

exports.serverUtils = serverUtils;
