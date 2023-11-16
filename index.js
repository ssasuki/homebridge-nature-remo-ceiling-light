let Service, Characteristic;
let exec = require("child_process").exec;
let quotient;
let lastBrightness;
let signalTimes;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-nature-remo-ceiling-light", "NatureRemoCeilingLight", Lightbulb);
}

function Lightbulb(log, config) {
  this.log = log;
  this.name = config["name"];
  this.access_token = config["access_token"];
  this.signal_ID_on = config["signal_ID_on"];
  this.signal_ID_bright = config["signal_ID_bright"];
  this.signal_ID_dim = config["signal_ID_dim"];
  this.signal_ID_night = config["signal_ID_night"];
  this.signal_ID_off = config["signal_ID_off"];

  this.state = { power: false };

  this.informationService = new Service.AccessoryInformation();
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, "Homebridge")
    .setCharacteristic(Characteristic.Model, "NatureRemoCeilingLight")
    .setCharacteristic(Characteristic.SerialNumber, "NRTS-" + this.name);

  this.service = new Service.Lightbulb(this.name);
  
  // Create handlers for "On," "Off," and "Dim" buttons
  this.service
    .getCharacteristic(Characteristic.On)
    .on('set', this.setOn.bind(this));

  this.service
    .getCharacteristic(Characteristic.Brightness)
    .on('set', this.setBrightness.bind(this));

  this.isOn = false;
  this.brightness = 100; // 100% brightness by default
  lastBrightness = this.brightness
}



Lightbulb.prototype.getServices = function() {
  return [this.informationService, this.service];
}



Lightbulb.prototype.setOn = function(value, callback) {
  if (value && !this.isOn) {
    // Ceiling light is off, and "On" button was pressed
    this.isOn = true;
    
    // Send the appropriate command based on the value
    const signalID = this.signal_ID_on;
    this.cmdRequest(signalID, function(error, stdout, stderr) {
      if (error) {
        this.log('Failed to set: ' + error);
        callback(error);
      } else {
        callback();
      }
    }.bind(this));
    
    // Use Nature Remo API to turn on the light
    this.log('Setting ceiling light to ' + value);
    

    
  } else if (!value && this.isOn) {
    // Ceiling light is on, and "Off" button was pressed
    this.isOn = false;
    
    // Send the appropriate command based on the value
    const signalID = this.signal_ID_off;
    this.cmdRequest(signalID, function(error, stdout, stderr) {
      if (error) {
        this.log('Failed to set: ' + error);
        callback(error);
      } else {
        callback();
      }
    }.bind(this));
    
    // Use Nature Remo API to turn off the light
    this.log('Setting ceiling light to ' + value);
    
  }
  // No action needed if "On" button is pressed while the light is already on.
  // No action needed if "Off" button is pressed while the light is already off.
  callback();
}




Lightbulb.prototype.setBrightness = function(value, callback) {
  if (this.isOn) {
    // Ceiling light is on
    quotient = Math.floor(this.brightness / 10);
    this.brightness = quotient * 10;
    if (quotient === 0) {
      // "Dim" button was pressed, set brightness to 0%
      // Send the appropriate command based on the value
      const signalID = this.signal_ID_night;
      this.cmdRequest(signalID, function(error, stdout, stderr) {
        if (error) {
          this.log('Failed to set: ' + error);
          callback(error);
        } else {
          callback();
        }
      }.bind(this));
      
    
    } else {
      // "Dim" button was pressed with value > 0
      // Use Nature Remo API to set brightness to the specified value
      // Send the appropriate command based on the value
      if ( this.brightness > lastBrightness) {
        const signalID = this.signal_ID_bright;
      } else {
        const signalID = this.signal_ID_dim;
      }
      
      signalTimes = quotient - Math.floor(lastBrightness / 10)
      for (let i = 0; i < signalTimes; i++) {
        this.cmdRequest(signalID, function(error, stdout, stderr) {
          if (error) {
            this.log('Failed to set: ' + error);
            callback(error);
          } else {
            callback();
          }
        }.bind(this));
      
    }
    this.log('Setting ceiling light brightness to ' + this.brightness);
  }
  
  // No action needed if "Dim" button is pressed while the light is off.
  callback(null);
}

  

Lightbulb.prototype.cmdRequest = function(signalID, callback) {
  let cmd = 'curl -X POST ' +
            '"https://api.nature.global/1/signals/' + signalID + '/send" ' +
            '-H "accept":"application/json" ' +
            '-k --header "Authorization":"Bearer ' + this.access_token + '"';
  exec(cmd, function(error, stdout, stderr) { callback(error, stdout, stderr); });
}
