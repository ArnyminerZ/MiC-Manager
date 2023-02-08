<div style="text-align: center; margin-top: 15px">
    <img src="./images/banner.png" alt="MiC Manager" />
</div>

A backend server API for managing local groups data.

## Docker
### Running locally
```shell
docker build -t mic-manager .
docker run -dp 3000:3000 mic-manager
```

### Docker compose
You can take a look at the [docker-compose.yml](/docker-compose.yml) file to inspire yourself in building a custom
version, or just run that one with `docker-compose up -d`. Everything should work fine.

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
