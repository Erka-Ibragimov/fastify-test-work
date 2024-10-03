import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Client } from "pg";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    pg: Client;
  }
}

async function dbConnector(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
  });

  await client.connect();

  fastify.decorate("pg", client);

  fastify.addHook("onClose", async () => {
    await client.end();
  });
}

export default fp(dbConnector);
