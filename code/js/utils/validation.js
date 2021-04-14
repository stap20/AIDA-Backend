// src/usingDB/controllers/Helper.js
const bcrypt = require("bcryptjs");
var validator = require("validator");
var validatePhoneNumber = require('validate-phone-number-node-js');
const { isValid, mask } = require('ssn-validator');
var passwordValidator = require("password-validator");
var emailValidator = require("email-validator");
// Create a schema
var pw_validator = new passwordValidator();

const validation = {
  /**
   * isEmpty helper method
   * @param {string} data
   * @returns {Boolean} True or False
   */
  isEmptyString(data) {
    return validator.isEmpty(data);
  },

  /**
   * isValidEmail helper method
   * @param {string} email
   * @returns {Boolean} True or False
   */
  isValidEmail(email) {
    if (emailValidator.validate(email)) return true;
    else return false;
  },

  /**
   * isValidPassword helper method
   * @param {string} password
   * @returns {Boolean} True or False
   */
  isValidPassword(password) {
    return pw_validator.validate(password, { list: true });
  },

  /**
   * Hash Password Method
   * @param {string} password
   * @returns {string} returns hashed password
   */
  hashPassword(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
  },

    /**
   * phone_validation helper method
   * @param {string} number
   * @returns {Boolean} True or False
   */
  phone_validation(number) {
    return validatePhoneNumber.validate(number);
  },

    /**
   * ssn_validation helper method
   * @param {string} ssn
   * @returns {Boolean} True or False
   */
  ssn_validation(ssn) {
    return isValid(ssn);
  },

    /**
   * ssn_validation helper method
   * @param {string} ssn
   * @returns {Boolean} True or False
   */
  ssn_masking(ssn) {
    return mask(ssn);
  },

  /**
   * comparePassword
   * @param {string} hashPassword
   * @param {string} password
   * @returns {Boolean} return True or False
   */
  comparePassword(hashPassword, password) {
    return bcrypt.compareSync(password, hashPassword);
  },

  correct_password_validationMessage(validation_list) {
    // Add properties to it
    i = 0;
    validation_list.forEach(function(validation_message) {
      // Minimum length
      if (validation_message == "min")
        validation_list[i] =
          "Password must be between " + 8 + " and " + 30 + " characters";
      // Maximum length
      else if (validation_message == "max")
        validation_list[i] =
          "Password must be between " + 8 + " and " + 30 + " characters";
      // Must have uppercase letters
      else if (validation_message == "uppercase")
        validation_list[i] = "password must contain uppercase character";
      // Must have lowercase letters
      else if (validation_message == "lowercase")
        validation_list[i] = "password must contain lowercase character";
      // Must have digits
      else if (validation_message == "digits")
        validation_list[i] = "password must contain digits";
      // Should not have spaces
      else if (validation_message == "spaces")
        validation_list[i] = "password shouldn't contain spaces";
      i++;
    });

    return validation_list;
  },

  setpasswordValidator(validator_levels, min = 8, max = 30) {
    // Add properties to it
    validator_levels.forEach(function(validator) {
      // Minimum length
      if (validator == "min") pw_validator.is().min(min);
      // Maximum length
      else if (validator == "max") pw_validator.is().max(max);
      // Must have uppercase letters
      else if (validator == "uppercase") pw_validator.has().uppercase();
      // Must have lowercase letters
      else if (validator == "lowercase") pw_validator.has().lowercase();
      // Must have digits
      else if (validator == "digits") pw_validator.has().digits();
      // Should not have spaces
      else if (validator == "spaces")
        pw_validator
          .has()
          .not()
          .spaces();
    });
  }
};

exports.validation = validation;
