let Service, Characteristic;
let exec = require("child_process").exec;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-nature-remo-ceiling-light", "NatureRemoCeilingLight", CeilingLight);
}

function CeilingLight(log, config) {
  this.log = log;

  this.name = config["name"];
  this.access_token = config["access_token"];
  this.signal_ID_on_day = config["signal_ID_on_day"];
  this.signal_ID_on_night = config["signal_ID_on_night"];
  this.signal_ID_off = config["signal_ID_off"];
  this.start_time_day = config["start_time_day"] || "06:00:00"; // Default to 6:00 AM
  this.start_time_night = config["start_time_night"] || "20:30:00"; // Default to 8:30 PM

  this.state = { power: false };

  this.informationService = new Service.AccessoryInformation();
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, "Homebridge")
    .setCharacteristic(Characteristic.Model, "NatureRemoCeilingLight")
    .setCharacteristic(Characteristic.SerialNumber, "NRCL-" + this.name);

  this.switchService = new Service.Switch(this.name);
  this.switchService.getCharacteristic(Characteristic.On)
    .on('set', this.setPower.bind(this));
}

CeilingLight.prototype.getServices = function() {
  return [this.informationService, this.switchService];
}

CeilingLight.prototype.setPower = function(value, callback) {
  if (this.state.power != value) {
    this.state.power = value;
    this.log('Setting switch to ' + value);
    
    if (value) {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentSecond = currentTime.getSeconds();
      const currentDayTime = this.getTimeInSeconds(currentHour, currentMinute, currentSecond);
      const dayTimeStartSeconds = this.getTimeInSeconds(this.parseTime(this.start_time_day));
      const nightTimeStartSeconds = this.getTimeInSeconds(this.parseTime(this.start_time_night));
      const isDayTime = currentDayTime >= dayTimeStartSeconds && currentDayTime < nightTimeStartSeconds;

      const signalID = isDayTime ? this.signal_ID_on_day : this.signal_ID_on_night;
      this.sendSignal(signalID, callback);
    } else {
      this.sendSignal(this.signal_ID_off, callback);
    }
  } else {
    callback();
  }
}

CeilingLight.prototype.sendSignal = function(signalID, callback) {
  let cmd = 'curl -X POST ' +
            '"https://api.nature.global/1/signals/' + signalID + '/send" ' +
            '-H "accept":"application/json" ' +
            '-k --header "Authorization":"Bearer ' + this.access_token + '"';
  exec(cmd, function(error, stdout, stderr) {
    if (error) {
      this.log('Failed to send signal: ' + error);
      callback(error);
    } else {
      this.log('Signal sent successfully');
      callback();
    }
  }.bind(this));
}

CeilingLight.prototype.parseTime = function(timeString) {
  const parts = timeString.split(':');
  return {
    hours: parseInt(parts[0]),
    minutes: parseInt(parts[1]),
    seconds: parseInt(parts[2])
  };
}

CeilingLight.prototype.getTimeInSeconds = function(timeObj) {
  return (timeObj.hours * 3600) + (timeObj.minutes * 60) + timeObj.seconds;
}
