FROM    node:8-alpine
RUN     apk add --no-cache python curl bash automake autoconf libtool git alpine-sdk postgresql-dev
RUN     addgroup ddk -g 1100 && \
        adduser -D -u 1100 ddk -G ddk

WORKDIR /home/ddk

USER    ddk
RUN     mkdir -p /home/ddk && \
        chmod -R 777 /home/ddk && \
        mkdir -p /home/ddk/logs && \
        mkdir -p /home/ddk/public/images/dapps/logs && \
        mkdir -p /home/ddk/public/images/dapps/pids && \
        mkdir -p /home/ddk/public/images/dapps/public && \
        touch /home/ddk/LICENSE

USER root
RUN     npm install --global npm@latest && \
        npm install --global node-gyp@latest && \
        npm install --global wait-port@latest

USER ddk
COPY    ./package*.json /home/ddk/
RUN     npm install

COPY    --chown=ddk . /home/ddk
RUN     npm run build
COPY    --chown=ddk ./entrypoint-deploy.sh /home/ddk/entrypoint-deploy.sh

USER    root
RUN     chmod +x /home/ddk/entrypoint-deploy.sh

USER    ddk
ENTRYPOINT ["/bin/bash", "/home/ddk/entrypoint-deploy.sh"]
