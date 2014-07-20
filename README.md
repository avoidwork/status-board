# status-board

***status-board*** is a node.js application designed to provide server statistics for the last 30 minutes in near real time to Panic's Status Board dashboard.

## Requirements
- node.js 0.8.x or newer

## Installation
1. Clone this repository, and change to it
2. Edit `config.json` to change the port, auth or enable SSL
3. Type `npm install` to install the dependencies
4. Type `node app.js` to start the API

## Configuration Options
### Authentication (disabled)
To enable authentication, add this object to your configuration, and set the user/pass combinations as required.

```json
"auth": {
	"localhost": {
		"authRealm": "Private",
		"authList": ["user:pass"]
	}
}
```

### Hostname (localhost)
To change the default hostname, change the key under "vhosts" to the new hostname.

### Port (8000)
To change the default port from 8000, change the "port" value. To run on a low port such as 80, or 443, please create a new key:value pair named "uid" with the UID of the account to drop to after starting the application; elevated priviliges are required to start on low ports, but the application shouldn't continue to run as that account.

### Refresh (15 seconds)
To change the refresh of Status Board, change the "refresh" value to the desired number of seconds. Lower than 15 appears to have no affect.

### SSL (disabled)
To enable SSL change the `null` values under "ssl" to file paths.
