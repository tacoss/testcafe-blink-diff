FROM shivjm/node-chromium-alpine:18

RUN apk add --no-cache make bash curl git fish gcompat jq openssh-client python3 g++
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.17/pocketbase_0.22.17_linux_amd64.zip
RUN unzip pocketbase_0.22.17_linux_amd64.zip && mv pocketbase /usr/local/bin/pocketbase

COPY "entrypoint.sh" "/entrypoint.sh"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["true"]
