FROM oven/bun AS build 

WORKDIR /client

COPY . .

RUN bun install

EXPOSE 3000

CMD ["bun", "run", "build"]

FROM nginx:alpine

COPY --from=build /client/build /usr/share/nginx/html

EXPOSE 80