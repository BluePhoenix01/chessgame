FROM oven/bun AS build 

WORKDIR /client

COPY . .

RUN bun install

CMD ["bun", "run", "build"]

FROM nginx:alpine

COPY --from=build /client/build /usr/share/nginx/html

COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80