const withAutofillAndroid = require('./android-autofill/withAndroidAutofill');
const withAutofillIOS = require('./ios-autofill/withIOSAutofill');

module.exports = function withAutofill(config) {
  config = withAutofillAndroid(config);
  config = withAutofillIOS(config);
  return config;
};
