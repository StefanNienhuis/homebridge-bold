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

| Property               | Type      | Details                                                                                                             |
| ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `platform`             | `string`  | **Required**<br/>Must always be `Bold`.                                                                             |
| `accessToken`          | `string`  | **Required**<br/>Access token for the Bold API.                                                                     |
| `refreshToken`         | `string`  | **Required**<br/>Refresh token for the Bold API.                                                                    |
| `refreshURL`           | `string`  | **Optional**<br/>Custom refresh URL for token refreshing. Use this only if you authenticated with a custom backend. |
| `legacyAuthentication` | `boolean` | **Required**<br/>Switch between default and legacy authentication. This settings will impact token refreshing.      |
|                        |           |                                                                                                                     |

## Backend

The `backend/` folder contains the source code for the backend that is used while authenticating using the Bold app (default authentication). I host this myself on AWS, with a client id and secret that was provided to me. While your password is never available to this server, you can choose to self host this backend if you obtain a client id and secret from Bold. Specify a custom backend by clicking the settings icon on the login page. Also specify a custom refresh URL in the config, as a custom client id and secret require refreshing with the same client id and secret.

Alternatively you can also choose to use legacy authentication using username/password if you prefer not to use either of these options. This will log out your Bold app as only one username/password based session can be active at the same time.

*Note:* While default authentication is (semi-)supported by Bold, legacy authentication is not supported at all and may break at any time.

## Credits

Thanks to [Erik Nienhuis](https://github.com/ErikNienhuis) for helping with reverse-engineering the Bold API and providing me with the Bold API documentation.
