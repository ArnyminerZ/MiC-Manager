# MiC Manager
A backend server API for managing local groups data.

## Development
### Requirements
#### NodeJS
You can download NodeJS for your system from the official website: [Node JS][node-js]

#### Dependencies
To install all the Node dependencies, run the following command in the project's root directory
```shell
npm install
```

### Running
To start the application, run the `start` script:
```shell
npm start
```

## Requests
If you want to register the sample user, run:
```shell
curl http://localhost:3000/v1/auth/register -H "Content-Type: application/json" -d @samples/new-user.json -X GET
```

To log in:
```shell
curl http://localhost:3000/v1/auth/login -H "Content-Type: application/json" -d @samples/login.json -X GET
```

[node-js]: https://nodejs.org/
