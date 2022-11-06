if [ ! "$(docker ps -q -f name=mic_mariadb)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=mic_mariadb)" ]; then
        # cleanup
        docker rm mic_mariadb
    fi

    echo 'Please, start first the MariaDB container. E.g. docker compose up -d mic_mariadb'
    exit
fi
if [ ! "$(docker ps -q -f name=mic_radicale)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=mic_radicale)" ]; then
        # cleanup
        docker rm mic_radicale
    fi

    echo 'Please, start first the Radicale container. E.g. docker compose up -d mic_radicale'
    exit
fi

docker compose up -d mic_interface
