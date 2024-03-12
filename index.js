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
  this.start_time_day = config["start_time_day"]; // Start time for day mode in 24-hour format (e.g., "08:00")
  this.start_time_night = config["start_time_night"]; // Start time for night mode in 24-hour format (e.g., "20:00")

  this.state = { power: false };

  this.informationService = new Service.AccessoryInformation();
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, "Homebridge")
    .setCharacteristic(Characteristic.Model, "NatureRemoCeilingLight")
    .setCharacteristic(Characteristic.SerialNumber, "NRL-" + this.name);

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

      this.log(currentTime + ' currentTime');
      
      const start_day_time_hour = this.start_time_day.split(':')[0];
      const start_day_time_minute = this.start_time_day.split(':')[1];
      let day_start = new Date();
      day_start.setHours(start_day_time_hour);
      day_start.setMinutes(start_day_time_minute);
      day_start.setSeconds("00");
      
      this.log(day_start + ' day_start');
      
      const start_night_time_hour = this.start_time_night.split(':')[0];
      const start_night_time_minute = this.start_time_night.split(':')[1];
      let night_start = new Date();
      night_start.setHours(start_night_time_hour);
      night_start.setMinutes(start_night_time_minute);
      night_start.setSeconds("00");
      
      this.log(night_start + ' night_start');
      
      const isDayTime = (currentTime >= day_start && currentTime < night_start);
      
      this.log(isDayTime + ' isDayTime');
      
      let signalID

      if(isDayTime) {
       signalID = this.signal_ID_on_day;
      } else {
       signalID = this.signal_ID_on_night;
      }
      
      this.log(signalID + ' signalID');
      
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
      this.log('Failed to set: ' + error);
      callback(error);
    } else {
      callback();
    }
  }.bind(this));
}
