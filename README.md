<span align="center">

# Homebridge Bold

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![Downloads](https://img.shields.io/npm/dt/homebridge-bold)](https://www.npmjs.com/package/homebridge-bold)
[![Version](https://img.shields.io/npm/v/homebridge-bold)](https://www.npmjs.com/package/homebridge-bold)
<br/>
[![Issues](https://img.shields.io/github/issues/StefanNienhuis/homebridge-bold)](https://github.com/StefanNienhuis/homebridge-bold/issues)
[![Pull requests](https://img.shields.io/github/issues-pr/StefanNienhuis/homebridge-bold)](https://github.com/StefanNienhuis/homebridge-bold/pulls)

This [Homebridge](https://homebridge.io) plugin brings HomeKit support for the Bold Smart Locks.

</span>

## Installation
First, install Homebridge<br/>
`npm install --global homebridge`

Then, install the Bold plugin<br/>
`npm install --global homebridge-bold`

## Configuration
The easiest way to configure this plugin is by using the [Config UI](https://github.com/oznu/homebridge-config-ui-x), as this plugin provides a login flow for the authentication token.

*Notes:*
 * Bold only allows one logged in session per account. Unless you don't need to use the Bold app, it's recommended to create an additional account
 * A Bold Connect hub is required for this plugin to function. This plugin will only expose locks that are linked to a Bold Connect hub to HomeKit.
 * While HomeKit shows the lock with locked/unlocked state, this only reflects whether you can turn the lock, not whether the door is locked.

### Manual configuration
An example configuration can be found in the [config.example.json](config.example.json) file.

| Property    | Type     | Details                                                 |
| ----------- | -------- | ------------------------------------------------------- |
| `platform`  | `string` | **Required**<br/>Must always be `Bold`.                 |
| `authToken` | `string` | **Required**<br/>Authentication token for the Bold API. |

## Credits

Thanks to [Erik Nienhuis](https://github.com/ErikNienhuis) for helping with reverse-engineering the Bold API and providing me with the Bold API documentation.
