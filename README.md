# homebridge-nature-remo-ceiling-light
 [Homebridge](https://github.com/homebridge/homebridge) plugin to control ceiling light with power and dim button using  [Nature Remo](https://nature.global/nature-remo/).

## Installation
```bash
npm install -g homebridge-nature-remo-ceiling-light
```

## Example config.json
```json
  "accessories": [
    {
      "name": "[Name display in Home app]",
      "access_token": "[Your access_token]",
      "signal_ID_on_day": "[aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa]",
      "signal_ID_on_night": "[bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb]",
      "signal_ID_off": "[cccccccc-cccc-cccc-cccc-cccccccccccc]",
      "start_time_day": "[06:00]",
      "start_time_night": "[20:00]",
      "accessory": "NatureRemoCeilingLight"
    }
  ]
```
- `name` can be set whatever you want
- To get `access_token`, visit https://home.nature.global/
- To get `signal_ID_on` and `signal_ID_off`, run `curl -X GET "https://api.nature.global/1/appliances" -H "Authorization: Bearer [access_token]"` and find `id` key
- `accessory` must be `NatureRemoSwitch`
