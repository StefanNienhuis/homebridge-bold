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
The easiest way to configure this plugin is by using the [Config UI](https://github.com/oznu/homebridge-config-ui-x), as this plugin provides a login flow for the access & refresh token.

For HOOBS or Homebridge without a configuration UI, you can use the [authentication website](https://stefannienhuis.github.io/homebridge-bold/) and use the resulting access & refresh token in the [Manual configuration](#manual-configuration).

*Notes:*
 * A Bold Connect hub is required for this plugin to function. This plugin will only expose locks that are linked to a Bold Connect hub to HomeKit.
 * While HomeKit shows the lock with locked/unlocked state, this only reflects whether you can turn the lock, not whether the door is locked.

### Manual configuration
An example configuration can be found in the [config.example.json](config.example.json) file.

| Property       | Type     | Details                                          |
| -------------- | -------- | ------------------------------------------------ |
| `platform`     | `string` | **Required**<br/>Must always be `Bold`.          |
| `accessToken`  | `string` | **Required**<br/>Access token for the Bold API.  |
| `refreshToken` | `string` | **Required**<br/>Refresh token for the Bold API. |

## Backend

The `backend/` folder contains the source code for the backend that is used while authenticating using the Bold app (default authentication). I host this myself on AWS. While your password is never available to this server, you can choose to self host this backend if you obtain a client id and secret from Bold. Specify a custom backend by clicking the settings icon on the login page.

Alternatively you can also choose to use Legacy Authentication using username/password if you prefer not to use either of these options. This will log out your Bold app as only one username/password session can be active at the same time.

## Credits

Thanks to [Erik Nienhuis](https://github.com/ErikNienhuis) for helping with reverse-engineering the Bold API and providing me with the Bold API documentation.
