import Fastify from "fastify";
import routes from "./route";
import dbConnector from "./db";
import redisConnector from "./redis";

const server = Fastify({ logger: false });

server.register(dbConnector);
server.register(redisConnector);
server.register(routes);

const start = async () => {
  try {
    await server.listen({ port: 3000 });
    server.log.info(`Server listening at http://localhost:3000`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
