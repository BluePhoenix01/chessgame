FROM oven/bun

WORKDIR /server

COPY . .

RUN bun install

EXPOSE 3001

CMD ["bun", "run", "start"]
